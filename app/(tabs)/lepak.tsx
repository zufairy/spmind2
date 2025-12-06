import React, { useState, useEffect, useRef, useReducer, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image, ImageBackground, Animated, TextInput, PixelRatio, KeyboardAvoidingView, Platform, Keyboard, InputAccessoryView } from 'react-native';
 
import { LinearGradient } from 'expo-linear-gradient';
import { Globe, Settings, MessageCircle, Users, Home, Coffee, Gamepad2, Heart, Star, Smile, Camera, Palette, Search, FileText, User, X } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Animatable from 'react-native-animatable';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useMultiplayer } from '../../contexts/MultiplayerContext';
import { authService } from '../../services/authService';

// Enhanced movement system with A* pathfinding and decoupled animation
import { aStar } from '../../pathfinding/aStar';
import { SpriteAnimator, Player as PlayerType } from '../../animation/spriteAnimator';
import { QUADRANTS, getQuadrantForPosition, getQuadrantBounds } from '../../movement/grid';

const { width, height } = Dimensions.get('window');

// Enhanced tile system constants
const TILE_SIZE = 24; // Smaller tiles for more detail
const WORLD_WIDTH = 85; // 2048x2048 world size
const WORLD_HEIGHT = 85;

// Enhanced movement constants for 2048x2048 world - OPTIMIZED FOR ULTRA SMOOTH MOVEMENT
const WALK_SPEED = 500;           // px/s (even faster movement)
const ANIM_FPS = 30;              // walking frames cadence (120 FPS compatible)
const END_TILE_PAUSE_MS = 20;     // show frame 2 at centers (minimal pause)
const ARRIVE_EPS = 0.1;           // px snap threshold (ultra precise)

  // Enhanced movement helper functions
  const tileCenterPx = (t: { tx: number; ty: number }) => ({
    x: t.tx * TILE_SIZE + TILE_SIZE / 2,
    y: t.ty * TILE_SIZE + TILE_SIZE / 2
  });

const worldToTile = (p: { x: number; y: number }) => ({
  tx: Math.floor(p.x / TILE_SIZE),
  ty: Math.floor(p.y / TILE_SIZE)
});

const dirFromDelta = (dx: number, dy: number): "down"|"left"|"right"|"up" => {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  } else {
    return dy > 0 ? "down" : "up";
  }
};

const rowFromDir = (d: "down"|"left"|"right"|"up"): number => {
  const dirMap = { down: 0, left: 1, right: 2, up: 3 };
  return dirMap[d];
};

// Enhanced easing functions for smoother animations
const easingFunctions = {
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  easeOutSine: (t: number) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  linear: (t: number) => t,
};

// Spritesheet constants for different sprites
const SPRITE_COLS = 4;
const SPRITE_ROWS = 4;

// Different frame sizes for different sprites
const SPRITE_FRAME_SIZES = {
  1: { width: 64, height: 64 }, // sprite1: 64x64 frames
  2: { width: 32, height: 48 }, // sprite2: 32x48 frames (exact specifications)
  3: { width: 32, height: 48 }, // sprite3: 32x48 frames (exact specifications)
  4: { width: 32, height: 48 }, // sprite4: 32x48 frames (exact specifications)
  5: { width: 32, height: 48 }, // sprite5: 32x48 frames (exact specifications)
  6: { width: 64, height: 64 }, // sprite6: 64x64 frames (same as sprite1)
  7: { width: 32, height: 48 }, // sprite7: 32x48 frames (exact specifications)
  8: { width: 32, height: 48 }, // sprite8: 32x48 frames (exact specifications)
  9: { width: 32, height: 48 }, // sprite9: 32x48 frames (exact specifications)
};

// Different frame counts for walking animation per sprite
const SPRITE_WALK_FRAMES = {
  1: 4, // sprite1: 4 walking frames
  2: 4, // sprite2: 4 walking frames (frames 0-3 per direction)
  3: 4, // sprite3: 4 walking frames
  4: 4, // sprite4: 4 walking frames (frames 0-3 per direction)
  5: 4, // sprite5: 4 walking frames (frames 0-3 per direction)
  6: 4, // sprite6: 4 walking frames
  7: 4, // sprite7: 4 walking frames (frames 0-3 per direction)
  8: 4, // sprite8: 4 walking frames (frames 0-3 per direction)
  9: 4, // sprite9: 4 walking frames (frames 0-3 per direction)
};

interface Player {
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
  chatBubble?: string;
  chatTimestamp?: number;
  isMoving?: boolean;
  targetX?: number;
  targetY?: number;
  walkFrame?: number;
  pos?: { x: number; y: number }; // Enhanced pixel position for smooth gliding
}

interface Room {
  id: string;
  name: string;
  theme: string;
  background: string;
  backgroundImage?: any;
  icon: any;
  tiles: number[][];
  players: Player[];
  decorations: Array<{
    x: number;
    y: number;
    type: string;
    sprite: string;
  }>;
}

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

// Tile types: 0 = walkable, 1 = wall, 2 = water, 3 = grass, 4 = path
const sampleRooms: Room[] = [
  {
    id: 'park',
    name: 'Sunny Park',
    theme: 'park',
    background: '#87CEEB',
    backgroundImage: require('../../assets/images/map.png'),
    icon: Home,
    tiles: Array.from({ length: WORLD_HEIGHT }, (_, y) =>
      Array.from({ length: WORLD_WIDTH }, (_, x) => 0)
    ),
    decorations: [],
    players: []
  },
  // Cozy Cafe - Hidden for now
  // {
  //   id: 'cafe',
  //   name: 'Cozy Cafe',
  //   theme: 'cafe',
  //   background: '#D2B48C',
  //   backgroundImage: require('../../assets/images/cafe.png'),
  //   icon: Coffee,
  //   tiles: Array.from({ length: WORLD_HEIGHT }, (_, y) =>
  //     Array.from({ length: WORLD_WIDTH }, (_, x) => 0)
  //   ),
  //   decorations: [],
  //   players: []
  // },
  {
    id: 'arcade',
    name: 'Chilly Rooftop',
    theme: 'arcade',
    background: '#9370DB',
    backgroundImage: require('../../assets/images/big_rooftop.png'),
    icon: Gamepad2,
    tiles: Array.from({ length: 128 }, (_, y) =>  // 3072 / 24 = 128 tiles tall
      Array.from({ length: 85 }, (_, x) => 0)      // 2048 / 24 = 85 tiles wide
    ),
    decorations: [],
    players: []
  }
];

// Default center position for Sunny Park (will be calculated dynamically in component)
const DEFAULT_CENTER_TILE = Math.floor(2048 / 24 / 2); // 2048px / 24px tile / 2

const currentPlayer: Player = {
  id: 'me',
  name: 'You',
  tileX: DEFAULT_CENTER_TILE,
  tileY: DEFAULT_CENTER_TILE,
  direction: 'right',
  animation: 'idle',
  outfit: 'casual',
  hair: 'messy',
  color: '#00FF00',
  isOnline: true
};

