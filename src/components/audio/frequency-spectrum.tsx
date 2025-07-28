import { useEffect, useRef } from 'react';
import { type AudioData } from '../../types/audio';

interface FrequencySpectrumProps {
  audioData: AudioData;
  height?: number;
  width?: number;
  barColor?: string;
  backgroundColor?: string;
  showLabels?: boolean;
}

export function FrequencySpectrum({
  audioData,
  height = 200,
  width = 800,
  barColor = 'rgba(100, 120, 255, 0.8)',
  backgroundColor = 'rgba(0, 0, 0, 0.1)',
  showLabels = true
}: FrequencySpectrumProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Setup audio context and analyzer
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Create source from the audio buffer
    const source = audioContext.createBufferSource();
    source.buffer = audioData.buffer;
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    // Start playback
    source.start();
    
    // Save references
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    sourceRef.current = source;
    
    // Setup canvas
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Visualization function
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      
      analyser.getByteFrequencyData(dataArray);
      
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
    
    // Start visualization
    draw();
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (sourceRef.current) {
        sourceRef.current.stop();
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioData, height, width, barColor, backgroundColor, showLabels]);
  
  return (
    <div className="frequency-spectrum">
      <canvas ref={canvasRef} className="w-full h-full"></canvas>
    </div>
  );
}
