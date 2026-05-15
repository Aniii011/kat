-- ============================================================
-- Dripp Marketplace — Supabase Database Setup
-- Nigerian Fashion, Beauty & Lifestyle Marketplace
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ── Listings table ──────────────────────────────────────────
create table if not exists listings (
  id                 bigint generated always as identity primary key,
  title              text        not null,
  price              numeric     not null,
  original_price     numeric,
  discount           int,
  category           text        not null,
  description        text        not null,
  brand              text,
  image_url          text        not null,
  images             text[]      not null default '{}',
  rating             numeric     not null default 0,
  review_count       int         not null default 0,
  sold               int         not null default 0,
  in_stock           boolean     not null default true,
  stock_count        int         not null default 1,
  free_shipping      boolean     not null default false,
  shipping_days      int         not null default 3,
  seller_name        text        not null,
  seller_avatar      text,
  seller_rating      numeric     not null default 5,
  seller_followers   int,
  is_verified_seller boolean     not null default false,
  badge              text,
  colors             text[],
  clothing_sizes     text[],
  shoe_sizes         text[],
  aesthetics         text[],
  is_thrift          boolean     not null default false,
  deposit_amount     numeric,
  is_featured        boolean     not null default false,
  tags               text[],
  created_at         timestamptz not null default now()
);

-- ── Reviews table ────────────────────────────────────────────
create table if not exists reviews (
  id          bigint generated always as identity primary key,
  listing_id  bigint      not null references listings(id) on delete cascade,
  author      text        not null,
  avatar      text        not null,
  rating      int         not null check (rating between 1 and 5),
  date        text        not null,
  title       text        not null,
  body        text        not null,
  verified    boolean     not null default false,
  created_at  timestamptz not null default now()
);

-- ── Row Level Security ────────────────────────────────────────
alter table listings enable row level security;
alter table reviews  enable row level security;

create policy "Public read listings" on listings for select using (true);
create policy "Public read reviews"  on reviews  for select using (true);

-- ── Seed: Listings ───────────────────────────────────────────
insert into listings
  (title, price, original_price, discount, category, description, brand, image_url, images,
   rating, review_count, sold, in_stock, stock_count, free_shipping, shipping_days,
   seller_name, seller_avatar, seller_rating, seller_followers, is_verified_seller,
   badge, colors, clothing_sizes, shoe_sizes, aesthetics, is_thrift, deposit_amount, is_featured, tags)
