import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface MultiplayerPlayer {
  id: string;
  name: string;
  tileX: number;
  tileY: number;
  direction: 'up' | 'down' | 'left' | 'right';
  animation: 'idle' | 'walking' | 'sitting' | 'dancing' | 'waving';
  outfit: string;
  hair: string;
  color: string;
  isOnline: boolean;
  sprite?: number; // Selected sprite number (1-9)
  chatBubble?: string;
  chatTimestamp?: number;
  isMoving?: boolean;
  targetX?: number;
  targetY?: number;
  walkFrame?: number;
  pos?: { x: number; y: number };
  lastSeen: string;
}

export interface MultiplayerRoom {
  id: string;
  name: string;
  theme: string;
  background: string;
  backgroundImage?: any;
  icon: any;
  tiles: number[][];
  players: MultiplayerPlayer[];
  decorations: Array<{
    x: number;
    y: number;
    type: string;
    sprite: string;
  }>;
  maxPlayers: number;
  currentPlayers: number;
  isPrivate: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
  type: 'chat' | 'emote';
  roomId: string;
}

class MultiplayerService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private currentRoomId: string | null = null;
  private currentPlayer: MultiplayerPlayer | null = null;

  // Initialize multiplayer for a player
  async initializePlayer(userId: string, userName: string, sprite: number = 1): Promise<MultiplayerPlayer> {
    this.currentPlayer = {
      id: userId,
      name: userName,
      tileX: 42,
      tileY: 42,
      direction: 'down',
      animation: 'idle',
      outfit: 'casual',
      hair: 'messy',
      color: '#00FF00',
      isOnline: true,
      sprite: sprite, // Add sprite number
      pos: { x: 42 * 24 + 12, y: 42 * 24 + 12 },
      lastSeen: new Date().toISOString(),
    };
    return this.currentPlayer;
  }

  // Join a room (create if doesn't exist for language-based rooms)
  async joinRoom(roomId: string, player: MultiplayerPlayer): Promise<boolean> {
    try {
      // Check if room exists
      const { data: existingRoom, error: fetchError } = await supabase
        .from('multiplayer_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking room:', fetchError);
        // If database is not available, simulate joining a room
        console.log('Database not available, simulating room join');
        this.currentRoomId = roomId;
        return true;
      }

      // If room doesn't exist, create it (for language-based rooms)
      if (!existingRoom) {
        const roomCreated = await this.createLanguageRoom(roomId, player);
        if (!roomCreated) {
          // If can't create room, simulate joining
          console.log('Could not create room, simulating join');
          this.currentRoomId = roomId;
          return true;
        }
      }

      // Add player to room
      const { data: currentRoom, error: roomFetchError } = await supabase
        .from('multiplayer_rooms')
        .select('players, current_players')
        .eq('id', roomId)
        .single();

      if (roomFetchError || !currentRoom) {
        console.error('Error fetching room for join:', roomFetchError);
        this.currentRoomId = roomId;
        return true;
      }

      // Ensure players is an array
      if (!currentRoom.players || !Array.isArray(currentRoom.players)) {
        console.error('Invalid players data in room:', currentRoom);
        this.currentRoomId = roomId;
        return true;
      }

      // Clean up stale players (not seen in last 5 minutes)
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const activePlayers = currentRoom.players.filter((p: any) => {
        const lastSeen = new Date(p.lastSeen);
        return lastSeen > fiveMinutesAgo;
      });

      console.log(`🧹 Cleaned up ${currentRoom.players.length - activePlayers.length} stale players`);

      // Check if player is already in the room
      const playerExists = activePlayers.some((p: any) => p.id === player.id);
      if (playerExists) {
        console.log('Player already in room, updating their data');
        // Update player's lastSeen
        const updatedPlayers = activePlayers.map((p: any) => 
          p.id === player.id ? { ...player, lastSeen: new Date().toISOString() } : p
        );
        
        await supabase
          .from('multiplayer_rooms')
          .update({
            players: updatedPlayers,
            current_players: updatedPlayers.length
          })
          .eq('id', roomId);
        
        this.currentRoomId = roomId;
        this.setupRoomChannel(roomId);
        return true;
      }

      // Add player to the active players array
      const updatedPlayers = [...activePlayers, player];
      const updatedCurrentPlayers = updatedPlayers.length;

      const { error } = await supabase
        .from('multiplayer_rooms')
        .update({
          players: updatedPlayers,
          current_players: updatedCurrentPlayers
        })
        .eq('id', roomId);

      if (error) {
        console.error('Error joining room:', error);
        // If database update fails, still allow joining
        console.log('Database update failed, but allowing room join');
        this.currentRoomId = roomId;
        return true;
      }

      this.currentRoomId = roomId;
      this.setupRoomChannel(roomId);
      return true;
    } catch (error) {
      console.error('Error joining room:', error);
      // If all else fails, simulate joining
      console.log('All database operations failed, simulating room join');
      this.currentRoomId = roomId;
      return true;
    }
  }

  // Leave a room
  async leaveRoom(roomId: string, playerId: string): Promise<boolean> {
    try {
      // First, get the current room data
      const { data: room, error: fetchError } = await supabase
        .from('multiplayer_rooms')
        .select('players, current_players')
        .eq('id', roomId)
        .single();

      if (fetchError || !room) {
        console.error('Error fetching room:', fetchError);
        // Still try to cleanup local state
        const channel = this.channels.get(roomId);
        if (channel) {
          await supabase.removeChannel(channel);
          this.channels.delete(roomId);
        }
        this.currentRoomId = null;
        return true; // Return true to allow local cleanup
      }

      // Ensure players is an array
      if (!room.players || !Array.isArray(room.players)) {
        console.error('Invalid players data in room:', room);
        // Still try to cleanup local state
        const channel = this.channels.get(roomId);
        if (channel) {
          await supabase.removeChannel(channel);
          this.channels.delete(roomId);
        }
        this.currentRoomId = null;
        return true;
      }

      // Filter out the leaving player
      const updatedPlayers = room.players.filter((p: any) => p.id !== playerId);
      const newPlayerCount = Math.max(0, room.current_players - 1);

      // Update the room
      const { error: updateError } = await supabase
        .from('multiplayer_rooms')
        .update({
          players: updatedPlayers,
          current_players: newPlayerCount
        })
        .eq('id', roomId);

      if (updateError) {
        console.error('Error updating room after leave:', updateError);
      }

      // Unsubscribe from room channel
      const channel = this.channels.get(roomId);
      if (channel) {
        await supabase.removeChannel(channel);
        this.channels.delete(roomId);
      }

      this.currentRoomId = null;
      return true;
    } catch (error) {
      console.error('Error leaving room:', error);
      // Still cleanup local state
      const channel = this.channels.get(roomId);
      if (channel) {
        try {
          await supabase.removeChannel(channel);
        } catch (e) {
          // Ignore channel removal errors
        }
        this.channels.delete(roomId);
      }
      this.currentRoomId = null;
      return true; // Return true to allow local cleanup
    }
  }

  // Create a language-based room
  async createLanguageRoom(roomId: string, player: MultiplayerPlayer): Promise<boolean> {
    try {
      // Determine room properties based on room ID
      const isEnglish = roomId.includes('english_room');
      const isMalay = roomId.includes('malay_room');
      const theme = roomId.split('_').pop() || 'park';
      
      // Default room data based on theme
      const roomData = {
        id: roomId,
        name: `${isEnglish ? 'English' : 'Malay'} ${theme.charAt(0).toUpperCase() + theme.slice(1)} Room`,
        theme: theme,
        background: this.getThemeBackground(theme),
        tiles: this.getThemeTiles(theme),
        decorations: this.getThemeDecorations(theme),
        players: [],
        max_players: 20,
        current_players: 0,
        is_private: false,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('multiplayer_rooms')
        .insert(roomData);

      if (error) {
        console.error('Error creating language room:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error creating language room:', error);
      return false;
    }
  }

  // Get theme background color
  private getThemeBackground(theme: string): string {
    const backgrounds: { [key: string]: string } = {
      'park': '#87CEEB',
      'cafe': '#D2B48C',
      'arcade': '#9370DB',
      'beach': '#87CEEB',
      'forest': '#228B22',
    };
    return backgrounds[theme] || '#87CEEB';
  }

  // Get theme tiles
  private getThemeTiles(theme: string): number[][] {
    // Return default empty tiles for now
    return Array.from({ length: 85 }, (_, y) =>
      Array.from({ length: 85 }, (_, x) => 0)
    );
  }

  // Get theme decorations
  private getThemeDecorations(theme: string): Array<{x: number, y: number, type: string, sprite: string}> {
    // Return empty decorations for now
    return [];
  }

  // Create a new room
  async createRoom(roomData: Partial<MultiplayerRoom>): Promise<string | null> {
    try {
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase
        .from('multiplayer_rooms')
        .insert({
          id: roomId,
          name: roomData.name || 'New Room',
          theme: roomData.theme || 'park',
          background: roomData.background || '#87CEEB',
          tiles: roomData.tiles || Array.from({ length: 85 }, (_, y) =>
            Array.from({ length: 85 }, (_, x) => 0)
          ),
          players: [],
          decorations: roomData.decorations || [],
          max_players: roomData.maxPlayers || 10,
          current_players: 0,
          is_private: roomData.isPrivate || false,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error creating room:', error);
        return null;
      }

      return roomId;
    } catch (error) {
      console.error('Error creating room:', error);
      return null;
    }
  }

  // Get available rooms
  async getAvailableRooms(): Promise<MultiplayerRoom[]> {
    try {
      const { data, error } = await supabase
        .from('multiplayer_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || !Array.isArray(data)) {
        if (error) console.error('Error fetching rooms:', error);
        // Return default rooms if database is not set up or offline
        return this.getDefaultRooms();
      }

      // Filter rooms where current_players < max_players
      const availableRooms = data.filter(
        room => room.current_players < room.max_players
      );

      return availableRooms.length > 0 ? availableRooms : this.getDefaultRooms();
    } catch (error) {
      console.error('Error fetching rooms:', error);
      // Return default rooms if database is not set up
      return this.getDefaultRooms();
    }
  }

  // Get default rooms when database is not available
  private getDefaultRooms(): MultiplayerRoom[] {
    return [
      {
        id: 'english_room_park',
        name: 'English Park Room',
        theme: 'park',
        background: '#87CEEB',
        tiles: Array.from({ length: 85 }, (_, y) =>
          Array.from({ length: 85 }, (_, x) => 0)
        ),
        players: [],
        decorations: [],
        maxPlayers: 20,
        currentPlayers: 0,
        isPrivate: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'malay_room_park',
        name: 'Malay Park Room',
        theme: 'park',
        background: '#87CEEB',
        tiles: Array.from({ length: 85 }, (_, y) =>
          Array.from({ length: 85 }, (_, x) => 0)
        ),
        players: [],
        decorations: [],
        maxPlayers: 20,
        currentPlayers: 0,
        isPrivate: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'english_room_cafe',
        name: 'English Cafe Room',
        theme: 'cafe',
        background: '#D2B48C',
        tiles: Array.from({ length: 85 }, (_, y) =>
          Array.from({ length: 85 }, (_, x) => 0)
        ),
        players: [],
        decorations: [],
        maxPlayers: 15,
        currentPlayers: 0,
        isPrivate: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'malay_room_cafe',
        name: 'Malay Cafe Room',
        theme: 'cafe',
        background: '#D2B48C',
        tiles: Array.from({ length: 85 }, (_, y) =>
          Array.from({ length: 85 }, (_, x) => 0)
        ),
        players: [],
        decorations: [],
        maxPlayers: 15,
        currentPlayers: 0,
        isPrivate: false,
        createdAt: new Date().toISOString(),
      }
    ];
  }

  // Update player position
  async updatePlayerPosition(roomId: string, playerId: string, position: { x: number; y: number }, tilePosition: { tileX: number; tileY: number }): Promise<void> {
    try {
      // First, get the current room data
      const { data: roomData, error: positionFetchError } = await supabase
        .from('multiplayer_rooms')
        .select('players')
        .eq('id', roomId)
        .single();

      if (positionFetchError || !roomData) {
        console.error('Error fetching room for position update:', positionFetchError);
        return;
      }

      // Ensure players is an array
      if (!roomData.players || !Array.isArray(roomData.players)) {
        console.error('Invalid players data in room:', roomData);
        return;
      }

      // Update the player in the players array
      const updatedPlayers = roomData.players.map((player: any) => {
        if (player.id === playerId) {
          // Calculate direction based on movement
          const oldPos = player.pos || { x: player.tileX * 24, y: player.tileY * 24 };
          let direction = player.direction || 'down';
          
          const dx = position.x - oldPos.x;
          const dy = position.y - oldPos.y;
          
          if (Math.abs(dx) > Math.abs(dy)) {
            direction = dx > 0 ? 'right' : 'left';
          } else if (Math.abs(dy) > 0.5) {
            direction = dy > 0 ? 'down' : 'up';
          }
          
          return {
            ...player,
            pos: position,
            tileX: tilePosition.tileX,
            tileY: tilePosition.tileY,
            direction: direction,
            isMoving: Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5,
            lastSeen: new Date().toISOString()
          };
        }
        return player;
      });

      // Update the room with the new players array
      const { error } = await supabase
        .from('multiplayer_rooms')
        .update({
          players: updatedPlayers,
          updated_at: new Date().toISOString() // Force update timestamp to trigger real-time
        })
        .eq('id', roomId);

      if (error) {
        console.error('Error updating player position:', error);
      }
    } catch (error) {
      console.error('Error updating player position:', error);
    }
  }

  // Update player sprite
  async updatePlayerSprite(sprite: number): Promise<void> {
    if (!this.currentRoomId || !this.currentPlayer) return;

    try {
      // Update current player sprite
      this.currentPlayer.sprite = sprite;

      // Fetch current room data
      const { data: roomData, error: fetchError } = await supabase
        .from('multiplayer_rooms')
        .select('players')
        .eq('id', this.currentRoomId)
        .single();

      if (fetchError || !roomData) {
        console.error('Error fetching room for sprite update:', fetchError);
        return;
      }

      // Ensure players is an array
      if (!roomData.players || !Array.isArray(roomData.players)) {
        console.error('Invalid players data in room:', roomData);
        return;
      }

      // Update the player's sprite in the players array
      const updatedPlayers = roomData.players.map((player: any) => {
        if (player.id === this.currentPlayer?.id) {
          return {
            ...player,
            sprite: sprite,
            lastSeen: new Date().toISOString()
          };
        }
        return player;
      });

      // Update the room
      const { error } = await supabase
        .from('multiplayer_rooms')
        .update({
          players: updatedPlayers,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.currentRoomId);

      if (error) {
        console.error('Error updating player sprite:', error);
      } else {
        console.log('✅ Player sprite updated to:', sprite);
      }
    } catch (error) {
      console.error('Error updating player sprite:', error);
    }
  }

  // Send chat message
  async sendChatMessage(roomId: string, message: ChatMessage): Promise<void> {
    try {
      // Map the message object to match database column names
      const dbMessage = {
        id: message.id,
        room_id: message.roomId,
        player_id: message.playerId,
        player_name: message.playerName,
        message: message.message,
        message_type: message.type, // Map 'type' to 'message_type'
        timestamp: new Date(message.timestamp).toISOString()
      };

      console.log('💬 Sending chat message to database:', dbMessage);

      const { error } = await supabase
        .from('chat_messages')
        .insert(dbMessage);

      if (error) {
        console.error('❌ Error sending chat message:', error);
      } else {
        console.log('✅ Chat message sent successfully');
      }
    } catch (error) {
      console.error('❌ Error sending chat message:', error);
    }
  }

  // Setup real-time channel for a room
  private setupRoomChannel(roomId: string): void {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'multiplayer_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          this.handleRoomUpdate(payload);
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          this.handleChatMessage(payload);
        }
      )
      .subscribe();

    this.channels.set(roomId, channel);
  }

  // Handle room updates
  private handleRoomUpdate(payload: any): void {
    // This will be handled by the component that subscribes to room updates
    console.log('Room updated:', payload);
  }

  // Handle chat messages
  private handleChatMessage(payload: any): void {
    // This will be handled by the component that subscribes to chat updates
    console.log('New chat message:', payload);
  }

  // Get current player
  getCurrentPlayer(): MultiplayerPlayer | null {
    return this.currentPlayer;
  }

  // Get current room ID
  getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }

  // Cleanup
  async cleanup(): Promise<void> {
    for (const [roomId, channel] of this.channels) {
      await supabase.removeChannel(channel);
    }
    this.channels.clear();
    this.currentRoomId = null;
    this.currentPlayer = null;
  }
}

export const multiplayerService = new MultiplayerService();
