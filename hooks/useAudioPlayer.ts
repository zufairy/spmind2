import { useState, useRef } from 'react';
import { Audio } from 'expo-av';

export interface AudioPlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  duration: number;
  position: number;
}

export function useAudioPlayer() {
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isLoading: false,
    duration: 0,
    position: 0,
  });

  const soundRef = useRef<Audio.Sound | null>(null);

  const playAudio = async (audioUrl: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Stop any currently playing audio
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      // Create and load new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );

      soundRef.current = sound;

      // Set up status updates
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setState(prev => ({
            ...prev,
            isPlaying: status.isPlaying || false,
            isLoading: false,
            duration: status.durationMillis || 0,
            position: status.positionMillis || 0,
          }));
        }
      });

      await sound.playAsync();
    } catch (error) {
      console.error('Error playing audio:', error);
      setState(prev => ({ ...prev, isLoading: false, isPlaying: false }));
    }
  };

  const stopAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  };

  const pauseAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  };

  const resumeAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync();
    }
  };

  return {
    state,
    playAudio,
    stopAudio,
    pauseAudio,
    resumeAudio,
  };
}