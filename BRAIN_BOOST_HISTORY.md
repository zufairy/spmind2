# 🧠 Brain Boost History System

Complete tracking system for Daily Brain Boost sessions with detailed metrics and history.

---

## 📊 Database Structure

### Table: `brain_boost_history`

Tracks every Daily Brain Boost session completed by users.

#### Columns:

**Session Information:**
- `id` - UUID (Primary Key)
- `user_id` - UUID (Foreign Key → users.id)
- `session_date` - DATE (when session occurred)
- `session_time` - TIME (what time session started)
- `duration_seconds` - INTEGER (total time spent)
- `duration_minutes` - INTEGER (auto-calculated from seconds)

**Content Details:**
- `mode` - VARCHAR(50) - Type of brain boost
  - Options: 'quiz', 'flashcard', 'memory', 'speed', 'practice'
- `subject` - VARCHAR(100) - Subject studied (e.g., 'Mathematics', 'Science')
- `topics` - TEXT[] - Array of topics covered (e.g., ['Algebra', 'Equations'])

**Performance Metrics:**
- `total_questions` - INTEGER - How many questions
- `correct_answers` - INTEGER - How many correct
- `wrong_answers` - INTEGER - How many wrong
- `score_percentage` - INTEGER - Score as percentage (0-100)

**Additional Data:**
- `streak_day` - INTEGER - Which day of streak (1, 2, 3...)
- `difficulty_level` - VARCHAR(20) - 'easy', 'medium', 'hard'
- `points_earned` - INTEGER - Points awarded for this session
- `completed` - BOOLEAN - Whether session was finished
- `created_at` - TIMESTAMP - When record created
- `updated_at` - TIMESTAMP - Last update

---

## 🎯 Features

### 1. **Session Tracking**
Every brain boost session records:
- ✅ Date and time of session
- ✅ How long you studied (in minutes)
- ✅ What topics you covered
- ✅ Your quiz score percentage
- ✅ Points earned
- ✅ Current streak day

### 2. **Statistics Dashboard**
See your overall performance:
- 📊 Total sessions completed
- ⏱️ Total study time (minutes)
- 🎯 Average score percentage
- 🏆 Perfect scores (100%) count
- 🔥 Current streak
- ⭐ Total points earned
- 📚 Favorite subject
- ❓ Total questions answered

### 3. **History Page**
Beautiful interface showing:
- Recent sessions list
- Score badges (color-coded)
- Topics covered per session
- Time spent per session
- Points earned per session
- Streak indicators

---

## 🚀 Quick Setup

### Step 1: Create Table
Run in Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS public.brain_boost_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_time TIME NOT NULL DEFAULT CURRENT_TIME,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER GENERATED ALWAYS AS (duration_seconds / 60) STORED,
  mode VARCHAR(50) NOT NULL CHECK (mode IN ('quiz', 'flashcard', 'memory', 'speed', 'practice')),
  subject VARCHAR(100),
  topics TEXT[],
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  wrong_answers INTEGER DEFAULT 0,
  score_percentage INTEGER DEFAULT 0 CHECK (score_percentage >= 0 AND score_percentage <= 100),
  streak_day INTEGER DEFAULT 1,
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  points_earned INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Step 2: Add Sample Data
```sql
-- Get your user ID
SELECT id FROM users LIMIT 1;

-- Insert sample sessions (use your user ID)
INSERT INTO brain_boost_history (
  user_id, mode, subject, topics, 
  duration_seconds, total_questions, correct_answers,
  score_percentage, points_earned, streak_day, completed
) VALUES
  (
    'YOUR-USER-ID-HERE',
    'quiz',
    'Mathematics',
    ARRAY['Algebra', 'Equations'],
    450,
    10,
    10,
    100,
    150,
    1,
    true
  );
```

Or use the automated script: `database/scripts/setup_brain_boost_history.sql`

---

## 💻 Usage in Code

### Recording a Session

```typescript
import { brainBoostHistoryService } from '../services/brainBoostHistoryService';

// After user completes a brain boost quiz
const result = await brainBoostHistoryService.recordSession(
  userId,
  'quiz',                              // mode
  'Mathematics',                       // subject
  ['Algebra', 'Quadratic Equations'],  // topics
  450,                                 // duration in seconds
  10,                                  // total questions
  9,                                   // correct answers
  90,                                  // score percentage
  'medium'                             // difficulty
);

if (result) {
  console.log(`Session recorded! Earned ${result.pointsEarned} points`);
}
```

