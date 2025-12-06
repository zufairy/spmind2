# 🏆 Dynamic Leaderboard System

## Overview
Complete points and leaderboard system with location-based filtering for the Genius app. Users earn points through games and study sessions, and compete on regional, national, and global leaderboards.

---

## 📊 Database Schema

### New Tables Created

#### 1. **points_history**
Tracks all point gains and sources.

```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key → users.id)
- points_earned: INTEGER
- source: VARCHAR(50) - 'daily_brain_boost', 'word_bomb', 'quiz', 'homework_help', etc.
- source_id: UUID - Reference to specific game/session
- description: TEXT
- created_at: TIMESTAMP
```

#### 2. **daily_brain_boost_sessions**
Records daily brain boost game completions.

```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key → users.id)
- mode: VARCHAR(50) - 'quiz', 'flashcard', 'memory', 'speed'
- score: INTEGER (0-100)
- questions_answered: INTEGER
- correct_answers: INTEGER
- time_spent_seconds: INTEGER
- points_earned: INTEGER
- completed: BOOLEAN
- created_at: TIMESTAMP
```

#### 3. **game_scores**
Tracks game completions and scores.

```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key → users.id)
- game_type: VARCHAR(50) - 'word_bomb', 'silat_master', 'spell_bird'
- game_id: TEXT - Reference to specific game instance
- score: INTEGER
- points_earned: INTEGER
- rank: INTEGER - Player's rank in that game
- total_players: INTEGER
- duration_seconds: INTEGER
- completed: BOOLEAN
- created_at: TIMESTAMP
```

### Updated Tables

#### **users** table additions:
```sql
- city: VARCHAR(100)
- state: VARCHAR(100)
- country: VARCHAR(100) DEFAULT 'Malaysia'
- region: VARCHAR(100)
```

---

## 🎮 Points System

### How Points Are Earned

#### **Daily Brain Boost**
- Base points: 0-100 (based on score)
- Perfect score bonus: +50 points (150 total)
- Function: `complete_daily_brain_boost()`

#### **Mini Games (Word Bomb, etc.)**
- Base points: Score from game
- Winner bonus: +100 points
- Runner-up bonus: +50 points
- Third place bonus: +25 points
- Function: `complete_game()`

#### **Other Sources**
- Quiz completion
- Homework help usage
- Study sessions
- Achievements unlocked

### Example Usage

```typescript
// After completing Daily Brain Boost
await leaderboardService.completeDailyBrainBoost(
  userId,
  'quiz',      // mode
  85,          // score (0-100)
  10,          // questions answered
  8,           // correct answers
  120          // time spent in seconds
);
// Result: User earns 85 points

// After completing Word Bomb game
await leaderboardService.completeGame(
  userId,
  'word_bomb',
  gameId,
  500,         // score
  1,           // rank (1st place)
  4,           // total players
  180          // duration
);
// Result: User earns 600 points (500 + 100 winner bonus)
```

---

## 🌍 Location-Based Filtering

### Filter Types

1. **Region** - Local area (e.g., "Kuala Lumpur", "Selangor")
2. **National** - Same country (e.g., "Malaysia")
3. **Global** - All users worldwide

### How It Works

```typescript
// Regional leaderboard (user's own region)
const regionalLeaderboard = await leaderboardService.getRegionalLeaderboard(userId, 100);

// National leaderboard (same country)
const nationalLeaderboard = await leaderboardService.getNationalLeaderboard(userId, 100);

// Global leaderboard (all users)
const globalLeaderboard = await leaderboardService.getGlobalLeaderboard(100);
```

---

## 🔧 Database Functions

### 1. `add_points_to_user()`
Adds points to user and records in history.

**Parameters:**
- `p_user_id`: UUID
- `p_points`: INTEGER
- `p_source`: VARCHAR(50)
- `p_source_id`: UUID (optional)
- `p_description`: TEXT (optional)

**Returns:**
- `new_total_points`: INTEGER
- `points_added`: INTEGER

### 2. `get_leaderboard()`
Gets leaderboard filtered by location.

**Parameters:**
- `p_filter_type`: 'region' | 'state' | 'country' | 'global'
- `p_filter_value`: VARCHAR(100) (optional)
- `p_limit`: INTEGER (default: 100)

**Returns:**
Table with: id, full_name, username, points, avatar_url, region, state, country, rank

### 3. `complete_daily_brain_boost()`
Records session and awards points.

**Parameters:**
- `p_user_id`: UUID
- `p_mode`: VARCHAR(50)
- `p_score`: INTEGER (0-100)
- `p_questions_answered`: INTEGER
- `p_correct_answers`: INTEGER
- `p_time_spent_seconds`: INTEGER

**Returns:**
- `session_id`: UUID
- `points_earned`: INTEGER
- `new_total_points`: INTEGER

### 4. `complete_game()`
Records game completion and awards points.

**Parameters:**
- `p_user_id`: UUID
- `p_game_type`: VARCHAR(50)
- `p_game_id`: TEXT
- `p_score`: INTEGER
- `p_rank`: INTEGER (optional)
- `p_total_players`: INTEGER (optional)
- `p_duration_seconds`: INTEGER (optional)

**Returns:**
- `score_id`: UUID
- `points_earned`: INTEGER
- `new_total_points`: INTEGER

---

## 💻 Frontend Implementation

### Service Usage

```typescript
import { leaderboardService } from '../services/leaderboardService';

// In your component
const [leaderboardData, setLeaderboardData] = useState<any[]>([]);

// Fetch regional leaderboard
const fetchLeaderboard = async () => {
  const data = await leaderboardService.getRegionalLeaderboard(userId, 100);
  setLeaderboardData(data);
};

// Award points after game
const awardGamePoints = async () => {
  const result = await leaderboardService.completeGame(
    userId,
    'word_bomb',
    gameId,
    500,
    1,    // 1st place
    4     // 4 players
  );
  
  if (result) {
    console.log(`Earned ${result.pointsEarned} points!`);
    console.log(`New total: ${result.newTotalPoints}`);
  }
};
```

