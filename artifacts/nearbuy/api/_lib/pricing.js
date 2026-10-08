// Server-side source of truth for what an order costs.
//
// The browser sends WHAT is being bought (product ids, quantity, chosen
// colour/size, city, coupon code). It never decides a price: every number
// below is read from the database here, so editing localStorage, the cart
// or the request body cannot make an order cheaper.

const FEE_RATE = 0.095; // KAT platform fee, same as src/lib/product-variants.ts
const MAX_LINES = 30;
const MAX_QTY = 50;

const fail = (error) => ({ ok: false, error });
const norm = (v) => String(v ?? "").trim().toLowerCase();
const toCustomerPrice = (sellerPrice) => Math.round(Number(sellerPrice) * (1 + FEE_RATE));

function readVariants(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((r) => {
    const attributes =
      r && typeof r.attributes === "object" && r.attributes
        ? r.attributes
        : { color: r?.color, size: r?.size, shoeSize: r?.shoeSize };
    const price =
      r?.price !== undefined && r?.price !== null && r?.price !== "" ? Number(r.price) : undefined;
    return { attributes, price: Number.isFinite(price) ? price : undefined };
  });
}

function attr(variant, key) {
  const entry = Object.entries(variant.attributes || {}).find(([k]) => norm(k) === key);
  return norm(entry?.[1]);
}

// The unit price the buyer must pay for one item, or null if it can't be determined.
function unitPriceFor(product, item) {
  const baseCustomer =
    Number(product.price) > 0
      ? Math.round(Number(product.price))
      : Number(product.seller_price) > 0
        ? toCustomerPrice(product.seller_price)
        : 0;

  const variants = readVariants(product.variants);
  if (variants.length === 0) return baseCustomer > 0 ? baseCustomer : null;

  const variantCustomer = (v) => (v && v.price !== undefined ? toCustomerPrice(v.price) : baseCustomer);

  const color = norm(item.selectedColor);
  const size = norm(item.selectedSize);
  const matches = variants.filter(
    (v) =>
      (!color || attr(v, "color") === color) &&
      (!size || attr(v, "size") === size || attr(v, "shoesize") === size)
  );
  if (matches.length === 1) return variantCustomer(matches[0]) || null;

  // Could not pin down one variant. Only accept a price that really exists for
  // this product, so a made-up number is still rejected.
  const allowed = new Set([baseCustomer, ...variants.map(variantCustomer)].filter((n) => n > 0));
  const claimed = Math.round(Number(item.price));
  return allowed.has(claimed) ? claimed : null;
}

export async function priceOrder(sb, intent) {
  if (!intent || !Array.isArray(intent.items) || intent.items.length === 0 || intent.items.length > MAX_LINES) {
    return fail("Your cart is empty or invalid.");
  }

  for (const item of intent.items) {
    const qty = Number(item?.quantity);
    if (!item || typeof item.listingId !== "string" || !item.listingId || item.listingId.length > 64) {
      return fail("One or more products are invalid.");
    }
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
      return fail("One or more quantities are invalid.");
    }
  }

  // 1. Products and their real prices
  const ids = [...new Set(intent.items.map((i) => i.listingId))];
  const { data: products, error: productsError } = await sb
    .from("products")
    .select("id, seller_id, store_id, seller_name, title, image_url, price, seller_price, variants")
    .in("id", ids);

  if (productsError) return fail("Could not load products. Please try again.");

  const byId = new Map((products || []).map((p) => [String(p.id), p]));
  const lines = [];
  let subtotal = 0;

  for (const item of intent.items) {
    const product = byId.get(String(item.listingId));
    if (!product) return fail("A product in your cart is no longer available.");

    const unitPrice = unitPriceFor(product, item);
    if (!unitPrice) return fail(`"${product.title || "A product"}" has changed. Please re-add it to your cart.`);

    const quantity = Number(item.quantity);
    lines.push({ item, product, unitPrice, quantity });
    subtotal += unitPrice * quantity;
  }

  // 2. Delivery fee for the chosen area (standard or door, whichever matches)
  const state = String(intent.state || "").trim().slice(0, 80);
  const city = String(intent.city || "").trim().slice(0, 80);
  if (!state || !city) return fail("Please choose a delivery area.");

  const { data: area, error: areaError } = await sb
    .from("delivery_areas")
    .select("delivery_fee, door_delivery_fee")
    .eq("state", state)
    .eq("city", city)
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (areaError) return fail("Could not check delivery. Please try again.");
  if (!area) return fail("Delivery to this area isn't available.");

  const validFees = [area.delivery_fee, area.door_delivery_fee]
    .filter((f) => f !== null && f !== undefined)
    .map(Number);
  const claimedFee = Number(intent.deliveryFee);
  if (!validFees.includes(claimedFee)) {
    return fail("The delivery fee for this area has changed. Please re-select your delivery option.");
  }
  const delivery = claimedFee;

  // 3. Coupon, re-validated from the database (the browser's discount is ignored)
  let discount = 0;
  let coupon = null;
  const code = String(intent.couponCode || "").trim().toUpperCase().slice(0, 40);

  if (code) {
    const { data, error: couponError } = await sb
      .from("coupons")
      .select("*")
      .eq("code", code)
      .eq("active", true)
      .maybeSingle();

    if (couponError || !data) return fail("That coupon code is no longer valid.");
    if (data.expires_at && new Date(data.expires_at) < new Date()) return fail("That coupon has expired.");
    if (data.usage_limit && (data.times_used || 0) >= data.usage_limit) return fail("That coupon has reached its usage limit.");
    if (data.min_order_amount && subtotal < data.min_order_amount) return fail("Your order is below this coupon's minimum.");

    coupon = data;
    discount =
      data.discount_type === "percent"
        ? Math.round(subtotal * (Number(data.discount_value) / 100))
        : Math.min(Number(data.discount_value), subtotal);
  }

  const total = subtotal + delivery - discount;
  if (!Number.isInteger(total) || total <= 0) return fail("Your order total is invalid.");

  return { ok: true, lines, subtotal, delivery, discount, total, coupon };
}