export default function LepakScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { 
    currentRoom: multiplayerRoom, 
    availableRooms, 
    isConnected, 
    currentPlayer: multiplayerPlayer, 
    otherPlayers, 
    chatMessages: multiplayerChatMessages,
    playerChatBubbles,
    joinRoom, 
    leaveRoom, 
    updatePlayerPosition,
    updatePlayerSprite,
    sendChatMessage,
    refreshRooms,
    createRoom,
    isLoading: multiplayerLoading,
    error: multiplayerError
  } = useMultiplayer();

  // Debug logging for multiplayer state (disabled to reduce spam)
  // useEffect(() => {
  //   console.log('Multiplayer state updated:', {
  //     isConnected,
  //     currentRoom: multiplayerRoom?.id,
  //     otherPlayersCount: otherPlayers.length,
  //     chatBubblesCount: Object.keys(playerChatBubbles).length,
  //     otherPlayers: otherPlayers.map(p => ({ 
  //       id: p.id, 
  //       name: p.name, 
  //       pos: p.pos,
  //       tileX: p.tileX,
  //       tileY: p.tileY,
  //       direction: p.direction
  //     }))
  //   });
  // }, [isConnected, multiplayerRoom, otherPlayers, playerChatBubbles]);

  // Debug logging for position changes (disabled to reduce spam)
  // useEffect(() => {
  //   if (otherPlayers.length > 0) {
  //     console.log('Other players positions:', otherPlayers.map(p => ({
  //       name: p.name,
  //       pixelPos: p.pos,
  //       tilePos: { x: p.tileX, y: p.tileY }
  //     })));
  //   }
  // }, [otherPlayers]);

  // Track other players' animation state and smooth position (same as current player)
  const [otherPlayersState, setOtherPlayersState] = useState<{[playerId: string]: {
    frame: number,
    isMoving: boolean,
    currentPos: {x: number, y: number},
    targetPos: {x: number, y: number}
  }}>({});

  useEffect(() => {
    // Update animation for other players at 120fps for ultra smooth movement
    const animIntervalId = setInterval(() => {
      otherPlayers.forEach(player => {
        setOtherPlayersState(prev => {
          const prevState = prev[player.id];
          if (!prevState) return prev;
          
          const isMoving = prevState.isMoving;
          
          // Update frame if moving (cycle 0-3 like current player) - faster animation
          const newFrame = isMoving ? (prevState.frame + 1) % 4 : 0;
          
          return {
            ...prev,
            [player.id]: {
              ...prevState,
              frame: newFrame
            }
          };
        });
      });
    }, 33); // ~30fps animation (33ms) for smooth but not excessive
    
    // Ultra-smooth position interpolation at 120fps with optimized prediction
    const positionIntervalId = setInterval(() => {
      otherPlayers.forEach(player => {
        const targetX = player.pos?.x || (player.tileX * TILE_SIZE + TILE_SIZE / 2);
        const targetY = player.pos?.y || (player.tileY * TILE_SIZE + TILE_SIZE / 2);
        
        setOtherPlayersState(prev => {
          const prevState = prev[player.id] || { 
            frame: 0, 
            isMoving: false, 
            currentPos: { x: targetX, y: targetY },
            targetPos: { x: targetX, y: targetY },
            velocity: { x: 0, y: 0 }
          };
          
          // Smooth interpolation towards target (much faster for real-time feel)
          const currentX = prevState.currentPos.x;
          const currentY = prevState.currentPos.y;
          
          const dx = targetX - currentX;
          const dy = targetY - currentY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Adaptive interpolation: faster for larger distances, slower for small
          let interpolationFactor = 0.8; // Much faster interpolation (80% towards target)
          if (distance < 5) {
            interpolationFactor = 0.95; // Almost instant for small distances
          } else if (distance > 50) {
            interpolationFactor = 0.6; // Slightly slower for large jumps
          }
          
          let newX = currentX + dx * interpolationFactor;
          let newY = currentY + dy * interpolationFactor;
          
          // Improved client-side prediction with velocity tracking
          if (player.isMoving && distance > 2) {
            // Calculate velocity from previous position
            const velocity = prevState.velocity || { x: 0, y: 0 };
            const newVelocity = { x: dx * 0.1, y: dy * 0.1 };
            
            // Predict movement with velocity
            const predictDist = Math.min(8, distance * 0.1); // Adaptive prediction distance
            newX += newVelocity.x * predictDist;
            newY += newVelocity.y * predictDist;
            
            // Update velocity
            prevState.velocity = newVelocity;
          }
          
          // Check if moving (distance from target > 0.5 pixels for ultra precision)
          const isMoving = distance > 0.5;
          
          return {
            ...prev,
            [player.id]: {
              frame: prevState.frame,
              isMoving: isMoving,
              currentPos: { x: newX, y: newY },
              targetPos: { x: targetX, y: targetY },
              velocity: prevState.velocity || { x: 0, y: 0 }
            }
          };
        });
      });
    }, 8); // ~120fps for ultra-smooth gliding
    
    return () => {
      clearInterval(animIntervalId);
      clearInterval(positionIntervalId);
    };
  }, [otherPlayers]);

  // Reset zoom function
  const resetZoom = () => {
    setZoomLimits({ min: 0.1, max: 3.0 });
    setCurrentZoom(1.0);
  };
  
  // Debug logging for movement and map rendering
  const debugMovement = (message: string, data?: any) => {
    // Temporarily disabled to prevent stack overflow
    // console.log(`[MOVEMENT DEBUG] ${message}`, data || '');
  };

  // Map direction to sprite sheet row (4x4 grid)
  const getDirectionRow = (direction: 'up' | 'down' | 'left' | 'right'): number => {
    // Sprite4 and similar sprites use: row 0=down, 1=left, 2=right, 3=up
    if ([2, 3, 4, 5, 7, 8, 9].includes(selectedSprite)) {
      switch (direction) {
        case 'down': return 0;  // Row 0 - walk-down
        case 'left': return 1;  // Row 1 - walk-left
        case 'right': return 2; // Row 2 - walk-right
        case 'up': return 3;    // Row 3 - walk-up
        default: return 0;
      }
    }
    
    // Default mapping for sprite1 and sprite6 (older sprites)
    switch (direction) {
      case 'down': return 0;  // First row - walking down
      case 'left': return 2;  // Use right row but flip it (scaleX: -1)
      case 'right': return 2; // Third row - walking right
      case 'up': return 3;    // Fourth row - walking up
      default: return 0;
    }
  };

  // Get current direction for rendering (use ref for immediate updates)
  const getCurrentDirection = (): 'up' | 'down' | 'left' | 'right' => {
    return lastDirectionSet.current;
  };
  
  // Keep existing UI state
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ms'>('en');
  const [currentRoom, setCurrentRoom] = useState<Room>(sampleRooms[0]);
  const [showChat, setShowChat] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmotes, setShowEmotes] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [playerBubbles, setPlayerBubbles] = useState<Array<{id: string, text: string, timestamp: number, type: 'chat' | 'emote'}>>([]);
  const [playerEmoteBubble, setPlayerEmoteBubble] = useState<string | null>(null);
  const [showSpriteSelector, setShowSpriteSelector] = useState(false);
  const [selectedSprite, setSelectedSprite] = useState(1);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showRoomSelection, setShowRoomSelection] = useState(true); // Show language selection on load
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false); // Track if user has joined a room
  const [selectedLanguageRoom, setSelectedLanguageRoom] = useState<'en' | 'ms' | null>(null); // Track selected language room
  const [showSettingsMenu, setShowSettingsMenu] = useState(false); // Settings menu modal
  const hiddenInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  // Zoom is handled by ScrollView
  

  // Enhanced movement system state (simplified) - OPTIMIZED FOR HIGH FPS
  const lastUpdateTime = useRef<number>(performance.now());
  const frameRate = 120; // Increased to 120 FPS for super smooth gameplay
  const frameInterval = 1000 / frameRate;

  // Calculate initial center position (default to Sunny Park center: 1024x1024 pixels)
  const initialCenterTileX = Math.floor(2048 / TILE_SIZE / 2);
  const initialCenterTileY = Math.floor(2048 / TILE_SIZE / 2);
  const initialCenterPixelX = 2048 / 2;
  const initialCenterPixelY = 2048 / 2;

  // Legacy compatibility (for existing UI)
  const [playerTilePosition, setPlayerTilePosition] = useState({ 
    tileX: initialCenterTileX, 
    tileY: initialCenterTileY 
  });

  // Enhanced player state with A* pathfinding and decoupled animation
  const [player, setPlayer] = useState<PlayerType>({
    pos: { x: initialCenterPixelX, y: initialCenterPixelY },
    dir: "down",
    state: "idle",
    frame: 0,
    path: [],
    animAccum: 0,
    endTileTimer: 0,
  });


  // Initialize player position and zoom once
  // Calculate zoom limits based on map size and screen dimensions
  const calculateZoomLimits = (screenWidth: number, screenHeight: number, mapWidth: number, mapHeight: number) => {
    try {
      // Calculate the minimum zoom scale needed to fit the entire map on screen
      const minZoomX = screenWidth / mapWidth;
      const minZoomY = screenHeight / mapHeight;
      const minZoom = Math.min(minZoomX, minZoomY);
      
      // Set minimum zoom to fit the map exactly on screen, but not too small
      const finalMinZoom = Math.max(0.1, Math.min(1.0, minZoom));
      
      // Set maximum zoom to 3x for reasonable zoom in
      const maxZoom = 3.0;
      
      return {
        min: finalMinZoom,
        max: maxZoom
      };
    } catch (error) {
      console.error('Error calculating zoom limits:', error);
      // Fallback to safe defaults
      return {
        min: 0.1,
        max: 3.0
      };
    }
  };

  useEffect(() => {
    // Use the exact pixel center values for consistency
    const initialPos = { 
      x: initialCenterPixelX, 
      y: initialCenterPixelY 
    };
    
    // Update position ref immediately
    currentPositionRef.current = initialPos;
    
    // Update player state
    setPlayer(prevPlayer => ({
      ...prevPlayer,
      pos: initialPos
    }));
    
    // Calculate zoom limits based on screen size and map size
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const mapWidth = WORLD_WIDTH * TILE_SIZE;
    const mapHeight = WORLD_HEIGHT * TILE_SIZE;
    
    const limits = calculateZoomLimits(screenWidth, screenHeight, mapWidth, mapHeight);
    setZoomLimits(limits);
    
    // Center the view on player spawn position
    setTimeout(() => {
      if (scrollViewRef.current) {
        const scrollX = Math.max(0, initialCenterPixelX - screenWidth / 2);
        const scrollY = Math.max(0, initialCenterPixelY - screenHeight / 2);
        
        scrollViewRef.current.scrollTo({
          x: scrollX,
          y: scrollY,
          animated: false // No animation on initial load
        });
      }
    }, 100);
    
  }, []); // Only run once on mount



  const [playerAnimation, setPlayerAnimation] = useState<'idle' | 'walking' | 'sitting' | 'dancing' | 'waving'>('idle');
  const [playerDirection, setPlayerDirection] = useState<'up' | 'down' | 'left' | 'right'>('down');
  const lastDirectionChange = useRef<number>(0);
  const lastDirectionSet = useRef<'up' | 'down' | 'left' | 'right'>('down');
  const [isMoving, setIsMoving] = useState(false);
  const [walkFrame, setWalkFrame] = useState(0);
  const [currentSpriteFrame, setCurrentSpriteFrame] = useState(0);
  const [targetPosition, setTargetPosition] = useState<{tileX: number, tileY: number} | null>(null);
  const [walkPath, setWalkPath] = useState<Array<{tileX: number, tileY: number}>>([]);
  const [bgSize, setBgSize] = useState<{ width: number; height: number }>({ width: WORLD_WIDTH * TILE_SIZE, height: WORLD_HEIGHT * TILE_SIZE });
  const [mapSize, setMapSize] = useState<{ width: number; height: number }>({ 
    width: WORLD_WIDTH * TILE_SIZE, 
    height: WORLD_HEIGHT * TILE_SIZE 
  });
  
  // Dynamic zoom limits based on map size and screen size
  const [zoomLimits, setZoomLimits] = useState({ min: 0.1, max: 3.0 });
  const [currentZoom, setCurrentZoom] = useState(1.0);

  // Recalculate zoom limits when screen dimensions change
  useEffect(() => {
    const updateZoomLimits = () => {
      const screenWidth = Dimensions.get('window').width;
      const screenHeight = Dimensions.get('window').height;
      const mapWidth = mapSize.width || WORLD_WIDTH * TILE_SIZE;
      const mapHeight = mapSize.height || WORLD_HEIGHT * TILE_SIZE;
      
      const limits = calculateZoomLimits(screenWidth, screenHeight, mapWidth, mapHeight);
      
      // Ensure limits are reasonable
      const safeLimits = {
        min: Math.max(0.1, Math.min(1.0, limits.min)), // Don't allow zoom out beyond 1.0
        max: Math.max(1.0, Math.min(3.0, limits.max))  // Don't allow zoom in beyond 3.0
      };
      
      setZoomLimits(safeLimits);
    };

    // Update zoom limits when map size changes
    updateZoomLimits();

    // Listen for orientation changes
    const subscription = Dimensions.addEventListener('change', updateZoomLimits);
    
    return () => subscription?.remove();
  }, [mapSize]);
  const [stepCounter, setStepCounter] = useState(0);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [animationSpeed, setAnimationSpeed] = useState(1.0);
  const [isInterpolating, setIsInterpolating] = useState(false);
  const [isTurning, setIsTurning] = useState(false);

  const frameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const turnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Touch zoom state


  // Load saved sprite preference on mount
  useEffect(() => {
    const loadSavedSprite = async () => {
      const savedSprite = await authService.loadSelectedSprite();
      if (savedSprite !== 1) {
        setSelectedSprite(savedSprite);
        
        // Update multiplayer sprite if connected
        if (isConnected) {
          updatePlayerSprite(savedSprite);
        }
      }
    };
    
    loadSavedSprite();
  }, []); // Only run once on mount

  // Walking animation system
  useEffect(() => {
    let animationInterval: NodeJS.Timeout | null = null;
    
    if (isMoving && playerAnimation === 'walking') {
      animationInterval = setInterval(() => {
        setCurrentSpriteFrame(prev => (prev + 1) % 4); // Cycle through 4 walking frames
      }, 200) as unknown as NodeJS.Timeout; // Change frame every 200ms
    } else {
      setCurrentSpriteFrame(0); // Reset to first frame when not moving
    }
    
    return () => {
      if (animationInterval) {
        clearInterval(animationInterval);
      }
    };
  }, [isMoving, playerAnimation, playerDirection]); // Add playerDirection as dependency

  // Safety timeout to stop movement if it gets stuck
  useEffect(() => {
    if (isMoving) {
      // Calculate timeout based on path length - longer paths get more time
      const pathLength = walkPath.length;
      const timeoutDuration = Math.max(5000, pathLength * 100); // At least 5 seconds, or 100ms per step
      
      const timeout = setTimeout(() => {
        setIsMoving(false);
        setPlayerAnimation('idle');
        setWalkPath([]);
        setTargetPosition(null);
      }, timeoutDuration);

      return () => clearTimeout(timeout);
    }
  }, [isMoving, walkPath.length]);

  // Simple zoom without PanResponder

  // Enhanced movement system
  const animator = useRef(new SpriteAnimator());
  const lastTime = useRef<number>(performance.now());
  const animationId = useRef<number | undefined>(undefined);

  // Enhanced game loop with A* pathfinding and decoupled animation
  const gameLoop = (currentTime: number) => {
    const dt = (currentTime - lastTime.current) / 1000;
    lastTime.current = currentTime;

    updateMovement(dt);
    updateAnimation(dt);
    
    // Don't sync legacy state during movement - causes teleporting
  };

  // Enhanced movement update - SYNCED WITH EXISTING TILE SYSTEM
  const updateMovement = (dt: number) => {
    debugMovement('updateMovement called', {
      dt: dt,
      frameRate: 1000 / dt,
      playerPos: player.pos,
      pathLength: player.path.length
    });
    
    setPlayer(prevPlayer => {
      const newPlayer = { ...prevPlayer };

      if (newPlayer.path.length > 0) {
        const node = newPlayer.path[0];
        const target = tileCenterPx(node);
        const dx = target.x - newPlayer.pos.x;
        const dy = target.y - newPlayer.pos.y;
        const dist = Math.hypot(dx, dy);


        if (dist <= ARRIVE_EPS) {
          // Snap to center
          newPlayer.pos = target;
          newPlayer.path.shift();
          
          // Update existing tile position to match enhanced movement
          setPlayerTilePosition({ tileX: node.tx, tileY: node.ty });
          
          if (newPlayer.path.length > 0) {
            // Continue to next node
            newPlayer.state = "walking";
            // Update direction for next node
            const nextNode = newPlayer.path[0];
            const nextTarget = tileCenterPx(nextNode);
            const nextDx = nextTarget.x - newPlayer.pos.x;
            const nextDy = nextTarget.y - newPlayer.pos.y;
            newPlayer.dir = dirFromDelta(nextDx, nextDy);
          } else {
            // Reached end - show end tile frame
            animator.current.setEndTileState(newPlayer);
          }
        } else {
          // Move towards target
          const vx = (dx / (dist || 1)) * WALK_SPEED;
          const vy = (dy / (dist || 1)) * WALK_SPEED;
          newPlayer.pos.x += vx * dt;
          newPlayer.pos.y += vy * dt;
          newPlayer.dir = dirFromDelta(dx, dy);
          newPlayer.state = "walking";
        }
      } else {
        // Handle end tile timer
        animator.current.updateEndTileTimer(dt, newPlayer);
      }

      return newPlayer;
    });
  };

  // Enhanced animation update
  const updateAnimation = (dt: number) => {
    setPlayer(prevPlayer => {
      const newPlayer = { ...prevPlayer };
      animator.current.update(dt, newPlayer);
      return newPlayer;
    });
  };

  // Sync enhanced state with legacy state for compatibility
  // Removed syncLegacyState - was causing teleporting during movement

  // Sprite mapping for dynamic loading - corrected file extensions
  const spriteMap = {
    1: require('../../assets/images/sprite1.png'),
    2: require('../../assets/images/sprite2.png'), // Fixed: actual file is .png
    3: require('../../assets/images/sprite3.png'),
    4: require('../../assets/images/sprite4.png'),
    5: require('../../assets/images/sprite5.png'),
    6: require('../../assets/images/sprite6.png'),
    7: require('../../assets/images/sprite7.png'),
    8: require('../../assets/images/sprite8.png'),
    9: require('../../assets/images/sprite9.png'),
  };
  
  const walkAnimation = useRef(new Animated.Value(0)).current;
  const bounceAnimation = useRef(new Animated.Value(1)).current;
  const walkFrameInterval = useRef<NodeJS.Timeout | null>(null);
  const chatBubbleTimeout = useRef<NodeJS.Timeout | null>(null);
  const emoteBubbleTimeout = useRef<NodeJS.Timeout | null>(null);
  // Zoom handled by ScrollView minimumZoomScale/maximumZoomScale

  // Removed fallback animation - using tile-based animation system

  useEffect(() => {
    // Load map dimensions with error handling - DISABLED to prevent null URL errors
    // Use fallback dimensions directly
    setMapSize({ width: WORLD_WIDTH * TILE_SIZE, height: WORLD_HEIGHT * TILE_SIZE });
    
    // try {
    //   const mapSource = Image.resolveAssetSource(require('../../assets/images/map.png'));
    //   if (mapSource && mapSource.width && mapSource.height) {
    //     setMapSize({ width: mapSource.width, height: mapSource.height });
    //   } else {
    //     // Fallback dimensions if resolveAssetSource fails
    //     setMapSize({ width: WORLD_WIDTH * TILE_SIZE, height: WORLD_HEIGHT * TILE_SIZE });
    //   }
    // } catch (error) {
    //   console.warn('Failed to resolve map image source:', error);
    //   // Fallback dimensions
    //   setMapSize({ width: WORLD_WIDTH * TILE_SIZE, height: WORLD_HEIGHT * TILE_SIZE });
    // }
  }, []);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Enhanced game loop with A* pathfinding and decoupled animation - DISABLED
  // useEffect(() => {
  //   lastTime.current = performance.now();
  //   animationId.current = requestAnimationFrame(gameLoop);

  //   return () => {
  //     if (animationId.current) {
  //       cancelAnimationFrame(animationId.current);
  //     }
  //   };
  // }, []);

  useEffect(() => {
    // Start idle animation
    const idleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnimation, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    idleAnimation.start();

    return () => {
      idleAnimation.stop();
      if (walkFrameInterval.current) {
        clearInterval(walkFrameInterval.current);
      }
      if (frameTimerRef.current) {
        clearInterval(frameTimerRef.current);
      }
      if (turnTimerRef.current) {
        clearTimeout(turnTimerRef.current);
      }
      if (chatBubbleTimeout.current) {
        clearTimeout(chatBubbleTimeout.current);
      }
      if (emoteBubbleTimeout.current) {
        clearTimeout(emoteBubbleTimeout.current);
      }
    };
  }, []);

  // Frame animation is now handled directly in the interpolation function

  const handleLanguageChange = (newLanguage: 'en' | 'ms') => {
    setCurrentLanguage(newLanguage);
  };

  // Calculate center position based on room
  const getMapCenter = (roomId: string) => {
    if (roomId === 'arcade') {
      // Chilly Rooftop: 2048x3072
      return {
        tileX: Math.floor(2048 / TILE_SIZE / 2),
        tileY: Math.floor(3072 / TILE_SIZE / 2),
        pixelX: 2048 / 2,
        pixelY: 3072 / 2
      };
    } else {
      // Sunny Park & Cafe: 2048x2048
      return {
        tileX: Math.floor(2048 / TILE_SIZE / 2),
        tileY: Math.floor(2048 / TILE_SIZE / 2),
        pixelX: 2048 / 2,
        pixelY: 2048 / 2
      };
    }
  };

  const changeRoom = (room: Room) => {
    setCurrentRoom(room);
    
    // Calculate center position for the new map
    const center = getMapCenter(room.id);
    
    // Set player to center of map
    setPlayerTilePosition({ tileX: center.tileX, tileY: center.tileY });
    setPlayer(prevPlayer => ({
      ...prevPlayer,
      pos: { x: center.pixelX, y: center.pixelY }
    }));
    
    // IMPORTANT: Update the position ref so movement starts from center
    currentPositionRef.current = { x: center.pixelX, y: center.pixelY };
    
    setPlayerAnimation('idle');
    setWalkFrame(0);
    setStepCounter(0);
    
    // Reset zoom to default and center on player sprite
    setCurrentZoom(1.0);
    
    // Center the view on the player sprite after a brief delay to ensure render
    setTimeout(() => {
      if (scrollViewRef.current) {
        const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
        
        // Calculate scroll position to center player sprite
        const scrollX = Math.max(0, center.pixelX - screenWidth / 2);
        const scrollY = Math.max(0, center.pixelY - screenHeight / 2);
        
        scrollViewRef.current.scrollTo({
          x: scrollX,
          y: scrollY,
          animated: true
        });
      }
    }, 100);
  };

  const isWalkable = (tileX: number, tileY: number) => {
    // Check against the actual room's tile dimensions instead of fixed constants
    const roomHeight = currentRoom.tiles.length;
    const roomWidth = currentRoom.tiles[0]?.length || 0;
    
    if (tileX < 0 || tileX >= roomWidth || tileY < 0 || tileY >= roomHeight) {
      return false;
    }
    return currentRoom.tiles[tileY] && currentRoom.tiles[tileY][tileX] === 0;
  };

  // Optimized pathfinding with strict tile-by-tile movement
  const findPath = (startX: number, startY: number, targetX: number, targetY: number) => {
    const startTime = performance.now();
    const path: Array<{tileX: number, tileY: number}> = [];
    let currentX = startX;
    let currentY = startY;
    let safety = 0;
    const maxSteps = 500; // Reduced for faster pathfinding
    
    debugMovement('findPath called', {
      start: { x: startX, y: startY },
      target: { x: targetX, y: targetY },
      distance: Math.abs(targetX - startX) + Math.abs(targetY - startY)
    });

    while ((currentX !== targetX || currentY !== targetY) && safety < maxSteps) {
      safety++;
      let stepped = false;

      // Calculate distance to target
      const dx = targetX - currentX;
      const dy = targetY - currentY;

      // 4-directional pathfinding - cardinal directions only
      if (!stepped) {
        if (dx !== 0) {
          const stepX = dx > 0 ? 1 : -1;
        if (isWalkable(currentX + stepX, currentY)) {
          currentX += stepX;
          path.push({ tileX: currentX, tileY: currentY });
          stepped = true;
        }
      }

        if (!stepped && dy !== 0) {
          const stepY = dy > 0 ? 1 : -1;
          if (isWalkable(currentX, currentY + stepY)) {
            currentY += stepY;
            path.push({ tileX: currentX, tileY: currentY });
            stepped = true;
          }
        }
      }

      // If all preferred directions failed, try simple detours
      if (!stepped) {
        const detours = [
          { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
          { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
        ];
        let found = false;
        for (const d of detours) {
          if (isWalkable(currentX + d.dx, currentY + d.dy)) {
            currentX += d.dx;
            currentY += d.dy;
            path.push({ tileX: currentX, tileY: currentY });
            found = true;
            break;
          }
        }
        if (!found) break; // stuck
      }
    }
    
    const endTime = performance.now();
    debugMovement('findPath completed', {
      pathLength: path.length,
      duration: endTime - startTime,
      safety: safety,
      success: path.length > 0
    });
    
    return path;
  };


  // Enhanced tile click with A* pathfinding - REVERTED TO WORKING SYSTEM
  const handleTileClick = (tileX: number, tileY: number) => {
    // Block new touches while already moving
    if (isMoving || isInterpolating) {
      return;
    }
    
    // Check if target is walkable
    const walkable = isWalkable(tileX, tileY);
    if (!walkable) {
      return;
    }
    
    // Stop any existing movement completely
    setIsMoving(false);
    setIsInterpolating(false);
    setIsTurning(false);
    setPlayerAnimation('idle');
    setWalkFrame(0);
    setStepCounter(0);
    
    // Clear all timers immediately
    if (frameTimerRef.current) {
      clearInterval(frameTimerRef.current);
      frameTimerRef.current = null;
    }
    if (turnTimerRef.current) {
      clearTimeout(turnTimerRef.current);
      turnTimerRef.current = null;
    }

    // Wait a frame to ensure state is cleared
    setTimeout(() => {
    const path = findPath(playerTilePosition.tileX, playerTilePosition.tileY, tileX, tileY);
    
    if (path.length > 0) {
      setTargetPosition({ tileX, tileY });
      setWalkPath(path);
      setIsMoving(true);
      setPlayerAnimation('walking');
      
      // Start continuous walking animation
      startWalkingAnimation();
      
      // Reset direction tracking for new movement
      lastDirectionSet.current = playerDirection;
      
      // Set initial direction based on first movement step for immediate response
        const firstStep = path[0];
        const dx = firstStep.tileX - playerTilePosition.tileX;
        const dy = firstStep.tileY - playerTilePosition.tileY;
        
        // Determine direction based on primary movement axis
        let initialDirection = playerDirection;
        if (Math.abs(dx) > Math.abs(dy)) {
          initialDirection = dx > 0 ? 'right' : 'left';
        } else if (Math.abs(dy) > 0) {
          initialDirection = dy > 0 ? 'down' : 'up';
        }
        
        // Setting initial direction for movement
        setPlayerDirection(initialDirection);
        lastDirectionSet.current = initialDirection; // Track the initial direction
      
      // Start with first walking frame for smoother transition
      const maxWalkFrames = SPRITE_WALK_FRAMES[selectedSprite as keyof typeof SPRITE_WALK_FRAMES] || 4;
      setWalkFrame(1); // Start with first walking frame (not idle)
      setStepCounter(1); // Start step counter
      
        // Animation will start per-tile in moveAlongPath
        
        // Start movement immediately
        moveAlongPath(path, 0);
      }
    }, 10); // Small delay to ensure state is cleared
  };


  // Persistent frame counter for animation
  const frameCounterRef = useRef(0);


  // Start walking animation for movement - ULTRA SMOOTH
  const startWalkingAnimation = () => {
    // Clear any existing timer first
    if (frameTimerRef.current) {
      clearInterval(frameTimerRef.current);
      frameTimerRef.current = null;
    }
    
      const maxWalkFrames = SPRITE_WALK_FRAMES[selectedSprite as keyof typeof SPRITE_WALK_FRAMES] || 4;
    const frameInterval = 8; // 8ms per frame = 120 FPS for ultra smooth animation
    
    
    const frameTimer = setInterval(() => {
      // Cycle through walking frames (1, 2, 3, 4) continuously
      frameCounterRef.current = (frameCounterRef.current + 1) % maxWalkFrames;
      const frameForTile = frameCounterRef.current + 1; // Frames 1-4
      setWalkFrame(frameForTile);
    }, frameInterval);
    
    frameTimerRef.current = frameTimer as any;
  };

  // Per-tile walking animation - ULTRA FAST AND SMOOTH
  const startTileAnimation = (tileIndex: number) => {
    // Clear any existing timer first
    if (frameTimerRef.current) {
      clearInterval(frameTimerRef.current);
      frameTimerRef.current = null;
    }
    
    const maxWalkFrames = SPRITE_WALK_FRAMES[selectedSprite as keyof typeof SPRITE_WALK_FRAMES] || 4;
    
    // Start with frame 1 immediately
    setWalkFrame(1);
    
    // Show frame 2 after 40ms (much faster)
      setTimeout(() => {
      setWalkFrame(2);
    }, 40);
    
    // Show frame 3 after 80ms (approaching destination)
    setTimeout(() => {
      setWalkFrame(3);
    }, 80);
    
    // Show frame 4 after 120ms (arriving at destination)
    setTimeout(() => {
      setWalkFrame(4);
    }, 120);
  };

  const moveAlongPath = (path: Array<{tileX: number, tileY: number}>, recursionDepth: number = 0) => {
    // Path processing
    
    // Safety check to prevent infinite recursion
    if (recursionDepth > 100) {
      console.warn('moveAlongPath: Maximum recursion depth reached, stopping movement');
      setIsMoving(false);
      setPlayerAnimation('idle');
      return;
    }
    
    // Get current position from the ref (always up-to-date)
    const currentPos = currentPositionRef.current;
    
    if (path.length === 0) {
      // Path complete - stop movement immediately
      
      // Clear all movement states immediately
      setIsMoving(false);
      setPlayerAnimation('idle');
      setWalkFrame(0);
      setStepCounter(0);
      setIsInterpolating(false);
      setIsTurning(false);
      setWalkPath([]);
      setTargetPosition(null);
      
      // Reset sprite frame to idle frame for current direction
      setCurrentSpriteFrame(0);
      
      // Reset direction tracking
      lastDirectionSet.current = playerDirection;
      
      // Clear all timers
      if (frameTimerRef.current) {
        clearInterval(frameTimerRef.current);
        frameTimerRef.current = null;
        frameCounterRef.current = 0;
      }
      if (turnTimerRef.current) {
        clearTimeout(turnTimerRef.current);
        turnTimerRef.current = null;
      }
      
      // Movement stopped
      return;
    }

    const nextStep = path[0];
    const remainingPath = path.slice(1);

    // 4-directional movement detection
    const dx = nextStep.tileX - Math.floor(currentPos.x / TILE_SIZE);
    const dy = nextStep.tileY - Math.floor(currentPos.y / TILE_SIZE);
    
    let newDirection = playerDirection;
    
    // 4-directional mapping (cardinal directions only)
    if (dx > 0) {
      newDirection = 'right';
    } else if (dx < 0) {
      newDirection = 'left';
    } else if (dy > 0) {
      newDirection = 'down';
    } else if (dy < 0) {
      newDirection = 'up';
    }
    
    // Handle direction change with debouncing to prevent rapid changes
    const now = Date.now();
    let hasDirectionChanged = false;
    // Direction check logic
    if (newDirection !== lastDirectionSet.current && (now - lastDirectionChange.current) > 50) {
      // Direction change logic
      
      if (turnTimerRef.current) {
        clearTimeout(turnTimerRef.current);
      }
      
      // Update direction and timestamp
      setPlayerDirection(newDirection);
      lastDirectionChange.current = now;
      lastDirectionSet.current = newDirection; // Track the direction we just set
      setIsTurning(false);
      
      // Reset walk frame to 0 for smooth transition
      setWalkFrame(0);
      
      // Reset sprite frame to 0 to ensure proper direction display
      setCurrentSpriteFrame(0);
      // Sprite frame and direction updated
      
      hasDirectionChanged = true;
    }

    // Use current player position for smooth gliding
    const startX = Math.floor(currentPos.x / TILE_SIZE);
    const startY = Math.floor(currentPos.y / TILE_SIZE);
    const endX = nextStep.tileX;
    const endY = nextStep.tileY;
    
    // Calculate move duration based on WALK_SPEED - ultra smooth movement
    const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2) * TILE_SIZE;
    const moveDuration = (distance / WALK_SPEED) * 1000; // Convert to milliseconds, optimized for ultra smooth movement
    
    debugMovement('Movement calculation', {
      startPos: { x: startX, y: startY },
      endPos: { x: endX, y: endY },
      distance: distance,
      walkSpeed: WALK_SPEED,
      moveDuration: moveDuration,
      tilesPerSecond: TILE_SIZE / (WALK_SPEED / 1000)
    });
    
    setIsInterpolating(true);
    
    // Clear existing timers
    if (frameTimerRef.current) {
      clearInterval(frameTimerRef.current);
      frameTimerRef.current = null;
    }
    if (turnTimerRef.current) {
      clearTimeout(turnTimerRef.current);
      turnTimerRef.current = null;
    }
    
    // Animation is already running continuously from startWalkingAnimation()
    // No need to start per-tile animation
    
    // Smooth gliding movement between tiles
    const startTime = Date.now();
    const startPixelX = currentPos.x; // Use current pixel position
    const startPixelY = currentPos.y; // Use current pixel position
    const endPixelX = endX * TILE_SIZE + TILE_SIZE / 2;
    const endPixelY = endY * TILE_SIZE + TILE_SIZE / 2;
    
    const animateGliding = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / moveDuration, 1);
      
      // Use ultra-smooth easing for gliding effect - linear for maximum smoothness
      const easedProgress = progress; // Linear interpolation for ultra smooth movement
      
      // Calculate current pixel position
      const currentPixelX = startPixelX + (endPixelX - startPixelX) * easedProgress;
      const currentPixelY = startPixelY + (endPixelY - startPixelY) * easedProgress;
      
      // Update player position with exact pixel coordinates
      setPlayer(prevPlayer => {
        // Update the ref with current position
        currentPositionRef.current = { x: currentPixelX, y: currentPixelY };
        
        const newPlayer = {
          ...prevPlayer,
          pos: { x: currentPixelX, y: currentPixelY }
        };

        // Update multiplayer position if connected - optimized for smooth real-time movement
        // Send updates every 33ms (30 times per second) for optimal balance of smoothness and performance
        const now = Date.now();
        const lastUpdate = (window as any).lastMultiplayerUpdate || 0;
        if (isConnected && multiplayerRoom && (now - lastUpdate) > 33) {
          (window as any).lastMultiplayerUpdate = now;
          try {
            // Send position with current direction for better synchronization
            updatePlayerPosition(
              { x: currentPixelX, y: currentPixelY },
              { tileX: Math.floor(currentPixelX / TILE_SIZE), tileY: Math.floor(currentPixelY / TILE_SIZE) }
            );
          } catch (error) {
            console.warn('Failed to update multiplayer position:', error);
          }
        }

        return newPlayer;
      });
      
      // Don't update tile position during gliding - only update at the end
      
      if (progress < 1) {
        // Continue gliding
        requestAnimationFrame(animateGliding);
      } else {
        // Gliding complete - snap to exact tile center
        setPlayer(prevPlayer => ({
          ...prevPlayer,
          pos: { x: endPixelX, y: endPixelY }
        }));
        setPlayerTilePosition({ tileX: endX, tileY: endY });
        setIsInterpolating(false);
        
        // Update the path to reflect remaining steps
        setWalkPath(remainingPath);
        
        // Check if this was the last step
        if (remainingPath.length === 0) {
          // Path complete
          // Path is complete, stop movement immediately
          setIsMoving(false);
          setPlayerAnimation('idle');
          setWalkFrame(0);
          setStepCounter(0);
          setIsInterpolating(false);
          setIsTurning(false);
          setWalkPath([]);
          setTargetPosition(null);
          return;
        }
        
        // Continue to next tile with updated position
        setPlayer(prevPlayer => {
          // Use the updated position for the next movement
          // Use requestAnimationFrame instead of setTimeout to prevent stack overflow
          requestAnimationFrame(() => {
            if (remainingPath.length > 0) {
              moveAlongPath(remainingPath, recursionDepth + 1);
            }
          });
          return prevPlayer;
        });
      }
    };
    
    // Start smooth gliding animation
    requestAnimationFrame(animateGliding);
  };

  // Remove conflicting animation system - use the existing one in moveAlongPath

  const handleEmote = (emote: 'wave' | 'dance' | 'sit') => {
    setPlayerAnimation(emote === 'wave' ? 'waving' : emote === 'dance' ? 'dancing' : 'sitting');
    setShowEmotes(false);
    
    // Enhanced emote animation with better frame management
    setWalkFrame(0);
    setStepCounter(0);
    
    // Set emote bubble with enhanced styling
    const emoteEmoji = emote === 'wave' ? '👋' : emote === 'dance' ? '💃' : '🧘';
    
    // Add emote bubble to unified array
    const newEmoteBubble = {
      id: Date.now().toString(),
      text: emoteEmoji,
      timestamp: Date.now(),
      type: 'emote' as const
    };
    
    setPlayerBubbles(prev => [...prev, newEmoteBubble]);
    
    // Send to multiplayer if connected
    if (isConnected && multiplayerRoom) {
      sendChatMessage(emoteEmoji, 'emote');
    }
    
    // Remove emote bubble after 5 seconds
    setTimeout(() => {
      setPlayerBubbles(prev => prev.filter(bubble => bubble.id !== newEmoteBubble.id));
    }, 5000);
    
    // Enhanced emote duration with better timing
    setTimeout(() => {
      setPlayerAnimation('idle');
      setWalkFrame(0);
    }, 3000) as any;
  };


  const MAX_CHAT_LENGTH = 50; // Maximum characters for chat messages

  const handleSendChat = () => {
    if (chatInput.trim()) {
      const trimmedText = chatInput.trim();
      let newBubble;
      
      // Check character limit
      if (trimmedText.length > MAX_CHAT_LENGTH) {
        // Truncate text if too long
        const truncatedText = trimmedText.substring(0, MAX_CHAT_LENGTH) + '...';
        newBubble = {
          id: Date.now().toString(),
          text: truncatedText,
          timestamp: Date.now()
        };
      } else {
        newBubble = {
          id: Date.now().toString(),
          text: trimmedText,
          timestamp: Date.now()
        };
      }
      
      // Add new bubble to the array
      setPlayerBubbles(prev => [...prev, { ...newBubble, type: 'chat' }]);
      
      // Send to multiplayer if connected
      if (isConnected && multiplayerRoom) {
        sendChatMessage(trimmedText, 'chat');
      }
      
      // Clear input
      setChatInput('');
      
      // Blur the hidden input to dismiss keyboard
      hiddenInputRef.current?.blur();
      
      // Remove this bubble after 5 seconds
      setTimeout(() => {
        setPlayerBubbles(prev => prev.filter(bubble => bubble.id !== newBubble.id));
      }, 5000);
    }
  };

  // Animation speed controls
  const adjustAnimationSpeed = (speed: number) => {
    setAnimationSpeed(Math.max(0.5, Math.min(2.0, speed))); // Clamp between 0.5x and 2.0x
  };

  const handleSpriteSelect = async (spriteNumber: number) => {
    setSelectedSprite(spriteNumber);
    setShowSpriteSelector(false);
    // Trigger frame change when sprite changes
    setWalkFrame(0); // Reset to idle frame
    setStepCounter(0); // Reset step counter
    setPlayerAnimation('idle'); // Force idle animation
    setCurrentSpriteFrame(0); // Reset sprite frame
    
    // Save sprite preference to database
    await authService.saveSelectedSprite(spriteNumber);
    
    // Update multiplayer sprite so others can see it
    if (isConnected) {
      updatePlayerSprite(spriteNumber);
    }
  };

  // Zoom is handled by ScrollView properties


  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        playerId: 'me',
        playerName: 'You',
        message: newMessage.trim(),
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };


  const renderPlayer = (player: Player, isCurrentPlayer: boolean = false) => {
    // Use enhanced player state for current player
    const currentPlayer = isCurrentPlayer ? player : player;
    const getPlayerSprite = () => {
      // If this is the local player, render from spritesheet
      if (isCurrentPlayer) {
        // Get frame dimensions for current sprite
        const frameSize = SPRITE_FRAME_SIZES[selectedSprite as keyof typeof SPRITE_FRAME_SIZES] || { width: 64, height: 64 };
        const maxWalkFrames = SPRITE_WALK_FRAMES[selectedSprite as keyof typeof SPRITE_WALK_FRAMES] || 4;
        
        // Calculate scale based on tile size and frame size
        const spriteScale = (TILE_SIZE * 2.5) / frameSize.height; // Scale to fit in container
        
        // Direction mapping (all sprites use same direction order)
        const directionMap = { 'down': 0, 'left': 1, 'right': 2, 'up': 3 };
        const rowIndex = directionMap[getCurrentDirection()];
        
        // Enhanced frame calculation with better walking animation
        let colIndex = 0;
        if (playerAnimation === 'walking' && isMoving) {
          // Walking frames: cycle through frames 1, 2, 3, 4 for smooth walking
          const safeWalkFrame = walkFrame % maxWalkFrames;
          colIndex = safeWalkFrame + 1; // +1 because frame 0 is idle
          
          // Ensure we don't exceed the sprite sheet columns
          colIndex = Math.min(colIndex, SPRITE_COLS - 1);
        } else if (playerAnimation === 'walking' && !isMoving) {
          // Walking animation but not moving (turning)
          colIndex = 1; // First walking frame for turning
        } else {
          colIndex = 0; // Idle frame
        }

        // Calculate translation to show the correct frame
        // Ensure colIndex is within valid range (0 to SPRITE_COLS-1)
        const safeColIndex = Math.min(Math.max(colIndex, 0), SPRITE_COLS - 1);
        let translateX = -safeColIndex * frameSize.width * spriteScale;
        let translateY = -rowIndex * frameSize.height * spriteScale;
        
        // Special handling for sprite2 - exact specifications
        if (selectedSprite === 2) {
          // Sprite2 specs: 32x48 pixels per frame, 4x4 grid, no margins or spacing
          const sprite2FrameWidth = 32;  // frameWidth=32
          const sprite2FrameHeight = 48; // frameHeight=48
          const sprite2Cols = 4;         // cols=4
          const sprite2Rows = 4;         // rows=4
          
          // Translation for exact frame slicing
          translateX = -safeColIndex * sprite2FrameWidth * spriteScale;
          translateY = -rowIndex * sprite2FrameHeight * spriteScale;
          
        }
        
        // Special handling for sprite3 - exact specifications
        if (selectedSprite === 3) {
          // Sprite3 specs: 32x48 pixels per frame, 4x4 grid, no margins or spacing
          const sprite3FrameWidth = 32;  // frameWidth=32
          const sprite3FrameHeight = 48; // frameHeight=48
          const sprite3Cols = 4;         // cols=4
          const sprite3Rows = 4;         // rows=4
          
          // Translation for exact frame slicing
          translateX = -safeColIndex * sprite3FrameWidth * spriteScale;
          translateY = -rowIndex * sprite3FrameHeight * spriteScale;
          
        }
        
        // Special handling for sprites 4, 5, 7, 8, 9 - exact specifications
        if ([4, 5, 7, 8, 9].includes(selectedSprite)) {
          // All these sprites use: 32x48 pixels per frame, 4x4 grid, no margins or spacing
          const spriteFrameWidth = 32;  // frameWidth=32
          const spriteFrameHeight = 48; // frameHeight=48
          const spriteCols = 4;         // cols=4
          const spriteRows = 4;         // rows=4
          
          // Translation for exact frame slicing
          translateX = -safeColIndex * spriteFrameWidth * spriteScale;
          translateY = -rowIndex * spriteFrameHeight * spriteScale;
          
        }

        // Calculate container size to show only ONE sprite frame
        let containerWidth = frameSize.width * spriteScale;
        let containerHeight = frameSize.height * spriteScale;
        
        // Special container sizing for sprite2 - exact 32x48 dimensions
        if (selectedSprite === 2) {
          // Container sized for exact sprite2 frame dimensions (32px x 48px)
          const sprite2FrameWidth = 32;  // frameWidth=32
          const sprite2FrameHeight = 48; // frameHeight=48
          containerWidth = sprite2FrameWidth * spriteScale;
          containerHeight = sprite2FrameHeight * spriteScale;
        }
        
        // Special container sizing for sprite3 - exact 32x48 dimensions
        if (selectedSprite === 3) {
          // Container sized for exact sprite3 frame dimensions (32px x 48px)
          const sprite3FrameWidth = 32;  // frameWidth=32
          const sprite3FrameHeight = 48; // frameHeight=48
          containerWidth = sprite3FrameWidth * spriteScale;
          containerHeight = sprite3FrameHeight * spriteScale;
        }
        
        // Special container sizing for sprites 4, 5, 7, 8, 9 - exact 32x48 dimensions
        if ([4, 5, 7, 8, 9].includes(selectedSprite)) {
          // Container sized for exact frame dimensions (32px x 48px)
          const spriteFrameWidth = 32;  // frameWidth=32
          const spriteFrameHeight = 48; // frameHeight=48
          containerWidth = spriteFrameWidth * spriteScale;
          containerHeight = spriteFrameHeight * spriteScale;
        }

        return (
          <View 
            key={`sprite-${selectedSprite}`}
            style={[styles.spriteContainer, { 
            width: containerWidth, 
            height: containerHeight,
            overflow: 'hidden', // Ensure only one sprite is visible
            }]}
          >
            <Image
              key={`sprite-image-${selectedSprite}`}
              source={spriteMap[selectedSprite as keyof typeof spriteMap]}
              style={[
                styles.spriteImage,
                {
                  width: SPRITE_COLS * frameSize.width * spriteScale,
                  height: SPRITE_ROWS * frameSize.height * spriteScale,
                  transform: [
                    { translateX },
                    { translateY },
                  ],
                },
              ]}
              resizeMode="cover"
            />
          </View>
        );
      }

      // NPCs: fallback emoji-based sprite
      const getCharacterEmoji = () => {
        if (player.animation === 'dancing') return '💃';
        if (player.animation === 'waving') return '👋';
        if (player.animation === 'sitting') return '🧘';
        if (player.animation === 'walking') {
          const walkFrames = ['🚶', '🏃', '🚶', '🏃'];
          return walkFrames[walkFrame] || '🚶';
        }
        return '🧑'; // Idle
      };

      return (
        <Animated.View style={[
          styles.playerSprite,
          { 
            transform: [{ scale: bounceAnimation }]
          }
        ]}>
          <View style={styles.pixelCharacter}>
            <Text style={styles.characterEmoji}>
              {getCharacterEmoji()}
            </Text>
          </View>
        </Animated.View>
      );
    };

    // Safety check to prevent division by zero
    const safeMapWidth = mapSize.width || WORLD_WIDTH * TILE_SIZE;
    const safeMapHeight = mapSize.height || WORLD_HEIGHT * TILE_SIZE;
    
    // Use smooth pixel positioning for gliding movement
    let pixelX, pixelY;
    
    if (isCurrentPlayer && player.pos) {
      // Use exact pixel coordinates for smooth gliding
      pixelX = (player.pos.x * safeMapWidth) / (WORLD_WIDTH * TILE_SIZE);
      pixelY = (player.pos.y * safeMapHeight) / (WORLD_HEIGHT * TILE_SIZE);
    } else {
      // Use tile-based positioning for other players
      pixelX = (player.tileX * safeMapWidth) / WORLD_WIDTH;
      pixelY = (player.tileY * safeMapHeight) / WORLD_HEIGHT;
    }
    
    // Adjust Y position for current player to show legs properly
    if (isCurrentPlayer) {
      const frameSize = SPRITE_FRAME_SIZES[selectedSprite as keyof typeof SPRITE_FRAME_SIZES] || { width: 64, height: 64 };
      const spriteScale = (TILE_SIZE * 2.5) / frameSize.height;
      pixelY = pixelY - frameSize.height * spriteScale * 0.2; // Move player up to show legs
    }

    // Calculate container size for current player
    let containerSize = TILE_SIZE * 2.5; // Default size
    if (isCurrentPlayer) {
      const frameSize = SPRITE_FRAME_SIZES[selectedSprite as keyof typeof SPRITE_FRAME_SIZES] || { width: 64, height: 64 };
      const spriteScale = (TILE_SIZE * 2.5) / frameSize.height;
      // Container size matches single sprite frame
      containerSize = Math.max(frameSize.width * spriteScale, frameSize.height * spriteScale);
    }

    return (
      <View
        key={player.id}
        style={[
          styles.playerContainer,
          {
            left: pixelX,
            top: pixelY,
            width: containerSize,
            height: containerSize,
          }
        ]}
      >
        {getPlayerSprite()}
        <Text style={styles.playerName}>{player.name}</Text>
        
        {/* Chat bubble */}
        {player.chatBubble && (
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>
              {player.chatBubble}
            </Text>
          </View>
        )}
        
        {/* Emote bubble */}
        {(player.animation === 'waving' && !player.chatBubble && !isCurrentPlayer) && (
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>👋</Text>
          </View>
        )}
        {(player.animation === 'dancing' && !player.chatBubble && !isCurrentPlayer) && (
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>💃</Text>
          </View>
        )}
        {(player.animation === 'sitting' && !player.chatBubble && !isCurrentPlayer) && (
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>🧘</Text>
          </View>
        )}
        
        {/* Current player emote bubble */}
        {isCurrentPlayer && playerEmoteBubble && (
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>{playerEmoteBubble}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderRoom = () => {
    // Determine content dimensions based on room
    const contentWidth = 2048;
    const contentHeight = currentRoom.id === 'arcade' ? 3072 : 2048;
    
    return (
      <View style={styles.roomWrapper}>
        <View style={{ 
          flex: 1, 
          overflow: 'hidden',
          width: '100%',
          height: '100%'
        }}>
          <ScrollView 
            ref={scrollViewRef}
            style={[styles.roomScroll, { 
              maxWidth: contentWidth,
              maxHeight: '100%'
            }]}
            contentContainerStyle={[styles.roomContent, { 
              backgroundColor: currentRoom.background || '#87CEEB', 
              width: contentWidth, 
              height: contentHeight,
              maxWidth: contentWidth,
              maxHeight: contentHeight
            }]}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            bounces={false}
            bouncesZoom={false}
            alwaysBounceVertical={false}
            alwaysBounceHorizontal={false}
            overScrollMode="never"
            minimumZoomScale={zoomLimits.min}
            maximumZoomScale={zoomLimits.max}
            pinchGestureEnabled={true}
            scrollEnabled={true}
            directionalLockEnabled={false}
            contentOffset={{ x: 0, y: 0 }}
            zoomScale={currentZoom}
            onScroll={(event) => {
              const zoomLevel = event.nativeEvent.zoomScale || 1.0;
              setCurrentZoom(zoomLevel);
            }}
          >
          {/* 4-quadrant system for Sunny Park */}
          {currentRoom.id === 'park' ? (
            <View style={[styles.quadrantContainer, { width: contentWidth, height: contentHeight }]}>
              {/* Top Left */}
              <Image
                source={require('../../assets/images/top_left.png')}
                style={[styles.quadrantImage, { position: 'absolute', top: 0, left: 0 }]}
                resizeMode="cover"
              />
              {/* Top Right */}
              <Image
                source={require('../../assets/images/top_right.png')}
                style={[styles.quadrantImage, { position: 'absolute', top: 0, right: 0 }]}
                resizeMode="cover"
              />
              {/* Bottom Left */}
              <Image
                source={require('../../assets/images/bottom_left.png')}
                style={[styles.quadrantImage, { position: 'absolute', bottom: 0, left: 0 }]}
                resizeMode="cover"
              />
              {/* Bottom Right */}
              <Image
                source={require('../../assets/images/bottom_right.png')}
                style={[styles.quadrantImage, { position: 'absolute', bottom: 0, right: 0 }]}
                resizeMode="cover"
              />
            </View>
          ) : currentRoom.id === 'arcade' ? (
            <View style={[styles.quadrantContainer, { width: contentWidth, height: contentHeight }]}>
              {/* Chilly Rooftop - 1024x1536 image scaled 2x */}
              <Image
                source={require('../../assets/images/big_rooftop.png')}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: contentWidth,
                  height: contentHeight
                }}
                resizeMode="cover"
              />
            </View>
          ) : currentRoom.id === 'cafe' ? (
            <View style={[styles.quadrantContainer, { width: contentWidth, height: contentHeight }]}>
              {/* Cozy Cafe */}
              <Image
                source={require('../../assets/images/cafe.png')}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: contentWidth,
                  height: contentHeight
                }}
                resizeMode="cover"
              />
            </View>
          ) : (
            <View style={{
              width: contentWidth,
              height: contentHeight,
              backgroundColor: '#87CEEB',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Text style={{ fontSize: 24, color: 'white' }}>
                OTHER ROOM
              </Text>
            </View>
          )}

          {/* Efficient touch system - single touchable area */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: contentWidth,
              height: contentHeight,
              backgroundColor: 'transparent',
              zIndex: 10
            }}
            onPress={(event) => {
              const { locationX, locationY } = event.nativeEvent;
              
              // Convert pixel coordinates to tile coordinates using actual room dimensions
              const roomHeight = currentRoom.tiles.length;
              const roomWidth = currentRoom.tiles[0]?.length || 0;
              
              const tileX = Math.floor((locationX * roomWidth) / contentWidth);
              const tileY = Math.floor((locationY * roomHeight) / contentHeight);
              
              // Call handleTileClick with calculated coordinates
              handleTileClick(tileX, tileY);
            }}
            activeOpacity={0.7}
          />

          {/* Current Player sprite with animation */}
          <View
            style={[
              {
                // All sprites centered at 64×64 container
                left: player.pos.x - 32,  // 64/2 = 32
                top: player.pos.y - 32,   // 64/2 = 32
                width: 64,   // Same for all sprites
                height: 64,  // Same for all sprites
              }
            ]}
          >
            <View style={{
              // Dynamic width based on sprite type to show only ONE frame
              width: [2, 3, 4, 5, 7, 8, 9].includes(selectedSprite) 
                ? (32 * 64) / 48  // 42.67px - exact width of ONE scaled frame
                : 64,
              height: 64,
              overflow: 'hidden', // Critical: clips to show only ONE frame
              justifyContent: 'center',
              alignItems: 'center',
              transform: [
                // Only flip for sprites that don't have a dedicated left animation (sprite1, sprite6)
                { scaleX: (getCurrentDirection() === 'left' && ![2, 3, 4, 5, 7, 8, 9].includes(selectedSprite)) ? -1 : 1 }
              ]
            }}>
              {/* Debug UI removed for clean appearance */}
              
              {/* Real player sprite with frame animation - scaled to fit 64×64 */}
              <Image
                key={`current-player-sprite-${selectedSprite}`}
                source={spriteMap[selectedSprite as keyof typeof spriteMap]}
                style={{
                  // Scale entire sprite sheet proportionally
                  // For 32×48 sprites: scale to match 64px height (48 * 1.333 = 64)
                  width: [2, 3, 4, 5, 7, 8, 9].includes(selectedSprite) 
                    ? (128 * 64) / 48  // 128 * 1.333 = ~170.67 (full sheet width)
                    : 256,  // (64*4)*1
                  height: [2, 3, 4, 5, 7, 8, 9].includes(selectedSprite) 
                    ? (192 * 64) / 48  // 192 * 1.333 = 256 (full sheet height)
                    : 256, // (64*4)*1
                  left: [2, 3, 4, 5, 7, 8, 9].includes(selectedSprite) 
                    ? -currentSpriteFrame * ((32 * 64) / 48)   // 32 * 1.333 = ~42.67 per frame
                    : -currentSpriteFrame * 64,  // 64px per frame
                  top: [2, 3, 4, 5, 7, 8, 9].includes(selectedSprite)
                    ? -getDirectionRow(getCurrentDirection()) * 64  // Exactly 64px per row
                    : -getDirectionRow(getCurrentDirection()) * 64,  // 64px per row
                position: 'absolute',
                }}
                resizeMode="stretch" // Use stretch for pixel-perfect scaling, no smoothing
              />
            </View>
            
            {/* Player name */}
            <Text style={styles.playerName}>{user?.full_name || 'You'}</Text>
            
            {/* Unified bubbles - stacked upward */}
            {playerBubbles.map((bubble, index) => (
              <View 
                key={bubble.id}
                style={[
                  styles.speechBubble,
                  bubble.type === 'emote' && styles.emoteBubble,
                  {
                    top: -70 - (index * 40), // Stack upward, 40px spacing between bubbles, start higher
                    zIndex: 1000 - index, // Newer bubbles on top
                  }
                ]}
              >
                <Text style={[
                  styles.speechText,
                  bubble.type === 'emote' && styles.emoteBubbleText
                ]}>
                  {bubble.text}
              </Text>
              </View>
            ))}
            
          </View>

          {/* Other Players from Multiplayer */}
          {hasJoinedRoom && otherPlayers.map((otherPlayer, index) => {
            // Get animation state with smooth interpolated position
            const playerState = otherPlayersState[otherPlayer.id];
            
            if (!playerState) return null; // Skip if not initialized yet
            
            // Use smooth interpolated position (like current player's gliding)
            const otherPlayerX = playerState.currentPos.x;
            const otherPlayerY = playerState.currentPos.y;
            
            // Get other player's sprite (default to 1 if not set)
            const otherPlayerSprite = otherPlayer.sprite || 1;
            const is32x48Sprite = [2, 3, 4, 5, 7, 8, 9].includes(otherPlayerSprite);
            
            return (
              <View
                key={otherPlayer.id}
                style={[
                  {
                position: 'absolute',
                    left: otherPlayerX - 30,
                    top: otherPlayerY - 30,
                    width: 60,
                    height: 60,
                    zIndex: 10,
                  }
                ]}
              >
                <View style={{
                  width: is32x48Sprite ? (32 * 64) / 48 : 64, // Match current player container width
                  height: 64,
                  overflow: 'hidden',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transform: [
                    // Only flip for sprites without dedicated left animation
                    { scaleX: (otherPlayer.direction === 'left' && !is32x48Sprite) ? -1 : 1 }
                  ]
                }}>
                  {/* Real player sprite with frame animation (same as current player) */}
              <Image
                    key={`other-player-sprite-${otherPlayer.id}-${otherPlayerSprite}`}
                    source={spriteMap[otherPlayerSprite as keyof typeof spriteMap]}
                style={{
                      width: is32x48Sprite ? (128 * 64) / 48 : 256,
                      height: is32x48Sprite ? (192 * 64) / 48 : 256,
                      left: is32x48Sprite 
                        ? -playerState.frame * ((32 * 64) / 48)
                        : -playerState.frame * 64,
                      top: is32x48Sprite
                        ? -getDirectionRow(otherPlayer.direction) * 64
                        : -getDirectionRow(otherPlayer.direction) * 64,
                  position: 'absolute',
                }}
                    resizeMode="stretch"
              />
            </View>
                
                {/* Other player name */}
                <Text style={styles.playerName}>{otherPlayer.name}</Text>
                
                {/* Other player chat bubbles */}
                {playerChatBubbles[otherPlayer.id] ? (
                  <View style={[
                    styles.speechBubble,
                    playerChatBubbles[otherPlayer.id].type === 'emote' && styles.emoteBubble
                  ]}>
                    <Text style={[
                      styles.speechText,
                      playerChatBubbles[otherPlayer.id].type === 'emote' && styles.emoteBubbleText
                    ]}>
                      {playerChatBubbles[otherPlayer.id].text}
                    </Text>
          </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
        </View>
      </View>
    );
  };

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? '#000000' : '#FFFFFF',
    },
    backgroundImage: {
      backgroundColor: isDark ? 'transparent' : 'rgba(255, 255, 255, 0.9)',
    },
    gradient: {
      backgroundColor: isDark ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
    },
    gradientColors: isDark 
      ? ['rgba(20, 20, 20, 0.9)', 'rgba(30, 30, 30, 0.8)', 'rgba(25, 25, 25, 0.85)', 'rgba(20, 20, 20, 0.9)']
      : ['rgba(20, 20, 20, 0.9)', 'rgba(30, 30, 30, 0.8)', 'rgba(25, 25, 25, 0.85)', 'rgba(20, 20, 20, 0.9)'],
    text: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    headerText: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    languageText: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <ImageBackground 
        source={require('../../assets/images/wall.jpg')} 
        style={[styles.backgroundImage, dynamicStyles.backgroundImage]}
        resizeMode="cover"
      >
        <LinearGradient
          colors={dynamicStyles.gradientColors as any}
          style={[styles.gradient, dynamicStyles.gradient]}
        >
          {/* Custom Navigation Bar */}
          {/* <View style={styles.customNavigationBar}>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => router.push('/(tabs)/search')}
            >
              <Search size={32} color="#6B7280" strokeWidth={2} style={{ opacity: 0.6 }} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => router.push('/(tabs)/notes')}
            >
              <FileText size={32} color="#6B7280" strokeWidth={2} style={{ opacity: 0.6 }} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => router.push('/(tabs)/home')}
            >
              <Home size={32} color="#6B7280" strokeWidth={2} style={{ opacity: 0.6 }} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.navButton, styles.navButtonActive]}
            >
              <Gamepad2 size={32} color="#FF9500" strokeWidth={2.5} style={styles.navIconGlow} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <User size={32} color="#6B7280" strokeWidth={2} style={{ opacity: 0.6 }} />
            </TouchableOpacity>
          </View> */}

          {/* Header - Same as Tutor Page */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {/* Logo removed */}
            </View>
            <View style={styles.headerRight}>
              {/* Current Room Indicator */}
              <View style={styles.currentRoomIndicator}>
                <Globe size={16} color="#58CC02" />
                <Text style={styles.currentRoomText}>
                  {currentLanguage === 'en' ? '🇺🇸 English Room' : '🇲🇾 Malay Room'}
                  </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.settingsButton}
                onPress={() => setShowSettingsMenu(true)}
              >
                <Settings size={20} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.exitButton}
                onPress={async () => {
                  // Leave the room
                  await leaveRoom();
                  setHasJoinedRoom(false);
                  // Navigate to community tab
                  router.push('/(tabs)/community');
                }}
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Game Area */}
          <View style={styles.gameContainer}>

            {/* Room Selector - Only show after joining */}
            {hasJoinedRoom && (
              <View style={styles.roomSelector}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {sampleRooms.map((room) => {
                    const IconComponent = room.icon;
                    const isActive = currentRoom.id === room.id;
                    return (
                      <TouchableOpacity
                        key={room.id}
                        style={[styles.roomButtonWrapper, isActive && styles.roomButtonWrapperActive]}
                        onPress={() => changeRoom(room)}
                        activeOpacity={0.9}
                      >
                      <LinearGradient
                        colors={isActive ? ['#58CC02', '#4CAF00'] : ['#FFFFFF', '#F5F5F5']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.roomButton}
                      >
                        <View style={styles.roomButtonGloss} />
                        <View style={styles.roomButtonContent}>
                          <View style={[
                            styles.roomIconBadge,
                            isActive && { backgroundColor: 'rgba(255,255,255,0.3)', borderColor: '#FFFFFF' },
                            !isActive && { backgroundColor: '#58CC02', borderColor: '#4CAF00' }
                          ]}>
                            <IconComponent size={16} color="#FFFFFF" />
                          </View>
                          <Text style={[styles.roomButtonLabel, isActive && styles.roomButtonLabelActive]}>
                            {room.name}
                          </Text>
                          <View style={[
                            styles.roomPlayerCountBadge,
                            isActive && { backgroundColor: 'rgba(255,255,255,0.3)', borderColor: '#FFFFFF' },
                            !isActive && { backgroundColor: '#58CC02', borderColor: '#4CAF00' }
                          ]}>
                            <Users size={10} color="#FFFFFF" />
                            <Text style={styles.roomPlayerCountText}>{room.players.length}</Text>
                          </View>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
            )}

            {/* Game World */}
            <View 
              style={styles.gameWorld}
              onLayout={(event) => {
                const { width, height } = event.nativeEvent.layout;
                setContainerDimensions({ width, height });
              }}
            >
              {renderRoom()}
            </View>

            {/* Multiplayer Room Selection */}
            {showRoomSelection && (
              <TouchableOpacity 
                style={styles.roomSelectionOverlay}
                activeOpacity={1}
                onPress={(e) => {
                  // Prevent clicks from going through to the background
                  e.stopPropagation();
                }}
              >
                <TouchableOpacity 
                  style={styles.roomSelectionContainer}
                  activeOpacity={1}
                  onPress={(e) => e.stopPropagation()}
                >
                  <View style={styles.roomSelectionHeader}>
                    <Text style={styles.roomSelectionTitle}>
                      {hasJoinedRoom ? '🚪 Change Room' : 'Welcome to Lepak! 🎮'}
                    </Text>
                    {hasJoinedRoom && (
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setShowRoomSelection(false)}
                      >
                        <Text style={styles.closeButtonText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <View style={styles.languageRoomSelector}>
                    <Text style={styles.languageRoomTitle}>Choose your language room:</Text>
                    
                    <TouchableOpacity
                      style={[
                        styles.languageRoomOption,
                        selectedLanguageRoom === 'en' && styles.languageRoomOptionSelected
                      ]}
                      onPress={() => {
                        setSelectedLanguageRoom('en');
                        setCurrentLanguage('en');
                      }}
                    >
                      <Text style={styles.languageRoomText}>🇺🇸 English Room</Text>
                      <Text style={styles.languageRoomSubtext}>Chat and play in English</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.languageRoomOption,
                        selectedLanguageRoom === 'ms' && styles.languageRoomOptionSelected
                      ]}
                      onPress={() => {
                        setSelectedLanguageRoom('ms');
                        setCurrentLanguage('ms');
                      }}
                    >
                      <Text style={styles.languageRoomText}>🇲🇾 Malay Room</Text>
                      <Text style={styles.languageRoomSubtext}>Chat and play in Malay</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Info Footer */}
                  <View style={styles.roomSelectionFooter}>
                    <Text style={styles.roomSelectionFooterText}>
                      💡 Meet other students and chat in real-time!
                    </Text>
                  </View>

                  {/* Continue Button */}
                  <TouchableOpacity
                    style={[
                      styles.joinRoomButton,
                      !selectedLanguageRoom && styles.joinRoomButtonDisabled
                    ]}
                    disabled={!selectedLanguageRoom}
                    onPress={async () => {
                      if (!selectedLanguageRoom) return;
                      
                      // Join directly with default room (Sunny Park)
                      const defaultRoom = sampleRooms[0]; // Sunny Park
                      changeRoom(defaultRoom);
                            
                            // Join the room with selected language
                      const roomId = `${selectedLanguageRoom === 'en' ? 'english' : 'malay'}_room_${defaultRoom.theme}`;
                            const success = await joinRoom(roomId);
                            if (success) {
                              setHasJoinedRoom(true);
                        setShowRoomSelection(false);
                      }
                    }}
                  >
                    <Text style={styles.joinRoomButtonText}>
                      {!selectedLanguageRoom 
                        ? 'Select a language first' 
                        : '🎮 Enter Lepak World'}
                          </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </TouchableOpacity>
            )}

            {/* Map Selection Modal - REMOVED: Users now go directly to Sunny Park after language selection */}

            {/* Settings Menu Modal */}
            {showSettingsMenu && (
              <View style={styles.roomSelectionOverlay}>
                <View style={styles.roomSelectionContainer}>
                  <View style={styles.roomSelectionHeader}>
                    <Text style={styles.roomSelectionTitle}>⚙️ Settings</Text>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setShowSettingsMenu(false)}
                    >
                      <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.settingsMenuContent}>
                    {/* Change Character */}
                    <TouchableOpacity
                      style={styles.settingsMenuItem}
                      onPress={() => {
                        setShowSettingsMenu(false);
                        setShowSpriteSelector(true);
                      }}
                    >
                      <View style={styles.settingsMenuIcon}>
                        <Text style={styles.settingsMenuEmoji}>👤</Text>
                      </View>
                      <View style={styles.settingsMenuTextContainer}>
                        <Text style={styles.settingsMenuItemText}>Change Character</Text>
                        <Text style={styles.settingsMenuItemSubtext}>Select a different sprite</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Change Room */}
                    <TouchableOpacity
                      style={styles.settingsMenuItem}
                      onPress={() => {
                        setShowSettingsMenu(false);
                        // Reset selected language to allow re-selection
                        setSelectedLanguageRoom(null);
                        setShowRoomSelection(true);
                      }}
                    >
                      <View style={styles.settingsMenuIcon}>
                        <Text style={styles.settingsMenuEmoji}>🚪</Text>
                      </View>
                      <View style={styles.settingsMenuTextContainer}>
                        <Text style={styles.settingsMenuItemText}>Change Room</Text>
                        <Text style={styles.settingsMenuItemSubtext}>Switch language or map</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Hidden TextInput for keyboard accessory view */}
            <TextInput
              ref={hiddenInputRef}
              style={styles.hiddenInput}
              placeholder="Type a message..."
              value={chatInput}
              onChangeText={setChatInput}
              onSubmitEditing={handleSendChat}
              returnKeyType="send"
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              multiline={false}
              autoCorrect={false}
              autoCapitalize="sentences"
              inputAccessoryViewID="chatInputAccessory"
              maxLength={MAX_CHAT_LENGTH}
            />

            {/* Keyboard Accessory View */}
            <InputAccessoryView nativeID="chatInputAccessory">
              <View style={styles.keyboardAccessory}>
                <TextInput
                  style={styles.accessoryInput}
                  placeholder="Type a message..."
                  placeholderTextColor="#999999"
                  value={chatInput}
                  onChangeText={setChatInput}
                  onSubmitEditing={handleSendChat}
                  returnKeyType="send"
                  multiline={false}
                  autoCorrect={false}
                  autoCapitalize="sentences"
                  maxLength={MAX_CHAT_LENGTH}
                />
                <TouchableOpacity 
                  style={styles.accessorySendButton}
                  onPress={handleSendChat}
                >
                  <Text style={styles.accessorySendText}>Send</Text>
                </TouchableOpacity>
              </View>
            </InputAccessoryView>

            {/* Emote Panel */}
            {showEmotes && (
              <Animatable.View animation="fadeInUp" style={styles.emotePanel}>
                <TouchableOpacity 
                  style={styles.emoteButton}
                  onPress={() => handleEmote('wave')}
                >
                  <Text style={styles.emoteText}>👋</Text>
                  <Text style={styles.emoteLabel}>
                    {currentLanguage === 'ms' ? 'Lambaikan' : 'Wave'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.emoteButton}
                  onPress={() => handleEmote('dance')}
                >
                  <Text style={styles.emoteText}>💃</Text>
                  <Text style={styles.emoteLabel}>
                    {currentLanguage === 'ms' ? 'Menari' : 'Dance'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.emoteButton}
                  onPress={() => handleEmote('sit')}
                >
                  <Text style={styles.emoteText}>🪑</Text>
                  <Text style={styles.emoteLabel}>
                    {currentLanguage === 'ms' ? 'Duduk' : 'Sit'}
                  </Text>
                </TouchableOpacity>
              </Animatable.View>
            )}

            {/* Sprite Selector Popup */}
            {showSpriteSelector && (
              <Animatable.View animation="fadeIn" style={styles.spriteSelectorOverlay}>
                <Animatable.View animation="zoomIn" style={styles.spriteSelectorContainer}>
                  <View style={styles.spriteSelectorHeader}>
                    <Text style={styles.spriteSelectorTitle}>Choose Your Character</Text>
                    <TouchableOpacity 
                      style={styles.spriteSelectorClose}
                      onPress={() => setShowSpriteSelector(false)}
                    >
                      <Text style={styles.spriteSelectorCloseText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <ScrollView 
                    style={styles.spriteGrid}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.spriteGridContent}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((spriteNum) => (
                      <TouchableOpacity
                        key={spriteNum}
                        style={[
                          styles.spriteOption,
                          selectedSprite === spriteNum && styles.spriteOptionSelected
                        ]}
                        onPress={() => handleSpriteSelect(spriteNum)}
                      >
                        <View style={styles.spritePreview}>
                          <Image
                            source={spriteMap[spriteNum as keyof typeof spriteMap]}
                            style={styles.spritePreviewImage}
                            resizeMode="contain"
                          />
                        </View>
                        <Text style={styles.spriteOptionText}>Sprite {spriteNum}</Text>
                        {selectedSprite === spriteNum && (
                          <View style={styles.spriteSelectedBadge}>
                            <Text style={styles.spriteSelectedText}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </Animatable.View>
              </Animatable.View>
            )}

            {/* Chat Panel */}
            {showChat && (
              <Animatable.View animation="slideInUp" style={styles.chatPanel}>
                <View style={styles.chatHeader}>
                  <Text style={styles.chatTitle}>
                    {currentLanguage === 'ms' ? 'Chat' : 'Chat'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowChat(false)}>
                    <Text style={styles.chatClose}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.chatMessages}>
                  {multiplayerChatMessages.map((message) => (
                    <View key={message.id} style={styles.chatMessage}>
                      <Text style={styles.chatPlayerName}>{message.playerName}:</Text>
                      <Text style={styles.chatMessageText}>{message.message}</Text>
                    </View>
                  ))}
                </ScrollView>
                
                <View style={styles.chatInput}>
                  <TextInput
                    style={styles.chatInputField}
                    placeholder={currentLanguage === 'ms' ? 'Tulis mesej...' : 'Type a message...'}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    onSubmitEditing={sendMessage}
                  />
                  <TouchableOpacity style={styles.chatSendButton} onPress={sendMessage}>
                    <Text style={styles.chatSendText}>📤</Text>
                  </TouchableOpacity>
                </View>
              </Animatable.View>
            )}
          </View>

          {/* Game Chat Input - Outside game container (hidden during room selection) */}
          {!showRoomSelection && (
            <Animatable.View 
              animation="fadeInUp"
              duration={400}
              delay={200}
              style={styles.floatingChatContainer}
            >
              <Animatable.View 
                animation="pulse"
                iterationCount="infinite"
                duration={3000}
                style={styles.floatingChatWrapper}
              >
                <TouchableOpacity 
                  style={styles.floatingChatInputTouchable}
                  onPress={() => {
                    hiddenInputRef.current?.focus();
                  }}
                >
                  <Text style={[
                    styles.floatingChatInputText,
                    chatInput ? styles.floatingChatInputTextFilled : styles.floatingChatInputTextEmpty
                  ]}>
                    {chatInput || "Type a message..."}
                  </Text>
                  {chatInput && (
                    <Text style={styles.characterCount}>
                      {chatInput.length}/{MAX_CHAT_LENGTH}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.floatingEmoteButton}
                  onPress={() => setShowEmotes(!showEmotes)}
                >
                  <Smile size={18} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.floatingSendButton}
                  onPress={handleSendChat}
                >
                  <Text style={styles.floatingSendText}>SEND</Text>
                </TouchableOpacity>
              </Animatable.View>
            </Animatable.View>
          )}
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 5,
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  headerLogo: {
    width: 120,
    height: 40,
  },
  languageSwitch: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    padding: 1,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 2,
    gap: 4,
    minWidth: 35,
  },
  languageButtonActive: {
    backgroundColor: '#4A90E2',
    borderWidth: 1,
    borderColor: '#357ABD',
  },
  languageText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  languageTextActive: {
    color: '#FFFFFF',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#58CC02',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: '#4BA600',
    borderRightColor: '#4BA600',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  exitButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: '#E55555',
    borderRightColor: '#E55555',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginLeft: 10,
  },
  gameContainer: {
    flex: 1,
  },
  roomSelector: {
    marginBottom: 10,
  },
  roomButtonWrapper: {
    marginRight: 8,
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  roomButtonWrapperActive: {
    transform: [{ translateY: -1 }],
  },
  roomButton: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 80,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  roomButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  roomIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  roomButtonLabel: {
    flex: 1,
    color: '#333333',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  roomButtonLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  roomPlayerCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  roomPlayerCountText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  roomButtonGloss: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  gameWorld: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 600,
    maxHeight: height * 0.7, // Limit to 70% of screen height
  },
  roomWrapper: {
    flex: 1,
    position: 'relative',
  },
  roomContainer: {
    flex: 1,
    position: 'relative',
  },
  quadrantContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 2048,
    height: 2048,
    zIndex: 0,
  },
  quadrantImage: {
    width: 1024,
    height: 1024,
  },
  roomScroll: {
    flex: 1,
    zIndex: 1,
    maxHeight: '100%',
  },
  roomContent: {
    position: 'relative',
  },
  roomBackgroundImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  tile: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderWidth: 0.5,
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  decoration: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  decorationSprite: {
    fontSize: 24,
    textAlign: 'center',
  },
  playerContainer: {
    position: 'absolute',
    zIndex: 10,
    // Dynamic sizing will be applied based on sprite
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerSprite: {
    width: TILE_SIZE * 2.5,
    height: TILE_SIZE * 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spriteContainer: {
    // Dynamic sizing will be applied via inline styles
    overflow: 'hidden',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    position: 'relative',
  },
  spriteImage: {
    position: 'absolute',
  },
  spriteBackgroundMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'transparent',
    // This will help mask any background that might show through
    // The actual masking will be handled by the container's overflow: hidden
  },
  pixelCharacter: {
    width: TILE_SIZE * 2.5,
    height: TILE_SIZE * 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterEmoji: {
    fontSize: 60,
    textAlign: 'center',
  },
  playerName: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    fontSize: 8,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  speechBubble: {
    position: 'absolute',
    top: -50,
    left: -20,
    right: -20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 6,
    borderWidth: 2,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  speechText: {
    fontSize: 10,
    color: '#000000',
    textAlign: 'center',
    fontWeight: '600',
  },
  emoteBubble: {
    backgroundColor: '#FFE4B5',
    borderColor: '#FFA500',
  },
  emoteBubbleText: {
    fontSize: 16,
    fontWeight: '400',
  },
  instructionsContainer: {
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  instructionsText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  floatingChatContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    zIndex: 1001,
  },
  floatingChatWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#58CC02',
    shadowColor: '#58CC02',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  floatingChatInputTouchable: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    minHeight: 40,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  floatingChatInputText: {
    fontSize: 16,
    color: '#333333',
    textAlignVertical: 'center',
  },
  floatingChatInputTextEmpty: {
    color: '#999999',
  },
  floatingChatInputTextFilled: {
    color: '#333333',
    fontWeight: '500',
  },
  characterCount: {
    position: 'absolute',
    top: -15,
    right: 5,
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  floatingEmoteButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    pointerEvents: 'auto',
  },
  floatingSendButton: {
    backgroundColor: '#58CC02',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4CAF00',
    shadowColor: '#58CC02',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 40,
    pointerEvents: 'auto',
  },
  floatingSendText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
  hiddenInput: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    width: 1,
    height: 1,
    opacity: 0,
  },
  keyboardAccessory: {
    backgroundColor: '#F8F8F8',
    borderTopWidth: 0.5,
    borderTopColor: '#C6C6C6',
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  accessoryInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333333',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 8,
    maxHeight: 100,
  },
  accessorySendButton: {
    backgroundColor: '#58CC02',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 70,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4CAF00',
  },
  accessorySendText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  spriteSelectorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  spriteSelectorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#58CC02',
    shadowColor: '#58CC02',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  spriteSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 3,
    borderBottomColor: '#58CC02',
    backgroundColor: '#F5F5F5',
  },
  spriteSelectorTitle: {
    color: '#333333',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  spriteSelectorClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  spriteSelectorCloseText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '800',
  },
  spriteGrid: {
    maxHeight: 400,
  },
  spriteGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 15,
    gap: 10,
  },
  spriteOption: {
    width: 100,
    height: 120,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  spriteOptionSelected: {
    borderColor: '#58CC02',
    backgroundColor: '#E8F5E9',
    shadowColor: '#58CC02',
    shadowOpacity: 0.3,
  },
  spritePreview: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  spritePreviewImage: {
    width: 60,
    height: 60,
  },
  spriteOptionText: {
    color: '#333333',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  spriteSelectedBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#58CC02',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  spriteSelectedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#FF6B9D',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 3,
    borderColor: '#E91E63',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  emotePanel: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  emoteButton: {
    alignItems: 'center',
    padding: 8,
  },
  emoteText: {
    fontSize: 24,
    marginBottom: 4,
  },
  emoteLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  chatPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chatTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatClose: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatMessages: {
    flex: 1,
    marginBottom: 16,
  },
  chatMessage: {
    marginBottom: 8,
  },
  chatPlayerName: {
    color: '#4A90E2',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatMessageText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  chatInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatInputField: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 14,
  },
  chatSendButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatSendText: {
    fontSize: 16,
  },
  // Multiplayer styles
  roomSelectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  roomSelectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 3,
    borderColor: '#58CC02',
    shadowColor: '#58CC02',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  roomSelectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  roomSelectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#666666',
    fontSize: 18,
    fontWeight: 'bold',
  },
  roomList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  roomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  roomDetails: {
    fontSize: 12,
    color: '#888',
  },
  roomStatus: {
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  createRoomButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  createRoomButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createRoomForm: {
    gap: 15,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  formInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  themeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  themeOption: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  themeOptionSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  themeOptionText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  createButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Language room selector styles
  languageRoomSelector: {
    gap: 15,
    marginBottom: 20,
  },
  languageRoomTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 10,
  },
  languageRoomOption: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 20,
    borderWidth: 3,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  languageRoomOptionSelected: {
    backgroundColor: '#58CC02',
    borderColor: '#4CAF00',
  },
  languageRoomText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  languageRoomSubtext: {
    fontSize: 14,
    color: '#666666',
  },
  roomSelectionFooter: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#58CC02',
    gap: 10,
  },
  roomInfoInline: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  roomInfoText: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '600',
  },
  roomInfoDivider: {
    fontSize: 13,
    color: '#58CC02',
  },
  roomSelectionFooterText: {
    fontSize: 12,
    color: '#333333',
    textAlign: 'center',
    fontWeight: '600',
  },
  joinRoomButton: {
    marginTop: 20,
    backgroundColor: '#58CC02',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#4CAF00',
    shadowColor: '#58CC02',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  joinRoomButtonDisabled: {
    backgroundColor: '#E0E0E0',
    borderColor: '#CCCCCC',
    opacity: 0.6,
  },
  joinRoomButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  // Map selection styles
  mapSelectionContainer: {
    flexDirection: 'column',
    gap: 15,
    marginTop: 20,
  },
  mapOptionCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 20,
    borderWidth: 2,
    borderColor: '#333',
  },
  mapOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlayerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mapPlayerCountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  mapOptionName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  mapOptionDescription: {
    color: '#999',
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  mapOptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapOptionStatus: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  backToLanguageButton: {
    marginTop: 20,
    backgroundColor: '#444',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  backToLanguageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Current room indicator styles
  currentRoomIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#58CC02',
    marginRight: 10,
    gap: 6,
    shadowColor: '#58CC02',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  currentRoomText: {
    color: '#333333',
    fontSize: 12,
    fontWeight: '700',
  },
  // Settings menu styles
  settingsMenuContent: {
    gap: 12,
    marginTop: 20,
  },
  settingsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  settingsMenuItemDanger: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  settingsMenuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsMenuEmoji: {
    fontSize: 24,
  },
  settingsMenuTextContainer: {
    flex: 1,
  },
  settingsMenuItemText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  settingsMenuItemTextDanger: {
    color: '#FF6B6B',
  },
  settingsMenuItemSubtext: {
    color: '#666666',
    fontSize: 13,
  },
  // Debug zoom info styles
  debugZoomInfo: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 8,
    zIndex: 1000,
  },
  debugZoomText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  resetZoomButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  resetZoomText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  // Debug multiplayer info styles
  debugMultiplayerInfo: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 8,
    zIndex: 1000,
  },
  debugMultiplayerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Custom Navigation Bar - Matching HomeScreen tab bar
  customNavigationBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    elevation: 8,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    height: 70,
    paddingBottom: 15,
    paddingTop: 15,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    zIndex: 1000,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 12,
    padding: 8,
  },
  navButtonActive: {
    backgroundColor: '#FFF4E6',
    borderWidth: 2,
    borderColor: '#FF9500',
    borderRadius: 12,
  },
  navIconGlow: {
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
