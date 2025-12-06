# Notifications System Setup Guide

## Overview
Your profile page now has a **functional notification system** that automatically tracks:
- 🏆 **Level Up Notifications** - When users reach a new level
- 🎯 **Achievement Notifications** - When users earn subject mastery achievements

## Features

### ✅ Real-time Notifications
- Automatic notification creation when events happen
- Badge counter showing unread notifications
- Poll for new notifications every 30 seconds

### ✅ Mark as Read
- Click individual notifications to mark them as read
- "Mark all read" button to clear all unread notifications
- Unread count updates automatically

### ✅ Beautiful UI
- Color-coded icons per notification type
- Time ago display (e.g., "2 hours ago", "Just now")
- Unread indicator dot for new notifications
- Empty state when no notifications
- Loading state while fetching

### ✅ Notification Types
| Type | Icon | Color | Trigger |
|------|------|-------|---------|
| Level Up | 🏆 Trophy | Gold (#FFD700) | Points reach new level threshold |
| Achievement | 🏅 Award | Green (#00FF00) | Complete 10 brain boost sessions for a subject |
| Streak | ⚡ Zap | Orange (#FF9800) | (Future use) |

## Setup Instructions

### Step 1: Run the Database Migration

1. Open your **Supabase Dashboard**: https://supabase.com/dashboard
2. Navigate to your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the entire contents of `database/migrations/006_notifications_system.sql`
6. Click **Run** (or press Ctrl/Cmd + Enter)

This will create:
- `notifications` table to store all notifications
- Functions to create, read, and manage notifications
- Automatic triggers in `complete_brain_boost_session` function
- Row Level Security (RLS) policies

### Step 2: Verify the Setup

Run this test query in SQL Editor:

```sql
-- Check if notifications table was created
SELECT * FROM public.notifications LIMIT 5;

-- Check available functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%notification%';
```

You should see these functions:
- `create_notification`
- `get_user_notifications`
- `get_unread_notification_count`
- `mark_notification_read`
- `mark_all_notifications_read`

### Step 3: Test in the App

1. Open your app and go to **Profile** page
2. Look at the notification bell icon in the top right
3. If you have no notifications, the bell will be clean
4. To test notifications:
   - Complete a Daily Brain Boost session
   - If you gain points that push you to a new level, you'll get a level-up notification
   - If you complete your 10th session for a subject, you'll get an achievement notification

### Step 4: Create Test Notifications (Optional)

To test without completing sessions, run this in SQL Editor:

```sql
-- Replace 'YOUR_USER_ID' with your actual user ID
-- Create a test level up notification
SELECT public.create_notification(
  'YOUR_USER_ID'::uuid,
  'level_up',
  'Level Up! 🎉',
  'Congratulations! You reached Level 5 - Achiever!',
  'trophy',
  '#FFD700',
  NULL,
  'level'
);

-- Create a test achievement notification
SELECT public.create_notification(
  'YOUR_USER_ID'::uuid,
  'achievement',
  'Achievement Unlocked! 🏆',
  'You earned "Mathematics Master"! Keep up the great work!',
  'award',
  '#00FF00',
  NULL,
  'achievement'
);
```

## How It Works

### Automatic Notification Creation

#### Level Up Notifications
When a user completes a brain boost session:
1. Points are awarded
2. System calculates old level and new level
3. If level increased, creates a level-up notification
4. Notification appears in profile page immediately

```sql
-- Triggered in complete_brain_boost_session function
IF v_new_level > v_old_level THEN
  PERFORM public.create_notification(
    v_user_id,
    'level_up',
    'Level Up! 🎉',
    'Congratulations! You reached Level ' || v_new_level || ' - ' || v_new_level_name || '!',
    'trophy',
    '#FFD700',
    NULL,
    'level'
  );
END IF;
```

#### Achievement Notifications
When a user earns an achievement:
1. Session completion triggers achievement check
2. If achievement just unlocked (10th session), creates notification
3. Notification shows achievement name

```sql
-- Triggered when achievement unlocked
IF v_achievement.achievement_unlocked = true THEN
  PERFORM public.create_notification(
    v_user_id,
    'achievement',
    'Achievement Unlocked! 🏆',
    'You earned "' || v_achievement.achievement_name || '"!',
    'award',
    '#00FF00',
    NULL,
    'achievement'
  );
END IF;
```

### Notification Display

The profile page:
1. **Fetches notifications** on load using `get_user_notifications`
2. **Fetches unread count** for the badge
3. **Polls every 30 seconds** for new notifications
4. **Displays time ago** automatically (e.g., "2 hours ago")
5. **Shows badge counter** on notification bell if unread > 0

### Mark as Read

When user clicks a notification:
1. Calls `mark_notification_read` function
2. Updates notification in database (sets `read = true`)
3. Updates local state (removes unread indicator)
4. Decrements badge counter
5. Shows notification details in alert

## Level System Reference

| Level | Name | Points Required | Notification Trigger |
|-------|------|----------------|---------------------|
| 1 | Beginner | 0 - 99 | Starting level |
| 2 | Learner | 100 - 249 | Reach 100 points |
| 3 | Explorer | 250 - 499 | Reach 250 points |
| 4 | Ambitious | 500 - 999 | Reach 500 points |
| 5 | Achiever | 1000 - 1999 | Reach 1000 points |
| 6 | Scholar | 2000 - 3499 | Reach 2000 points |
| 7 | Expert | 3500 - 4999 | Reach 3500 points |
| 8 | Master | 5000 - 7499 | Reach 5000 points |
| 9 | Virtuoso | 7500 - 9999 | Reach 7500 points |
| 10 | Legend | 10000+ | Reach 10000 points |

## Customization

### Add New Notification Types

1. **Update the database check constraint**:
```sql
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('level_up', 'achievement', 'streak', 'milestone', 'system', 'your_new_type'));
```

2. **Add icon mapping** in `profile.tsx`:
```typescript
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'level_up':
      return Trophy;
    case 'achievement':
      return Award;
    case 'your_new_type':
      return YourIcon;
    default:
      return MessageSquare;
  }
};
```

3. **Add color mapping**:
```typescript
const getNotificationIconColor = (type: string, iconColor?: string) => {
  if (iconColor) return iconColor;
  switch (type) {
    case 'your_new_type':
      return '#YOUR_COLOR';
    // ... existing cases
  }
};
```

### Customize Notification Messages

Edit the notification creation in `database/migrations/006_notifications_system.sql`:

```sql
-- Level up notification (around line 245)
PERFORM public.create_notification(
  v_user_id,
  'level_up',
  'Your Custom Title! 🎉',  -- Customize this
  'Your custom message here!',  -- Customize this
  'trophy',
  '#FFD700',
  NULL,
  'level'
);
```

### Change Polling Interval

In `profile.tsx` (around line 175), change the interval:

```typescript
// Poll for new notifications every 30 seconds
const interval = setInterval(fetchUnreadCount, 30000); // Change 30000 to your desired milliseconds
```

### Notification Retention

By default, the system keeps the last 100 notifications per user. To change this:

```sql
-- Edit cleanup_old_notifications function
-- Change WHERE rn > 100 to your desired number
WHERE rn > 50  -- Keep last 50 instead of 100
```

## Troubleshooting

### No Notifications Appearing

1. **Check if functions exist**:
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name LIKE '%notification%';
```

2. **Check if notifications table exists**:
```sql
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'notifications';
```

3. **Check RLS policies**:
```sql
SELECT * FROM pg_policies WHERE tablename = 'notifications';
```

### Notifications Not Showing After Session

1. **Verify brain boost session completed**:
```sql
SELECT * FROM brain_boost_history 
WHERE user_id = 'YOUR_USER_ID' 
  AND completed = true 
ORDER BY created_at DESC 
LIMIT 5;
```

2. **Check if notifications were created**:
```sql
SELECT * FROM notifications 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC 
LIMIT 10;
```

3. **Check user points and level**:
```sql
SELECT points, 
  (SELECT level FROM get_level_from_points(points)) as current_level
FROM users 
WHERE id = 'YOUR_USER_ID';
```

### Badge Count Not Updating

1. **Check unread count function**:
```sql
SELECT get_unread_notification_count('YOUR_USER_ID');
```

2. **Manually check unread notifications**:
```sql
SELECT COUNT(*) FROM notifications 
WHERE user_id = 'YOUR_USER_ID' AND read = false;
```

3. **Restart the app** to reinitialize polling

## Future Enhancements

You can extend this system to add:

### Streak Notifications
- 3-day streak, 7-day streak, 30-day streak
- Trigger when user completes daily brain boost X days in a row

### Milestone Notifications
- First 100 points, first 1000 points
- Total 100 questions answered
- 50 hours of study time

### Social Notifications
- Friend completed same achievement
- New leaderboard position
- Multiplayer game invites

### System Notifications
- New features available
- Maintenance announcements
- Tips and tricks

Each would follow the same pattern:
1. Add notification type to database constraint
2. Add icon/color mapping in profile.tsx
3. Create notification trigger in relevant function
4. Display in notification dropdown

## Notes

- ✅ Notifications are automatically deleted after 100 per user
- ✅ Unread notifications have a green dot indicator
- ✅ Time ago updates automatically (e.g., "Just now", "2 hours ago")
- ✅ Mark all read button appears only when there are unread notifications
- ✅ Empty state shows when no notifications exist
- ✅ Loading state while fetching from database

Enjoy your new notification system! 🎉

