----------------------------------------------------------------
-- DataBites - Seed Data (Test Data Only)
-- Author: Caroline Sholar (Database & QA Lead)
-- Description: 120+ test data points across 3 users
--   Run AFTER databites_schema.sql — local testing ONLY
--   Never run on a real/production database
----------------------------------------------------------------
-- Usage (run from Backend/ folder):
--   python3 -c "
--     import sqlite3
--     conn = sqlite3.connect('../DataBase/databites.db')
--     conn.executescript(open('../DataBase/seed_data.sql').read())
--     print('Seeded!')
--   "
----------------------------------------------------------------


----------------------------------------------------------------
-- USERS
-- 3 test accounts, password for all is: test1234

INSERT INTO users (username, email, password_hash, display_name) VALUES
    ('alice', 'alice@test.com', 'pbkdf2:sha256:test_hash_alice', 'Alice'),
    ('bob',   'bob@test.com',   'pbkdf2:sha256:test_hash_bob',   'Bob'),
    ('carol', 'carol@test.com', 'pbkdf2:sha256:test_hash_carol', 'Carol');


----------------------------------------------------------------
-- FOOD LOGS — Alice (user_id = 1) — 45 entries
-- Covers all meal types, all moods, with and without notes,
-- spread across multiple weeks for summary testing

INSERT INTO food_logs (user_id, food_name, logged_at, meal_type, mood, notes) VALUES
    (1, 'Oatmeal with banana',       '2026-03-09 08:15:00', 'breakfast', 'happy',    'made at home'),
    (1, 'Grilled chicken wrap',      '2026-03-09 12:30:00', 'lunch',     'neutral',  'dining hall'),
    (1, 'Handful of almonds',        '2026-03-09 15:00:00', 'snack',     'tired',    NULL),
    (1, 'Pasta with marinara',       '2026-03-09 19:00:00', 'dinner',    'happy',    'cooked with roommate'),
    (1, 'Scrambled eggs and toast',  '2026-03-08 09:00:00', 'breakfast', 'neutral',  NULL),
    (1, 'Caesar salad',              '2026-03-08 13:00:00', 'lunch',     'stressed', 'ate at desk'),
    (1, 'Granola bar',               '2026-03-08 16:00:00', 'snack',     'tired',    NULL),
    (1, 'Leftover pasta',            '2026-03-08 18:30:00', 'dinner',    'tired',    'too tired to cook'),
    (1, 'Yogurt parfait',            '2026-03-07 08:45:00', 'breakfast', 'happy',    NULL),
    (1, 'Turkey sandwich',           '2026-03-07 12:00:00', 'lunch',     'neutral',  'from the cafe'),
    (1, 'Apple and peanut butter',   '2026-03-07 16:00:00', 'snack',     'happy',    NULL),
    (1, 'Stir fry with rice',        '2026-03-07 19:30:00', 'dinner',    'excited',  'tried a new recipe'),
    (1, 'Cereal with milk',          '2026-03-06 08:00:00', 'breakfast', 'tired',    'running late'),
    (1, 'Pizza slice',               '2026-03-06 13:30:00', 'lunch',     'happy',    'out with friends'),
    (1, 'Chips and salsa',           '2026-03-06 17:00:00', 'snack',     'neutral',  NULL),
    (1, 'Burrito bowl',              '2026-03-06 20:00:00', 'dinner',    'happy',    'chipotle run'),
    (1, 'Avocado toast',             '2026-03-05 09:00:00', 'breakfast', 'excited',  'treated myself'),
    (1, 'Soup and bread',            '2026-03-05 12:30:00', 'lunch',     'sad',      'not feeling great'),
    (1, 'Granola bar',               '2026-03-05 15:30:00', 'snack',     'tired',    NULL),
    (1, 'Spaghetti bolognese',       '2026-03-05 19:00:00', 'dinner',    'neutral',  'mom''s recipe'),
    (1, 'Pancakes',                  '2026-03-04 10:00:00', 'breakfast', 'happy',    'weekend treat'),
    (1, 'Grilled cheese',            '2026-03-04 14:00:00', 'lunch',     'happy',    NULL),
    (1, 'Ice cream',                 '2026-03-04 20:00:00', 'snack',     'excited',  'movie night'),
    (1, 'Chicken and veggies',       '2026-03-04 19:00:00', 'dinner',    'neutral',  'meal prepped'),
    (1, 'Bagel with cream cheese',   '2026-03-03 08:30:00', 'breakfast', 'neutral',  NULL),
    (1, 'Cobb salad',                '2026-03-03 12:00:00', 'lunch',     'happy',    NULL),
    (1, 'Protein bar',               '2026-03-03 15:00:00', 'snack',     'neutral',  'post gym'),
    (1, 'Tacos',                     '2026-03-03 19:30:00', 'dinner',    'excited',  'taco tuesday'),
    (1, 'French toast',              '2026-03-02 09:00:00', 'breakfast', 'happy',    'slow morning'),
    (1, 'Tomato soup',               '2026-03-02 13:00:00', 'lunch',     'sad',      'rainy day'),
    (1, 'Orange slices',             '2026-03-02 16:00:00', 'snack',     'neutral',  NULL),
    (1, 'Grilled salmon',            '2026-03-02 19:00:00', 'dinner',    'happy',    'treat yourself'),
    (1, 'Smoothie',                  '2026-02-28 08:00:00', 'breakfast', 'excited',  'berry blend'),
    (1, 'Veggie wrap',               '2026-02-28 12:30:00', 'lunch',     'neutral',  NULL),
    (1, 'Crackers and hummus',       '2026-02-28 15:30:00', 'snack',     'happy',    NULL),
    (1, 'Chicken stir fry',          '2026-02-28 19:00:00', 'dinner',    'happy',    'quick weeknight meal'),
    (1, 'Overnight oats',            '2026-02-27 08:00:00', 'breakfast', 'happy',    'prepped night before'),
    (1, 'BLT sandwich',              '2026-02-27 12:00:00', 'lunch',     'neutral',  NULL),
    (1, 'Banana',                    '2026-02-27 15:00:00', 'snack',     'tired',    NULL),
    (1, 'Mac and cheese',            '2026-02-27 19:30:00', 'dinner',    'happy',    'comfort food'),
    (1, 'Waffles with syrup',        '2026-02-26 09:30:00', 'breakfast', 'excited',  'weekend'),
    (1, 'Chicken noodle soup',       '2026-02-26 13:00:00', 'lunch',     'sad',      'feeling under the weather'),
    (1, 'Trail mix',                 '2026-02-26 16:00:00', 'snack',     'neutral',  NULL),
    (1, 'Veggie pizza',              '2026-02-26 19:30:00', 'dinner',    'happy',    'pizza friday'),
    (1, 'Greek yogurt',              '2026-02-25 08:00:00', 'breakfast', 'neutral',  NULL);


