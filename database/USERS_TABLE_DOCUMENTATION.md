# 📊 Users Table Documentation

## Overview
The `users` table is the **core user profile table** in your Genius App. It stores all user information, preferences, and onboarding data.

---

## 🗂️ Table Structure

### Basic Information
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique user identifier (matches Supabase Auth user ID) |
| `email` | `varchar` | NOT NULL, UNIQUE | User's email address (from Supabase Auth) |
| `full_name` | `varchar` | NOT NULL | User's full name |
| `username` | `varchar` | UNIQUE | Unique username for the user |
| `created_at` | `timestamp with time zone` | DEFAULT now() | When the user was created |
| `updated_at` | `timestamp with time zone` | DEFAULT now() | Last time the user profile was updated |

### School & Age Information
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `school` | `varchar` | Nullable | User's school name |
| `current_school` | `varchar` | Nullable | Current school (duplicate of `school`, used during onboarding) |
| `age` | `integer` | CHECK (age IS NULL OR age > 0 AND age < 150) | User's age (calculated from birth_date) |
| `birth_date` | `date` | Nullable | User's date of birth |

### Learning Preferences
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `preferred_language` | `varchar` | DEFAULT 'english', CHECK ('english', 'malay', 'mixed') | User's preferred app language |
| `study_hours_per_day` | `integer` | DEFAULT 2, CHECK (0-12) | How many hours user studies per day |
| `weak_subjects` | `text[]` | DEFAULT '{}' | Array of subjects user finds challenging |
| `strong_subjects` | `text[]` | DEFAULT '{}' | Array of subjects user excels in |
| `academic_goals` | `text` | Nullable | User's academic goals/aspirations |
| `study_preferences` | `jsonb` | DEFAULT '{}' | Additional study preferences (flexible JSON) |

### Onboarding & App State
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `onboarding_completed` | `boolean` | DEFAULT false | Whether user completed onboarding flow |
| `onboarding_data` | `jsonb` | DEFAULT '{}' | Complete onboarding data (backup) |
| `selected_sprite` | `integer` | DEFAULT 1, CHECK (1-9) | User's selected character sprite in Lepak game |

---

## 🔐 Row Level Security (RLS) Policies

### Current Policies:
1. **"Users can view own profile"**
   - Allows: `SELECT`
   - Condition: `auth.uid() = id`
   - Users can only see their own profile

2. **"Users can insert own profile"**
   - Allows: `INSERT`
   - Condition: `auth.uid() = id`
   - Users can create their own profile during registration

3. **"Users can update own profile"**
   - Allows: `UPDATE`
   - Condition: `auth.uid() = id`
   - Users can only update their own profile

### ⚠️ Important Notes:
- **Anonymous users cannot read** from this table (blocked by RLS)
- This is why we need **RPC functions** (`check_username_exists`, `check_email_exists`) for registration validation
- RLS ensures users cannot see other users' data

---

## 🔗 Relationships

### Foreign Keys (Referenced By):
1. **`ai_sessions.user_id`** → References `users.id`
   - All AI chat sessions belong to a user

2. **`notes.user_id`** → References `users.id`
   - All notes belong to a user

3. **`recording_sessions.user_id`** → References `users.id`
   - All audio recording sessions belong to a user

4. **`sticky_notes.user_id`** → References `users.id`
   - All sticky notes belong to a user

5. **`session_sticky_notes.user_id`** → References `users.id`
   - All session-specific sticky notes belong to a user

6. **`user_progress.user_id`** → References `users.id`
   - All learning progress tracking belongs to a user

---

## 📝 Common Use Cases

### 1. **User Registration**
```typescript
// During registration (authService.ts)
await supabase.from('users').insert({
  id: authUser.id,
  email: credentials.email,
  full_name: credentials.full_name,
  username: credentials.username,
  onboarding_completed: false
});
```

### 2. **Onboarding Completion**
```typescript
// During onboarding (onboarding.tsx)
await supabase.from('users').update({
  full_name: data.intro,
  school: data.current_school,
  birth_date: data.birth_date,
  age: calculatedAge,
  preferred_language: mapLanguage(data.preferred_language),
  weak_subjects: data.weak_subjects,
  strong_subjects: data.strong_subjects,
  study_hours_per_day: mapStudyHours(data.study_hours_per_day),
  academic_goals: data.academic_goals,
  onboarding_completed: true,
  onboarding_data: data
}).eq('id', userId);
```

