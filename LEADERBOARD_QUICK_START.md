# 🚀 Leaderboard Quick Start Guide

## 30-Second Setup

### 1. Run Database Migrations (5 min)

Open your Supabase SQL Editor and run these two files:

**First:**
```sql
-- Copy and paste contents of: database/migrations/add_points_system.sql
```

**Then:**
```sql
-- Copy and paste contents of: database/migrations/add_leaderboard_function.sql
```

### 2. Test It Works (1 min)

In Supabase SQL Editor:

```sql
-- Test the function
SELECT * FROM get_leaderboard(5);
```

If you get results → ✅ You're done!  
If empty → Continue to step 3

### 3. Add Test Points (2 min)

Get your user ID from Supabase Auth dashboard, then:

```sql
-- Replace YOUR_USER_ID with your actual ID
SELECT add_points_to_user('YOUR_USER_ID'::uuid, 150);
```

### 4. Check the App (30 sec)

1. Open your app
2. Go to Community tab
3. See your name on the leaderboard! 🎉

---

## What You Get

✅ **Leaderboard shows:**
- User's name
- Username (@handle)
- Profile picture
- Points (sorted highest first)
- Rank (1st, 2nd, 3rd...)

✅ **Points are earned from:**
- Word Bomb: +10 per word, +20 for winning
- Daily Brain Boost: +10 per correct answer
- More games coming soon!

✅ **Design preserved:**
- Beautiful top 3 podium with crown
- Ranks 4-8 with colored badges
- "Show Top 10" modal
- Loading and empty states

---

## Files Changed

- `services/wordBombService.ts` - Winners get +20 bonus
- `app/(tabs)/community.tsx` - Real database fetching

---

## Need More Users for Testing?

Run this to add random points to all users:

```sql
-- Copy and paste: database/migrations/add_leaderboard_test_data.sql
```

---

## Troubleshooting

**Q: Leaderboard shows "No users on leaderboard yet"**  
A: Users need to have:
- `onboarding_completed = true`
- `points > 0`

**Q: Function doesn't exist error**  
A: Run the SQL migrations in Supabase

**Q: Can't see my points**  
A: Make sure you completed onboarding in the app

---

## Full Documentation

📖 See `LEADERBOARD_UPDATE_SUMMARY.md` for complete details  
📖 See `database/LEADERBOARD_SETUP.md` for advanced setup

---

**Status:** ✅ Ready to use!