----------------------------------------------------------------
-- FOOD LOGS — Bob (user_id = 2) — 35 entries

INSERT INTO food_logs (user_id, food_name, logged_at, meal_type, mood, notes) VALUES
    (2, 'Protein shake',             '2026-03-09 07:30:00', 'breakfast', 'excited',  'post workout'),
    (2, 'Chicken rice bowl',         '2026-03-09 12:00:00', 'lunch',     'happy',    'meal prepped'),
    (2, 'Mixed nuts',                '2026-03-09 15:30:00', 'snack',     'neutral',  NULL),
    (2, 'Beef tacos',                '2026-03-09 19:00:00', 'dinner',    'happy',    'homemade'),
    (2, 'Bagel with cream cheese',   '2026-03-08 08:30:00', 'breakfast', 'neutral',  NULL),
    (2, 'Burger and fries',          '2026-03-08 13:30:00', 'lunch',     'happy',    'out with friends'),
    (2, 'Grapes',                    '2026-03-08 16:00:00', 'snack',     'neutral',  NULL),
    (2, 'Pasta primavera',           '2026-03-08 19:30:00', 'dinner',    'happy',    NULL),
    (2, 'Eggs and bacon',            '2026-03-07 08:00:00', 'breakfast', 'happy',    'weekend breakfast'),
    (2, 'Club sandwich',             '2026-03-07 13:00:00', 'lunch',     'neutral',  NULL),
    (2, 'Protein bar',               '2026-03-07 16:00:00', 'snack',     'excited',  'pre workout'),
    (2, 'Steak and potatoes',        '2026-03-07 19:00:00', 'dinner',    'excited',  'treated myself'),
    (2, 'Oatmeal',                   '2026-03-06 08:00:00', 'breakfast', 'neutral',  NULL),
    (2, 'Tuna salad sandwich',       '2026-03-06 12:30:00', 'lunch',     'neutral',  NULL),
    (2, 'Apple',                     '2026-03-06 15:30:00', 'snack',     'happy',    NULL),
    (2, 'Chicken soup',              '2026-03-06 19:00:00', 'dinner',    'sad',      'not feeling well'),
    (2, 'Cereal',                    '2026-03-05 08:00:00', 'breakfast', 'tired',    NULL),
    (2, 'Veggie burger',             '2026-03-05 12:00:00', 'lunch',     'neutral',  'trying something new'),
    (2, 'Crackers',                  '2026-03-05 15:00:00', 'snack',     'tired',    NULL),
    (2, 'Sushi',                     '2026-03-05 19:30:00', 'dinner',    'excited',  'sushi night'),
    (2, 'Smoothie bowl',             '2026-03-04 09:00:00', 'breakfast', 'happy',    'weekend'),
    (2, 'BBQ chicken wrap',          '2026-03-04 13:00:00', 'lunch',     'happy',    NULL),
    (2, 'Popcorn',                   '2026-03-04 16:00:00', 'snack',     'happy',    'movie afternoon'),
    (2, 'Grilled chicken and rice',  '2026-03-04 19:00:00', 'dinner',    'neutral',  'meal prep'),
    (2, 'Toast with jam',            '2026-03-03 08:00:00', 'breakfast', 'neutral',  NULL),
    (2, 'Caesar salad',              '2026-03-03 12:30:00', 'lunch',     'happy',    NULL),
    (2, 'Banana',                    '2026-03-03 15:00:00', 'snack',     'neutral',  NULL),
    (2, 'Shrimp stir fry',           '2026-03-03 19:00:00', 'dinner',    'excited',  'new recipe'),
    (2, 'Avocado toast',             '2026-03-02 09:00:00', 'breakfast', 'happy',    NULL),
    (2, 'Soup and sandwich',         '2026-03-02 13:00:00', 'lunch',     'neutral',  NULL),
    (2, 'Cheese and crackers',       '2026-03-02 16:00:00', 'snack',     'happy',    NULL),
    (2, 'Baked salmon',              '2026-03-02 19:30:00', 'dinner',    'happy',    'healthy dinner'),
    (2, 'Pancakes',                  '2026-03-01 10:00:00', 'breakfast', 'excited',  'sunday brunch'),
    (2, 'Chicken sandwich',          '2026-03-01 14:00:00', 'lunch',     'neutral',  NULL),
    (2, 'Rice bowl with veggies',    '2026-03-01 19:00:00', 'dinner',    'happy',    'light dinner');