values
(
  'Ankara Co-ord Blazer & Wide-Leg Set', 18500, 25000, 26, 'Co-ords',
  'Stunning ankara print co-ord set featuring a structured blazer and matching wide-leg trousers. Made from premium Dutch wax fabric. Perfect for owambe parties, corporate events, or elevating your everyday look.',
  'Adire House',
  'https://picsum.photos/seed/f1/400/500',
  ARRAY['https://picsum.photos/seed/f1/400/500','https://picsum.photos/seed/f1b/400/500','https://picsum.photos/seed/f1c/400/500'],
  4.9, 214, 89, true, 12, true, 2,
  'Adire House', 'https://picsum.photos/seed/s1/40/40', 4.9, 12400, true,
  'Best Seller',
  ARRAY['Red/Gold','Blue/White','Green/Orange','Purple/Yellow'],
  ARRAY['XS','S','M','L','XL','XXL'], null,
  ARRAY['90s African Aunty','Old Money'],
  false, null, true,
  ARRAY['ankara','co-ord','owambe','party','corporate']
),
(
  'Baddie Bodycon Slit Dress', 12000, 18000, 33, 'Women',
  'Sleek floor-length bodycon dress with a thigh-high slit. Stretchy fabric hugs every curve. Perfect for girls'' night out, parties, or date night. Available in multiple head-turning colours.',
  null,
  'https://picsum.photos/seed/f2/400/500',
  ARRAY['https://picsum.photos/seed/f2/400/500','https://picsum.photos/seed/f2b/400/500','https://picsum.photos/seed/f2c/400/500'],
  4.7, 178, 143, true, 8, false, 3,
  'Glam by Nkechi', 'https://picsum.photos/seed/s2/40/40', 4.7, 8900, true,
  'Trending',
  ARRAY['Jet Black','Fire Red','Cobalt Blue','Champagne'],
  ARRAY['XS','S','M','L','XL'], null,
  ARRAY['Baddie'],
  false, null, true,
  ARRAY['bodycon','party','date night','slit dress']
),
(
  'Old Money Cream Linen Blazer Set', 42000, 58000, 28, 'Co-ords',
  'Effortlessly sophisticated cream linen blazer with matching tailored trousers. Minimalist, clean, and luxurious. Wear it to brunch, a business meeting, or pair the blazer over a bikini on a yacht.',
  'Lagos Luxe',
  'https://picsum.photos/seed/f3/400/500',
  ARRAY['https://picsum.photos/seed/f3/400/500','https://picsum.photos/seed/f3b/400/500','https://picsum.photos/seed/f3c/400/500'],
  4.9, 93, 41, true, 5, true, 2,
  'Lagos Luxe', 'https://picsum.photos/seed/s3/40/40', 5.0, 22100, true,
  'Best Seller',
  ARRAY['Cream','Camel','Sage Green','Black'],
  ARRAY['XS','S','M','L','XL'], null,
  ARRAY['Old Money','Clean Girl'],
  false, null, true,
  ARRAY['blazer','linen','luxury','old money','minimalist']
),
(
  'Brazilian Body Wave Lace Front Wig', 48000, 65000, 26, 'Wigs & Hair',
  '100% virgin Brazilian human hair body wave wig with HD lace frontal. 18 inches. Pre-plucked hairline with baby hairs. Bouncy, glossy, and incredibly natural-looking.',
  null,
  'https://picsum.photos/seed/f4/400/500',
  ARRAY['https://picsum.photos/seed/f4/400/500','https://picsum.photos/seed/f4b/400/500','https://picsum.photos/seed/f4c/400/500'],
  4.8, 312, 201, true, 15, true, 1,
  'Glam Wig Factory', 'https://picsum.photos/seed/s4/40/40', 4.8, 31000, true,
  'Hot Deal',
  ARRAY['Natural Black','Dark Brown','Chestnut'],
  null, null,
  ARRAY['Baddie','Clean Girl','Old Money'],
  false, null, true,
  ARRAY['wig','hair','lace front','human hair','brazilian']
),
(
  'Clean Girl Gold Layered Chain Set', 8500, 13000, 35, 'Jewellery & Accessories',
  'Dainty layered gold chain set — includes a choker, 16-inch, and 18-inch chain. 18K gold plated, tarnish-resistant. The perfect everyday jewellery stack for a clean, minimal aesthetic.',
  null,
  'https://picsum.photos/seed/f5/400/500',
  ARRAY['https://picsum.photos/seed/f5/400/500','https://picsum.photos/seed/f5b/400/500'],
  4.6, 445, 380, true, 50, true, 2,
  'Lush Jewels NG', 'https://picsum.photos/seed/s5/40/40', 4.6, 9800, true,
  'Best Seller',
  ARRAY['Gold','Silver','Rose Gold'],
  null, null,
  ARRAY['Clean Girl','Old Money','Soft Girl'],
  false, null, false,
  ARRAY['jewellery','gold','chain','minimal','layered']
),
(
  'Oversized Streetwear Graphic Hoodie', 15500, 22000, 30, 'Tops',
  'Heavyweight 380GSM fleece hoodie with a bold Lagos skyline graphic. Oversized fit, kangaroo pocket, and ribbed cuffs. Heavy and warm — perfect for cool Lagos nights.',
  null,
  'https://picsum.photos/seed/f6/400/500',
  ARRAY['https://picsum.photos/seed/f6/400/500','https://picsum.photos/seed/f6b/400/500'],
  4.8, 127, 89, true, 20, false, 3,
  'Nine01 Brand', 'https://picsum.photos/seed/s6/40/40', 4.8, 15700, true,
  'Trending',
  ARRAY['Black','Washed Grey','Army Green','Burgundy'],
  ARRAY['S','M','L','XL','XXL'], null,
  ARRAY['Streetwear'],
  false, null, false,
  ARRAY['hoodie','streetwear','graphic','oversized','lagos']
),
(
  'Vacay Crocheted Bikini Set', 11000, 16500, 33, 'Swimwear',
  'Handmade crochet bikini set with adjustable ties. Comes with a matching cover-up skirt. Perfect for beach holidays, poolside sessions, or island getaways. Very Instagram-worthy.',
  null,
  'https://picsum.photos/seed/f7/400/500',
  ARRAY['https://picsum.photos/seed/f7/400/500','https://picsum.photos/seed/f7b/400/500'],
  4.7, 88, 62, true, 10, true, 3,
  'Island Girl Threads', 'https://picsum.photos/seed/s7/40/40', 4.7, 6200, false,
  'New',
  ARRAY['White','Coral','Sage','Chocolate Brown'],
  ARRAY['XS','S','M','L'], null,
  ARRAY['Vacay','Boho'],
  false, null, false,
  ARRAY['bikini','swimwear','beach','crochet','vacay']
),
(
  'Boho Floral Chiffon Maxi Dress', 22000, 30000, 27, 'Women',
  'Flowy chiffon maxi dress with a beautiful tropical floral print. V-neckline, tiered skirt, and adjustable waist tie. Effortlessly feminine for beach weddings, garden brunches, or sightseeing.',
  null,
  'https://picsum.photos/seed/f8/400/500',
  ARRAY['https://picsum.photos/seed/f8/400/500','https://picsum.photos/seed/f8b/400/500'],
  4.8, 156, 75, true, 8, true, 2,
  'Bloom & Thread', 'https://picsum.photos/seed/s8/40/40', 4.8, 11200, true,
  'Best Seller',
  ARRAY['Tropical Blue','Dusty Rose','Ivory/Green'],
  ARRAY['XS','S','M','L','XL'], null,
  ARRAY['Boho','Vacay','Soft Girl'],
  false, null, false,
  ARRAY['maxi dress','floral','boho','chiffon','wedding guest']
),
(
  'Platform Chunky Sneakers', 28500, 38000, 25, 'Sneakers',
  '90s-inspired chunky platform sneakers with a 4cm sole. Genuine leather upper, cushioned insole. A streetwear and clean-girl staple that elevates any outfit.',
  null,
  'https://picsum.photos/seed/f9/400/500',
  ARRAY['https://picsum.photos/seed/f9/400/500','https://picsum.photos/seed/f9b/400/500'],
  4.7, 203, 155, true, 18, true, 2,
  'Sole Story NG', 'https://picsum.photos/seed/s9/40/40', 4.7, 18500, true,
  'Trending',
  ARRAY['Triple White','Black/White','Cream/Brown'],
  null, ARRAY['36','37','38','39','40','41','42'],
  ARRAY['Clean Girl','Streetwear','90s African Aunty'],
  false, null, false,
  ARRAY['sneakers','platform','chunky','shoes']
),
(
  'Soft Girl Satin Slip Pyjama Set', 14000, 19500, 28, 'Underwear & Sleepwear',
  'Silky smooth satin pyjama set with lace trim. Shorts and cami top with adjustable straps. So luxurious you''ll want to wear it everywhere. Available in the most beautiful pastel shades.',
  null,
  'https://picsum.photos/seed/f10/400/500',
  ARRAY['https://picsum.photos/seed/f10/400/500','https://picsum.photos/seed/f10b/400/500'],
  4.9, 267, 219, true, 30, true, 2,
  'Lush Luxe Loungewear', 'https://picsum.photos/seed/s10/40/40', 4.9, 14300, true,
  'Best Seller',
  ARRAY['Dusty Rose','Baby Blue','Lilac','Champagne'],
  ARRAY['XS','S','M','L','XL'], null,
  ARRAY['Soft Girl'],
  false, null, false,
  ARRAY['pyjama','satin','sleepwear','soft girl','loungewear']
),
(
  '90s Aunty Kente Print Blouse', 9500, 14000, 32, 'Tops',
  'A proud celebration of African fashion. Bold kente-inspired print blouse with structured shoulders and peplum hem. Pairs beautifully with wide-leg trousers or a midi skirt.',
  null,
  'https://picsum.photos/seed/f11/400/500',
  ARRAY['https://picsum.photos/seed/f11/400/500','https://picsum.photos/seed/f11b/400/500'],
  4.8, 134, 98, true, 14, false, 3,
  'Adire House', 'https://picsum.photos/seed/s1/40/40', 4.9, 12400, true,
  null,
  ARRAY['Multi-Kente','Blue/Gold','Red/Black'],
  ARRAY['XS','S','M','L','XL','XXL'], null,
  ARRAY['90s African Aunty'],
  false, null, false,
  ARRAY['kente','african print','blouse','peplum','top']
),
(
  'Gym Set – Sports Bra & High Waist Leggings', 19500, 27000, 28, 'Gym Wear',
  'Squat-proof, sweat-wicking gym set. Sports bra with built-in padding and matching high-waist leggings with ribbed waistband. Sculpting fit that hugs your curves perfectly.',
  null,
  'https://picsum.photos/seed/f12/400/500',
  ARRAY['https://picsum.photos/seed/f12/400/500','https://picsum.photos/seed/f12b/400/500'],
  4.9, 389, 302, true, 25, true, 2,
  'FitGirl NG', 'https://picsum.photos/seed/s12/40/40', 4.9, 26800, true,
  'Best Seller',
  ARRAY['Burnt Orange','Deep Purple','Forest Green','Black','Hot Pink'],
  ARRAY['XS','S','M','L','XL'], null,
  ARRAY['Clean Girl','Baddie'],
  false, null, true,
  ARRAY['gym','leggings','sports bra','fitness','workout']
),
(
  'Clear Rhinestone Barely There Heels', 32000, 45000, 29, 'Heels',
  'Ultra-glam crystal clear PVC barely-there heels with all-over rhinestone straps. 10cm stiletto heel. Perfect for weddings, proms, nightclubs, or whenever you need to be the most dressed person in the room.',
  null,
  'https://picsum.photos/seed/f13/400/500',
  ARRAY['https://picsum.photos/seed/f13/400/500','https://picsum.photos/seed/f13b/400/500'],
  4.6, 178, 112, true, 9, true, 2,
  'Sole Story NG', 'https://picsum.photos/seed/s9/40/40', 4.7, 18500, true,
  'Trending',
  ARRAY['Clear/Crystal','Gold Rhinestone','Silver Rhinestone'],
  null, ARRAY['36','37','38','39','40','41'],
  ARRAY['Baddie','Old Money'],
  false, null, false,
  ARRAY['heels','rhinestone','glam','party shoes','stiletto']
),
(
  'Black Girl Glow Vitamin C Serum', 7500, 10000, 25, 'Beauty',
  'Formulated specifically for melanin-rich skin. 20% Vitamin C + Niacinamide + Hyaluronic Acid. Fades dark spots, hyperpigmentation, and post-blemish marks. Dermatologist-tested, cruelty-free, made in Nigeria.',
  'Glow Ritual',
  'https://picsum.photos/seed/f14/400/500',
  ARRAY['https://picsum.photos/seed/f14/400/500','https://picsum.photos/seed/f14b/400/500'],
  4.9, 521, 431, true, 40, true, 1,
  'Glow Ritual', 'https://picsum.photos/seed/s14/40/40', 5.0, 44200, true,
  'Best Seller',
  null, null, null,
  ARRAY['Clean Girl'],
  false, null, true,
  ARRAY['skincare','vitamin c','serum','glow','dark spots']
),
(
  'Denim Corset Crop Top', 13500, 19000, 29, 'Denim',
  'Structured denim corset crop top with boning detail and hook-and-eye closure. A must-have wardrobe piece. Style with a maxi skirt for old money vibes or oversized jeans for that baddie look.',
  null,
  'https://picsum.photos/seed/f15/400/500',
  ARRAY['https://picsum.photos/seed/f15/400/500','https://picsum.photos/seed/f15b/400/500'],
  4.7, 143, 107, true, 16, false, 3,
  'Glam by Nkechi', 'https://picsum.photos/seed/s2/40/40', 4.7, 8900, true,
  null,
  ARRAY['Classic Blue','Black Denim','White Denim'],
  ARRAY['XS','S','M','L'], null,
  ARRAY['Baddie','Streetwear','Old Money'],
  false, null, false,
  ARRAY['denim','corset','crop top','top']
),
(
  'Plus Size Wrap Midi Dress', 16500, 23000, 28, 'Plus Size Fashion',
  'A gorgeous flowy wrap midi dress that celebrates all body types. Adjustable tie waist flatters your curves beautifully. Soft, breathable fabric. Available in extended sizes 14–24.',
  null,
  'https://picsum.photos/seed/f16/400/500',
  ARRAY['https://picsum.photos/seed/f16/400/500','https://picsum.photos/seed/f16b/400/500'],
  4.9, 287, 198, true, 22, true, 2,
  'Curves & Co.', 'https://picsum.photos/seed/s16/40/40', 4.9, 19600, true,
  'Best Seller',
  ARRAY['Burgundy','Forest Green','Navy Print','Terracotta'],
  ARRAY['14','16','18','20','22','24'], null,
  ARRAY['Old Money','Boho'],
  false, null, false,
  ARRAY['plus size','wrap dress','midi','curvy','inclusive']
),
(
  'Thrift: Y2K Butterfly Print Mini Skirt', 6000, null, null, 'Bottoms',
  'One-of-one vintage Y2K butterfly print mini skirt. Genuine 2000s era piece. Approx UK 10 sizing. Excellent condition — no tears, no stains. You won''t find another one like it.',
  null,
  'https://picsum.photos/seed/t1/400/500',
  ARRAY['https://picsum.photos/seed/t1/400/500','https://picsum.photos/seed/t1b/400/500'],
  5.0, 3, 0, true, 1, false, 4,
  'Thrift Queen NG', 'https://picsum.photos/seed/st1/40/40', 4.8, 7200, true,
  'Limited',
  ARRAY['Multicolour'],
  ARRAY['S'], null,
  ARRAY['90s African Aunty','Boho'],
  true, 2500, false,
  ARRAY['thrift','vintage','y2k','mini skirt','one of one']
),
(
  'Thrift: Vintage Corduroy Blazer', 8500, null, null, 'Clothing',
  'Authentic 1990s tan corduroy blazer. Fully lined, brass button detail, wide lapels. One-of-one — only 1 available. Perfect size M (UK 12). No moth holes, no stains.',
  null,
  'https://picsum.photos/seed/t2/400/500',
  ARRAY['https://picsum.photos/seed/t2/400/500','https://picsum.photos/seed/t2b/400/500'],
  4.9, 5, 0, true, 1, false, 4,
  'Thrift Queen NG', 'https://picsum.photos/seed/st1/40/40', 4.8, 7200, true,
  'Limited',
  ARRAY['Tan Corduroy'],
  ARRAY['M'], null,
  ARRAY['Old Money','90s African Aunty','Boho'],
  true, 3000, false,
  ARRAY['thrift','vintage','blazer','corduroy','one of one']
),
(
  'Thrift: 90s Band Tee – Fela Kuti', 12000, null, null, 'Tops',
  'Rare authentic 1990s Fela Kuti concert tee. Faded, worn-in perfection. Size L. A genuine piece of Nigerian music history in wearable form. Only 1 exists — deposit to secure.',
  null,
  'https://picsum.photos/seed/t3/400/500',
  ARRAY['https://picsum.photos/seed/t3/400/500','https://picsum.photos/seed/t3b/400/500'],
  5.0, 8, 0, true, 1, false, 4,
  'Afro Vintage Co.', 'https://picsum.photos/seed/st2/40/40', 5.0, 5400, true,
  'Limited',
  ARRAY['Faded Black'],
  ARRAY['L'], null,
  ARRAY['Streetwear','90s African Aunty'],
  true, 4000, false,
  ARRAY['thrift','vintage','fela kuti','band tee','nigerian']
);