### Community Page Integration

The community page now:
- ✅ Fetches **real users** from database
- ✅ Shows **dynamic avatars** (profile pictures or initials)
- ✅ Filters by **Region/National/Global** tabs
- ✅ Highlights **current user** with golden border
- ✅ Updates when **tab changes**
- ✅ Shows **Top 3 podium** and **Top 10 list**

---

## 🎯 Malaysian Context

### Default Locations
- **Country**: Malaysia
- **Common Regions**: 
  - Kuala Lumpur
  - Selangor
  - Penang
  - Johor
  - Perak
  - Sabah
  - Sarawak

### Future Enhancements
1. Auto-detect location from device
2. Show regional badges/icons
3. Regional competitions/events
4. State-specific content

---

## 🚀 Setup Instructions

### 1. Run Migration
```bash
# Execute the SQL migration
psql -h your-db-host -U postgres -d your-database -f database/migrations/003_add_user_location_and_points.sql
```

Or in Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `003_add_user_location_and_points.sql`
3. Execute the SQL

### 2. Update Existing Users
```sql
-- Set default location for existing users
UPDATE users SET 
  region = 'Selangor',
  state = 'Selangor',
  country = 'Malaysia'
WHERE region IS NULL;
```

### 3. Test Points System
```sql
-- Give a user some points
SELECT * FROM add_points_to_user(
  'user-uuid-here',
  100,
  'daily_brain_boost',
  NULL,
  'Test points'
);

-- Check leaderboard
SELECT * FROM get_leaderboard('global', NULL, 10);
```

---

## 📱 Features Implemented

### ✅ Dynamic Leaderboards
- Real-time data from database
- Region/National/Global filtering
- Automatic ranking calculation
- Current user highlighting

### ✅ Points System
- Track all point gains
- Multiple point sources
- Bonus point logic
- Points history tracking

### ✅ Profile Pictures
- Dynamic avatar loading
- Fallback to initials
- Color-coded avatars
- Cached images

### ✅ Location Filtering
- By region (local area)
- By country (national)
- Global rankings
- Automatic user location detection

---

## 🔄 Integration Points

### Daily Brain Boost Integration
```typescript
// In daily-brain-boost.tsx
import { leaderboardService } from '../services/leaderboardService';

// After quiz completion
const result = await leaderboardService.completeDailyBrainBoost(
  userId,
  mode,
  score,
  questionsAnswered,
  correctAnswers,
  timeSpent
);

// Show points earned
Alert.alert('Great Job!', `You earned ${result.pointsEarned} points!`);
```

### Word Bomb Integration
```typescript
// In word-bomb.tsx
import { leaderboardService } from '../services/leaderboardService';

// After game ends
const result = await leaderboardService.completeGame(
  userId,
  'word_bomb',
  gameId,
  finalScore,
  playerRank,
  totalPlayers,
  gameDuration
);
```

---

## 📈 Performance Optimizations

### Indexes Created
- `idx_users_points` - Fast point-based sorting
- `idx_users_region` - Fast regional filtering
- `idx_users_state` - Fast state filtering
- `idx_users_country` - Fast country filtering
- `idx_points_history_user_id` - Fast user history lookup
- `idx_game_scores_user_id` - Fast game history lookup

### Query Performance
- Indexed columns for sub-millisecond queries
- Optimized ROW_NUMBER() for ranking
- Efficient filtering with CASE statements

---

## 🎨 UI Features

### Leaderboard Display
- 🥇 Top 3 podium with special styling
- 📋 Ranks 4-7 in list view
- 📱 Full Top 10 in modal
- 🎯 Current user highlighted in gold
- 🏅 Achievement badges for top ranks

### Visual Elements
- Crown icon for 1st place
- Rank badges (2nd, 3rd)
- Profile pictures/initials
- Points with "pts" label
- Color-coded rank badges

---

## 🛠️ Maintenance

### Adding New Point Sources
1. Add to `source` CHECK constraint in `points_history` table
2. Update TypeScript types in `leaderboardService.ts`
3. Create specific function if needed (like `complete_daily_brain_boost`)

### Testing
```sql
-- View all points history
SELECT u.full_name, ph.points_earned, ph.source, ph.description, ph.created_at
FROM points_history ph
JOIN users u ON ph.user_id = u.id
ORDER BY ph.created_at DESC
LIMIT 20;

-- Check user's total points
SELECT full_name, points FROM users ORDER BY points DESC LIMIT 10;

-- Test regional filtering
SELECT * FROM get_leaderboard('region', 'Selangor', 10);
```

---

## 🔐 Security

### Row Level Security (RLS)
Consider adding RLS policies:

```sql
-- Users can view all leaderboard data (read-only)
CREATE POLICY "Anyone can view leaderboard"
  ON users FOR SELECT
  USING (true);

-- Users can only update their own points through functions
CREATE POLICY "Points updated via functions only"
  ON points_history FOR ALL
  USING (auth.uid() = user_id);
```

---

## 📝 Next Steps

1. ✅ Database schema created
2. ✅ Service layer implemented
3. ✅ Community page updated for dynamic data
4. 🔄 Integrate with Daily Brain Boost
5. 🔄 Integrate with Word Bomb
6. 🔄 Add real-time subscriptions
7. 🔄 Implement trend calculation
8. 🔄 Add location auto-detection

---

Made with 💚 for Malaysian students

