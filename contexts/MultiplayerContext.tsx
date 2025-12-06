import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { multiplayerService, MultiplayerPlayer, MultiplayerRoom, ChatMessage } from '../services/multiplayerService';
import { useAuth } from './AuthContext';
import { supabase } from '../services/supabase';

interface MultiplayerContextType {
  // Room state
  currentRoom: MultiplayerRoom | null;
  availableRooms: MultiplayerRoom[];
  isConnected: boolean;
  
  // Player state
  currentPlayer: MultiplayerPlayer | null;
  otherPlayers: MultiplayerPlayer[];
  
  // Chat state
  chatMessages: ChatMessage[];
  playerChatBubbles: {[playerId: string]: {text: string, timestamp: number, type: 'chat' | 'emote'}};
  
  // Actions
  joinRoom: (roomId: string) => Promise<boolean>;
  leaveRoom: () => Promise<boolean>;
  createRoom: (roomData: Partial<MultiplayerRoom>) => Promise<string | null>;
  updatePlayerPosition: (position: { x: number; y: number }, tilePosition: { tileX: number; tileY: number }) => Promise<void>;
  updatePlayerSprite: (sprite: number) => Promise<void>;
  sendChatMessage: (message: string, type: 'chat' | 'emote') => Promise<void>;
  refreshRooms: () => Promise<void>;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
}

const MultiplayerContext = createContext<MultiplayerContextType | undefined>(undefined);

export const useMultiplayer = () => {
  const context = useContext(MultiplayerContext);
  if (context === undefined) {
    throw new Error('useMultiplayer must be used within a MultiplayerProvider');
  }
  return context;
};

interface MultiplayerProviderProps {
  children: ReactNode;
}

