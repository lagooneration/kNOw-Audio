import { useEffect, useRef, useState } from 'react';
import { type AudioData } from '../../types/audio';

interface FrequencySpectrumProps {
  audioData: AudioData;
  height?: number;
  width?: number;
  barColor?: string;
  backgroundColor?: string;
  showLabels?: boolean;
  externalAudio?: HTMLAudioElement;
  sharedAnalyser?: AnalyserNode | null;
}

export function FrequencySpectrum({
  audioData,
  height = 200,
  width = 800,
  barColor = 'rgba(100, 120, 255, 0.8)',
  backgroundColor = 'rgba(0, 0, 0, 0.1)',
  showLabels = true,
  externalAudio,
  sharedAnalyser
}: FrequencySpectrumProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Set up the visualization
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Use shared analyser if provided, otherwise create our own
    if (sharedAnalyser) {
      analyserRef.current = sharedAnalyser;
    } else {
      // Setup audio context and analyzer
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      
      // Handle audio source based on whether external audio is provided
      let playbackStateHandler: (() => void) | undefined;
      
      if (externalAudio) {
        // Use external audio element
        // Check if the audio element is already connected to a source node
        try {
          // Only create a new source if we're not using a shared analyser
          const source = audioContext.createMediaElementSource(externalAudio);
          source.connect(analyser);
          analyser.connect(audioContext.destination);
        } catch (err) {
          console.warn('Audio element already connected, cannot create new MediaElementSource');
        }
        
        // Monitor external audio playback state
        playbackStateHandler = () => {
          setIsPlaying(!externalAudio.paused);
        };
        
        externalAudio.addEventListener('play', playbackStateHandler);
        externalAudio.addEventListener('pause', playbackStateHandler);
        externalAudio.addEventListener('ended', playbackStateHandler);
        
        // Initial state
        setIsPlaying(!externalAudio.paused);
      } else {
        // Create source from the audio buffer
        const source = audioContext.createBufferSource();
        source.buffer = audioData.buffer;
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        // Don't start playback automatically
        // Only play when user clicks play button
        setIsPlaying(false);
        
        // Save reference
        sourceRef.current = source;
      }
      
      // Save references
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
    }
    
    // Monitor external audio playback state if we're using a shared analyser
    let playbackStateHandler: (() => void) | undefined;
    if (sharedAnalyser && externalAudio) {
      playbackStateHandler = () => {
        setIsPlaying(!externalAudio.paused);
      };
      
      externalAudio.addEventListener('play', playbackStateHandler);
      externalAudio.addEventListener('pause', playbackStateHandler);
      externalAudio.addEventListener('ended', playbackStateHandler);
      
      // Initial state
      setIsPlaying(!externalAudio.paused);
    }
    
    // Setup canvas
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Initialize static display
    canvasCtx.fillStyle = backgroundColor;
    canvasCtx.fillRect(0, 0, width, height);
    
    if (showLabels) {
      const labelCount = 10;
      const step = Math.floor(audioData.buffer.sampleRate / 2 / labelCount);
      
      canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      canvasCtx.font = '10px Arial';
      canvasCtx.textAlign = 'center';
      
      for (let i = 0; i <= labelCount; i++) {
        const freq = i * step;
        const x = (i / labelCount) * width;
        
        canvasCtx.fillText(
          freq >= 1000 ? `${(freq / 1000).toFixed(1)}kHz` : `${freq}Hz`,
          x,
          height - 5
        );
      }
    }
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (sourceRef.current) {
        try {
          sourceRef.current.stop();
        } catch {
          // Ignore if already stopped
        }
      }
      
      // Only close the audio context if we created it ourselves
      if (audioContextRef.current && !sharedAnalyser) {
        audioContextRef.current.close();
      }
      
      // Remove event listeners if using external audio
      if (externalAudio && playbackStateHandler) {
        externalAudio.removeEventListener('play', playbackStateHandler);
        externalAudio.removeEventListener('pause', playbackStateHandler);
        externalAudio.removeEventListener('ended', playbackStateHandler);
      }
    };
  }, [audioData, height, width, barColor, backgroundColor, showLabels, externalAudio, sharedAnalyser]);
  
  // Start or stop the animation based on playback state
  useEffect(() => {
    if (isPlaying && analyserRef.current) {
      // If using internal source and not using external audio, start it when play button is clicked
      if (!externalAudio && audioContextRef.current) {
        try {
          // Create a new source node
          const newSource = audioContextRef.current.createBufferSource();
          newSource.buffer = audioData.buffer;
          newSource.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
          newSource.start();
          
          // Store the new source
          sourceRef.current = newSource;
        } catch {
          console.error('Error starting audio source');
        }
      }
      
      // Start visualization animation
      const draw = () => {
        if (!analyserRef.current || !canvasRef.current) return;
        
        animationRef.current = requestAnimationFrame(draw);
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const canvasCtx = canvasRef.current.getContext('2d');
        if (!canvasCtx) return;
        
        canvasCtx.fillStyle = backgroundColor;
        canvasCtx.fillRect(0, 0, width, height);
        
        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height;
          
          canvasCtx.fillStyle = barColor;
          canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
          
          x += barWidth + 1;
        }
        
        // Draw frequency labels if enabled
        if (showLabels) {
          const labelCount = 10;
          const step = Math.floor(audioData.buffer.sampleRate / 2 / labelCount);
          
          canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          canvasCtx.font = '10px Arial';
          canvasCtx.textAlign = 'center';
          
          for (let i = 0; i <= labelCount; i++) {
            const freq = i * step;
            const x = (i / labelCount) * width;
            
            canvasCtx.fillText(
              freq >= 1000 ? `${(freq / 1000).toFixed(1)}kHz` : `${freq}Hz`,
              x,
              height - 5
            );
          }
        }
      };
      
      draw();
    } else if (animationRef.current) {
      // Stop animation when not playing
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      
      // Draw static visualization
      if (canvasRef.current) {
        const canvasCtx = canvasRef.current.getContext('2d');
        if (canvasCtx) {
          canvasCtx.fillStyle = backgroundColor;
          canvasCtx.fillRect(0, 0, width, height);
          
          if (showLabels) {
            const labelCount = 10;
            const step = Math.floor(audioData.buffer.sampleRate / 2 / labelCount);
            
            canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            canvasCtx.font = '10px Arial';
            canvasCtx.textAlign = 'center';
            
            for (let i = 0; i <= labelCount; i++) {
              const freq = i * step;
              const x = (i / labelCount) * width;
              
              canvasCtx.fillText(
                freq >= 1000 ? `${(freq / 1000).toFixed(1)}kHz` : `${freq}Hz`,
                x,
                height - 5
              );
            }
          }
        }
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, audioData, height, width, barColor, backgroundColor, showLabels, externalAudio]);
  
  return (
    <div className="frequency-spectrum">
      <canvas ref={canvasRef} className="w-full h-full"></canvas>
    </div>
  );
}
