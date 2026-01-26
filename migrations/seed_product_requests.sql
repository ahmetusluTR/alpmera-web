-- Seed 15 initial product requests for the Product Requests page
-- Products selected for: >$300, widely available, low return risk,
-- single-box shipping, clear SKU/model, household/remote worker appeal

DO $$
DECLARE
  req_id uuid;
BEGIN

  -- 1. Breville Barista Express Espresso Machine (~$700, Kitchen Appliances)
  -- "Many people want a cafe-quality espresso setup at home, but don't urgently need it tomorrow."
  INSERT INTO product_requests (
    product_name, category, input_sku, reference_url, reason,
    status, vote_count, verification_status,
    created_at, updated_at
  ) VALUES (
    'Breville Barista Express Espresso Machine (BES870XL)',
    'Kitchen Appliances',
    'BES870XL',
    'https://www.amazon.com/dp/B00CH9QWOU',
    'Integrated grinder and espresso in one machine. Daily espresso drinkers save hundreds per year vs cafe visits.',
    'not_reviewed', 24, 'pending',
    now() - interval '14 days', now() - interval '14 days'
  ) RETURNING id INTO req_id;
  INSERT INTO sku_verification_jobs (product_request_id, status, created_at)
  VALUES (req_id, 'pending', now() - interval '14 days');
  INSERT INTO product_request_events (product_request_id, event_type, actor, created_at)
  VALUES (req_id, 'CREATED', 'system', now() - interval '14 days');

  -- 2. iRobot Roomba j7+ Self-Emptying Robot Vacuum (~$500, Home Appliances)
  -- "Many people want hands-off floor cleaning, but don't urgently need it tomorrow."
  INSERT INTO product_requests (
    product_name, category, input_sku, reference_url, reason,
    status, vote_count, verification_status,
    created_at, updated_at
  ) VALUES (
    'iRobot Roomba j7+ Self-Emptying Robot Vacuum',
    'Home Appliances',
    'j7+',
    'https://www.amazon.com/dp/B094NYHTFM',
    'Self-emptying robot vacuum with smart obstacle avoidance. Ideal for busy households with pets or kids.',
    'not_reviewed', 21, 'pending',
    now() - interval '13 days', now() - interval '13 days'
  ) RETURNING id INTO req_id;
  INSERT INTO sku_verification_jobs (product_request_id, status, created_at)
  VALUES (req_id, 'pending', now() - interval '13 days');
  INSERT INTO product_request_events (product_request_id, event_type, actor, created_at)
  VALUES (req_id, 'CREATED', 'system', now() - interval '13 days');

  -- 3. Dyson V15 Detect Cordless Vacuum (~$750, Home Appliances)
  -- "Many people want powerful cordless cleaning with dust visibility, but don't urgently need it tomorrow."
  INSERT INTO product_requests (
    product_name, category, input_sku, reference_url, reason,
    status, vote_count, verification_status,
    created_at, updated_at
  ) VALUES (
    'Dyson V15 Detect Cordless Vacuum',
    'Home Appliances',
    'V15',
    'https://www.amazon.com/dp/B09DY5GRSP',
    'Laser dust detection shows particles invisible to the eye. Most powerful Dyson cordless for whole-home cleaning.',
    'not_reviewed', 18, 'pending',
    now() - interval '12 days', now() - interval '12 days'
  ) RETURNING id INTO req_id;
  INSERT INTO sku_verification_jobs (product_request_id, status, created_at)
  VALUES (req_id, 'pending', now() - interval '12 days');
  INSERT INTO product_request_events (product_request_id, event_type, actor, created_at)
  VALUES (req_id, 'CREATED', 'system', now() - interval '12 days');

  -- 4. Vitamix A3500 Ascent Series Blender (~$550, Kitchen Appliances)
  -- "Many people want a commercial-grade blender for daily smoothies and cooking, but don't urgently need it tomorrow."
  INSERT INTO product_requests (
    product_name, category, input_sku, reference_url, reason,
    status, vote_count, verification_status,
    created_at, updated_at
  ) VALUES (
    'Vitamix A3500 Ascent Series Smart Blender',
    'Kitchen Appliances',
    'A3500',
    'https://www.amazon.com/dp/B074C3C7JB',
    'Commercial-grade blending power with touchscreen and wireless connectivity. Lasts 10+ years vs replacing cheaper blenders.',
    'not_reviewed', 16, 'pending',
    now() - interval '11 days', now() - interval '11 days'
  ) RETURNING id INTO req_id;
  INSERT INTO sku_verification_jobs (product_request_id, status, created_at)
  VALUES (req_id, 'pending', now() - interval '11 days');
  INSERT INTO product_request_events (product_request_id, event_type, actor, created_at)
  VALUES (req_id, 'CREATED', 'system', now() - interval '11 days');

  -- 5. KitchenAid Professional 600 Series Stand Mixer (~$430, Kitchen Appliances)
  -- "Many people want a heavy-duty stand mixer for baking, but don't urgently need it tomorrow."
  INSERT INTO product_requests (
    product_name, category, input_sku, reference_url, reason,
    status, vote_count, verification_status,
    created_at, updated_at
  ) VALUES (
    'KitchenAid Professional 600 Series 6-Qt Stand Mixer',
    'Kitchen Appliances',
    'KP26M1X',
    'https://www.amazon.com/dp/B000050AFF',
    'Professional-grade 6-quart mixer handles heavy doughs and large batches. Built to last decades with wide attachment ecosystem.',
    'not_reviewed', 15, 'pending',
    now() - interval '11 days', now() - interval '11 days'
  ) RETURNING id INTO req_id;
  INSERT INTO sku_verification_jobs (product_request_id, status, created_at)
  VALUES (req_id, 'pending', now() - interval '11 days');
  INSERT INTO product_request_events (product_request_id, event_type, actor, created_at)
  VALUES (req_id, 'CREATED', 'system', now() - interval '11 days');

  -- 6. Weber Genesis E-325s Gas Grill (~$950, Outdoor)
  -- "Many people want a reliable full-size gas grill, but don't urgently need it tomorrow."
  INSERT INTO product_requests (
    product_name, category, input_sku, reference_url, reason,
    status, vote_count, verification_status,
    created_at, updated_at
  ) VALUES (
    'Weber Genesis E-325s 3-Burner Gas Grill',
    'Outdoor',
    'E-325s',
    'https://www.amazon.com/dp/B09KMTVXST',
    'Durable stainless steel grill with Weber reliability. Perfect for families who grill weekly but want it to last 10+ years.',
    'not_reviewed', 14, 'pending',
    now() - interval '9 days', now() - interval '9 days'
  ) RETURNING id INTO req_id;
  INSERT INTO sku_verification_jobs (product_request_id, status, created_at)
  VALUES (req_id, 'pending', now() - interval '9 days');
  INSERT INTO product_request_events (product_request_id, event_type, actor, created_at)
  VALUES (req_id, 'CREATED', 'system', now() - interval '9 days');

  -- 7. Bose QuietComfort Ultra Headphones (~$430, Electronics)
  -- "Many people want premium noise-cancelling headphones for remote work, but don't urgently need it tomorrow."
  INSERT INTO product_requests (
    product_name, category, input_sku, reference_url, reason,
    status, vote_count, verification_status,
    created_at, updated_at
  ) VALUES (
    'Bose QuietComfort Ultra Wireless Headphones',
    'Electronics',
    'QC Ultra',
    'https://www.amazon.com/dp/B0CCZ1L489',
    'Best-in-class noise cancellation for open offices and remote work. Spatial audio and 24-hour battery life.',
    'not_reviewed', 13, 'pending',
    now() - interval '7 days', now() - interval '7 days'
  ) RETURNING id INTO req_id;
  INSERT INTO sku_verification_jobs (product_request_id, status, created_at)
  VALUES (req_id, 'pending', now() - interval '7 days');
  INSERT INTO product_request_events (product_request_id, event_type, actor, created_at)
  VALUES (req_id, 'CREATED', 'system', now() - interval '7 days');

  -- 8. LG C3 42" OLED 4K Smart TV (~$800, Electronics)
  -- "Many people want an OLED TV for their living room, but don't urgently need it tomorrow."
  INSERT INTO product_requests (
    product_name, category, input_sku, reference_url, reason,
    status, vote_count, verification_status,
    created_at, updated_at
  ) VALUES (
    'LG C3 42" OLED evo 4K Smart TV (OLED42C3PUA)',
    'Electronics',
    'OLED42C3PUA',
    'https://www.amazon.com/dp/B0BVXDPZP3',
    'Perfect size OLED for apartments and bedrooms. Self-lit pixels deliver perfect blacks that LCD TVs cannot match.',
    'not_reviewed', 12, 'pending',
    now() - interval '10 days', now() - interval '10 days'
  ) RETURNING id INTO req_id;
  INSERT INTO sku_verification_jobs (product_request_id, status, created_at)
  VALUES (req_id, 'pending', now() - interval '10 days');
  INSERT INTO product_request_events (product_request_id, event_type, actor, created_at)
  VALUES (req_id, 'CREATED', 'system', now() - interval '10 days');

  -- 9. DeLonghi La Specialista Prestigio (~$800, Kitchen Appliances)
  -- "Many people want barista-quality espresso with precision control, but don't urgently need it tomorrow."
  INSERT INTO product_requests (
    product_name, category, input_sku, reference_url, reason,
    status, vote_count, verification_status,
    created_at, updated_at
  ) VALUES (
    'DeLonghi La Specialista Prestigio Espresso Machine (EC9355M)',
    'Kitchen Appliances',
    'EC9355M',
    'https://www.amazon.com/dp/B09KG14FS4',
    'Dual heating system and sensor grinding for consistent espresso. Smart tamping station eliminates guesswork.',
    'not_reviewed', 10, 'pending',
    now() - interval '6 days', now() - interval '6 days'
  ) RETURNING id INTO req_id;
  INSERT INTO sku_verification_jobs (product_request_id, status, created_at)
  VALUES (req_id, 'pending', now() - interval '6 days');
  INSERT INTO product_request_events (product_request_id, event_type, actor, created_at)
  VALUES (req_id, 'CREATED', 'system', now() - interval '6 days');

  -- 10. Tineco Floor One S7 Pro Smart Wet-Dry Vacuum (~$500, Home Appliances)
  -- "Many people want a single device that vacuums and mops simultaneously, but don't urgently need it tomorrow."
  INSERT INTO product_requests (
    product_name, category, input_sku, reference_url, reason,
    status, vote_count, verification_status,
    created_at, updated_at
  ) VALUES (
    'Tineco Floor One S7 Pro Smart Wet-Dry Vacuum',
    'Home Appliances',
    'S7 Pro',
    'https://www.amazon.com/dp/B0CK3Z9V6V',
    'Vacuums and mops hard floors in one pass with self-cleaning. Eliminates the need for separate vacuum and mop.',
    'not_reviewed', 9, 'pending',
    now() - interval '4 days', now() - interval '4 days'
  ) RETURNING id INTO req_id;
  INSERT INTO sku_verification_jobs (product_request_id, status, created_at)
  VALUES (req_id, 'pending', now() - interval '4 days');
  INSERT INTO product_request_events (product_request_id, event_type, actor, created_at)
  VALUES (req_id, 'CREATED', 'system', now() - interval '4 days');

  -- 11. Jackery Explorer 1000 Plus Portable Power Station (~$800, Outdoor)
  -- "Many people want reliable backup power for outages and camping, but don't urgently need it tomorrow."
  INSERT INTO product_requests (
    product_name, category, input_sku, reference_url, reason,
    status, vote_count, verification_status,
    created_at, updated_at
  ) VALUES (
    'Jackery Explorer 1000 Plus Portable Power Station',
    'Outdoor',
    'Explorer 1000 Plus',
    'https://www.amazon.com/dp/B0CJ4N1LM7',
    'LiFePO4 battery with 1264Wh capacity. Powers essentials during outages, camping trips, or off-grid work.',
    'not_reviewed', 8, 'pending',
    now() - interval '8 days', now() - interval '8 days'
  ) RETURNING id INTO req_id;
  INSERT INTO sku_verification_jobs (product_request_id, status, created_at)
  VALUES (req_id, 'pending', now() - interval '8 days');
  INSERT INTO product_request_events (product_request_id, event_type, actor, created_at)
  VALUES (req_id, 'CREATED', 'system', now() - interval '8 days');

  -- 12. EGO Power+ 21" Select Cut Self-Propelled Mower (~$550, Tools)
  -- "Many people want a powerful battery mower to replace gas, but don't urgently need it tomorrow."
  INSERT INTO product_requests (
    product_name, category, input_sku, reference_url, reason,
    status, vote_count, verification_status,
    created_at, updated_at
  ) VALUES (
    'EGO Power+ 21" Select Cut Self-Propelled Lawn Mower',
    'Tools',
    'LM2135SP',
    'https://www.amazon.com/dp/B09MYQ35G7',
    'Battery-powered mower matching gas performance. No oil changes, gas runs, or pull-starts. Quiet enough for early morning use.',
    'not_reviewed', 7, 'pending',
    now() - interval '7 days', now() - interval '7 days'
  ) RETURNING id INTO req_id;
  INSERT INTO sku_verification_jobs (product_request_id, status, created_at)
  VALUES (req_id, 'pending', now() - interval '7 days');
  INSERT INTO product_request_events (product_request_id, event_type, actor, created_at)
  VALUES (req_id, 'CREATED', 'system', now() - interval '7 days');

  -- 13. Blueair Blue Pure 211i Max Air Purifier (~$370, Home Appliances)
  -- "Many people want cleaner indoor air for allergies or smoke season, but don't urgently need it tomorrow."
  INSERT INTO product_requests (
    product_name, category, input_sku, reference_url, reason,
    status, vote_count, verification_status,
    created_at, updated_at
  ) VALUES (
    'Blueair Blue Pure 211i Max Large Room Air Purifier',
    'Home Appliances',
    '211i Max',
    'https://www.amazon.com/dp/B0CJ5GP2NQ',
    'Covers up to 2,580 sq ft with HEPASilent Ultra filtration. Essential for allergy sufferers and wildfire smoke season.',
    'not_reviewed', 5, 'pending',
    now() - interval '5 days', now() - interval '5 days'
  ) RETURNING id INTO req_id;
  INSERT INTO sku_verification_jobs (product_request_id, status, created_at)
  VALUES (req_id, 'pending', now() - interval '5 days');
  INSERT INTO product_request_events (product_request_id, event_type, actor, created_at)
  VALUES (req_id, 'CREATED', 'system', now() - interval '5 days');

  -- 14. Milwaukee M18 FUEL 2-Tool Combo Kit (~$400, Tools)
  -- "Many people want professional-grade cordless tools for home projects, but don't urgently need it tomorrow."
  INSERT INTO product_requests (
    product_name, category, input_sku, reference_url, reason,
    status, vote_count, verification_status,
    created_at, updated_at
  ) VALUES (
    'Milwaukee M18 FUEL 2-Tool Combo Kit (Hammer Drill + Impact Driver)',
    'Tools',
    '3697-22',
    'https://www.amazon.com/dp/B07BRZ6PNY',
    'Professional-grade brushless drill and impact driver combo. One battery system powers 200+ Milwaukee tools.',
    'not_reviewed', 4, 'pending',
    now() - interval '2 days', now() - interval '2 days'
  ) RETURNING id INTO req_id;
  INSERT INTO sku_verification_jobs (product_request_id, status, created_at)
  VALUES (req_id, 'pending', now() - interval '2 days');
  INSERT INTO product_request_events (product_request_id, event_type, actor, created_at)
  VALUES (req_id, 'CREATED', 'system', now() - interval '2 days');

  -- 15. LG 27GP950-B UltraGear 27" 4K Gaming Monitor (~$600, Electronics)
  -- "Many people want a high-refresh 4K monitor for work and gaming, but don't urgently need it tomorrow."
  INSERT INTO product_requests (
    product_name, category, input_sku, reference_url, reason,
    status, vote_count, verification_status,
    created_at, updated_at
  ) VALUES (
    'LG UltraGear 27" 4K Nano IPS Gaming Monitor (27GP950-B)',
    'Electronics',
    '27GP950-B',
    'https://www.amazon.com/dp/B094LCB1WZ',
    'Dual-purpose 4K 160Hz monitor for productivity and gaming. Nano IPS panel with wide color gamut for content work.',
    'not_reviewed', 3, 'pending',
    now() - interval '3 days', now() - interval '3 days'
  ) RETURNING id INTO req_id;
  INSERT INTO sku_verification_jobs (product_request_id, status, created_at)
  VALUES (req_id, 'pending', now() - interval '3 days');
  INSERT INTO product_request_events (product_request_id, event_type, actor, created_at)
  VALUES (req_id, 'CREATED', 'system', now() - interval '3 days');

END $$;
