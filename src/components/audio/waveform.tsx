import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { type AudioData } from '../../types/audio';

interface WaveformProps {
  audioData: AudioData;
  height?: number;
  waveColor?: string;
  progressColor?: string;
  cursorColor?: string;
  barWidth?: number;
  barGap?: number;
  hideScrollbar?: boolean;
  onReady?: (wavesurfer: WaveSurfer) => void;
}

export function Waveform({
  audioData,
  height = 128,
  waveColor = 'rgba(100, 120, 255, 0.8)',
  progressColor = 'rgba(50, 80, 255, 0.9)',
  cursorColor = 'rgba(100, 120, 255, 1)',
  barWidth = 2,
  barGap = 1,
  hideScrollbar = false,
  onReady
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create WaveSurfer instance
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      height,
      waveColor,
      progressColor,
      cursorColor,
      barWidth,
      barGap,
      autoScroll: true,
      normalize: true,
      hideScrollbar,
    });

    // Load audio from URL
    wavesurfer.load(audioData.url);

    // Save reference
    wavesurferRef.current = wavesurfer;

    // Call onReady callback
    if (onReady) {
      wavesurfer.on('ready', () => {
        onReady(wavesurfer);
      });
    }

    // Cleanup
    return () => {
      wavesurfer.destroy();
    };
  }, [audioData, height, waveColor, progressColor, cursorColor, barWidth, barGap, hideScrollbar, onReady]);

  return (
    <div className="waveform-container">
      <div ref={containerRef} className="w-full"></div>
    </div>
  );
}
