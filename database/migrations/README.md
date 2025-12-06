# Word Bomb Database Migrations

## How to Apply Migrations

To apply the countdown feature migration to your Supabase database:

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `add_countdown_to_word_bomb.sql`
5. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

```bash
supabase db push
```

## Current Migrations

- **add_countdown_to_word_bomb.sql**: Adds countdown synchronization feature
  - Adds `countdown` column to `word_bomb_games` table
  - Updates game_state constraint to include 'countdown' state
  - Safe to run on existing databases (checks if column exists first)

## Verifying Migration

After running the migration, you can verify it worked by running this query in SQL Editor:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'word_bomb_games' 
AND column_name = 'countdown';
```

You should see the `countdown` column with type `integer`.