### 3. **Save Sprite Preference**
```typescript
// When user changes sprite (authService.ts)
await supabase.from('users').update({
  selected_sprite: spriteNumber
}).eq('id', userId);
```

### 4. **Check Username/Email Availability** (Registration)
```typescript
// Using RPC to bypass RLS (register.tsx)
const { data: exists } = await supabase
  .rpc('check_username_exists', { username_to_check: 'john' });
// Returns: true or false
```

### 5. **Load User Profile**
```typescript
// Get current user profile (authService.ts)
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();
```

---

## 🎨 Field Constraints & Validation

### Email
- ✅ Must be unique
- ✅ Required (NOT NULL)
- ✅ Validated by Supabase Auth

### Username
- ✅ Must be unique
- ✅ Optional but recommended
- ✅ Used in multiplayer features

### Age
- ✅ Between 1-149
- ✅ Can be NULL
- ✅ Calculated from birth_date

### Preferred Language
- ✅ Must be: 'english', 'malay', or 'mixed'
- ✅ Default: 'english'

### Study Hours Per Day
- ✅ Between 0-12 hours
- ✅ Default: 2

### Selected Sprite
- ✅ Between 1-9
- ✅ Default: 1
- ✅ Used in Lepak multiplayer game

---

## 🔧 Indexes

Current indexes:
1. **PRIMARY KEY** on `id` (automatic)
2. **UNIQUE INDEX** on `email` (automatic)
3. **UNIQUE INDEX** on `username` (automatic)
4. **INDEX** on `onboarding_completed` for faster onboarding status queries

---

## 📊 Sample Data Structure

```json
{
  "id": "b2e6ce9f-b00f-47c5-87da-81685b10d793",
  "email": "harith@gmail.com",
  "full_name": "Harith Danial",
  "username": "harith",
  "school": "SMK Bandar Utama",
  "current_school": "SMK Bandar Utama",
  "age": 21,
  "birth_date": "2004-10-01",
  "preferred_language": "malay",
  "study_hours_per_day": 2,
  "weak_subjects": ["Mathematics", "Physics"],
  "strong_subjects": ["English", "History"],
  "academic_goals": "Get straight A's in SPM",
  "study_preferences": {},
  "onboarding_completed": true,
  "onboarding_data": {
    "intro": "Harith Danial",
    "preferred_language": "Bahasa Melayu",
    "current_school": "SMK Bandar Utama",
    "birth_date": "2004-10-01",
    "weak_subjects": ["Mathematics", "Physics"],
    "strong_subjects": ["English", "History"],
    "study_hours_per_day": "1-2 hours",
    "academic_goals": "Get straight A's in SPM"
  },
  "selected_sprite": 1,
  "created_at": "2025-10-01T07:44:36.225617+00:00",
  "updated_at": "2025-10-01T07:46:33.69711+00:00"
}
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "User not found after registration"
**Cause:** Profile creation failed but auth user was created
**Solution:** Check profile creation errors in authService.ts

### Issue 2: "Cannot query users table"
**Cause:** RLS is blocking the query
**Solution:** Use RPC functions or ensure user is authenticated

### Issue 3: "Username already exists" during registration
**Cause:** Username is not unique
**Solution:** Use real-time validation with `check_username_exists()`

### Issue 4: "Onboarding keeps showing"
**Cause:** `onboarding_completed` is still `false`
**Solution:** Ensure onboarding completion updates this field

---

## 🎯 Best Practices

1. **Always set `onboarding_completed = true`** after onboarding
2. **Update `updated_at`** when making changes
3. **Validate email format** before insertion
4. **Check username availability** before registration
5. **Calculate age from birth_date** instead of storing both
6. **Use arrays for subjects** (weak_subjects, strong_subjects)
7. **Store flexible data in JSONB** (study_preferences, onboarding_data)

---

## 📚 Related Files

- **Services:** `services/authService.ts`
- **Contexts:** `contexts/AuthContext.tsx`
- **Screens:** `app/auth/register.tsx`, `app/onboarding.tsx`
- **Database:** 
  - `database/fix_users_schema.sql`
  - `database/allow_username_email_check.sql`
  - `database/add_sprite_preference.sql`

