# Testing Achievements and Notifications Guide

## Quick Test Overview

There are 3 ways to test:
1. **Manual Testing** - Complete actual brain boost sessions (slow but realistic)
2. **Database Injection** - Create test data directly in database (fast)
3. **SQL Test Script** - Automated test script (fastest, recommended)

---

## Method 1: Manual Testing (Real Usage)

### Testing Achievements

1. **Go to the app** → Home screen
2. **Select a subject** (e.g., Mathematics)
3. **Complete a Daily Brain Boost session**
4. **Go to Profile** → Scroll to "Subject Mastery"
5. You should see **Mathematics progress: 1/10**
6. **Repeat 9 more times** to unlock the achievement
7. On the 10th completion:
   - Achievement unlocks (icon changes from 🔒 to 🔢)
   - Progress bar fills to 100%
   - Card gets colored border
   - **Notification is created**

### Testing Level Up Notifications

1. **Check your current points** in Profile
2. **Check what level you're on** (shown under your name)
3. **Complete brain boost sessions** to earn points
4. **When you cross a level threshold**, you'll get a notification

**Level Thresholds:**
- Level 2: 100 points
- Level 3: 250 points
- Level 4: 500 points
- Level 5: 1000 points
- Level 6: 2000 points
- Level 7: 3500 points
- Level 8: 5000 points
- Level 9: 7500 points
- Level 10: 10000 points

---

## Method 2: Database Injection (Fast Testing)

### Prerequisites
1. Get your **User ID** from Supabase:
```sql
-- Find your user ID
SELECT id, email, full_name FROM users WHERE email = 'your.email@example.com';
```

Copy your `id` - you'll need it for all tests below.

### Test 1: Create Fake Brain Boost Sessions

This will give you progress toward achievements:

```sql
-- Replace 'YOUR_USER_ID' with your actual user ID

-- Create 5 Mathematics sessions
INSERT INTO brain_boost_history (
  user_id, 
  mode, 
  subject, 
  topics,
  total_questions, 
  correct_answers, 
  score_percentage, 
  duration_seconds, 
  points_earned, 
  completed
)
SELECT 
  'YOUR_USER_ID'::uuid,
  'quiz',
  'Mathematics',
  ARRAY['Algebra', 'Geometry'],
  10,
  8,
  80,
  900,
  90,
  true
FROM generate_series(1, 5);

-- Create 3 English sessions
INSERT INTO brain_boost_history (
  user_id, 
  mode, 
  subject, 
  topics,
  total_questions, 
  correct_answers, 
  score_percentage, 
  duration_seconds, 
  points_earned, 
  completed
)
SELECT 
  'YOUR_USER_ID'::uuid,
  'quiz',
  'English',
  ARRAY['Grammar', 'Vocabulary'],
  10,
  9,
  90,
  800,
  115,
  true
FROM generate_series(1, 3);
```

**After running this:**
- Go to Profile → Subject Mastery
- Mathematics should show: 5/10 (50% progress)
- English should show: 3/10 (30% progress)

### Test 2: Complete Achievement (10th Session)

```sql
-- This will trigger the achievement notification

-- Update achievement progress for Mathematics
SELECT * FROM public.update_achievement_progress(
  'YOUR_USER_ID'::uuid,
  'Mathematics'
);

-- Check if achievement unlocked
SELECT * FROM user_achievements 
WHERE user_id = 'YOUR_USER_ID' 
  AND subject = 'Mathematics';
```

If `earned = true`, the achievement is unlocked!

### Test 3: Create Test Notifications Manually

Create notifications without completing sessions:

```sql
-- Level Up Notification
INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  icon,
  icon_color,
  read
) VALUES (
  'YOUR_USER_ID'::uuid,
  'level_up',
  'Level Up! 🎉',
  'Congratulations! You reached Level 5 - Achiever!',
  'trophy',
  '#FFD700',
  false
);

-- Achievement Notification
INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  icon,
  icon_color,
  read
) VALUES (
  'YOUR_USER_ID'::uuid,
  'achievement',
  'Achievement Unlocked! 🏆',
  'You earned "Mathematics Master"! Keep up the great work!',
  'award',
  '#00FF00',
  false
);

-- Streak Notification (for future)
INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  icon,
  icon_color,
  read
) VALUES (
  'YOUR_USER_ID'::uuid,
  'streak',
  '7-Day Streak! ⚡',
  'Amazing! You''ve studied for 7 days in a row!',
  'fire',
  '#FF9800',
  false
);
```

**After running:**
- Go to Profile
- You should see a badge with **3** on the notification bell
- Click the bell to see all notifications

### Test 4: Add Points for Level Up

