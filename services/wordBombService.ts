import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Letter combinations that can appear in the game
const LETTER_COMBINATIONS = [
  'AS', 'ER', 'TH', 'ON', 'IN', 'RE', 'AN', 'ED', 'ND', 'TO',
  'OR', 'EA', 'TI', 'AR', 'TE', 'NG', 'AL', 'IT', 'IS', 'EN',
  'AT', 'IO', 'LE', 'CO', 'RA', 'RO', 'LI', 'HE', 'RI', 'NE',
  'ST', 'OU', 'ES', 'LA', 'VE', 'PO', 'DE', 'MA', 'CA', 'SE',
  'EL', 'UN', 'CE', 'ME', 'UR', 'PA', 'TA', 'GH', 'BL', 'CH',
  'SH', 'TR', 'PR', 'BR', 'CR', 'DR', 'FR', 'GR', 'SP', 'PL'
];

export interface WordBombPlayer {
  id: string;
  name: string;
  lives: number;
  isAlive: boolean;
  isCurrentTurn: boolean;
  avatar: string;
  avatarUrl: string | null;
  score: number;
  answeredWords: string[];
}

export interface WordBombGame {
  id: string;
  roomCode: string;
  hostId: string;
  players: WordBombPlayer[];
  gameState: 'lobby' | 'countdown' | 'playing' | 'finished';
  currentLetters: string;
  currentPlayerId: string | null;
  timeLeft: number;
  maxPlayers: number;
  roundNumber: number;
  usedWords: string[];
  winnerId: string | null;
  countdown: number;
  createdAt: string;
  updatedAt: string;
}

export interface WordBombGameUpdate {
  gameId: string;
  action: 'player_joined' | 'game_started' | 'word_submitted' | 'time_up' | 'game_over' | 'player_left';
  data?: any;
}