----------------------------------------------------------------
-- FOOD LOGS — Carol (user_id = 3) — 25 entries

INSERT INTO food_logs (user_id, food_name, logged_at, meal_type, mood, notes) VALUES
    (3, 'Green smoothie',            '2026-03-09 07:45:00', 'breakfast', 'excited',  'kale and mango'),
    (3, 'Quinoa salad',              '2026-03-09 12:00:00', 'lunch',     'happy',    'meal prepped'),
    (3, 'Rice cakes',                '2026-03-09 15:00:00', 'snack',     'neutral',  NULL),
    (3, 'Lentil soup',               '2026-03-09 19:00:00', 'dinner',    'happy',    'homemade'),
    (3, 'Chia pudding',              '2026-03-08 08:00:00', 'breakfast', 'happy',    'prepped overnight'),
    (3, 'Caprese sandwich',          '2026-03-08 12:30:00', 'lunch',     'neutral',  NULL),
    (3, 'Edamame',                   '2026-03-08 15:30:00', 'snack',     'happy',    NULL),
    (3, 'Veggie pasta',              '2026-03-08 19:00:00', 'dinner',    'neutral',  NULL),
    (3, 'Acai bowl',                 '2026-03-07 09:00:00', 'breakfast', 'excited',  'weekend treat'),
    (3, 'Falafel wrap',              '2026-03-07 13:00:00', 'lunch',     'happy',    'from the food truck'),
    (3, 'Fruit salad',               '2026-03-07 16:00:00', 'snack',     'happy',    NULL),
    (3, 'Mushroom risotto',          '2026-03-07 19:30:00', 'dinner',    'excited',  'date night in'),
    (3, 'Oat bran',                  '2026-03-06 08:00:00', 'breakfast', 'neutral',  NULL),
    (3, 'Greek salad',               '2026-03-06 12:00:00', 'lunch',     'happy',    NULL),
    (3, 'Almonds and dried fruit',   '2026-03-06 15:00:00', 'snack',     'neutral',  NULL),
    (3, 'Tofu stir fry',             '2026-03-06 19:00:00', 'dinner',    'happy',    'quick and easy'),
    (3, 'Yogurt with granola',       '2026-03-05 08:30:00', 'breakfast', 'happy',    NULL),
    (3, 'Hummus and veggie wrap',    '2026-03-05 12:30:00', 'lunch',     'neutral',  NULL),
    (3, 'Apple slices',              '2026-03-05 15:30:00', 'snack',     'happy',    NULL),
    (3, 'Black bean tacos',          '2026-03-05 19:00:00', 'dinner',    'excited',  'taco tuesday'),
    (3, 'Muesli with almond milk',   '2026-03-04 09:00:00', 'breakfast', 'happy',    'weekend morning'),
    (3, 'Avocado and egg toast',     '2026-03-04 13:00:00', 'lunch',     'excited',  'brunch vibes'),
    (3, 'Dark chocolate',            '2026-03-04 16:00:00', 'snack',     'happy',    'small treat'),
    (3, 'Stuffed bell peppers',      '2026-03-04 19:30:00', 'dinner',    'happy',    'new recipe'),
    (3, 'Overnight oats',            '2026-03-03 08:00:00', 'breakfast', 'neutral',  'easy morning');


