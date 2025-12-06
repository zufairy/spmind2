import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type EmotionType = 
  | 'happy' 
  | 'excited' 
  | 'surprised' 
  | 'sleepy' 
  | 'curious' 
  | 'shy' 
  | 'playful' 
  | 'confused' 
  | 'sad' 
  | 'love-struck'
  | 'neutral'
  | 'thinking'
  | 'listening'
  | 'talking'
  | 'waiting';

export type InteractionType = 
  | 'pet'
  | 'tickle'
  | 'high-five'
  | 'tap'
  | 'drag'
  | 'shake'
  | 'tilt'
  | 'voice'
  | 'ambient-sound'
  | 'time-based'
  | 'battery-low'
  | 'app-usage';

export type PersonalityTrait = {
  shyness: number; // 0-1 (0 = outgoing, 1 = very shy)
  energy: number; // 0-1 (0 = calm, 1 = very energetic)
  playfulness: number; // 0-1 (0 = serious, 1 = very playful)
  curiosity: number; // 0-1 (0 = uninterested, 1 = very curious)
  affection: number; // 0-1 (0 = distant, 1 = very affectionate)
};

export type AvatarMemory = {
  favoriteInteractions: InteractionType[];
  leastFavoriteInteractions: InteractionType[];
  interactionCount: Record<InteractionType, number>;
  lastInteractionTime: Record<InteractionType, number>;
  moodHistory: EmotionType[];
  personalityAdaptations: Partial<PersonalityTrait>;
};

export type AvatarState = {
  // Core state
  currentEmotion: EmotionType;
  previousEmotion: EmotionType;
  emotionIntensity: number; // 0-1
  isAnimating: boolean;
  
  // Interaction state
  lastInteraction: InteractionType | null;
  interactionCooldown: number;
  touchPosition: { x: number; y: number } | null;
  
  // Personality
  personality: PersonalityTrait;
  memory: AvatarMemory;
  
  // Contextual awareness
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  batteryLevel: number;
  ambientNoiseLevel: number;
  appUsagePattern: 'learning' | 'playing' | 'reading' | 'idle';
  
  // Animation state
  eyePosition: { x: number; y: number };
  headTilt: number;
  bodyBounce: number;
  hairBounce: number;
  blushIntensity: number;
  
  // Customization
  size: number;
  hairColor: string;
  eyeColor: string;
  skinTone: string;
  accessories: string[];
  
  // Actions
  setEmotion: (emotion: EmotionType, intensity?: number) => void;
  handleInteraction: (interaction: InteractionType, position?: { x: number; y: number }) => void;
  updatePersonality: (trait: keyof PersonalityTrait, value: number) => void;
  updateContext: (context: Partial<Pick<AvatarState, 'timeOfDay' | 'batteryLevel' | 'ambientNoiseLevel' | 'appUsagePattern'>>) => void;
  updateEyePosition: (position: { x: number; y: number }) => void;
  resetToNeutral: () => void;
  addMemory: (interaction: InteractionType, emotion: EmotionType) => void;
  setHairColor: (color: string) => void;
  setEyeColor: (color: string) => void;
  setSkinTone: (color: string) => void;
  setAccessories: (accessories: string[]) => void;
};

const defaultPersonality: PersonalityTrait = {
  shyness: 0.3,
  energy: 0.7,
  playfulness: 0.8,
  curiosity: 0.6,
  affection: 0.7,
};

const defaultMemory: AvatarMemory = {
  favoriteInteractions: [],
  leastFavoriteInteractions: [],
  interactionCount: {} as Record<InteractionType, number>,
  lastInteractionTime: {} as Record<InteractionType, number>,
  moodHistory: [],
  personalityAdaptations: {},
};