-- ── Seed: Reviews ────────────────────────────────────────────

-- Listing 1 – Ankara Co-ord
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Chidinma O.', 'https://picsum.photos/seed/a1/40/40', 5, 'May 8, 2025', 'Absolutely stunning!', 'Got so many compliments at my cousin''s wedding. Quality is top tier and fits TTS. The colours are so vibrant!', true from listings where title = 'Ankara Co-ord Blazer & Wide-Leg Set';
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Temi A.', 'https://picsum.photos/seed/a2/40/40', 5, 'Apr 22, 2025', 'Seller is an angel', 'Packaged beautifully, delivered fast. I wore it to a corporate dinner and everyone was asking where I got it from.', true from listings where title = 'Ankara Co-ord Blazer & Wide-Leg Set';

-- Listing 2 – Baddie Bodycon
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Blessing N.', 'https://picsum.photos/seed/a3/40/40', 5, 'May 10, 2025', 'ATE this look 🔥', 'I wore this to a birthday party and I was THE moment. Fit is perfect, very stretchy but keeps its shape.', true from listings where title = 'Baddie Bodycon Slit Dress';

-- Listing 3 – Linen Blazer Set
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Adaeze M.', 'https://picsum.photos/seed/a4/40/40', 5, 'May 5, 2025', 'Worth every kobo', 'The fabric quality is incredible. I''ve worn this to 3 events already. I always feel like a whole CEO.', true from listings where title = 'Old Money Cream Linen Blazer Set';

