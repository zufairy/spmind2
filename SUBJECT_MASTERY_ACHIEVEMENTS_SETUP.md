# Subject Mastery Achievements Setup Guide

## Overview
You now have a functional achievement system that tracks subject mastery! Users earn achievements by completing 10 Daily Brain Boost sessions per subject for:
- 🔢 Mathematics
- 📖 Bahasa Melayu  
- 🇬🇧 English
- 🏛️ Sejarah
- 🔬 Science

## How to Set Up

### Step 1: Run the Database Migration

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the entire contents of `database/migrations/005_subject_mastery_achievements.sql`
6. Click **Run** (or press Ctrl/Cmd + Enter)

This will:
- Create the `user_achievements` table
- Add functions to track and update achievements
- Update the `complete_brain_boost_session` function to automatically check achievements

### Step 2: Test the Setup

You can verify everything works by running this test query in the SQL Editor:

```sql
-- Initialize achievements for a test user (replace with your user ID)
SELECT public.initialize_subject_achievements('YOUR_USER_ID_HERE');

-- View achievements for that user
SELECT * FROM public.get_user_achievements('YOUR_USER_ID_HERE');
```

You should see 5 achievements created (one for each subject), all with:
- `current_count`: 0
- `required_count`: 10
- `earned`: false

### Step 3: Test in the App

1. Open the app and go to the **Profile** page
2. Scroll down to the **Subject Mastery** section
3. You should see all 5 subjects with:
   - A lock icon 🔒 (if not earned)
   - Progress bar showing 0/10
   - Subject name

### Step 4: Earn an Achievement

To test earning an achievement:

1. Go to **Home** screen
2. Select a subject (e.g., Mathematics)
3. Complete a Daily Brain Boost session
4. Repeat 9 more times (10 total sessions)
5. On the 10th completion, the achievement will unlock!

The profile page will automatically update to show:
- The subject-specific emoji (🔢 for Math, 📖 for BM, etc.)
- A colored border around the icon
- Progress bar filled to 100% (10/10)
- The card will have a green glow effect

## How It Works

### Database Schema

The `user_achievements` table stores:
- User ID
- Achievement type (currently "subject_mastery")
- Achievement name (e.g., "Mathematics Master")
- Subject name
- Current count (sessions completed)
- Required count (10 sessions needed)
- Earned status (true/false)
- Earned date (when unlocked)

### Automatic Tracking

When a user completes a Daily Brain Boost session:
1. The session is saved to `brain_boost_history` with the subject
2. The `complete_brain_boost_session` function automatically:
   - Counts total completed sessions for that subject
   - Updates the achievement progress
   - Awards the achievement if 10 sessions reached
   - Returns achievement unlock status

### Profile Display

The profile page:
- Fetches achievements on load using `get_user_achievements`
- Displays each subject with:
  - Subject-specific icon and color
  - Progress bar (visual feedback)
  - Count (X/10 completed)
  - Lock icon if not earned
  - Colored border and background if earned

## Customization

### Change Required Sessions

To change from 10 to a different number, update line 63 in the migration file:

```sql
required_count,  -- Change the number in the INSERT statement
10,  -- Change this to your desired number
```

### Add More Subjects

To add more subjects, update the `v_subjects` array in the `initialize_subject_achievements` function:

```sql
DECLARE
  v_subjects TEXT[] := ARRAY['Mathematics', 'Bahasa Melayu', 'English', 'Sejarah', 'Science', 'Your New Subject'];
```

Also add the subject config in `profile.tsx`:

```typescript
const configs: { [key: string]: { icon: string; color: string; bgColor: string } } = {
  'Your New Subject': { icon: '🎯', color: '#FF6B6B', bgColor: 'rgba(255, 107, 107, 0.2)' },
  // ... existing subjects
};
```

### Change Icons/Colors

Update the `getSubjectConfig` function in `app/(tabs)/profile.tsx` (around line 184):

```typescript
'Mathematics': { 
  icon: '🔢',  // Change emoji
  color: '#3B82F6',  // Change main color
  bgColor: 'rgba(59, 130, 246, 0.2)'  // Change background (same color with opacity)
},
```

## Troubleshooting

### Achievements Not Showing

1. Check if the migration ran successfully in Supabase
2. Check console logs for errors when fetching achievements
3. Verify the user is logged in (user ID is available)

### Progress Not Updating

1. Ensure Daily Brain Boost sessions are being saved with the correct subject name
2. Check that subject names match exactly (case-sensitive)
3. Run this query to verify sessions:

```sql
SELECT subject, COUNT(*) as session_count
FROM brain_boost_history
WHERE user_id = 'YOUR_USER_ID'
  AND completed = true
GROUP BY subject;
```

### Database Function Errors

If you see errors about missing functions:
1. Check that all functions were created successfully
2. Verify RLS (Row Level Security) policies are enabled
3. Try re-running the migration

## Next Steps

You can extend this system to add:
- Streak achievements (7 days in a row, 30 days, etc.)
- Perfect score achievements (10 perfect scores)
- Speed achievements (complete in under X minutes)
- Combo achievements (all subjects mastered)
- Special event achievements

Each would follow the same pattern:
1. Add achievement type to database
2. Create tracking function
3. Display in profile page with custom styling

## Notes

- Achievements are automatically initialized when `get_user_achievements` is called
- Progress updates automatically when completing brain boost sessions
- The system is retroactive - existing sessions count toward achievements
- Achievements can't be "un-earned" once unlocked (earned_at timestamp is permanent)

Enjoy your new achievement system! 🎉

