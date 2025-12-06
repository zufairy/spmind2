# Points System Setup Guide

## Overview
The points system allows users to earn points through various activities in the app. Points are stored in the `users` table and displayed on the profile page.

---

## Database Setup

### 1. Apply the Points System Migration

Run the migration file in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of database/migrations/add_points_system.sql
```

### 2. Apply the Leaderboard Function Migration

**IMPORTANT:** You must also apply this migration to allow the leaderboard to work:

```sql
-- Copy and paste the contents of database/migrations/add_leaderboard_function.sql
```

This creates the `get_leaderboard()` function that bypasses RLS to fetch leaderboard data.

Or apply both via command line:

```bash
psql -h your-db-host -U your-db-user -d your-db-name -f database/migrations/add_points_system.sql
psql -h your-db-host -U your-db-user -d your-db-name -f database/migrations/add_leaderboard_function.sql
```

### 2. Verify Installation

Check if the points column was added:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'points';
```

You should see:
- `column_name`: points
- `data_type`: integer
- `column_default`: 0

---

## Features Added

### 1. **Points Column**
- Type: `INTEGER`
- Default: `0`
- Constraint: Cannot be negative
- Indexed for leaderboard queries

### 2. **Helper Function: `add_points_to_user()`**

Safely adds points to a user (atomic operation):

```typescript
// Add 10 points to a user
const { data, error } = await supabase
  .rpc('add_points_to_user', {
    user_id_param: userId,
    points_to_add: 10
  });

// Returns the new total points
console.log('New points total:', data);
```

**Deduct points** (use negative number):
```typescript
const { data } = await supabase
  .rpc('add_points_to_user', {
    user_id_param: userId,
    points_to_add: -5  // Deduct 5 points
  });
```

---

## Frontend Implementation

### Profile Page Display

The profile page now:
1. Fetches points from the database on load
2. Displays current points in the stats card
3. Updates progress bar based on points (out of 500)

**Location:** `app/(tabs)/profile.tsx`

```typescript
// Points are fetched automatically
const [userPoints, setUserPoints] = useState(0);

// Displayed in the stats section
<Text>{userStats.points}</Text>
```

---

## Usage Examples

### Example 1: Award Points for Completing a Task

```typescript
// In your component or service
import { supabase } from '../services/supabase';

async function awardPointsForTask(userId: string, taskPoints: number) {
  const { data: newTotal, error } = await supabase
    .rpc('add_points_to_user', {
      user_id_param: userId,
      points_to_add: taskPoints
    });

  if (error) {
    console.error('Error awarding points:', error);
    return null;
  }

  console.log(`✨ User earned ${taskPoints} points! New total: ${newTotal}`);
  return newTotal;
}
```

### Example 2: Get User's Current Points

```typescript
const { data, error } = await supabase
  .from('users')
  .select('points')
  .eq('id', userId)
  .single();

console.log('Current points:', data?.points);
```

### Example 3: Update Points Directly (Alternative)

```typescript
// If you prefer direct updates instead of using the function
const { error } = await supabase
  .from('users')
  .update({ points: supabase.raw('points + 10') })
  .eq('id', userId);
```

---

## Future Enhancements (Ideas)

Here's where you can add points later:

### Study Activities
- ✅ Complete a lesson: **+10 points**
- ✅ Finish homework: **+15 points**
- ✅ Study session (per hour): **+5 points**
- ✅ Perfect quiz score: **+20 points**

### Social Activities
- ✅ Help another student: **+5 points**
- ✅ Chat in Lepak: **+2 points/hour**
- ✅ Join multiplayer room: **+3 points**

### Daily Activities
- ✅ Login streak (7 days): **+50 points**
- ✅ Complete daily challenges: **+10 points**

### AI Tutor
- ✅ Ask a question: **+2 points**
- ✅ Complete AI tutorial: **+15 points**

### Notes & Organization
- ✅ Create a note: **+3 points**
- ✅ Organize notes with tags: **+5 points**

---

## Leaderboard (Future Feature)

The points are already indexed for efficient leaderboard queries:

```sql
-- Get top 10 users by points
SELECT full_name, username, points
FROM users
WHERE onboarding_completed = true
ORDER BY points DESC
LIMIT 10;
```

---

## Testing

### 1. Check Default Points (Should be 0)

```sql
SELECT full_name, points FROM users WHERE id = 'your-user-id';
```

### 2. Add Test Points

```sql
SELECT add_points_to_user('your-user-id', 100);
```

### 3. Verify on Profile Page

Open the app → Go to Profile → Check the Points stat card

### 4. Test Point Deduction

```sql
SELECT add_points_to_user('your-user-id', -10);
```

---

## Notes

- Points cannot go below 0 (constraint enforced)
- All existing users will start with 0 points
- Points are fetched fresh each time the profile page loads
- The progress bar calculates: `(points / 500) * 100`
- Maximum progress shown is 100%

---

## Support

If you encounter any issues:
1. Check Supabase logs for errors
2. Verify the migration was applied successfully
3. Ensure RLS policies allow authenticated users to read their own points
4. Check console logs for any fetch errors