export const MultiplayerProvider: React.FC<MultiplayerProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [currentRoom, setCurrentRoom] = useState<MultiplayerRoom | null>(null);
  const [availableRooms, setAvailableRooms] = useState<MultiplayerRoom[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<MultiplayerPlayer | null>(null);
  const [otherPlayers, setOtherPlayers] = useState<MultiplayerPlayer[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerChatBubbles, setPlayerChatBubbles] = useState<{[playerId: string]: {text: string, timestamp: number, type: 'chat' | 'emote'}}>({});

  // Initialize player when user changes
  useEffect(() => {
    if (user) {
      initializePlayer();
    } else {
      setCurrentPlayer(null);
      setOtherPlayers([]);
      setCurrentRoom(null);
      setIsConnected(false);
    }
  }, [user]);

  // Set up real-time subscriptions when room changes
  useEffect(() => {
    if (!currentRoom || !isConnected) return;

    console.log('Setting up real-time subscription for room:', currentRoom.id);

    const channel = supabase
      .channel(`room:${currentRoom.id}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'multiplayer_rooms', filter: `id=eq.${currentRoom.id}` },
        (payload) => {
          console.log('🔔 Room updated via real-time:', payload);
          if (payload.new) {
            const updatedRoom = payload.new as any;
            console.log('📦 Updated room data:', {
              id: updatedRoom.id,
              playersCount: updatedRoom.players?.length,
              updated_at: updatedRoom.updated_at
            });
            console.log('👥 Players in room:', updatedRoom.players);
            
            // Update current room
            setCurrentRoom(prev => ({
              ...prev,
              ...updatedRoom,
              players: updatedRoom.players || []
            }));
            
            // Update other players (exclude current player and filter stale players)
            if (updatedRoom.players && currentPlayer) {
              // Filter out stale players (not seen in last 5 minutes)
              const now = new Date();
              const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
              
              const activePlayers = updatedRoom.players.filter((p: any) => {
                const lastSeen = new Date(p.lastSeen);
                return lastSeen > fiveMinutesAgo;
              });

              const otherPlayers = activePlayers.filter((p: any) => p.id !== currentPlayer.id);
              console.log('👤 Active other players:', otherPlayers.map(p => ({
                id: p.id,
                name: p.name,
                pos: p.pos,
                tileX: p.tileX,
                tileY: p.tileY,
                lastSeen: p.lastSeen
              })));
              console.log('📊 Active players count:', otherPlayers.length);
              setOtherPlayers(otherPlayers);
            }
          }
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${currentRoom.id}` },
        (payload) => {
          console.log('💬 New chat message via real-time:', payload);
          if (payload.new) {
            // Map database columns to TypeScript interface
            const dbMessage = payload.new as any;
            const newMessage: ChatMessage = {
              id: dbMessage.id,
              roomId: dbMessage.room_id,
              playerId: dbMessage.player_id,
              playerName: dbMessage.player_name,
              message: dbMessage.message,
              type: dbMessage.message_type as 'chat' | 'emote',
              timestamp: new Date(dbMessage.timestamp).getTime()
            };
            
            console.log('💬 Mapped chat message:', newMessage);
            setChatMessages(prev => {
              const updated = [...prev, newMessage];
              console.log('💬 Chat messages updated, count:', updated.length);
              return updated;
            });
            
            // Update player chat bubbles for speech bubbles
            if (newMessage.playerId !== currentPlayer?.id) {
              console.log('💬 Adding speech bubble for player:', newMessage.playerId, 'message:', newMessage.message);
              setPlayerChatBubbles(prev => {
                const updated = {
                  ...prev,
                  [newMessage.playerId]: {
                    text: newMessage.message,
                    timestamp: newMessage.timestamp,
                    type: newMessage.type
                  }
                };
                console.log('💬 Player chat bubbles updated:', Object.keys(updated));
                return updated;
              });
              
              // Remove chat bubble after 5 seconds
              setTimeout(() => {
                console.log('💬 Removing speech bubble for player:', newMessage.playerId);
                setPlayerChatBubbles(prev => {
                  const updated = { ...prev };
                  delete updated[newMessage.playerId];
                  return updated;
                });
              }, 5000);
            } else {
              console.log('💬 Ignoring own message (my playerId:', currentPlayer?.id, ')');
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time subscription for room:', currentRoom.id);
      supabase.removeChannel(channel);
    };
  }, [currentRoom, currentPlayer, isConnected]);

  // Load available rooms on mount
  useEffect(() => {
    refreshRooms();
  }, []);

  const initializePlayer = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const player = await multiplayerService.initializePlayer(user.id, user.full_name || 'Anonymous');
      setCurrentPlayer(player);
      setIsConnected(true);
    } catch (err) {
      console.error('Error initializing player:', err);
      setError('Failed to initialize multiplayer');
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = useCallback(async (roomId: string): Promise<boolean> => {
    if (!currentPlayer) return false;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Joining room:', roomId, 'with player:', currentPlayer);
      
      const success = await multiplayerService.joinRoom(roomId, currentPlayer);
      if (success) {
        // Fetch updated room data directly from database
        try {
          const { data: roomData, error } = await supabase
            .from('multiplayer_rooms')
            .select('*')
            .eq('id', roomId)
            .single();

          if (error) {
            console.error('Error fetching room after join:', error);
            // Fallback to default room data
            const rooms = await multiplayerService.getAvailableRooms();
            const room = rooms.find(r => r.id === roomId);
            if (room) {
              setCurrentRoom(room);
              setOtherPlayers(room.players.filter(p => p.id !== currentPlayer.id));
            }
          } else {
            console.log('Room data fetched successfully:', roomData);
            setCurrentRoom(roomData);
            setOtherPlayers(roomData.players.filter((p: any) => p.id !== currentPlayer.id));
          }
        } catch (fetchErr) {
          console.error('Error fetching room data:', fetchErr);
          // Fallback to default room data
          const rooms = await multiplayerService.getAvailableRooms();
          const room = rooms.find(r => r.id === roomId);
          if (room) {
            setCurrentRoom(room);
            setOtherPlayers(room.players.filter(p => p.id !== currentPlayer.id));
          }
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error joining room:', err);
      setError('Failed to join room - Database may not be set up');
      // Don't fail completely, just show error
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentPlayer]);

  const leaveRoom = useCallback(async (): Promise<boolean> => {
    if (!currentRoom) return false;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await multiplayerService.leaveRoom(currentRoom.id, currentPlayer?.id || '');
      if (success) {
        setCurrentRoom(null);
        setOtherPlayers([]);
        setChatMessages([]);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error leaving room:', err);
      setError('Failed to leave room');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentRoom, currentPlayer]);

  const createRoom = useCallback(async (roomData: Partial<MultiplayerRoom>): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const roomId = await multiplayerService.createRoom(roomData);
      if (roomId) {
        await refreshRooms();
      }
      return roomId;
    } catch (err) {
      console.error('Error creating room:', err);
      setError('Failed to create room');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePlayerPosition = useCallback(async (position: { x: number; y: number }, tilePosition: { tileX: number; tileY: number }) => {
    if (!currentRoom || !currentPlayer) return;
    
    try {
      await multiplayerService.updatePlayerPosition(currentRoom.id, currentPlayer.id, position, tilePosition);
      
      // Update local player state
      setCurrentPlayer(prev => prev ? {
        ...prev,
        pos: position,
        tileX: tilePosition.tileX,
        tileY: tilePosition.tileY
      } : null);
    } catch (err) {
      console.error('Error updating player position:', err);
    }
  }, [currentRoom, currentPlayer]);

  const updatePlayerSprite = useCallback(async (sprite: number) => {
    try {
      await multiplayerService.updatePlayerSprite(sprite);
      
      // Update local player sprite
      setCurrentPlayer(prev => prev ? { ...prev, sprite } : null);
    } catch (err) {
      console.error('Error updating player sprite:', err);
    }
  }, []);

  const sendChatMessage = useCallback(async (message: string, type: 'chat' | 'emote') => {
    if (!currentRoom || !currentPlayer) return;
    
    try {
      const chatMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        roomId: currentRoom.id,
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        message,
        type,
        timestamp: Date.now()
      };
      
      await multiplayerService.sendChatMessage(currentRoom.id, chatMessage);
      
      // Add to local messages immediately for better UX
      setChatMessages(prev => [...prev, chatMessage]);
    } catch (err) {
      console.error('Error sending chat message:', err);
    }
  }, [currentRoom, currentPlayer]);

  const refreshRooms = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const rooms = await multiplayerService.getAvailableRooms();
      setAvailableRooms(rooms);
      console.log('Rooms loaded:', rooms.length, 'rooms available');
    } catch (err) {
      console.error('Error refreshing rooms:', err);
      setError('Failed to load rooms - Using offline mode');
      // Still try to get default rooms
      try {
        const defaultRooms = await multiplayerService.getAvailableRooms();
        setAvailableRooms(defaultRooms);
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      multiplayerService.cleanup();
    };
  }, []);

  const value: MultiplayerContextType = {
    currentRoom,
    availableRooms,
    isConnected,
    currentPlayer,
    otherPlayers,
    chatMessages,
    playerChatBubbles,
    joinRoom,
    leaveRoom,
    createRoom,
    updatePlayerPosition,
    updatePlayerSprite,
    sendChatMessage,
    refreshRooms,
    isLoading,
    error,
  };

  return (
    <MultiplayerContext.Provider value={value}>
      {children}
    </MultiplayerContext.Provider>
  );
};
