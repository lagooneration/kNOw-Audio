import { useEffect, useRef } from 'react';
import { type AudioData } from '../../types/audio';

interface SpectrogramProps {
  audioData: AudioData;
  height?: number;
  width?: number;
  colorMap?: string[];
  showScale?: boolean;
}

export function Spectrogram({
  audioData,
  height = 200,
  width = 800,
  colorMap = [
    'rgba(0, 0, 0, 1)',
    'rgba(0, 0, 255, 1)',
    'rgba(0, 255, 255, 1)',
    'rgba(0, 255, 0, 1)',
    'rgba(255, 255, 0, 1)',
    'rgba(255, 0, 0, 1)'
  ],
  showScale = true
}: SpectrogramProps) {
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
    
    // Configure analyzer
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;
    analyser.smoothingTimeConstant = 0.85;
    
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
    
    // Clear canvas
    canvasCtx.fillStyle = 'black';
    canvasCtx.fillRect(0, 0, width, height);
    
    // Position tracker
    let xPos = 0;
    
    // Create the color map function
    const getColor = (value: number) => {
      const v = Math.max(0, Math.min(1, value));
      const index = Math.floor(v * (colorMap.length - 1));
      
      if (index === colorMap.length - 1) {
        return colorMap[index];
      }
      
      const ratio = v * (colorMap.length - 1) - index;
      const color1 = colorMap[index];
      const color2 = colorMap[index + 1];
      
      // Parse colors
      const parseColor = (colorString: string) => {
        const match = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/);
        if (!match) return [0, 0, 0, 1];
        
        return [
          parseInt(match[1], 10),
          parseInt(match[2], 10),
          parseInt(match[3], 10),
          match[4] ? parseFloat(match[4]) : 1
        ];
      };
      
      const c1 = parseColor(color1);
      const c2 = parseColor(color2);
      
      // Interpolate between colors
      const r = Math.round(c1[0] + ratio * (c2[0] - c1[0]));
      const g = Math.round(c1[1] + ratio * (c2[1] - c1[1]));
      const b = Math.round(c1[2] + ratio * (c2[2] - c1[2]));
      const a = c1[3] + ratio * (c2[3] - c1[3]);
      
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    };
    
    // Draw spectrogram
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      
      analyser.getByteFrequencyData(dataArray);
      
      // Draw current column
      const imageData = canvasCtx.createImageData(1, height);
      
      for (let i = 0; i < height; i++) {
        // Map canvas y coordinate to frequency bin
        const binIndex = Math.floor(i / height * bufferLength);
        const value = dataArray[binIndex] / 255.0;
        
        // Get color for the value
        const color = getColor(value);
        
        // Parse the color
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/);
        if (!match) continue;
        
        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        const b = parseInt(match[3], 10);
        const a = match[4] ? parseFloat(match[4]) * 255 : 255;
        
        // Set pixel color
        const pixelIndex = (height - i - 1) * 4;
        imageData.data[pixelIndex] = r;
        imageData.data[pixelIndex + 1] = g;
        imageData.data[pixelIndex + 2] = b;
        imageData.data[pixelIndex + 3] = a;
      }
      
      // Put image data
      canvasCtx.putImageData(imageData, xPos, 0);
      
      // Increment x position
      xPos = (xPos + 1) % width;
      
      // Draw vertical line at current position
      canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      canvasCtx.fillRect(xPos, 0, 1, height);
      
      // Draw frequency scale
      if (showScale) {
        // Save context
        canvasCtx.save();
        
        // Draw over right edge with black box
        canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        canvasCtx.fillRect(width - 60, 0, 60, height);
        
        // Draw frequency labels
        canvasCtx.fillStyle = 'white';
        canvasCtx.font = '10px Arial';
        canvasCtx.textAlign = 'left';
        
        const labelCount = 10;
        const step = Math.floor(audioContext.sampleRate / 2 / labelCount);
        
        for (let i = 0; i <= labelCount; i++) {
          const freq = Math.floor(i * step);
          const y = height - (i / labelCount) * height;
          
          canvasCtx.fillText(
            freq >= 1000 ? `${(freq / 1000).toFixed(1)}kHz` : `${freq}Hz`,
            width - 55,
            y + 3
          );
        }
        
        // Restore context
        canvasCtx.restore();
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
  }, [audioData, height, width, colorMap, showScale]);
  
  return (
    <div className="spectrogram">
      <canvas ref={canvasRef} className="w-full h-full"></canvas>
    </div>
  );
}
