import { type AudioData } from '../types/audio';

export interface FrequencyOverlap {
  frequency: number;
  magnitude1: number;
  magnitude2: number;
  overlapIntensity: number; // 0-1 scale of overlap intensity
  isConstructive: boolean; // true if constructive, false if destructive
}

export interface EQSuggestion {
  track: 1 | 2;
  frequencyRange: {
    low: number;
    high: number;
  };
  gainReduction: number; // in dB
  q: number; // Q factor for the EQ
  reason: string;
}

// Analyze frequency overlap between two audio tracks
export function analyzeFrequencyOverlap(track1: AudioData, track2: AudioData): FrequencyOverlap[] {
  // This is a simplified implementation - in a real application, we would:
  // 1. Perform FFT on both tracks
  // 2. Normalize the magnitudes
  // 3. Compare frequency bins to find overlaps
  
  const overlaps: FrequencyOverlap[] = [];
  const fftSize = 2048;
  const audioContext = new AudioContext();
  
  // Create analyzers for both tracks
  const analyzer1 = audioContext.createAnalyser();
  analyzer1.fftSize = fftSize;
  const bufferLength = analyzer1.frequencyBinCount;
  const dataArray1 = new Float32Array(bufferLength);
  
  const analyzer2 = audioContext.createAnalyser();
  analyzer2.fftSize = fftSize;
  const dataArray2 = new Float32Array(bufferLength);
  
  // Create sources for both tracks
  const source1 = audioContext.createBufferSource();
  source1.buffer = track1.buffer;
  source1.connect(analyzer1);
  
  const source2 = audioContext.createBufferSource();
  source2.buffer = track2.buffer;
  source2.connect(analyzer2);
  
  // Get frequency data (we're not playing the audio, just analyzing it)
  analyzer1.getFloatFrequencyData(dataArray1);
  analyzer2.getFloatFrequencyData(dataArray2);
  
  // Calculate the Nyquist frequency (half the sample rate)
  const nyquist = track1.buffer.sampleRate / 2;
  
  // Analyze each frequency bin
  for (let i = 0; i < bufferLength; i++) {
    // Convert bin index to frequency
    const frequency = i * nyquist / bufferLength;
    
    // Normalize the magnitudes (dB to 0-1 scale)
    const magnitude1 = (dataArray1[i] + 140) / 140; // Assuming minimum is -140dB
    const magnitude2 = (dataArray2[i] + 140) / 140;
    
    // Calculate overlap
    const minMagnitude = Math.min(magnitude1, magnitude2);
    const maxMagnitude = Math.max(magnitude1, magnitude2);
    
    // Only consider significant magnitudes
    if (maxMagnitude > 0.1) {
      const overlapIntensity = minMagnitude / maxMagnitude;
      
      // Only include significant overlaps
      if (overlapIntensity > 0.3) {
        // Determine if constructive or destructive
        // This is simplified - in reality would depend on phase information
        const isConstructive = Math.random() > 0.5; // Randomized for demo
        
        overlaps.push({
          frequency,
          magnitude1,
          magnitude2,
          overlapIntensity,
          isConstructive
        });
      }
    }
  }
  
  // Close audio context to clean up
  audioContext.close();
  
  return overlaps;
}

// Generate EQ suggestions based on frequency overlaps
export function generateEQSuggestions(overlaps: FrequencyOverlap[]): EQSuggestion[] {
  const suggestions: EQSuggestion[] = [];
  
  // Group overlaps into frequency ranges
  const frequencyRanges: {low: number, high: number, overlaps: FrequencyOverlap[]}[] = [];
  let currentRange: {low: number, high: number, overlaps: FrequencyOverlap[]} | null = null;
  
  // Sort overlaps by frequency
  const sortedOverlaps = [...overlaps].sort((a, b) => a.frequency - b.frequency);
  
  // Group adjacent frequencies
  sortedOverlaps.forEach(overlap => {
    if (!currentRange) {
      currentRange = {
        low: overlap.frequency,
        high: overlap.frequency,
        overlaps: [overlap]
      };
    } else if (overlap.frequency - currentRange.high < 50) { // If within 50Hz, consider adjacent
      currentRange.high = overlap.frequency;
      currentRange.overlaps.push(overlap);
    } else {
      frequencyRanges.push(currentRange);
      currentRange = {
        low: overlap.frequency,
        high: overlap.frequency,
        overlaps: [overlap]
      };
    }
  });
  
  if (currentRange) {
    frequencyRanges.push(currentRange);
  }
  
  // Generate suggestions for each frequency range
  frequencyRanges.forEach(range => {
    // Skip very narrow ranges
    if (range.high - range.low < 20) return;
    
    // Determine which track to adjust based on context
    // For simplicity, we'll suggest adjusting the track with the higher average magnitude
    let track1TotalMagnitude = 0;
    let track2TotalMagnitude = 0;
    
    range.overlaps.forEach(overlap => {
      track1TotalMagnitude += overlap.magnitude1;
      track2TotalMagnitude += overlap.magnitude2;
    });
    
    const track1AvgMagnitude = track1TotalMagnitude / range.overlaps.length;
    const track2AvgMagnitude = track2TotalMagnitude / range.overlaps.length;
    
    const trackToAdjust: 1 | 2 = track1AvgMagnitude > track2AvgMagnitude ? 1 : 2;
    
    // Calculate suggestion details
    const centerFreq = (range.low + range.high) / 2;
    const bandwidth = range.high - range.low;
    const q = centerFreq / bandwidth;
    
    // Determine the gain reduction based on overlap intensity
    const avgOverlapIntensity = range.overlaps.reduce((sum, overlap) => 
      sum + overlap.overlapIntensity, 0) / range.overlaps.length;
    
    const gainReduction = -3 - (avgOverlapIntensity * 6); // -3 to -9 dB
    
    // Generate frequency description for the reason
    let freqDescription = "";
    if (centerFreq < 250) freqDescription = "low";
    else if (centerFreq < 1000) freqDescription = "low-mid";
    else if (centerFreq < 4000) freqDescription = "mid";
    else if (centerFreq < 10000) freqDescription = "high-mid";
    else freqDescription = "high";
    
    // Generate the suggestion
    suggestions.push({
      track: trackToAdjust,
      frequencyRange: {
        low: range.low,
        high: range.high
      },
      gainReduction: Math.round(gainReduction * 10) / 10,
      q: Math.round(q * 10) / 10,
      reason: `Significant frequency masking in the ${freqDescription} range around ${Math.round(centerFreq)}Hz`
    });
  });
  
  return suggestions;
}
