import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { type AudioData } from '../../types/audio';

interface MiniWaveformProps {
  audioData: AudioData;
  height?: number;
  width?: number;
  waveColor?: string;
  progressColor?: string;
  backgroundColor?: string;
  onPlay?: () => void;
  onPause?: () => void;
}

export function MiniWaveform({
  audioData,
  height = 60,
  width = 200,
  waveColor = 'rgba(20, 230, 180, 0.8)',
  progressColor = 'rgba(20, 230, 180, 1)',
  backgroundColor = 'rgba(10, 15, 20, 0.9)',
  onPlay,
  onPause
}: MiniWaveformProps) {
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
      barWidth: 1,
      barGap: 1,
      autoCenter: true,
      normalize: true,
      hideScrollbar: true,
    });

    // Load audio from URL
    wavesurfer.load(audioData.url);

    // Register events
    if (onPlay) {
      wavesurfer.on('play', onPlay);
    }
    
    if (onPause) {
      wavesurfer.on('pause', onPause);
    }

    // Save reference
    wavesurferRef.current = wavesurfer;

    // Cleanup
    return () => {
      wavesurfer.destroy();
    };
  }, [audioData, height, waveColor, progressColor, onPlay, onPause]);

  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  return (
    <div 
      className="mini-waveform-container rounded-md overflow-hidden"
      style={{ 
        width: `${width}px`, 
        height: `${height}px`, 
        backgroundColor,
        boxShadow: '0 0 8px rgba(20, 230, 180, 0.3)',
        position: 'relative'
      }}
    >
      <div ref={containerRef} className="w-full h-full"></div>
      <button 
        className="absolute bottom-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
        onClick={handlePlayPause}
        style={{ width: '24px', height: '24px' }}
      >
      </button>
    </div>
  );
}
