import { useEffect, useRef } from 'react';
import { type AudioData } from '../../types/audio';
import { type FrequencyOverlap } from '../../utils/audio-mixing';

interface FrequencyOverlapVisualizerProps {
  track1: AudioData;
  track2: AudioData;
  overlaps: FrequencyOverlap[];
  height?: number;
  width?: number;
}

export function FrequencyOverlapVisualizer({
  track1,
  track2,
  overlaps,
  height = 300,
  width = 800
}: FrequencyOverlapVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current || !track1 || !track2) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set up audio context and analyzers
    const audioContext = new AudioContext();
    
    const analyzer1 = audioContext.createAnalyser();
    analyzer1.fftSize = 2048;
    const bufferLength = analyzer1.frequencyBinCount;
    const dataArray1 = new Uint8Array(bufferLength);
    
    const analyzer2 = audioContext.createAnalyser();
    analyzer2.fftSize = 2048;
    const dataArray2 = new Uint8Array(bufferLength);
    
    // Create sources
    const source1 = audioContext.createBufferSource();
    source1.buffer = track1.buffer;
    source1.connect(analyzer1);
    
    const source2 = audioContext.createBufferSource();
    source2.buffer = track2.buffer;
    source2.connect(analyzer2);
    
    // Get frequency data
    analyzer1.getByteFrequencyData(dataArray1);
    analyzer2.getByteFrequencyData(dataArray2);
    
    // Draw frequency data for track 1 (blue)
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(65, 105, 225, 0.6)';
    ctx.lineWidth = 2;
    
    const barWidth = width / bufferLength;
    
    for (let i = 0; i < bufferLength; i++) {
      const x = i * barWidth;
      const y = height - (dataArray1[i] / 255) * height;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
    // Draw frequency data for track 2 (green)
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(34, 139, 34, 0.6)';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < bufferLength; i++) {
      const x = i * barWidth;
      const y = height - (dataArray2[i] / 255) * height;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
    // Highlight overlap regions
    overlaps.forEach(overlap => {
      // Calculate position
      const nyquist = track1.buffer.sampleRate / 2;
      const binIndex = Math.floor(overlap.frequency * bufferLength / nyquist);
      const x = binIndex * barWidth;
      
      // Determine color and opacity based on constructive/destructive nature and intensity
      // Use higher opacity for stronger overlaps
      const baseOpacity = 0.3 + (overlap.overlapIntensity * 0.7);
      
      const color = overlap.isConstructive 
        ? `rgba(255, 165, 0, ${baseOpacity})` // Orange for constructive
        : `rgba(255, 0, 0, ${baseOpacity})`; // Red for destructive
      
      // Draw vertical highlight for the overlap - use wider bars for important frequencies
      const highlightWidth = Math.max(2, Math.min(6, overlap.overlapIntensity * 8)) * barWidth;
      
      ctx.fillStyle = color;
      ctx.fillRect(
        x - highlightWidth / 2, 
        0, 
        highlightWidth, 
        height
      );
      
      // Add a border to make it more visible
      ctx.strokeStyle = overlap.isConstructive ? 'rgba(255, 200, 100, 0.9)' : 'rgba(255, 100, 100, 0.9)';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        x - highlightWidth / 2, 
        0, 
        highlightWidth, 
        height
      );
      
      // Add label for significant overlaps
      if (overlap.overlapIntensity > 0.6) {
        // Draw a background for the text to make it more readable
        const frequencyText = `${Math.round(overlap.frequency)}Hz`;
        const typeText = overlap.isConstructive ? 'Constructive' : 'Destructive';
        
        // Measure text width
        const freqTextWidth = ctx.measureText(frequencyText).width;
        const typeTextWidth = ctx.measureText(typeText).width;
        const maxWidth = Math.max(freqTextWidth, typeTextWidth);
        
        // Draw background for frequency text
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - maxWidth/2 - 5, height - 45, maxWidth + 10, 40);
        
        // Draw text
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          frequencyText, 
          x, 
          height - 30
        );
        
        // Add constructive/destructive label
        ctx.fillStyle = overlap.isConstructive ? 'rgba(255, 200, 100, 1)' : 'rgba(255, 100, 100, 1)';
        ctx.fillText(
          typeText,
          x,
          height - 15
        );
      }
    });
    
    // Add frequency labels on x-axis
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    const freqLabels = [20, 100, 500, 1000, 5000, 10000, 20000];
    freqLabels.forEach(freq => {
      const x = (freq / 22050) * width; // 22050 is Nyquist for 44.1kHz
      ctx.fillText(`${freq < 1000 ? freq : (freq/1000)+'k'}`, x, height - 5);
    });
    
    // Add legend
    ctx.fillStyle = 'rgba(65, 105, 225, 0.6)';
    ctx.fillRect(width - 150, 10, 20, 10);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.fillText(`Track 1: ${track1.metadata.name}`, width - 125, 20);
    
    ctx.fillStyle = 'rgba(34, 139, 34, 0.6)';
    ctx.fillRect(width - 150, 30, 20, 10);
    ctx.fillStyle = 'white';
    ctx.fillText(`Track 2: ${track2.metadata.name}`, width - 125, 40);
    
    ctx.fillStyle = 'rgba(255, 165, 0, 0.6)';
    ctx.fillRect(width - 150, 50, 20, 10);
    ctx.fillStyle = 'white';
    ctx.fillText('Constructive Overlap', width - 125, 60);
    
    ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
    ctx.fillRect(width - 150, 70, 20, 10);
    ctx.fillStyle = 'white';
    ctx.fillText('Destructive Overlap', width - 125, 80);
    
    // Clean up
    audioContext.close();
  }, [track1, track2, overlaps, height, width]);
  
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-auto bg-background/50 rounded-md"
    />
  );
}
