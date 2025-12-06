import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAvatarStore, EmotionType, InteractionType } from '../stores/avatarStore';

// Optional sound import with fallback
let Sound: any = null;
let soundAvailable = false;

try {
  Sound = require('react-native-sound');
  // Enable playback in silence mode
  Sound.setCategory('Playback');
  soundAvailable = true;
} catch (error) {
  console.log('Sound not available, using visual feedback only');
  soundAvailable = false;
}

interface AvatarSoundSystemProps {
  enableSounds?: boolean;
  volume?: number;
}

export default function AvatarSoundSystem({
  enableSounds = true,
  volume = 0.7,
}: AvatarSoundSystemProps) {
  const { currentEmotion, lastInteraction, emotionIntensity } = useAvatarStore();
  const [sounds, setSounds] = useState<Record<string, any>>({});
  const lastPlayedSound = useRef<string>('');

  // Sound effects mapping
  const soundEffects = {
    // Emotion sounds
    happy: ['giggle1', 'giggle2', 'chuckle'],
    excited: ['squeal', 'cheer', 'excited_gasp'],
    surprised: ['gasp', 'surprise', 'oh'],
    sleepy: ['yawn', 'sleepy_sigh', 'tired_breath'],
    curious: ['hmm', 'curious_sound', 'question'],
    shy: ['shy_giggle', 'embarrassed', 'soft_laugh'],
    playful: ['playful_laugh', 'mischievous', 'fun_sound'],
    confused: ['confused_hmm', 'puzzled', 'thinking_sound'],
    sad: ['sad_sigh', 'whimper', 'disappointed'],
    'love-struck': ['love_sigh', 'heartbeat', 'romantic_sound'],
    thinking: ['thinking_hmm', 'concentration', 'focused_breath'],
    listening: ['attentive', 'listening_sound', 'focused'],
    talking: ['talking_sound', 'speech', 'voice'],
    
    // Interaction sounds
    pet: ['purr', 'happy_purr', 'content_sound'],
    tickle: ['tickle_laugh', 'giggle_fit', 'laughing'],
    'high-five': ['high_five', 'celebration', 'success'],
    tap: ['tap_sound', 'click', 'gentle_tap'],
    shake: ['surprised_gasp', 'shock', 'alarmed'],
    tilt: ['curious_sound', 'hmm', 'question'],
    voice: ['listening', 'attentive', 'focused'],
    'ambient-sound': ['aware', 'alert', 'noticing'],
    'time-based': ['time_sound', 'schedule', 'routine'],
    'battery-low': ['tired', 'low_energy', 'sleepy'],
    'app-usage': ['activity_sound', 'engagement', 'involvement'],
  };

  // Initialize sounds
  useEffect(() => {
    if (!enableSounds || !soundAvailable || !Sound) return;

    const initializeSounds = () => {
      const soundMap: Record<string, any> = {};
      
      // For demo purposes, we'll create placeholder sounds
      // In a real app, you'd load actual sound files
      Object.keys(soundEffects).forEach(key => {
        try {
          // Create a placeholder sound object
          // In production, you'd load actual audio files
          const sound = new Sound('placeholder.mp3', Sound.MAIN_BUNDLE, (error) => {
            if (error) {
              console.log('Sound not found, using placeholder');
            }
          });
          
          sound.setVolume(volume);
          soundMap[key] = sound;
        } catch (error) {
          console.log(`Failed to load sound for ${key}`);
          soundMap[key] = null;
        }
      });
      
      setSounds(soundMap);
    };

    initializeSounds();

    return () => {
      // Cleanup sounds
      Object.values(sounds).forEach(sound => {
        if (sound && sound.release) {
          sound.release();
        }
      });
    };
  }, [enableSounds, volume]);

  // Play emotion-based sounds
  useEffect(() => {
    if (!enableSounds || !soundAvailable || !sounds[currentEmotion]) return;

    const playEmotionSound = () => {
      const emotionSounds = soundEffects[currentEmotion];
      if (!emotionSounds || emotionSounds.length === 0) return;

      const randomSound = emotionSounds[Math.floor(Math.random() * emotionSounds.length)];
      const soundKey = `${currentEmotion}_${randomSound}`;
      
      // Avoid playing the same sound repeatedly
      if (soundKey === lastPlayedSound.current) return;
      
      lastPlayedSound.current = soundKey;
      
      const sound = sounds[currentEmotion];
      if (sound) {
        sound.stop(() => {
          sound.play((success) => {
            if (!success) {
              console.log('Failed to play emotion sound');
            }
          });
        });
      }
    };

    // Play sound with delay based on emotion intensity
    const delay = Math.max(200, 1000 - (emotionIntensity * 800));
    const timeout = setTimeout(playEmotionSound, delay);

    return () => clearTimeout(timeout);
  }, [currentEmotion, emotionIntensity, enableSounds, sounds]);

  // Play interaction-based sounds
  useEffect(() => {
    if (!enableSounds || !soundAvailable || !lastInteraction || !sounds[lastInteraction]) return;

    const playInteractionSound = () => {
      const interactionSounds = soundEffects[lastInteraction];
      if (!interactionSounds || interactionSounds.length === 0) return;

      const randomSound = interactionSounds[Math.floor(Math.random() * interactionSounds.length)];
      const soundKey = `${lastInteraction}_${randomSound}`;
      
      // Avoid playing the same sound repeatedly
      if (soundKey === lastPlayedSound.current) return;
      
      lastPlayedSound.current = soundKey;
      
      const sound = sounds[lastInteraction];
      if (sound) {
        sound.stop(() => {
          sound.play((success) => {
            if (!success) {
              console.log('Failed to play interaction sound');
            }
          });
        });
      }
    };

    // Play interaction sound immediately
    const timeout = setTimeout(playInteractionSound, 100);

    return () => clearTimeout(timeout);
  }, [lastInteraction, enableSounds, sounds]);

  // Ambient sound reactions
  useEffect(() => {
    if (!enableSounds || !soundAvailable) return;

    const playAmbientReaction = () => {
      // This would react to ambient noise levels
      // For now, we'll simulate occasional ambient reactions
      const shouldReact = Math.random() < 0.1; // 10% chance every 5 seconds
      
      if (shouldReact) {
        const sound = sounds['ambient-sound'];
        if (sound) {
          sound.stop(() => {
            sound.play((success) => {
              if (!success) {
                console.log('Failed to play ambient sound');
              }
            });
          });
        }
      }
    };

    const interval = setInterval(playAmbientReaction, 5000);

    return () => clearInterval(interval);
  }, [enableSounds, sounds]);

  // Idle sounds
  useEffect(() => {
    if (!enableSounds || !soundAvailable) return;

    const playIdleSound = () => {
      if (currentEmotion === 'neutral' || currentEmotion === 'thinking') {
        const idleSounds = ['breathing', 'soft_sigh', 'content_hum'];
        const randomSound = idleSounds[Math.floor(Math.random() * idleSounds.length)];
        
        // Very low probability for idle sounds
        if (Math.random() < 0.05) {
          const sound = sounds[currentEmotion];
          if (sound) {
            sound.setVolume(volume * 0.3); // Quieter for idle sounds
            sound.stop(() => {
              sound.play((success) => {
                if (!success) {
                  console.log('Failed to play idle sound');
                }
                sound.setVolume(volume); // Reset volume
              });
            });
          }
        }
      }
    };

    const interval = setInterval(playIdleSound, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [currentEmotion, enableSounds, sounds, volume]);

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
});