class WordBombService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private currentGameId: string | null = null;

  // Create a new game
  async createGame(hostId: string, hostName: string, maxPlayers: number = 4): Promise<string | null> {
    try {
      const roomCode = this.generateRoomCode();
      const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Fetch user's profile picture from database
      const { data: userData } = await supabase
        .from('users')
        .select('avatar_url, full_name')
        .eq('id', hostId)
        .single();

      const hostPlayer: WordBombPlayer = {
        id: hostId,
        name: hostName,
        lives: 2,
        isAlive: true,
        isCurrentTurn: false,
        avatar: hostName.charAt(0)?.toUpperCase() || '?',
        avatarUrl: userData?.avatar_url || null,
        score: 0,
        answeredWords: []
      };

      const gameData: Omit<WordBombGame, 'id' | 'createdAt' | 'updatedAt'> = {
        roomCode,
        hostId,
        players: [hostPlayer],
        gameState: 'lobby',
        currentLetters: '',
        currentPlayerId: null,
        timeLeft: 15,
        maxPlayers,
        roundNumber: 0,
        usedWords: [],
        winnerId: null,
        countdown: 0
      };

      const { error } = await supabase
        .from('word_bomb_games')
        .insert({
          id: gameId,
          room_code: roomCode,
          host_id: hostId,
          players: gameData.players,
          game_state: gameData.gameState,
          current_letters: gameData.currentLetters,
          current_player_id: gameData.currentPlayerId,
          time_left: gameData.timeLeft,
          max_players: maxPlayers,
          round_number: gameData.roundNumber,
          used_words: gameData.usedWords,
          winner_id: gameData.winnerId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating word bomb game:', error);
        return null;
      }

      this.currentGameId = gameId;
      return gameId;
    } catch (error) {
      console.error('Error creating word bomb game:', error);
      return null;
    }
  }

  // Join an existing game
  async joinGame(roomCode: string, playerId: string, playerName: string): Promise<string | null> {
    try {
      // Find game by room code
      const { data: games, error: fetchError } = await supabase
        .from('word_bomb_games')
        .select('*')
        .eq('room_code', roomCode)
        .eq('game_state', 'lobby')
        .single();

      if (fetchError || !games) {
        console.error('Game not found or already started:', fetchError);
        return null;
      }

      const game = games as any;

      // Check if game is full
      if (game.players.length >= game.max_players) {
        console.error('Game is full');
        return null;
      }

      // Check if player already in game
      const playerExists = game.players.some((p: any) => p.id === playerId);
      if (playerExists) {
        this.currentGameId = game.id;
        return game.id;
      }

      // Fetch user's profile picture from database
      const { data: userData } = await supabase
        .from('users')
        .select('avatar_url, full_name')
        .eq('id', playerId)
        .single();

      // Add new player
      const newPlayer: WordBombPlayer = {
        id: playerId,
        name: playerName,
        lives: 2,
        isAlive: true,
        isCurrentTurn: false,
        avatar: playerName.charAt(0)?.toUpperCase() || '?',
        avatarUrl: userData?.avatar_url || null,
        score: 0,
        answeredWords: []
      };

      const updatedPlayers = [...game.players, newPlayer];

      const { error } = await supabase
        .from('word_bomb_games')
        .update({
          players: updatedPlayers,
          updated_at: new Date().toISOString()
        })
        .eq('id', game.id);

      if (error) {
        console.error('Error joining game:', error);
        return null;
      }

      this.currentGameId = game.id;
      return game.id;
    } catch (error) {
      console.error('Error joining game:', error);
      return null;
    }
  }

  // Start countdown before game
  async startCountdown(gameId: string): Promise<boolean> {
    try {
      // Set game state to countdown with initial value of 5
      const { error } = await supabase
        .from('word_bomb_games')
        .update({
          game_state: 'countdown',
          countdown: 5,
          updated_at: new Date().toISOString()
        })
        .eq('id', gameId);

      if (error) {
        console.error('Error starting countdown:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error starting countdown:', error);
      return false;
    }
  }

  // Update countdown value
  async updateCountdown(gameId: string, countdownValue: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('word_bomb_games')
        .update({
          countdown: countdownValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', gameId);

      if (error) {
        console.error('Error updating countdown:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating countdown:', error);
      return false;
    }
  }

  // Start the game
  async startGame(gameId: string): Promise<boolean> {
    try {
      const { data: game, error: fetchError } = await supabase
        .from('word_bomb_games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (fetchError || !game) {
        console.error('Game not found:', fetchError);
        return false;
      }

      // Allow single player for practice mode
      if (game.players.length < 1) {
        console.error('Need at least 1 player to start');
        return false;
      }

      // Set first player and generate letters
      const updatedPlayers = game.players.map((p: any, index: number) => ({
        ...p,
        isCurrentTurn: index === 0
      }));

      const { error } = await supabase
        .from('word_bomb_games')
        .update({
          game_state: 'playing',
          players: updatedPlayers,
          current_player_id: updatedPlayers[0].id,
          current_letters: this.getRandomLetters(),
          time_left: 15,
          round_number: 1,
          countdown: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', gameId);

      if (error) {
        console.error('Error starting game:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error starting game:', error);
      return false;
    }
  }

  // Submit a word answer
  async submitWord(gameId: string, playerId: string, word: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data: game, error: fetchError } = await supabase
        .from('word_bomb_games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (fetchError || !game) {
        return { success: false, message: 'Game not found' };
      }

      // Check if it's player's turn
      if (game.current_player_id !== playerId) {
        return { success: false, message: 'Not your turn' };
      }

      // Validate word
      const normalizedWord = word.toLowerCase().trim();
      const letters = game.current_letters.toLowerCase();

      // Check minimum length first
      if (normalizedWord.length < 3) {
        return { success: false, message: 'Word must be at least 3 letters' };
      }

      // Check if word contains the required letters
      if (!normalizedWord.includes(letters)) {
        return { success: false, message: `Word must contain "${game.current_letters.toUpperCase()}"` };
      }

      // Check if word already used in this game
      if (game.used_words && game.used_words.includes(normalizedWord)) {
        return { success: false, message: 'Word already used in this game' };
      }

      // Word is valid! Update game state
      const updatedUsedWords = [...game.used_words, normalizedWord];
      
      // Update player's score and answered words
      const updatedPlayers = game.players.map((p: any) => {
        if (p.id === playerId) {
          return {
            ...p,
            score: p.score + 10,
            answeredWords: [...p.answeredWords, normalizedWord]
          };
        }
        return p;
      });

      // Move to next alive player
      const nextPlayer = this.getNextPlayer(game.players, playerId);
      
      const playersWithTurn = updatedPlayers.map((p: any) => ({
        ...p,
        isCurrentTurn: p.id === nextPlayer.id
      }));

      // Generate new letters
      const { error } = await supabase
        .from('word_bomb_games')
        .update({
          players: playersWithTurn,
          current_player_id: nextPlayer.id,
          current_letters: this.getRandomLetters(),
          time_left: 15,
          used_words: updatedUsedWords,
          round_number: game.round_number + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', gameId);

      if (error) {
        console.error('Error updating game:', error);
        return { success: false, message: 'Error updating game' };
      }

      return { success: true, message: 'Word accepted!' };
    } catch (error) {
      console.error('Error submitting word:', error);
      return { success: false, message: 'Error submitting word' };
    }
  }

  // Handle timeout (player loses a life)
  async handleTimeout(gameId: string, playerId: string): Promise<boolean> {
    try {
      console.log('⏰ Handling timeout for game:', gameId, 'player:', playerId);
      
      const { data: game, error: fetchError } = await supabase
        .from('word_bomb_games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (fetchError || !game) {
        console.error('Game not found:', fetchError);
        return false;
      }

      console.log('Current game state:', game);

      // Reduce player's lives
      const updatedPlayers = game.players.map((p: any) => {
        if (p.id === playerId) {
          const newLives = Math.max(0, p.lives - 1);
          console.log(`Player ${p.name} lost a life: ${p.lives} → ${newLives}`);
          return {
            ...p,
            lives: newLives,
            isAlive: newLives > 0
          };
        }
        return p;
      });

      // Check if game is over
      const alivePlayers = updatedPlayers.filter((p: any) => p.isAlive);
      
      console.log('Alive players after timeout:', alivePlayers.length);
      console.log('Total players in game:', updatedPlayers.length);

      // For single player, end game ONLY if no lives left (0 alive players)
      if (updatedPlayers.length === 1 && alivePlayers.length === 0) {
        console.log('Single player game over - no lives left');
        const { error } = await supabase
          .from('word_bomb_games')
          .update({
            players: updatedPlayers,
            game_state: 'finished',
            winner_id: null, // No winner in practice mode when you lose
            updated_at: new Date().toISOString()
          })
          .eq('id', gameId);

        if (error) {
          console.error('Error ending single player game:', error);
          return false;
        }

        return true;
      }
      
      // For multiplayer (2+ total players), check if only one player left alive
      if (updatedPlayers.length > 1 && alivePlayers.length === 1) {
        // Game over - someone won!
        console.log('Multiplayer game over! Winner:', alivePlayers[0].name);
        
        // Award winner 20 bonus points
        const playersWithWinnerBonus = updatedPlayers.map((p: any) => {
          if (p.id === alivePlayers[0].id) {
            return {
              ...p,
              score: p.score + 20
            };
          }
          return p;
        });
        
        const { error } = await supabase
          .from('word_bomb_games')
          .update({
            players: playersWithWinnerBonus,
            game_state: 'finished',
            winner_id: alivePlayers[0].id,
            updated_at: new Date().toISOString()
          })
          .eq('id', gameId);

        if (error) {
          console.error('Error ending game:', error);
          return false;
        }

        return true;
      }

      // For multiplayer, check if no players left (all eliminated)
      if (updatedPlayers.length > 1 && alivePlayers.length === 0) {
        console.log('All players eliminated - draw');
        const { error } = await supabase
          .from('word_bomb_games')
          .update({
            players: updatedPlayers,
            game_state: 'finished',
            winner_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', gameId);

        if (error) {
          console.error('Error ending game:', error);
          return false;
        }

        return true;
      }

      // Game continues - move to next alive player (or same player in single-player)
      const nextPlayer = this.getNextPlayer(updatedPlayers, playerId);
      console.log('Next player:', nextPlayer.name, 'lives:', nextPlayer.lives);
      
      const playersWithTurn = updatedPlayers.map((p: any) => ({
        ...p,
        isCurrentTurn: p.id === nextPlayer.id
      }));

      const { error } = await supabase
        .from('word_bomb_games')
        .update({
          players: playersWithTurn,
          current_player_id: nextPlayer.id,
          current_letters: this.getRandomLetters(),
          time_left: 15,
          round_number: game.round_number + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', gameId);

      if (error) {
        console.error('Error updating game after timeout:', error);
        return false;
      }

      console.log('✅ Timeout handled successfully - new letters:', playersWithTurn[0].lives);
      return true;
    } catch (error) {
      console.error('Error handling timeout:', error);
      return false;
    }
  }

  // Leave game
  async leaveGame(gameId: string, playerId: string): Promise<boolean> {
    try {
      const { data: game, error: fetchError } = await supabase
        .from('word_bomb_games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (fetchError || !game) {
        console.error('Game not found:', fetchError);
        return false;
      }

      // Remove player from game
      const updatedPlayers = game.players.filter((p: any) => p.id !== playerId);

      // If no players left or game in lobby, delete game
      if (updatedPlayers.length === 0 || game.game_state === 'lobby') {
        const { error } = await supabase
          .from('word_bomb_games')
          .delete()
          .eq('id', gameId);

        if (error) {
          console.error('Error deleting game:', error);
        }

        this.currentGameId = null;
        return true;
      }

      // If game is playing, mark player as not alive
      if (game.game_state === 'playing') {
        const playersAfterLeave = game.players.map((p: any) => 
          p.id === playerId ? { ...p, isAlive: false, lives: 0 } : p
        );

        const alivePlayers = playersAfterLeave.filter((p: any) => p.isAlive);

        if (alivePlayers.length === 1) {
          // Game over - award winner 20 bonus points
          const playersWithWinnerBonus = playersAfterLeave.map((p: any) => {
            if (p.id === alivePlayers[0].id) {
              return {
                ...p,
                score: p.score + 20
              };
            }
            return p;
          });
          
          await supabase
            .from('word_bomb_games')
            .update({
              players: playersWithWinnerBonus,
              game_state: 'finished',
              winner_id: alivePlayers[0].id,
              updated_at: new Date().toISOString()
            })
            .eq('id', gameId);

          return true;
        }

        // Update current player if needed
        let newCurrentPlayerId = game.current_player_id;
        if (game.current_player_id === playerId) {
          const nextPlayer = this.getNextPlayer(playersAfterLeave, playerId);
          newCurrentPlayerId = nextPlayer.id;
        }

        await supabase
          .from('word_bomb_games')
          .update({
            players: playersAfterLeave,
            current_player_id: newCurrentPlayerId,
            updated_at: new Date().toISOString()
          })
          .eq('id', gameId);
      } else {
        // Just remove player
        await supabase
          .from('word_bomb_games')
          .update({
            players: updatedPlayers,
            updated_at: new Date().toISOString()
          })
          .eq('id', gameId);
      }

      this.currentGameId = null;
      return true;
    } catch (error) {
      console.error('Error leaving game:', error);
      return false;
    }
  }

  // Get game by ID
  async getGame(gameId: string): Promise<WordBombGame | null> {
    try {
      const { data: game, error } = await supabase
        .from('word_bomb_games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (error || !game) {
        console.error('Game not found:', error);
        return null;
      }

      return this.mapDbGameToWordBombGame(game);
    } catch (error) {
      console.error('Error getting game:', error);
      return null;
    }
  }

  // Get game by room code
  async getGameByRoomCode(roomCode: string): Promise<WordBombGame | null> {
    try {
      const { data: game, error } = await supabase
        .from('word_bomb_games')
        .select('*')
        .eq('room_code', roomCode)
        .single();

      if (error || !game) {
        console.error('Game not found:', error);
        return null;
      }

      return this.mapDbGameToWordBombGame(game);
    } catch (error) {
      console.error('Error getting game by room code:', error);
      return null;
    }
  }

  // Subscribe to game updates
  subscribeToGame(gameId: string, callback: (game: WordBombGame) => void): RealtimeChannel {
    const channel = supabase
      .channel(`word_bomb:${gameId}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'word_bomb_games', filter: `id=eq.${gameId}` },
        (payload) => {
          console.log('🎮 Word Bomb game updated:', payload);
          if (payload.new) {
            const game = this.mapDbGameToWordBombGame(payload.new as any);
            callback(game);
          }
        }
      )
      .subscribe();

    this.channels.set(gameId, channel);
    return channel;
  }

  // Unsubscribe from game updates
  async unsubscribeFromGame(gameId: string): Promise<void> {
    const channel = this.channels.get(gameId);
    if (channel) {
      await supabase.removeChannel(channel);
      this.channels.delete(gameId);
    }
  }

  // Helper: Generate random room code
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Helper: Get random letters
  private getRandomLetters(): string {
    return LETTER_COMBINATIONS[Math.floor(Math.random() * LETTER_COMBINATIONS.length)];
  }

  // Helper: Get random avatar
  private getRandomAvatar(): string {
    const avatars = ['😎', '🤓', '😺', '🐶', '🦊', '🐼', '🐯', '🦁', '🐸', '🐵'];
    return avatars[Math.floor(Math.random() * avatars.length)];
  }

  // Helper: Get next alive player
  private getNextPlayer(players: any[], currentPlayerId: string): any {
    const alivePlayers = players.filter(p => p.isAlive);
    
    // If only one player (single-player mode), return that player
    if (alivePlayers.length === 1) {
      return alivePlayers[0];
    }
    
    // For multiplayer, get next player in rotation
    const currentIndex = alivePlayers.findIndex(p => p.id === currentPlayerId);
    const nextIndex = (currentIndex + 1) % alivePlayers.length;
    return alivePlayers[nextIndex];
  }

  // Helper: Map database game to WordBombGame
  private mapDbGameToWordBombGame(dbGame: any): WordBombGame {
    return {
      id: dbGame.id,
      roomCode: dbGame.room_code,
      hostId: dbGame.host_id,
      players: dbGame.players,
      gameState: dbGame.game_state,
      currentLetters: dbGame.current_letters,
      currentPlayerId: dbGame.current_player_id,
      timeLeft: dbGame.time_left,
      maxPlayers: dbGame.max_players,
      roundNumber: dbGame.round_number,
      usedWords: dbGame.used_words || [],
      winnerId: dbGame.winner_id,
      countdown: dbGame.countdown || 0,
      createdAt: dbGame.created_at,
      updatedAt: dbGame.updated_at
    };
  }

  // Cleanup
  async cleanup(): Promise<void> {
    for (const [gameId, channel] of this.channels) {
      await supabase.removeChannel(channel);
    }
    this.channels.clear();
    this.currentGameId = null;
  }

  getCurrentGameId(): string | null {
    return this.currentGameId;
  }
}

export const wordBombService = new WordBombService();

