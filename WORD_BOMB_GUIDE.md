# Word Bomb Multiplayer Game Guide

## Overview
Word Bomb is an exciting multiplayer word game where 2-4 players compete to type words containing specific letters before time runs out. Last player standing wins!

## Features
- **Real-time Multiplayer**: Play with 2-4 players simultaneously
- **Time-based Challenge**: 15 seconds per turn
- **Lives System**: Each player has 2 lives
- **Room-based Gameplay**: Easy room codes for friends to join
- **Real-time Updates**: Powered by Supabase real-time subscriptions
- **Word Validation**: Intelligent word checking system
- **Beautiful UI**: Animated, responsive interface

## Game Flow

### 1. Menu Screen
- **Create Game**: Host a new game and get a room code
- **Join Game**: Enter a friend's room code to join their game

### 2. Lobby
- Wait for players to join (2-4 players required)
- Share the 6-character room code with friends
- Host can start the game when ready

### 3. Gameplay
- Each player takes turns typing words
- A random 2-letter combination is displayed (e.g., "AS", "ER", "TH")
- Type a word containing those letters within 15 seconds
- Valid words earn points and pass the bomb to the next player
- Time runs out? Lose a life!
- Last player with lives remaining wins

### 4. Game Over
- Winner is crowned
- View final scores
- Play again or return to menu

## Database Setup

### Run the SQL Schema
Execute the SQL file to create the necessary tables:

```bash
# In your Supabase SQL editor, run:
database/word_bomb_schema.sql
```

This creates:
- `word_bomb_games` table with Row Level Security policies
- Indexes for performance
- Automatic cleanup function for old games

### Database Structure

**word_bomb_games Table:**
- `id` (TEXT): Unique game identifier
- `room_code` (TEXT): 6-character join code
- `host_id` (TEXT): User ID of game creator
- `players` (JSONB): Array of player objects
- `game_state` (TEXT): 'lobby', 'playing', or 'finished'
- `current_letters` (TEXT): Current letter combination
- `current_player_id` (TEXT): ID of active player
- `time_left` (INTEGER): Seconds remaining
- `max_players` (INTEGER): 2-4 players
- `round_number` (INTEGER): Current round
- `used_words` (JSONB): Words already used in game
- `winner_id` (TEXT): ID of winner (when finished)
- `created_at`, `updated_at`: Timestamps

## How to Play

### Starting a Game
1. Navigate to the home screen
2. Click the "Word Bomb" card (bomb emoji 💣)
3. Choose "Create Game" or "Join Game"

### Creating a Game
1. Click "Create Game"
2. Share the 6-character room code with friends
3. Wait for players to join (minimum 2 players)
4. Click "Start Game" when ready

### Joining a Game
1. Click "Join Game"
2. Enter the room code from your friend
3. Wait in lobby for host to start

### During Gameplay
1. When it's your turn, the bomb will be red and animated
2. See the letter combination in the center (e.g., "AS")
3. Type a word containing those letters (e.g., "taste", "Asia", "fast")
4. Press enter or tap the submit button
5. Valid word? Bomb passes to next player!
6. Invalid or timeout? Lose a life!

### Word Rules
- Must contain the shown letters in order
- Must be at least 3 letters long
- Cannot reuse words from the current game
- Case insensitive

## Game Logic

### Letter Combinations
60+ common letter pairs including:
- AS, ER, TH, ON, IN, RE, AN, ED, ND, TO
- OR, EA, TI, AR, TE, NG, AL, IT, IS, EN
- Plus many more!

### Word Validation
The game includes:
- Dictionary of 1000+ common English words
- Substring matching for letter combinations
- Duplicate word detection per game
- Minimum length validation (3 letters)

### Scoring System
- Each valid word: +10 points
- Winner bonus: Surviving with lives

## Technical Implementation

### Services
**wordBombService.ts**
- `createGame()`: Host creates a new game
- `joinGame()`: Player joins by room code
- `startGame()`: Host starts the game
- `submitWord()`: Submit answer
- `handleTimeout()`: Process time expiration
- `subscribeToGame()`: Real-time updates

### Real-time Updates
Uses Supabase real-time subscriptions:
```typescript
wordBombService.subscribeToGame(gameId, (game) => {
  // Handle game state updates
});
```

### Components
- **Menu**: Create/Join game options
- **Lobby**: Player waiting room
- **Playing**: Active gameplay interface
- **Finished**: Results and winner display

## Customization

### Adjust Game Settings
In `wordBombService.ts`:

```typescript
// Change timer duration (default: 15 seconds)
timeLeft: 15

// Change max players (default: 4)
maxPlayers: 4

// Change lives per player (default: 2)
lives: 2
```

### Add More Words
In `data/wordList.ts`:
```typescript
export const COMMON_WORDS = new Set([
  'your', 'custom', 'words', 'here',
  // ... add more
]);
```

### Customize Letter Combinations
In `wordBombService.ts`:
```typescript
const LETTER_COMBINATIONS = [
  'AS', 'ER', 'TH', // ... add your combinations
];
```

## Troubleshooting

### Game Not Starting
- Ensure minimum 2 players in lobby
- Check that you're the host
- Verify Supabase connection

### Words Not Accepting
- Check word contains required letters
- Ensure word hasn't been used before
- Verify minimum 3 characters

### Real-time Not Working
- Check Supabase real-time is enabled
- Verify RLS policies are set correctly
- Check network connection

### Players Not Appearing
- Ensure database tables exist
- Check RLS policies allow read/write
- Verify player IDs are valid

## Performance Tips

1. **Optimize Word List**: Use a word validation API for larger dictionaries
2. **Cleanup Old Games**: Run the cleanup function periodically:
   ```sql
   SELECT cleanup_old_word_bomb_games();
   ```
3. **Index Optimization**: Ensure indexes are created for fast queries
4. **Real-time Efficiency**: Unsubscribe when leaving games

## Future Enhancements

Potential features to add:
- [ ] More languages support
- [ ] Difficulty levels (easy/medium/hard letters)
- [ ] Power-ups (freeze bomb, skip turn, etc.)
- [ ] Global leaderboards
- [ ] Tournament mode
- [ ] Custom word lists by topic
- [ ] Voice input for words
- [ ] Spectator mode
- [ ] Replay system
- [ ] Achievement badges

## Support

For issues or questions:
1. Check database is properly set up
2. Verify Supabase connection
3. Review console logs for errors
4. Ensure user authentication is working

## Credits

Created with:
- React Native + Expo
- Supabase (Database + Real-time)
- TypeScript
- Expo Router

Enjoy the game! 💣💥