-- Listing 4 – Wig
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Funmi B.', 'https://picsum.photos/seed/a5/40/40', 5, 'May 12, 2025', 'Insanely natural!', 'This wig had everyone convinced it was my real hair. The lace is so transparent and the hair is so soft. 10/10!', true from listings where title = 'Brazilian Body Wave Lace Front Wig';
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Kemi D.', 'https://picsum.photos/seed/a6/40/40', 4, 'Apr 28, 2025', 'Gorgeous wig', 'Beautiful quality. Delivery was fast. One star off because the bleaching on the knots could be a little better.', true from listings where title = 'Brazilian Body Wave Lace Front Wig';

-- Listing 5 – Gold Chains
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Zara L.', 'https://picsum.photos/seed/a7/40/40', 5, 'May 9, 2025', 'So delicate and pretty', 'Bought two sets — one for me and one for my sister. Still wearing mine everyday and no tarnish after 3 weeks!', true from listings where title = 'Clean Girl Gold Layered Chain Set';

-- Listing 6 – Hoodie
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Seun A.', 'https://picsum.photos/seed/a8/40/40', 5, 'May 1, 2025', 'Heaviest hoodie I own', 'The fabric is so thick and premium. Wearing it oversized over biker shorts = entire outfit. Very much the vibe.', true from listings where title = 'Oversized Streetwear Graphic Hoodie';