```sql
-- Add points to trigger level up
UPDATE users 
SET points = points + 500 
WHERE id = 'YOUR_USER_ID';

-- Check your new level
SELECT 
  points,
  (SELECT level FROM get_level_from_points(points)) as current_level,
  (SELECT level_name FROM get_level_from_points(points)) as current_level_name
FROM users 
WHERE id = 'YOUR_USER_ID';
```

---

## Method 3: Complete Automated Test Script (Recommended)

This script tests everything at once:

```sql
-- ============================================
-- COMPLETE TEST SCRIPT
-- ============================================
-- Replace 'YOUR_USER_ID' with your actual user ID

DO $$
DECLARE
  v_user_id UUID := 'YOUR_USER_ID'::uuid;
  v_old_points INTEGER;
  v_new_points INTEGER;
BEGIN
  RAISE NOTICE '=== Starting Comprehensive Test ===';
  
  -- Step 1: Clear existing test data
  RAISE NOTICE 'Step 1: Cleaning up old test data...';
  DELETE FROM brain_boost_history WHERE user_id = v_user_id AND session_date = CURRENT_DATE;
  DELETE FROM notifications WHERE user_id = v_user_id;
  
  -- Step 2: Get current points
  SELECT points INTO v_old_points FROM users WHERE id = v_user_id;
  RAISE NOTICE 'Step 2: Current points: %', v_old_points;
  
  -- Step 3: Create brain boost sessions for multiple subjects
  RAISE NOTICE 'Step 3: Creating test sessions...';
  
  -- Mathematics (8 sessions - not enough to unlock)
  INSERT INTO brain_boost_history (
    user_id, mode, subject, topics,
    total_questions, correct_answers, score_percentage,
    duration_seconds, points_earned, completed
  )
  SELECT 
    v_user_id, 'quiz', 'Mathematics', ARRAY['Algebra'],
    10, 8, 80, 900, 90, true
  FROM generate_series(1, 8);
  
  -- English (10 sessions - should unlock achievement!)
  INSERT INTO brain_boost_history (
    user_id, mode, subject, topics,
    total_questions, correct_answers, score_percentage,
    duration_seconds, points_earned, completed
  )
  SELECT 
    v_user_id, 'quiz', 'English', ARRAY['Grammar'],
    10, 9, 90, 800, 115, true
  FROM generate_series(1, 10);
  
  -- Bahasa Melayu (5 sessions)
  INSERT INTO brain_boost_history (
    user_id, mode, subject, topics,
    total_questions, correct_answers, score_percentage,
    duration_seconds, points_earned, completed
  )
  SELECT 
    v_user_id, 'quiz', 'Bahasa Melayu', ARRAY['Tatabahasa'],
    10, 7, 70, 850, 70, true
  FROM generate_series(1, 5);
  
  RAISE NOTICE 'Created 23 test sessions';
  
  -- Step 4: Update achievement progress
  RAISE NOTICE 'Step 4: Updating achievements...';
  PERFORM update_achievement_progress(v_user_id, 'Mathematics');
  PERFORM update_achievement_progress(v_user_id, 'English');
  PERFORM update_achievement_progress(v_user_id, 'Bahasa Melayu');
  
  -- Step 5: Create test notifications
  RAISE NOTICE 'Step 5: Creating test notifications...';
  
  -- Achievement notification
  PERFORM create_notification(
    v_user_id,
    'achievement',
    'Achievement Unlocked! 🏆',
    'You earned "English Master"! Keep up the great work!',
    'award',
    '#00FF00',
    NULL,
    'achievement'
  );
  
  -- Level up notification
  PERFORM create_notification(
    v_user_id,
    'level_up',
    'Level Up! 🎉',
    'Congratulations! You reached a new level!',
    'trophy',
    '#FFD700',
    NULL,
    'level'
  );
  
  -- Step 6: Check results
  SELECT points INTO v_new_points FROM users WHERE id = v_user_id;
  RAISE NOTICE 'Step 6: New points: % (gained: %)', v_new_points, (v_new_points - v_old_points);
  
  RAISE NOTICE '=== Test Complete! ===';
  RAISE NOTICE 'Check your app:';
  RAISE NOTICE '1. Profile -> Subject Mastery';
  RAISE NOTICE '   - Mathematics: 8/10 (80%%)';
  RAISE NOTICE '   - English: 10/10 (100%% - UNLOCKED!)';
  RAISE NOTICE '   - Bahasa Melayu: 5/10 (50%%)';
  RAISE NOTICE '2. Profile -> Notification Bell';
  RAISE NOTICE '   - Should show badge with 2';
  RAISE NOTICE '   - Click to see notifications';
END $$;
```

**Run this script and then:**
1. Open your app
2. Go to Profile
3. Check Subject Mastery section
4. Check notification bell (should have badge with 2)
5. Click bell to see notifications

