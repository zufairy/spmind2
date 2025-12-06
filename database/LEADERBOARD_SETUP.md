# 🏆 Leaderboard Setup Guide

## Overview
This guide will help you set up the leaderboard system for the Genius App. The leaderboard displays users ranked by their points earned through various activities.

---

## Prerequisites

1. ✅ Supabase project set up
2. ✅ Users table with `points` column
3. ✅ Database access via Supabase SQL Editor

---

## Step 1: Add Points Column (if not exists)

Run this SQL in your Supabase SQL Editor:

```sql
-- Run: database/migrations/add_points_system.sql
```

This will:
- Add `points` column to users table (default 0)
- Create index for fast leaderboard queries
- Add constraint to ensure points are never negative
- Create `add_points_to_user()` function for safely adding points

---

## Step 2: Create Leaderboard Function

Run this SQL in your Supabase SQL Editor:

```sql
-- Run: database/migrations/add_leaderboard_function.sql
```

This creates the `get_leaderboard(limit_count)` function that:
- Fetches top users by points
- Bypasses RLS (safe - only public leaderboard data)
- Returns: id, full_name, username, points, avatar_url, rank
- Only includes users who completed onboarding

---

## Step 3: Test the Setup

### Test 1: Check if function exists
```sql
SELECT proname, proargnames 
FROM pg_proc 
WHERE proname = 'get_leaderboard';
```

Expected result: Should show the function with its parameters

### Test 2: Test the function
```sql
SELECT * FROM get_leaderboard(10);
```

Expected result: Top 10 users by points (if any users exist with points > 0)

### Test 3: Add test points to your user
```sql
-- Replace 'YOUR_USER_ID' with your actual user ID
SELECT add_points_to_user('YOUR_USER_ID'::uuid, 100);
```

Expected result: Should return your new points total

---

## How It Works

### Points System
- Users earn points through:
  - ✅ Daily Brain Boost games (+10 per correct answer)
  - ✅ Word Bomb wins (+20 for winner, +10 per correct word)
  - 🔜 Quiz completion
  - 🔜 AI tutoring sessions
  - 🔜 Daily login streaks

### Leaderboard Tabs
Currently showing:
- **Region** - All users (will filter by region in future)
- **National** - All users (will filter by country in future)
- **Global** - All users

### Data Display
1. **Top 3 Podium** - Featured prominently with crown for 1st place
2. **Ranks 4-8** - Listed with colored badges
3. **Show Top 10 Modal** - Full modal showing all top 10 users

---

## Database Schema

### Users Table (relevant columns)
```
id            uuid           PRIMARY KEY
full_name     varchar        NOT NULL
username      varchar        UNIQUE
points        integer        DEFAULT 0
avatar_url    text          Nullable
onboarding_completed boolean DEFAULT false
```

### Leaderboard Function
```sql
get_leaderboard(limit_count integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  full_name text,
  username text,
  points integer,
  avatar_url text,
  rank bigint
)
```

---

## Frontend Implementation

### Community Screen (`app/(tabs)/community.tsx`)

The leaderboard automatically:
1. ✅ Fetches data on component mount
2. ✅ Shows loading state while fetching
3. ✅ Displays "no users" message if empty
4. ✅ Shows top 3 in podium format
5. ✅ Shows ranks 4-8 in list format
6. ✅ Provides "Show Top 10" button for full modal

### Key Functions
```typescript
// Fetch leaderboard data
const fetchLeaderboard = async () => {
  const { data, error } = await supabase
    .rpc('get_leaderboard', { limit_count: 100 });
  // ... transform and display data
}
```

---

## Troubleshooting

### Issue: "Function get_leaderboard does not exist"
**Solution:** Run `database/migrations/add_leaderboard_function.sql` in Supabase SQL Editor

### Issue: "No users on leaderboard"
**Possible Causes:**
1. No users have onboarding_completed = true
2. All users have 0 points
**Solution:** 
- Check users: `SELECT id, full_name, points, onboarding_completed FROM users LIMIT 10;`
- Add test points: `SELECT add_points_to_user(user_id, 100);`

### Issue: "Permission denied for function get_leaderboard"
**Solution:** Run the GRANT statement:
```sql
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer) TO anon;
```

---

## Testing Checklist

- [ ] Run `add_points_system.sql`
- [ ] Run `add_leaderboard_function.sql`
- [ ] Verify function exists with test query
- [ ] Add points to at least 3 test users
- [ ] Verify leaderboard displays correctly in app
- [ ] Test "Show Top 10" modal
- [ ] Verify avatar images display (if users have avatars)

---

## Future Enhancements

Planned features:
- 🔜 Filter by region/country for Regional/National tabs
- 🔜 Real-time updates when points change
- 🔜 User's own rank displayed prominently
- 🔜 Trend indicators (up/down arrows)
- 🔜 Achievement badges for top performers
- 🔜 Historical leaderboard data (weekly/monthly)

---

## Points Earning Guide

### Daily Brain Boost
- Each correct answer: **+10 points**
- Perfect score bonus: **+50 points**

### Word Bomb
- Each correct word: **+10 points**
- Winning the game: **+20 bonus points**

### Coming Soon
- Quiz completion: **+20-50 points** (based on difficulty)
- AI tutoring milestones: **+15 points**
- Daily login streak: **+5 points/day**

---

## Support

If you encounter issues:
1. Check Supabase logs for errors
2. Verify SQL functions are created correctly
3. Check RLS policies on users table
4. Ensure users have `onboarding_completed = true`

---

**Last Updated:** October 8, 2025