-- Listing 7 – Bikini
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Priscilla E.', 'https://picsum.photos/seed/a9/40/40', 5, 'Apr 20, 2025', 'Wore this in Zanzibar!', 'It photographed so beautifully. The cover-up skirt is a great bonus. Got so many DMs asking where I got it.', true from listings where title = 'Vacay Crocheted Bikini Set';

-- Listing 8 – Boho Maxi
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Amaka C.', 'https://picsum.photos/seed/a10/40/40', 5, 'May 3, 2025', 'Dreamy dress', 'This dress flows so beautifully. I wore it to a garden wedding and everyone complimented me. Runs true to size.', true from listings where title = 'Boho Floral Chiffon Maxi Dress';

-- Listing 9 – Sneakers
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Tola F.', 'https://picsum.photos/seed/a11/40/40', 5, 'Apr 30, 2025', 'These shoes are EVERYTHING', 'So comfortable and look amazing. I''ve worn them 3 days in a row. Everyone asks where they''re from.', true from listings where title = 'Platform Chunky Sneakers';

-- Listing 10 – Pyjama Set
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Ngozi P.', 'https://picsum.photos/seed/a12/40/40', 5, 'May 7, 2025', 'Feels like clouds', 'The fabric is so soft and cool against the skin. I bought all 4 colours. Perfect birthday gift idea too!', true from listings where title = 'Soft Girl Satin Slip Pyjama Set';