export const useAvatarStore = create<AvatarState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentEmotion: 'neutral',
    previousEmotion: 'neutral',
    emotionIntensity: 0.5,
    isAnimating: false,
    
    lastInteraction: null,
    interactionCooldown: 0,
    touchPosition: null,
    
    personality: defaultPersonality,
    memory: defaultMemory,
    
    timeOfDay: 'afternoon',
    batteryLevel: 1,
    ambientNoiseLevel: 0,
    appUsagePattern: 'idle',
    
    eyePosition: { x: 0, y: 0 },
    headTilt: 0,
    bodyBounce: 0,
    hairBounce: 0,
    blushIntensity: 0,
    
    size: 1,
    hairColor: '#FFD700',
    eyeColor: '#4169E1',
    skinTone: '#FFE4B5',
    accessories: [],
    
    // Actions
    setEmotion: (emotion: EmotionType, intensity: number = 0.7) => {
      const state = get();
      set({
        previousEmotion: state.currentEmotion,
        currentEmotion: emotion,
        emotionIntensity: Math.max(0, Math.min(1, intensity)),
        isAnimating: true,
      });
      
      // Auto-reset animation state after transition
      setTimeout(() => {
        set({ isAnimating: false });
      }, 1000);
    },
    
    handleInteraction: (interaction: InteractionType, position?: { x: number; y: number }) => {
      const state = get();
      const now = Date.now();
      
      // Check cooldown
      if (now - (state.memory.lastInteractionTime[interaction] || 0) < 500) {
        return;
      }
      
      // Determine emotion based on interaction and personality
      let newEmotion: EmotionType = 'neutral';
      let intensity = 0.5;
      
      switch (interaction) {
        case 'pet':
          newEmotion = state.personality.affection > 0.5 ? 'love-struck' : 'happy';
          intensity = 0.8 + (state.personality.affection * 0.2);
          break;
        case 'tickle':
          newEmotion = state.personality.playfulness > 0.5 ? 'excited' : 'surprised';
          intensity = 0.9;
          break;
        case 'high-five':
          newEmotion = 'excited';
          intensity = 0.8;
          break;
        case 'tap':
          newEmotion = state.personality.energy > 0.5 ? 'playful' : 'curious';
          intensity = 0.6;
          break;
        case 'shake':
          newEmotion = 'surprised';
          intensity = 0.9;
          break;
        case 'tilt':
          newEmotion = 'curious';
          intensity = 0.7;
          break;
        case 'voice':
          newEmotion = 'listening';
          intensity = 0.6;
          break;
        case 'ambient-sound':
          newEmotion = state.ambientNoiseLevel > 0.7 ? 'surprised' : 'curious';
          intensity = Math.min(0.8, state.ambientNoiseLevel);
          break;
        case 'time-based':
          if (state.timeOfDay === 'night') {
            newEmotion = 'sleepy';
            intensity = 0.8;
          } else if (state.timeOfDay === 'morning') {
            newEmotion = 'excited';
            intensity = 0.7;
          }
          break;
        case 'battery-low':
          newEmotion = 'sleepy';
          intensity = 0.9;
          break;
        case 'app-usage':
          switch (state.appUsagePattern) {
            case 'playing':
              newEmotion = 'excited';
              intensity = 0.8;
              break;
            case 'learning':
              newEmotion = 'curious';
              intensity = 0.7;
              break;
            case 'reading':
              newEmotion = 'thinking';
              intensity = 0.6;
              break;
            default:
              newEmotion = 'neutral';
              intensity = 0.5;
          }
          break;
      }
      
      // Update memory
      const updatedMemory = {
        ...state.memory,
        interactionCount: {
          ...state.memory.interactionCount,
          [interaction]: (state.memory.interactionCount[interaction] || 0) + 1,
        },
        lastInteractionTime: {
          ...state.memory.lastInteractionTime,
          [interaction]: now,
        },
        moodHistory: [...state.memory.moodHistory.slice(-9), newEmotion],
      };
      
      set({
        lastInteraction: interaction,
        touchPosition: position || null,
        memory: updatedMemory,
      });
      
      // Set emotion with slight delay for natural feel
      setTimeout(() => {
        get().setEmotion(newEmotion, intensity);
      }, 100);
    },
    
  updatePersonality: (trait: keyof PersonalityTrait, value: number) => {
    const currentState = get();
    set({
      personality: {
        ...currentState.personality,
        [trait]: Math.max(0, Math.min(1, value)),
      },
    });
  },
    
    updateContext: (context) => {
      set(context);
    },
    
    updateEyePosition: (position: { x: number; y: number }) => {
      set({ eyePosition: position });
    },
    
    resetToNeutral: () => {
      set({
        currentEmotion: 'neutral',
        emotionIntensity: 0.5,
        isAnimating: false,
        headTilt: 0,
        bodyBounce: 0,
        hairBounce: 0,
        blushIntensity: 0,
      });
    },
    
    addMemory: (interaction: InteractionType, emotion: EmotionType) => {
      const state = get();
      const updatedMemory = {
        ...state.memory,
        moodHistory: [...state.memory.moodHistory.slice(-9), emotion],
      };
      set({ memory: updatedMemory });
    },
    
    setHairColor: (color: string) => {
      set({ hairColor: color });
    },
    
    setEyeColor: (color: string) => {
      set({ eyeColor: color });
    },
    
    setSkinTone: (color: string) => {
      set({ skinTone: color });
    },
    
    setAccessories: (accessories: string[]) => {
      set({ accessories });
    },
  }))
);
