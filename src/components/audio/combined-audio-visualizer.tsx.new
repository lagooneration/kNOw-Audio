import { useEffect, useRef } from 'react';
import { type AudioData } from '../../types/audio';
import { type FrequencyOverlap, type EQSuggestion } from '../../utils/audio-mixing';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface CombinedAudioVisualizerProps {
  track1: AudioData;
  track2: AudioData;
  overlaps: FrequencyOverlap[];
  suggestions: EQSuggestion[];
  height?: number;
  width?: number;
}

export function CombinedAudioVisualizer({
  track1,
  track2,
  overlaps,
  suggestions,
  height = 300,
  width = 800
}: CombinedAudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current || !track1 || !track2) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, width, height);
    
    // Draw a grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Define frequency bands for visualization
    const frequencyBands = [
      { name: "Sub Bass", min: 20, max: 60, constructive: 0, destructive: 0 },
      { name: "Bass", min: 60, max: 250, constructive: 0, destructive: 0 },
      { name: "Low Mids", min: 250, max: 500, constructive: 0, destructive: 0 },
      { name: "Mids", min: 500, max: 2000, constructive: 0, destructive: 0 },
      { name: "High Mids", min: 2000, max: 4000, constructive: 0, destructive: 0 },
      { name: "Presence", min: 4000, max: 6000, constructive: 0, destructive: 0 },
      { name: "Brilliance", min: 6000, max: 20000, constructive: 0, destructive: 0 }
    ];
    
    // Draw sample waveforms based on track names (simulated data)
    // Draw track 1 waveform at the top
    drawSimulatedWaveform(ctx, track1, 'rgba(65, 105, 225, 0.8)', 0, 0.3 * height);
    
    // Draw track 2 waveform at the bottom
    drawSimulatedWaveform(ctx, track2, 'rgba(34, 139, 34, 0.8)', 0.7 * height, 0.3 * height);
    
    // Draw combined waveform in the middle
    drawSimulatedCombinedWaveform(ctx, track1, track2, 'rgba(255, 255, 255, 0.8)', 0.35 * height, 0.3 * height);
    
    // Count constructive and destructive overlaps in each band
    overlaps.forEach(overlap => {
      const band = frequencyBands.find(band => 
        overlap.frequency >= band.min && overlap.frequency <= band.max
      );
      
      if (band) {
        if (overlap.isConstructive) {
          band.constructive += overlap.overlapIntensity;
        } else {
          band.destructive += overlap.overlapIntensity;
        }
      }
    });
    
    // Visualize the bands with significant interference
    const bandWidth = width / frequencyBands.length;
    
    frequencyBands.forEach((band, index) => {
      const xPosition = index * bandWidth;
      const totalInterference = band.constructive + band.destructive;
      
      // Skip bands with minimal interference
      if (totalInterference < 0.1) return;
      
      // Determine if band is predominantly constructive or destructive
      const isPredominantlyConstructive = band.constructive > band.destructive;
      const interferenceRatio = isPredominantlyConstructive 
        ? band.constructive / totalInterference 
        : band.destructive / totalInterference;
      
      // Only draw significant interference (more than 60% one way or the other)
      if (interferenceRatio >= 0.6) {
        const color = isPredominantlyConstructive 
          ? `rgba(255, 165, 0, ${Math.min(0.7, interferenceRatio * 0.7)})` // Orange for constructive
          : `rgba(255, 0, 0, ${Math.min(0.7, interferenceRatio * 0.7)})`;  // Red for destructive
        
        ctx.fillStyle = color;
        ctx.fillRect(xPosition, 0, bandWidth, height);
        
        // Add label
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        ctx.fillText(
          `${band.name} ${isPredominantlyConstructive ? '(+)' : '(-)'}`,
          xPosition + bandWidth / 2,
          20
        );
      }
    });
    
    // Add legend
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(width - 240, 10, 230, 100);
    
    ctx.fillStyle = 'rgba(65, 105, 225, 0.8)';
    ctx.fillRect(width - 230, 20, 15, 10);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.font = '12px Arial';
    ctx.fillText(`Track 1: ${track1.metadata.name}`, width - 210, 28);
    
    ctx.fillStyle = 'rgba(34, 139, 34, 0.8)';
    ctx.fillRect(width - 230, 40, 15, 10);
    ctx.fillText(`Track 2: ${track2.metadata.name}`, width - 210, 48);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(width - 230, 60, 15, 10);
    ctx.fillText('Combined Waveform', width - 210, 68);
    
    ctx.fillStyle = 'rgba(255, 165, 0, 0.8)';
    ctx.fillRect(width - 230, 80, 15, 10);
    ctx.fillText('Constructive Interference Band', width - 210, 88);
    
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.fillRect(width - 230, 100, 15, 10);
    ctx.fillText('Destructive Interference Band', width - 210, 108);
    
  }, [track1, track2, overlaps, suggestions, height, width]);
  
  // Helper function to draw a simulated waveform
  function drawSimulatedWaveform(
    ctx: CanvasRenderingContext2D,
    track: AudioData,
    color: string,
    yOffset: number,
    heightRange: number
  ) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Use track name to generate a unique but consistent pattern
    const seed = track.metadata.name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    
    for (let i = 0; i < width; i++) {
      const x = i;
      
      // Generate a semi-random waveform pattern based on track name
      const phase = seed / 100;
      const value = 
        Math.sin(i * 0.01 + phase) * 0.3 + 
        Math.sin(i * 0.05 + phase) * 0.2 +
        Math.sin(i * 0.001 + phase) * 0.5;
      
      // Scale and position the waveform
      const yMiddle = yOffset + heightRange / 2;
      const y = yMiddle + value * (heightRange / 2);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  }
  
  // Helper function to draw a simulated combined waveform
  function drawSimulatedCombinedWaveform(
    ctx: CanvasRenderingContext2D,
    track1: AudioData,
    track2: AudioData,
    color: string,
    yOffset: number,
    heightRange: number
  ) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Use track names to generate unique but consistent patterns
    const seed1 = track1.metadata.name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const seed2 = track2.metadata.name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    
    for (let i = 0; i < width; i++) {
      const x = i;
      
      // Generate semi-random waveform patterns based on track names
      const phase1 = seed1 / 100;
      const value1 = 
        Math.sin(i * 0.01 + phase1) * 0.3 + 
        Math.sin(i * 0.05 + phase1) * 0.2 +
        Math.sin(i * 0.001 + phase1) * 0.5;
        
      const phase2 = seed2 / 100;
      const value2 = 
        Math.sin(i * 0.01 + phase2) * 0.3 + 
        Math.sin(i * 0.05 + phase2) * 0.2 +
        Math.sin(i * 0.001 + phase2) * 0.5;
      
      // Combine the waveforms
      const combinedValue = (value1 + value2) / 2;
      
      // Scale and position the combined waveform
      const yMiddle = yOffset + heightRange / 2;
      const y = yMiddle + combinedValue * (heightRange / 2);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Frequency Band Interference Visualization</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This shows how both audio tracks combine when played together. 
          Highlighted regions show broader frequency bands where significant interference occurs.
        </p>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full h-auto bg-background/50 rounded-md"
        />
        <div className="mt-4 p-3 bg-slate-800/50 rounded-md text-sm">
          <p className="text-white/70">
            <span className="font-medium">How to read this visualization:</span> The top waveform is Track 1, 
            the bottom is Track 2, and the middle shows how they sound when combined. 
            Orange bands indicate frequency ranges with predominantly constructive interference (frequencies enhance each other), 
            while red bands show ranges with predominantly destructive interference (frequencies compete with each other).
            The visualization focuses on broader frequency bands rather than specific frequencies.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