---

## Verification Queries

### Check Your Achievements
```sql
SELECT 
  subject,
  current_count,
  required_count,
  earned,
  ROUND((current_count::numeric / required_count * 100), 0) as progress_percent
FROM user_achievements 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY subject;
```

Expected output:
```
subject         | current_count | required_count | earned | progress_percent
----------------|---------------|----------------|--------|------------------
Bahasa Melayu   | 5             | 10             | false  | 50
English         | 10            | 10             | true   | 100
Mathematics     | 8             | 10             | false  | 80
Science         | 0             | 10             | false  | 0
Sejarah         | 0             | 10             | false  | 0
```

### Check Your Notifications
```sql
SELECT 
  type,
  title,
  message,
  read,
  created_at
FROM notifications 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

### Check Your Sessions
```sql
SELECT 
  subject,
  COUNT(*) as total_sessions,
  SUM(points_earned) as total_points
FROM brain_boost_history 
WHERE user_id = 'YOUR_USER_ID' 
  AND completed = true
GROUP BY subject
ORDER BY total_sessions DESC;
```

### Check Your Level
```sql
SELECT 
  u.points,
  l.level,
  l.level_name
FROM users u
CROSS JOIN LATERAL get_level_from_points(u.points) l
WHERE u.id = 'YOUR_USER_ID';
```

---

## Testing Checklist

### ✅ Achievements Testing
- [ ] Can see all 5 subjects in Subject Mastery section
- [ ] Locked achievements show 🔒 icon
- [ ] Progress bars show correct percentage
- [ ] Count shows X/10 correctly
- [ ] After 10 sessions, achievement unlocks
- [ ] Unlocked achievement shows subject emoji (🔢, 📖, etc.)
- [ ] Unlocked achievement has colored border
- [ ] Achievement notification appears when unlocked

### ✅ Notifications Testing
- [ ] Notification bell shows badge when unread exist
- [ ] Badge count is accurate
- [ ] Click bell opens notification dropdown
- [ ] Notifications show correct icon and color
- [ ] Unread notifications have green dot
- [ ] Time ago displays correctly
- [ ] Click notification marks it as read
- [ ] "Mark all read" button appears when unread exist
- [ ] "Mark all read" clears all unread notifications
- [ ] Empty state shows when no notifications
- [ ] Loading state shows while fetching

---

## Troubleshooting

### Achievements Not Showing Progress

**Check sessions exist:**
```sql
SELECT subject, COUNT(*) 
FROM brain_boost_history 
WHERE user_id = 'YOUR_USER_ID' AND completed = true 
GROUP BY subject;
```

**Force update achievements:**
```sql
SELECT update_achievement_progress('YOUR_USER_ID'::uuid, 'Mathematics');
```

### Notifications Not Appearing

**Check notifications exist:**
```sql
SELECT * FROM notifications WHERE user_id = 'YOUR_USER_ID';
```

**If empty, create test notification:**
```sql
SELECT create_notification(
  'YOUR_USER_ID'::uuid,
  'level_up',
  'Test Notification',
  'This is a test!',
  'trophy',
  '#FFD700',
  NULL,
  'test'
);
```

### Badge Count Wrong

**Check unread count:**
```sql
SELECT get_unread_notification_count('YOUR_USER_ID'::uuid);
```

**Force mark all as read:**
```sql
UPDATE notifications 
SET read = true, read_at = NOW() 
WHERE user_id = 'YOUR_USER_ID';
```

---

## Reset Everything (Clean Slate)

If you want to start fresh:

```sql
-- WARNING: This deletes all your test data!
-- Replace 'YOUR_USER_ID' with your actual user ID

-- Delete sessions
DELETE FROM brain_boost_history WHERE user_id = 'YOUR_USER_ID';

-- Delete achievements
DELETE FROM user_achievements WHERE user_id = 'YOUR_USER_ID';

-- Delete notifications
DELETE FROM notifications WHERE user_id = 'YOUR_USER_ID';

-- Reset points (optional)
UPDATE users SET points = 0 WHERE id = 'YOUR_USER_ID';
```

---

## Quick Test Summary

**Fastest way to test everything:**

1. Copy the "Complete Automated Test Script" above
2. Replace `YOUR_USER_ID` with your actual user ID
3. Run in Supabase SQL Editor
4. Open app → Profile
5. Check achievements and notifications

Done! 🎉

---

Need help? Check the logs:
```sql
-- See recent notifications
SELECT * FROM notifications 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC LIMIT 10;

-- See recent sessions
SELECT * FROM brain_boost_history 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC LIMIT 10;

-- See achievement status
SELECT * FROM user_achievements 
WHERE user_id = 'YOUR_USER_ID';
```