-- Listing 11 – Kente Blouse
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Adesuwa K.', 'https://picsum.photos/seed/a13/40/40', 5, 'May 2, 2025', 'My ancestors are proud', 'This blouse is giving everything! I wore it to church and my aunties almost started a bidding war for it.', true from listings where title = '90s Aunty Kente Print Blouse';

-- Listing 12 – Gym Set
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Racheal I.', 'https://picsum.photos/seed/a14/40/40', 5, 'May 11, 2025', 'Best gym wear ever!', 'These leggings are truly squat-proof. I''ve washed mine 10 times and they still look brand new. Worth every penny.', true from listings where title = 'Gym Set – Sports Bra & High Waist Leggings';

-- Listing 13 – Heels
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Sade A.', 'https://picsum.photos/seed/a15/40/40', 5, 'Apr 15, 2025', 'Cinderella energy', 'These heels are absolutely gorgeous in person. The rhinestones catch the light so beautifully. Very comfortable!', true from listings where title = 'Clear Rhinestone Barely There Heels';

-- Listing 14 – Serum
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Obiageli T.', 'https://picsum.photos/seed/a16/40/40', 5, 'May 10, 2025', 'My skin is GLOWING', 'I''ve been using this for 6 weeks and my dark spots have faded so much. My skin is the clearest it''s been in years!', true from listings where title = 'Black Girl Glow Vitamin C Serum';
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Ifeoma N.', 'https://picsum.photos/seed/a17/40/40', 5, 'Apr 27, 2025', 'Game changer', 'Nigerian brand done right! This serum works better than expensive foreign ones I''ve tried.', true from listings where title = 'Black Girl Glow Vitamin C Serum';

