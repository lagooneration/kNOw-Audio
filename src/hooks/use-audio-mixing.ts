import { useState, useEffect, useCallback } from 'react';
import { type AudioData } from '../types/audio';
import { processAudioFile } from '../utils/audio-processing';

export interface MixingState {
  track1: AudioData | null;
  track2: AudioData | null;
  isProcessing: boolean;
  error: string | null;
}

export function useAudioMixing() {
  const [mixingState, setMixingState] = useState<MixingState>({
    track1: null,
    track2: null,
    isProcessing: false,
    error: null
  });

  const processTrack = useCallback(async (file: File, trackNumber: 1 | 2) => {
    try {
      setMixingState(prev => ({ ...prev, isProcessing: true, error: null }));
      
      const data = await processAudioFile(file);
      
      setMixingState(prev => ({
        ...prev,
        [`track${trackNumber}`]: data,
        isProcessing: false
      }));
      
      return data;
    } catch (err) {
      setMixingState(prev => ({
        ...prev,
        isProcessing: false,
        error: err instanceof Error ? err.message : 'An unknown error occurred'
      }));
      return null;
    }
  }, []);

  const clearTrack = useCallback((trackNumber: 1 | 2) => {
    setMixingState(prev => {
      const track = prev[`track${trackNumber}` as keyof Pick<MixingState, 'track1' | 'track2'>];
      if (track?.url) {
        URL.revokeObjectURL(track.url);
      }
      return {
        ...prev,
        [`track${trackNumber}`]: null
      };
    });
  }, []);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (mixingState.track1?.url) {
        URL.revokeObjectURL(mixingState.track1.url);
      }
      if (mixingState.track2?.url) {
        URL.revokeObjectURL(mixingState.track2.url);
      }
    };
  }, [mixingState.track1, mixingState.track2]);

  return {
    mixingState,
    processTrack,
    clearTrack
  };
}
