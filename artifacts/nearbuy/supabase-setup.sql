-- ============================================================
-- NearBuy Marketplace — Supabase Database Setup
-- Run this in your Supabase SQL Editor to create all tables
-- and seed them with the initial product data.
-- ============================================================

-- ── Listings table ──────────────────────────────────────────
create table if not exists listings (
  id              bigint generated always as identity primary key,
  title           text        not null,
  price           numeric     not null,
  original_price  numeric,
  discount        int,
  category        text        not null,
  description     text        not null,
  location        text        not null,
  image_url       text        not null,
  images          text[]      not null default '{}',
  rating          numeric     not null default 0,
  review_count    int         not null default 0,
  sold            int         not null default 0,
  in_stock        boolean     not null default true,
  stock_count     int         not null default 1,
  free_shipping   boolean     not null default false,
  shipping_days   int         not null default 5,
  seller_name     text        not null,
  seller_rating   numeric     not null default 5,
  is_verified_seller boolean  not null default false,
  badge           text,
  colors          text[],
  sizes           text[],
  created_at      timestamptz not null default now()
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

-- Allow anyone to read listings and reviews (public marketplace)
create policy "Public read listings"
  on listings for select using (true);

create policy "Public read reviews"
  on reviews for select using (true);

-- ── Seed: Listings ───────────────────────────────────────────
insert into listings
  (title, price, original_price, discount, category, description, location,
   image_url, images, rating, review_count, sold, in_stock, stock_count,
   free_shipping, shipping_days, seller_name, seller_rating, is_verified_seller, badge, colors, sizes)
values
(
  'Vintage Wooden Dining Table', 150, 220, 32, 'Furniture',
  'Solid oak dining table from the 1970s. Comfortably seats 6 people. Minor surface scratches but overall excellent structural condition. The natural wood grain gives it a warm, timeless look perfect for any dining room.',
  'Downtown',
  'https://picsum.photos/seed/1/800/600',
  ARRAY['https://picsum.photos/seed/1/800/600','https://picsum.photos/seed/1a/800/600','https://picsum.photos/seed/1b/800/600','https://picsum.photos/seed/1c/800/600'],
  4.8, 124, 38, true, 1, true, 3, 'Sarah Jenkins', 4.8, true, 'Best Seller',
  ARRAY['Natural Oak','Walnut','White'], null
),
(
  'Mountain Bike – Trek Marlin 7', 350, 499, 30, 'Sports',
  'Barely used Trek Marlin 7 mountain bike. 29-inch wheels, 21-speed Shimano drivetrain. Kept indoors away from weather. Ideal for local trails, commuting, or weekend adventures.',
  'Westside',
  'https://picsum.photos/seed/2/800/600',
  ARRAY['https://picsum.photos/seed/2/800/600','https://picsum.photos/seed/2a/800/600','https://picsum.photos/seed/2b/800/600','https://picsum.photos/seed/2c/800/600'],
  4.6, 89, 22, true, 1, false, 5, 'Mike R.', 4.2, false, 'Hot Deal',
  ARRAY['Matte Black','Forest Green','Slate Blue'], ARRAY['XS','S','M','L','XL']
),
(
  'Sony A6000 Mirrorless Camera Kit', 400, 580, 31, 'Electronics',
  'Includes the 16-50mm OSS kit lens, original Sony battery, charger, and UV filter. Very low shutter count (~2,400). Sensor is pristine. Selling because I upgraded to full-frame.',
  'North Hills',
  'https://picsum.photos/seed/3/800/600',
  ARRAY['https://picsum.photos/seed/3/800/600','https://picsum.photos/seed/3a/800/600','https://picsum.photos/seed/3b/800/600','https://picsum.photos/seed/3c/800/600'],
  4.9, 213, 67, true, 2, true, 2, 'David Lee', 5.0, true, 'Best Seller',
  ARRAY['Black'], null
),
(
  'Levi''s Classic Denim Jacket', 45, 75, 40, 'Clothing',
  'Vintage-washed Levi''s denim jacket. Nicely broken in with a classic fade — not distressed or torn. No stains, odor-free. A wardrobe staple you''ll reach for every day.',
  'Eastside',
  'https://picsum.photos/seed/4/800/600',
  ARRAY['https://picsum.photos/seed/4/800/600','https://picsum.photos/seed/4a/800/600','https://picsum.photos/seed/4b/800/600'],
  4.5, 56, 18, true, 3, true, 3, 'Emma W.', 4.5, false, 'Hot Deal',
  ARRAY['Indigo Blue','Light Wash'], ARRAY['XS','S','M','L']
),
(
  'Sci-Fi Classics Collection (10 Books)', 20, 45, 56, 'Books',
  'Curated collection of 10 paperback sci-fi novels including Asimov''s Foundation series, Dune, Ender''s Game, and more. All in good-to-great reading condition.',
  'Downtown',
  'https://picsum.photos/seed/5/800/600',
  ARRAY['https://picsum.photos/seed/5/800/600','https://picsum.photos/seed/5a/800/600','https://picsum.photos/seed/5b/800/600'],
  4.9, 77, 31, true, 1, true, 4, 'Bookworm Bob', 4.9, true, null,
  null, null
),
(
  'Handmade Ceramic Mug Set (4 pcs)', 60, 85, 29, 'Other',
  'Artisan-crafted ceramic mugs with a beautiful speckled glaze. Each piece is unique. Microwave and dishwasher safe. Supports a local ceramicist. Makes a perfect gift.',
  'Arts District',
  'https://picsum.photos/seed/6/800/600',
  ARRAY['https://picsum.photos/seed/6/800/600','https://picsum.photos/seed/6a/800/600','https://picsum.photos/seed/6b/800/600'],
  4.7, 148, 52, true, 5, true, 3, 'Clay & Co.', 4.7, true, 'Best Seller',
  ARRAY['Speckled White','Terracotta','Sage Green'], null
),
(
  '7''0 Funboard Surfboard', 200, 320, 38, 'Sports',
  'A great beginner-to-intermediate board. A couple of professionally repaired dings — completely water-tight and surf-ready. Great volume for learning to pop up.',
  'Beachside',
  'https://picsum.photos/seed/7/800/600',
  ARRAY['https://picsum.photos/seed/7/800/600','https://picsum.photos/seed/7a/800/600','https://picsum.photos/seed/7b/800/600'],
  4.3, 34, 12, true, 1, false, 7, 'Ocean Joe', 4.1, false, null,
  null, null
),
(
  'Mid-Century Modern Armchair', 180, 260, 31, 'Furniture',
  'Teak frame armchair with original mustard yellow upholstery. A striking mid-century piece that anchors any living room. No tears, springs intact, minimal wear.',
  'Uptown',
  'https://picsum.photos/seed/8/800/600',
  ARRAY['https://picsum.photos/seed/8/800/600','https://picsum.photos/seed/8a/800/600','https://picsum.photos/seed/8b/800/600','https://picsum.photos/seed/8c/800/600'],
  4.9, 91, 29, true, 1, true, 4, 'Vintage Finds', 4.9, true, 'Best Seller',
  ARRAY['Mustard Yellow','Teal','Charcoal'], null
),
(
  'Apple AirPods Pro (2nd Gen)', 120, 189, 37, 'Electronics',
  'Thoroughly cleaned and tested. Excellent ANC performance. Comes with charging case (MagSafe), all silicone tip sizes, and Lightning cable. Battery life is near-original.',
  'University Area',
  'https://picsum.photos/seed/9/800/600',
  ARRAY['https://picsum.photos/seed/9/800/600','https://picsum.photos/seed/9a/800/600','https://picsum.photos/seed/9b/800/600'],
  4.4, 167, 54, true, 2, true, 2, 'Student Sal', 4.0, false, 'Hot Deal',
  ARRAY['White'], null
),
(
  '2010 Honda Civic – Manual Transmission', 4500, 5800, 22, 'Vehicles',
  'Reliable daily driver with 120k miles. Recently serviced: oil change, new brake pads, fresh tires. Manual 5-speed, clean title, no accidents on Carfax. Great on gas.',
  'Suburbs',
  'https://picsum.photos/seed/10/800/600',
  ARRAY['https://picsum.photos/seed/10/800/600','https://picsum.photos/seed/10a/800/600','https://picsum.photos/seed/10b/800/600','https://picsum.photos/seed/10c/800/600'],
  4.6, 45, 1, true, 1, false, 7, 'Honest Auto', 4.6, true, null,
  ARRAY['Silver','Black','White'], null
),
(
  'Merino Wool Winter Coat', 80, 150, 47, 'Clothing',
  'Charcoal gray merino wool blend coat, size Large. Worn only a few times last season. No pilling, no stains — still looks new. Incredibly warm and versatile.',
  'Downtown',
  'https://picsum.photos/seed/11/800/600',
  ARRAY['https://picsum.photos/seed/11/800/600','https://picsum.photos/seed/11a/800/600','https://picsum.photos/seed/11b/800/600'],
  4.8, 62, 20, true, 2, true, 3, 'Sarah Jenkins', 4.8, true, null,
  ARRAY['Charcoal','Camel','Navy'], ARRAY['S','M','L','XL']
),
(
  'Yamaha FG800 Acoustic Guitar', 130, 200, 35, 'Other',
  'Yamaha FG800 acoustic in excellent condition. Great sound projection, stays in tune. Includes a padded soft gig bag and a new set of strings still in the pack.',
  'Westside',
  'https://picsum.photos/seed/12/800/600',
  ARRAY['https://picsum.photos/seed/12/800/600','https://picsum.photos/seed/12a/800/600','https://picsum.photos/seed/12b/800/600'],
  4.5, 88, 27, true, 1, false, 5, 'Music Maker', 4.3, false, 'Hot Deal',
  ARRAY['Natural'], null
);

-- ── Seed: Reviews ────────────────────────────────────────────
-- Listing 1 – Vintage Wooden Dining Table
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Maria T.', 'https://picsum.photos/seed/r1/40/40', 5, 'Apr 28, 2025', 'Absolutely beautiful!', 'Arrived well-packaged and looks even better in person. The oak finish is gorgeous. Highly recommend.', true from listings where title = 'Vintage Wooden Dining Table';
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'James K.', 'https://picsum.photos/seed/r2/40/40', 5, 'Mar 12, 2025', 'Sturdy and stylish', 'Seats my family of 6 easily. Very solid build. A few minor scratches as described but barely noticeable.', true from listings where title = 'Vintage Wooden Dining Table';
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Linda P.', 'https://picsum.photos/seed/r3/40/40', 4, 'Feb 5, 2025', 'Great value', 'Good quality for the price. Took a little while to arrive but was worth the wait.', false from listings where title = 'Vintage Wooden Dining Table';

-- Listing 2 – Mountain Bike
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Chris B.', 'https://picsum.photos/seed/r4/40/40', 5, 'May 2, 2025', 'Perfect trail bike', 'Exactly as described. Runs smoothly, gears shift perfectly. Great deal for the price!', true from listings where title = 'Mountain Bike – Trek Marlin 7';
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Aisha N.', 'https://picsum.photos/seed/r5/40/40', 4, 'Apr 14, 2025', 'Good condition, fast shipping', 'Minor paint scuff on the frame, not mentioned but otherwise flawless. Happy with the purchase.', true from listings where title = 'Mountain Bike – Trek Marlin 7';

-- Listing 3 – Sony A6000
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Nina W.', 'https://picsum.photos/seed/r6/40/40', 5, 'May 8, 2025', 'Mint condition!', 'Camera looks brand new. David was super responsive and packed it very carefully. 10/10 seller.', true from listings where title = 'Sony A6000 Mirrorless Camera Kit';
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Tom H.', 'https://picsum.photos/seed/r7/40/40', 5, 'Apr 20, 2025', 'Incredible kit for the price', 'Got everything listed. The lens is clean, no dust, and the shutter count is accurate. Very happy.', true from listings where title = 'Sony A6000 Mirrorless Camera Kit';
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Grace L.', 'https://picsum.photos/seed/r8/40/40', 4, 'Mar 9, 2025', 'Great camera, minor delay', 'Shipping took a day longer than expected but the camera is fantastic. No complaints on the product itself.', true from listings where title = 'Sony A6000 Mirrorless Camera Kit';

-- Listing 4 – Denim Jacket
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Sofia M.', 'https://picsum.photos/seed/r9/40/40', 5, 'Apr 30, 2025', 'Perfect vintage feel', 'Exactly the fade I was looking for. Fits true to size. Super fast shipping!', true from listings where title = 'Levi''s Classic Denim Jacket';
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Raj P.', 'https://picsum.photos/seed/r10/40/40', 4, 'Mar 22, 2025', 'Love it', 'Looks great and feels durable. Sizing is slightly small so size up if between sizes.', false from listings where title = 'Levi''s Classic Denim Jacket';

-- Listing 5 – Books
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Alex T.', 'https://picsum.photos/seed/r11/40/40', 5, 'May 1, 2025', 'Amazing value', '10 great books for $20? Unbeatable. All arrived in great shape, wrapped carefully.', true from listings where title = 'Sci-Fi Classics Collection (10 Books)';

-- Listing 6 – Ceramic Mugs
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Lily R.', 'https://picsum.photos/seed/r12/40/40', 5, 'May 5, 2025', 'Gift-worthy quality', 'Bought as a gift and everyone was so impressed. The glaze is stunning in person.', true from listings where title = 'Handmade Ceramic Mug Set (4 pcs)';
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Owen S.', 'https://picsum.photos/seed/r13/40/40', 5, 'Apr 10, 2025', 'Beautifully made', 'Each mug has subtle differences that make them feel truly handmade. Love them.', true from listings where title = 'Handmade Ceramic Mug Set (4 pcs)';

-- Listing 7 – Surfboard
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Jake M.', 'https://picsum.photos/seed/r14/40/40', 4, 'Apr 3, 2025', 'Solid beginner board', 'Repairs are solid and nearly invisible. Board floats great and was perfect for learning.', true from listings where title = '7''0 Funboard Surfboard';

-- Listing 8 – Armchair
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Diane F.', 'https://picsum.photos/seed/r15/40/40', 5, 'May 7, 2025', 'Statement piece!', 'This chair is the focal point of my whole living room now. The teak frame is incredibly solid.', true from listings where title = 'Mid-Century Modern Armchair';
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Ben A.', 'https://picsum.photos/seed/r16/40/40', 5, 'Apr 18, 2025', 'Exactly as described', 'Springs are in great shape, cushion is firm and supportive. Very satisfied.', true from listings where title = 'Mid-Century Modern Armchair';

-- Listing 9 – AirPods
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Priya K.', 'https://picsum.photos/seed/r17/40/40', 4, 'May 3, 2025', 'Great deal', 'ANC works as expected, sound quality is excellent. Case has a minor scuff but earbuds are pristine.', true from listings where title = 'Apple AirPods Pro (2nd Gen)';
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Luke D.', 'https://picsum.photos/seed/r18/40/40', 5, 'Mar 30, 2025', 'Fast shipping, perfect item', 'Listed as good condition and they delivered. Arrived in 2 days. Highly recommended.', true from listings where title = 'Apple AirPods Pro (2nd Gen)';

-- Listing 10 – Honda Civic
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Carlos M.', 'https://picsum.photos/seed/r19/40/40', 5, 'Apr 25, 2025', 'Exactly as advertised', 'Carfax clean, runs strong. Honest Auto was transparent and helpful throughout the process.', true from listings where title = '2010 Honda Civic – Manual Transmission';

-- Listing 11 – Wool Coat
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Hannah B.', 'https://picsum.photos/seed/r20/40/40', 5, 'May 6, 2025', 'Warm and chic', 'This coat is stunning and incredibly warm. Packaged perfectly, arrived quickly. Great seller!', true from listings where title = 'Merino Wool Winter Coat';

-- Listing 12 – Guitar
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Sam G.', 'https://picsum.photos/seed/r21/40/40', 5, 'Apr 22, 2025', 'Perfect beginner guitar', 'Sounds great out of the box. The gig bag is a nice bonus. Fast shipping and well-packaged.', true from listings where title = 'Yamaha FG800 Acoustic Guitar';
insert into reviews (listing_id, author, avatar, rating, date, title, body, verified)
select id, 'Rina O.', 'https://picsum.photos/seed/r22/40/40', 4, 'Mar 15, 2025', 'Good guitar, minor fret buzz', 'Slight fret buzz on the low E string at the 3rd fret but a simple truss rod adjustment fixed it. Nice instrument overall.', false from listings where title = 'Yamaha FG800 Acoustic Guitar';