-- Listing 15 – Denim Corset
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Yewande B.', 'https://picsum.photos/seed/a18/40/40', 5, 'May 6, 2025', 'So versatile!', 'This top goes with literally everything. I''ve styled it 5 different ways already. Quality is amazing.', true from listings where title = 'Denim Corset Crop Top';

-- Listing 16 – Plus Size Dress
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Chiamaka O.', 'https://picsum.photos/seed/a19/40/40', 5, 'May 9, 2025', 'Finally a brand that gets us!', 'The fabric is premium and fits my size 22 frame so beautifully. I cried a little. Thank you for the inclusive sizing!', true from listings where title = 'Plus Size Wrap Midi Dress';

-- Thrift items
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Kofo A.', 'https://picsum.photos/seed/at1/40/40', 5, 'Apr 18, 2025', 'Authentic vintage find!', 'This skirt is exactly as described. The print is so unique and the quality of the original fabric is amazing.', true from listings where title = 'Thrift: Y2K Butterfly Print Mini Skirt';

insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Nadia S.', 'https://picsum.photos/seed/at2/40/40', 5, 'Apr 10, 2025', 'This is a masterpiece', 'The quality of vintage items vs. new production is night and day. This blazer is everything.', true from listings where title = 'Thrift: Vintage Corduroy Blazer';

insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Emeka P.', 'https://picsum.photos/seed/at3/40/40', 5, 'May 1, 2025', 'Cultural treasure', 'I cannot believe this exists. My dad actually went to this concert. I will treasure this forever.', true from listings where title = 'Thrift: 90s Band Tee – Fela Kuti';