### Getting History

```typescript
// Fetch user's history
const history = await brainBoostHistoryService.getHistory(userId, 50);

// Fetch statistics
const stats = await brainBoostHistoryService.getStats(userId);

console.log(`Total sessions: ${stats?.total_sessions}`);
console.log(`Average score: ${stats?.average_score}%`);
console.log(`Current streak: ${stats?.current_streak} days`);
```

---

## 🎨 UI Features

### History Page (`/brain-boost-history`)

**Top Section - Statistics:**
- 4 stat cards showing key metrics
- Summary card with detailed stats
- Color-coded for easy reading

**Sessions List:**
- Each session shows:
  - 📝 Mode icon and name
  - 📅 Date and time
  - 🎯 Score percentage (color-coded badge)
  - 📚 Subject studied
  - 🏷️ Topics covered (as chips)
  - ⏱️ Duration
  - ✅ Questions answered (correct/total)
  - ⭐ Points earned
  - 🔥 Streak day (if > 1)

**Visual Design:**
- Dark theme consistent with app
- Smooth animations
- Color-coded scores:
  - Green: 90-100%
  - Gold: 70-89%
  - Orange: 50-69%
  - Red: < 50%

---

## 📈 Points Calculation

### Base Points
- Score percentage (0-100) = base points

### Bonuses
- **Perfect Score (100%)**: +50 points → **150 total**
- **Excellent (90-99%)**: +25 points → **up to 124 total**
- **Good (80-89%)**: +10 points → **up to 99 total**
- **Below 80%**: Base score only

### Example:
```
Quiz score: 90%
Base: 90 points
Bonus: 25 points (excellent)
Total: 115 points
```

---

## 🔗 Integration Points

### Daily Brain Boost Page
Add this to `app/daily-brain-boost.tsx`:

```typescript
import { brainBoostHistoryService } from '../services/brainBoostHistoryService';

// When quiz completes
const recordHistory = async () => {
  await brainBoostHistoryService.recordSession(
    userId,
    'quiz',
    selectedSubject,
    topicsCovered,
    timeSpentInSeconds,
    totalQuestions,
    correctAnswers,
    scorePercentage,
    difficulty
  );
};
```

### Profile Page
- ✅ Menu item updated to "Brain Boost History"
- ✅ Navigation to `/brain-boost-history`
- ✅ Uses Brain icon

---

## 📱 Page Navigation

```
Profile → Brain Boost History → History Page
  ↓
Shows:
- Stats cards (sessions, avg score, streak, time)
- Summary (perfect scores, points, favorite subject)
- Session list (recent first)
```

---

## 🔍 Queries You Can Run

### View all sessions for a user:
```sql
SELECT * FROM brain_boost_history 
WHERE user_id = 'YOUR-USER-ID'
ORDER BY session_date DESC;
```

### Get user statistics:
```sql
SELECT 
  COUNT(*) as sessions,
  SUM(duration_minutes) as total_minutes,
  AVG(score_percentage) as avg_score,
  SUM(points_earned) as total_points
FROM brain_boost_history
WHERE user_id = 'YOUR-USER-ID' AND completed = true;
```

### Check current streak:
```sql
SELECT MAX(streak_day) as current_streak
FROM brain_boost_history
WHERE user_id = 'YOUR-USER-ID'
  AND session_date >= CURRENT_DATE - INTERVAL '1 day';
```

---

## 🎯 What's Tracked

Every brain boost session captures:

1. **When** - Date and time
2. **How Long** - Duration in minutes/seconds
3. **What** - Subject and specific topics
4. **How Well** - Score percentage, questions answered
5. **Rewards** - Points earned
6. **Progress** - Streak day counter

---

## ✅ Files Created

1. ✅ `database/migrations/004_brain_boost_history.sql` - Full migration
2. ✅ `database/scripts/setup_brain_boost_history.sql` - Quick setup with sample data
3. ✅ `app/brain-boost-history.tsx` - Beautiful history page
4. ✅ `services/brainBoostHistoryService.ts` - Service layer
5. ✅ `BRAIN_BOOST_HISTORY.md` - This documentation

---

## 🚀 Next Steps

1. Run `setup_brain_boost_history.sql` in Supabase
2. Update your user ID in the INSERT statements
3. Refresh app → Go to Profile → Brain Boost History
4. See your complete history! 🎉

---

Made with 💚 for Malaysian students

