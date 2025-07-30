import { useEffect, useRef } from 'react';
import { type AudioData } from '../../types/audio';
import { type FrequencyOverlap, type EQSuggestion } from '../../utils/audio-mixing';

interface InterferenceVisualizerProps {
  track1: AudioData;
  track2: AudioData;
  overlaps: FrequencyOverlap[];
  suggestions: EQSuggestion[];
  height?: number;
  width?: number;
  showAfterEQ?: boolean;
}

export function InterferenceVisualizer({
  track1,
  track2,
  overlaps,
  suggestions,
  height = 300,
  width = 800,
  showAfterEQ = false
}: InterferenceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current || !track1 || !track2) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set background
    ctx.fillStyle = '#111122';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines (amplitude)
    for (let i = 0; i <= 5; i++) {
      const y = i * (height / 5);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Vertical grid lines (frequency in logarithmic scale)
    const freqLabels = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    const nyquist = track1.buffer.sampleRate / 2;
    
    freqLabels.forEach(freq => {
      // Convert frequency to x position (logarithmic scale)
      const x = width * Math.log10(freq / 20) / Math.log10(nyquist / 20);
      
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      
      // Label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(freq < 1000 ? `${freq}` : `${freq/1000}k`, x, height - 5);
    });
    
    // Set up audio context and analyzers
    const audioContext = new AudioContext();
    
    const analyzer1 = audioContext.createAnalyser();
    analyzer1.fftSize = 2048;
    const bufferLength = analyzer1.frequencyBinCount;
    const dataArray1 = new Float32Array(bufferLength);
    
    const analyzer2 = audioContext.createAnalyser();
    analyzer2.fftSize = 2048;
    const dataArray2 = new Float32Array(bufferLength);
    
    // Create sources
    const source1 = audioContext.createBufferSource();
    source1.buffer = track1.buffer;
    source1.connect(analyzer1);
    
    const source2 = audioContext.createBufferSource();
    source2.buffer = track2.buffer;
    source2.connect(analyzer2);
    
    // Get frequency data
    analyzer1.getFloatFrequencyData(dataArray1);
    analyzer2.getFloatFrequencyData(dataArray2);
    
    // Normalize data (convert from dB to 0-1 range)
    const normalizedData1 = new Float32Array(bufferLength);
    const normalizedData2 = new Float32Array(bufferLength);
    
    for (let i = 0; i < bufferLength; i++) {
      normalizedData1[i] = (dataArray1[i] + 140) / 140; // Assuming minimum dB is -140
      normalizedData2[i] = (dataArray2[i] + 140) / 140;
    }
    
    // Function to draw frequency data with logarithmic x-axis
    const drawFrequencyData = (data: Float32Array, color: string, lineWidth: number, opacity: number) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = opacity;
      
      for (let i = 0; i < bufferLength; i++) {
        // Convert bin index to frequency
        const frequency = i * nyquist / bufferLength;
        
        // Skip frequencies below 20Hz or above 20kHz
        if (frequency < 20 || frequency > 20000) continue;
        
        // Convert to logarithmic scale for x-axis
        const x = width * Math.log10(frequency / 20) / Math.log10(nyquist / 20);
        
        // Calculate y position (inverted, since 0 is at the top in canvas)
        const y = height - (data[i] * height);
        
        if (i === 0 || frequency === 20) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    };
    
    // Draw original frequency data
    drawFrequencyData(normalizedData1, 'rgba(65, 105, 225, 0.8)', 2, 1.0); // Track 1: Blue
    drawFrequencyData(normalizedData2, 'rgba(34, 139, 34, 0.8)', 2, 1.0);  // Track 2: Green
    
    // If showing after EQ, draw the modified frequency responses
    if (showAfterEQ) {
      // Create copies of the original data to modify
      const modifiedData1 = new Float32Array(normalizedData1);
      const modifiedData2 = new Float32Array(normalizedData2);
      
      // Apply EQ adjustments
      suggestions.forEach(suggestion => {
        const targetData = suggestion.track === 1 ? modifiedData1 : modifiedData2;
        const centerFreq = (suggestion.frequencyRange.low + suggestion.frequencyRange.high) / 2;
        const bandwidth = suggestion.frequencyRange.high - suggestion.frequencyRange.low;
        
        // Apply EQ adjustment (simplified bell curve)
        for (let i = 0; i < bufferLength; i++) {
          const frequency = i * nyquist / bufferLength;
          
          if (frequency >= suggestion.frequencyRange.low && frequency <= suggestion.frequencyRange.high) {
            // Calculate gain as a bell curve, with maximum at center frequency
            const normalizedDistance = Math.abs(frequency - centerFreq) / (bandwidth / 2);
            const gain = suggestion.gainReduction * Math.max(0, 1 - normalizedDistance);
            
            // Convert dB to gain factor
            const gainFactor = Math.pow(10, gain / 20);
            
            // Apply gain to the normalized magnitude
            targetData[i] *= gainFactor;
          }
        }
      });
      
      // Draw the modified frequency responses
      drawFrequencyData(modifiedData1, 'rgba(130, 160, 255, 0.7)', 2, 0.8); // Track 1 after EQ: Lighter blue
      drawFrequencyData(modifiedData2, 'rgba(100, 200, 100, 0.7)', 2, 0.8); // Track 2 after EQ: Lighter green
      
      // Draw a subtle combined response
      const combinedResponse = new Float32Array(bufferLength);
      for (let i = 0; i < bufferLength; i++) {
        // Simple additive mixing model
        combinedResponse[i] = Math.min(1, modifiedData1[i] + modifiedData2[i]);
      }
      
      drawFrequencyData(combinedResponse, 'rgba(255, 255, 255, 0.5)', 1.5, 0.6); // Combined: White
    }
    
    // Highlight interference regions
    overlaps.forEach(overlap => {
      // Calculate position on logarithmic scale
      const x = width * Math.log10(overlap.frequency / 20) / Math.log10(nyquist / 20);
      
      // Determine color and opacity based on constructive/destructive nature and intensity
      const baseOpacity = 0.3 + (overlap.overlapIntensity * 0.7);
      
      const color = overlap.isConstructive 
        ? `rgba(255, 165, 0, ${baseOpacity})` // Orange for constructive
        : `rgba(255, 0, 0, ${baseOpacity})`; // Red for destructive
      
      // Width based on frequency (logarithmic scale)
      const lowerFreq = overlap.frequency * 0.9;
      const upperFreq = overlap.frequency * 1.1;
      const x1 = width * Math.log10(lowerFreq / 20) / Math.log10(nyquist / 20);
      const x2 = width * Math.log10(upperFreq / 20) / Math.log10(nyquist / 20);
      const highlightWidth = x2 - x1;
      
      // Draw vertical highlight for the overlap
      ctx.fillStyle = color;
      ctx.fillRect(
        x - highlightWidth / 2, 
        0, 
        highlightWidth, 
        height
      );
      
      // Add wave symbol to illustrate constructive/destructive interference
      if (overlap.overlapIntensity > 0.5) {
        const waveY = height - 60; // Position of the wave visualization
        const waveHeight = 40; // Height of the wave visualization
        const waveWidth = highlightWidth * 0.7; // Width of the wave visualization
        
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        
        if (overlap.isConstructive) {
          // Draw constructive interference waves
          ctx.beginPath();
          ctx.moveTo(x - waveWidth/2, waveY);
          ctx.lineTo(x - waveWidth/4, waveY - waveHeight/2);
          ctx.lineTo(x, waveY);
          ctx.lineTo(x + waveWidth/4, waveY - waveHeight/2);
          ctx.lineTo(x + waveWidth/2, waveY);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(x - waveWidth/2, waveY + waveHeight/2);
          ctx.lineTo(x - waveWidth/4, waveY);
          ctx.lineTo(x, waveY + waveHeight/2);
          ctx.lineTo(x + waveWidth/4, waveY);
          ctx.lineTo(x + waveWidth/2, waveY + waveHeight/2);
          ctx.stroke();
          
          // Label
          ctx.fillStyle = 'white';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Constructive', x, waveY - waveHeight/2 - 5);
        } else {
          // Draw destructive interference waves
          ctx.beginPath();
          ctx.moveTo(x - waveWidth/2, waveY);
          ctx.lineTo(x - waveWidth/4, waveY - waveHeight/2);
          ctx.lineTo(x, waveY);
          ctx.lineTo(x + waveWidth/4, waveY - waveHeight/2);
          ctx.lineTo(x + waveWidth/2, waveY);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(x - waveWidth/2, waveY);
          ctx.lineTo(x - waveWidth/4, waveY + waveHeight/2);
          ctx.lineTo(x, waveY);
          ctx.lineTo(x + waveWidth/4, waveY + waveHeight/2);
          ctx.lineTo(x + waveWidth/2, waveY);
          ctx.stroke();
          
          // Label
          ctx.fillStyle = 'white';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Destructive', x, waveY - waveHeight/2 - 5);
        }
        
        // Frequency label
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(`${Math.round(overlap.frequency)}Hz`, x, waveY + waveHeight/2 + 15);
      }
    });
    
    // Add legend
    const legendY = 25;
    const legendX = width - 160;
    
    ctx.fillStyle = 'rgba(65, 105, 225, 0.8)';
    ctx.fillRect(legendX, legendY, 15, 10);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.font = '12px Arial';
    ctx.fillText(`Track 1: ${track1.metadata.name}`, legendX + 20, legendY + 8);
    
    ctx.fillStyle = 'rgba(34, 139, 34, 0.8)';
    ctx.fillRect(legendX, legendY + 20, 15, 10);
    ctx.fillStyle = 'white';
    ctx.fillText(`Track 2: ${track2.metadata.name}`, legendX + 20, legendY + 28);
    
    if (showAfterEQ) {
      ctx.fillStyle = 'rgba(130, 160, 255, 0.7)';
      ctx.fillRect(legendX, legendY + 40, 15, 10);
      ctx.fillStyle = 'white';
      ctx.fillText(`Track 1 after EQ`, legendX + 20, legendY + 48);
      
      ctx.fillStyle = 'rgba(100, 200, 100, 0.7)';
      ctx.fillRect(legendX, legendY + 60, 15, 10);
      ctx.fillStyle = 'white';
      ctx.fillText(`Track 2 after EQ`, legendX + 20, legendY + 68);
    }
    
    ctx.fillStyle = 'rgba(255, 165, 0, 0.6)';
    ctx.fillRect(legendX, showAfterEQ ? legendY + 80 : legendY + 40, 15, 10);
    ctx.fillStyle = 'white';
    ctx.fillText('Constructive Overlap', legendX + 20, showAfterEQ ? legendY + 88 : legendY + 48);
    
    ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
    ctx.fillRect(legendX, showAfterEQ ? legendY + 100 : legendY + 60, 15, 10);
    ctx.fillStyle = 'white';
    ctx.fillText('Destructive Overlap', legendX + 20, showAfterEQ ? legendY + 108 : legendY + 68);
    
    // Clean up
    audioContext.close();
  }, [track1, track2, overlaps, suggestions, height, width, showAfterEQ]);
  
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-auto bg-background/50 rounded-md"
    />
  );
}