----------------------------------------------------------------
-- SOFT-DELETED LOG — Alice
-- Tests that deleted entries do not appear in active_food_logs
-- Tests that undo route can restore a soft-deleted entry

INSERT INTO food_logs (user_id, food_name, logged_at, meal_type, mood, notes, deleted_at) VALUES
    (1, 'Fast food burger', '2026-03-05 19:00:00', 'dinner', 'sad', 'stress eating', '2026-03-05 21:00:00');


----------------------------------------------------------------
-- AUDIT RECORDS
-- Simulates change history for testing the undo feature
-- log 1  = Alice oatmeal (create only)
-- log 6  = Alice caesar salad (create then edit — undo rolls back mood)
-- log 106 = Alice fast food (create then delete — undo restores it)
-- log 47 = Bob burger (create only)

INSERT INTO food_log_audit (log_id, user_id, action, food_name, logged_at, meal_type, mood, notes) VALUES
    (1,   1, 'create', 'Oatmeal with banana', '2026-03-09 08:15:00', 'breakfast', 'happy',    'made at home'),
    (6,   1, 'create', 'Caesar salad',        '2026-03-08 13:00:00', 'lunch',     'neutral',  NULL),
    (6,   1, 'edit',   'Caesar salad',        '2026-03-08 13:00:00', 'lunch',     'stressed', 'ate at desk'),
    (106, 1, 'create', 'Fast food burger',    '2026-03-05 19:00:00', 'dinner',    'sad',      'stress eating'),
    (106, 1, 'delete', 'Fast food burger',    '2026-03-05 19:00:00', 'dinner',    'sad',      'stress eating'),
    (47,  2, 'create', 'Burger and fries',    '2026-03-08 13:30:00', 'lunch',     'happy',    'out with friends');


----------------------------------------------------------------
-- SUMMARIES
-- Pre-cached habit summaries for PBI #4 testing

INSERT INTO summaries (user_id, period_type, period_start, period_end, total_entries, most_common_meal_type, most_common_mood, days_logged, summary_notes) VALUES
    (1, 'weekly',  '2026-03-02', '2026-03-08', 20, 'lunch',  'happy',  7,  'You logged every day this week! Lunch was your most frequent meal and you were mostly happy while eating.'),
    (1, 'monthly', '2026-03-01', '2026-03-31', 45, 'lunch',  'happy',  14, 'Great month Alice! Lunch is your most tracked meal and happy is your most common mood.'),
    (2, 'weekly',  '2026-03-02', '2026-03-08', 14, 'dinner', 'happy',  7,  'You logged every day this week Bob! Dinner was your most frequent meal type.'),
    (2, 'monthly', '2026-03-01', '2026-03-31', 35, 'lunch',  'happy',  11, 'Solid month Bob! You logged 11 days and were mostly happy while eating.'),
    (3, 'weekly',  '2026-03-04', '2026-03-09', 12, 'lunch',  'happy',  6,  'Strong week Carol! You logged 6 out of 7 days and were mostly happy while eating.');


----------------------------------------------------------------
-- PASSWORD RESET TOKEN
-- Expired test token for Alice — safe for QA testing

INSERT INTO password_reset_tokens (user_id, token, expires_at, used) VALUES
    (1, 'test-reset-token-abc123', '2026-03-01 12:00:00', 0);
