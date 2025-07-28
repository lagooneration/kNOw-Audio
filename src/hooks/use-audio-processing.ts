import { useState, useEffect, useCallback } from 'react';
import { type AudioData } from '../types/audio';
import { processAudioFile } from '../utils/audio-processing';

export function useAudioProcessing() {
  const [audioData, setAudioData] = useState<AudioData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processAudio = useCallback(async (file: File) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const data = await processAudioFile(file);
      setAudioData(data);
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearAudio = useCallback(() => {
    if (audioData?.url) {
      URL.revokeObjectURL(audioData.url);
    }
    setAudioData(null);
  }, [audioData]);

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (audioData?.url) {
        URL.revokeObjectURL(audioData.url);
      }
    };
  }, [audioData]);

  return {
    audioData,
    isProcessing,
    error,
    processAudio,
    clearAudio
  };
}
