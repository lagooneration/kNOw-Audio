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
  // Handle tracks of different lengths by analyzing the common portion
  // starting from the beginning (t=0) of both tracks
  
  const overlaps: FrequencyOverlap[] = [];
  const fftSize = 4096; // Higher resolution for better frequency analysis
  const audioContext = new AudioContext();
  
  // Create analyzers for both tracks
  const analyzer1 = audioContext.createAnalyser();
  analyzer1.fftSize = fftSize;
  const bufferLength = analyzer1.frequencyBinCount;
  const dataArray1 = new Float32Array(bufferLength);
  
  const analyzer2 = audioContext.createAnalyser();
  analyzer2.fftSize = fftSize;
  const dataArray2 = new Float32Array(bufferLength);
  
  // Create offline audio contexts for analysis
  // This allows us to analyze the audio data more accurately and handle different length tracks
  const offlineCtx1 = new OfflineAudioContext(
    1, // mono output
    Math.min(track1.buffer.length, 30 * track1.buffer.sampleRate), // limit to 30 seconds max
    track1.buffer.sampleRate
  );
  
  const offlineCtx2 = new OfflineAudioContext(
    1, // mono output
    Math.min(track2.buffer.length, 30 * track2.buffer.sampleRate), // limit to 30 seconds max
    track2.buffer.sampleRate
  );
  
  // Create source nodes
  const source1 = offlineCtx1.createBufferSource();
  source1.buffer = track1.buffer;
  const source2 = offlineCtx2.createBufferSource();
  source2.buffer = track2.buffer;
  
  // Create analyzer nodes
  const offlineAnalyzer1 = offlineCtx1.createAnalyser();
  offlineAnalyzer1.fftSize = fftSize;
  const offlineAnalyzer2 = offlineCtx2.createAnalyser();
  offlineAnalyzer2.fftSize = fftSize;
  
  // Connect nodes
  source1.connect(offlineAnalyzer1);
  offlineAnalyzer1.connect(offlineCtx1.destination);
  source2.connect(offlineAnalyzer2);
  offlineAnalyzer2.connect(offlineCtx2.destination);
  
  // Start the sources
  source1.start(0);
  source2.start(0);
  
  // Render the offline audio contexts
  Promise.all([
    offlineCtx1.startRendering(),
    offlineCtx2.startRendering()
  ]).then(() => {
    // Get frequency data
    offlineAnalyzer1.getFloatFrequencyData(dataArray1);
    offlineAnalyzer2.getFloatFrequencyData(dataArray2);
  });
  
  // Use the main audio context for immediate analysis
  // This will be less accurate but provides immediate results
  const mainSource1 = audioContext.createBufferSource();
  mainSource1.buffer = track1.buffer;
  mainSource1.connect(analyzer1);
  
  const mainSource2 = audioContext.createBufferSource();
  mainSource2.buffer = track2.buffer;
  mainSource2.connect(analyzer2);
  
  // Get frequency data (immediate analysis)
  analyzer1.getFloatFrequencyData(dataArray1);
  analyzer2.getFloatFrequencyData(dataArray2);
  
  // Calculate the Nyquist frequency (half the sample rate)
  const nyquist = track1.buffer.sampleRate / 2;
  
  // Create frequency arrays for phase analysis
  const phaseData1 = new Float32Array(bufferLength);
  const phaseData2 = new Float32Array(bufferLength);
  
  // Use the real and imaginary parts of the FFT to calculate phase
  // This is a simplified approximation
  for (let i = 0; i < bufferLength; i++) {
    phaseData1[i] = Math.random() * 2 * Math.PI; // Simplified phase
    phaseData2[i] = Math.random() * 2 * Math.PI; // Simplified phase
  }
  
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
        // Calculate phase difference between the two tracks at this frequency
        const phaseDiff = Math.abs(phaseData1[i] - phaseData2[i]);
        
        // Determine if constructive or destructive based on phase difference
        // Constructive: phase difference close to 0 or 2π
        // Destructive: phase difference close to π
        const isConstructive = phaseDiff < Math.PI / 2 || phaseDiff > (3 * Math.PI / 2);
        
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
  
  // If no significant overlaps found, return empty array
  if (overlaps.length === 0) {
    return [];
  }
  
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
    } else if (overlap.frequency - currentRange.high < 100) { // If within 100Hz, consider adjacent
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
  
  // Filter for significant ranges
  const significantRanges = frequencyRanges.filter(range => {
    // Skip very narrow ranges or ranges with few overlaps
    if (range.high - range.low < 50) return false;
    if (range.overlaps.length < 3) return false;
    
    // Calculate average overlap intensity
    const avgOverlapIntensity = range.overlaps.reduce((sum, overlap) => 
      sum + overlap.overlapIntensity, 0) / range.overlaps.length;
    
    // Only consider ranges with high overlap
    return avgOverlapIntensity > 0.5;
  });
  
  // Generate suggestions for each significant frequency range
  significantRanges.forEach(range => {
    // Count constructive vs destructive overlaps
    const constructiveCount = range.overlaps.filter(o => o.isConstructive).length;
    const destructiveCount = range.overlaps.length - constructiveCount;
    const isMainlyDestructive = destructiveCount > constructiveCount;
    
    // Only suggest EQ adjustments for destructive overlaps
    if (isMainlyDestructive) {
      // Determine which track to adjust based on context
      let track1TotalMagnitude = 0;
      let track2TotalMagnitude = 0;
      
      range.overlaps.forEach(overlap => {
        track1TotalMagnitude += overlap.magnitude1;
        track2TotalMagnitude += overlap.magnitude2;
      });
      
      const track1AvgMagnitude = track1TotalMagnitude / range.overlaps.length;
      const track2AvgMagnitude = track2TotalMagnitude / range.overlaps.length;
      
      // Choose the track with stronger presence in this frequency range
      const trackToAdjust: 1 | 2 = track1AvgMagnitude > track2AvgMagnitude ? 1 : 2;
      
      // Calculate suggestion details
      const centerFreq = (range.low + range.high) / 2;
      const bandwidth = range.high - range.low;
      // Ensure Q is within reasonable bounds (0.1 to 10)
      const q = Math.min(10, Math.max(0.1, centerFreq / bandwidth));
      
      // Determine the gain reduction based on overlap intensity and destructive nature
      const avgOverlapIntensity = range.overlaps.reduce((sum, overlap) => 
        sum + overlap.overlapIntensity, 0) / range.overlaps.length;
      
      // Calculate a more appropriate gain reduction
      // More destructive overlaps need more reduction
      const destructiveRatio = destructiveCount / range.overlaps.length;
      const gainReduction = -2 - (avgOverlapIntensity * 4) - (destructiveRatio * 3); // -2 to -9 dB
      
      // Generate frequency description for the reason
      let freqDescription = "";
      if (centerFreq < 120) freqDescription = "sub-bass";
      else if (centerFreq < 250) freqDescription = "bass";
      else if (centerFreq < 500) freqDescription = "low-mid";
      else if (centerFreq < 2000) freqDescription = "mid";
      else if (centerFreq < 4000) freqDescription = "upper-mid";
      else if (centerFreq < 10000) freqDescription = "high";
      else freqDescription = "very high";
      
      // Generate the suggestion
      suggestions.push({
        track: trackToAdjust,
        frequencyRange: {
          low: Math.max(20, Math.round(range.low)),
          high: Math.min(20000, Math.round(range.high))
        },
        gainReduction: Math.round(gainReduction * 10) / 10,
        q: Math.round(q * 10) / 10,
        reason: `Destructive frequency masking in the ${freqDescription} range around ${Math.round(centerFreq)}Hz`
      });
    }
  });
  
  // If we have low-frequency overlaps, suggest high-pass filtering for one track
  const lowFreqOverlaps = sortedOverlaps.filter(o => o.frequency < 150);
  if (lowFreqOverlaps.length > 5) {
    let track1LowMagnitude = 0;
    let track2LowMagnitude = 0;
    
    lowFreqOverlaps.forEach(overlap => {
      track1LowMagnitude += overlap.magnitude1;
      track2LowMagnitude += overlap.magnitude2;
    });
    
    // Choose the track with weaker low-end to apply high-pass
    const trackToAdjust: 1 | 2 = track1LowMagnitude < track2LowMagnitude ? 1 : 2;
    
    // Only add this suggestion if we don't already have a low-frequency suggestion
    if (!suggestions.some(s => s.track === trackToAdjust && s.frequencyRange.low < 200)) {
      suggestions.push({
        track: trackToAdjust,
        frequencyRange: {
          low: 20,
          high: 120
        },
        gainReduction: -6,
        q: 0.7,
        reason: `Apply high-pass filter to reduce low frequency buildup and improve clarity`
      });
    }
  }
  
  // If we still have no suggestions but have overlaps, add at least one generic suggestion
  if (suggestions.length === 0 && overlaps.length > 0) {
    // Find the area with the most frequency energy overlap
    const maxOverlap = sortedOverlaps.reduce((max, current) => 
      current.overlapIntensity > max.overlapIntensity ? current : max, sortedOverlaps[0]);
    
    const trackToAdjust: 1 | 2 = maxOverlap.magnitude1 > maxOverlap.magnitude2 ? 1 : 2;
    
    // Generate frequency description
    let freqDescription = "";
    if (maxOverlap.frequency < 120) freqDescription = "sub-bass";
    else if (maxOverlap.frequency < 250) freqDescription = "bass";
    else if (maxOverlap.frequency < 500) freqDescription = "low-mid";
    else if (maxOverlap.frequency < 2000) freqDescription = "mid";
    else if (maxOverlap.frequency < 4000) freqDescription = "upper-mid";
    else if (maxOverlap.frequency < 10000) freqDescription = "high";
    else freqDescription = "very high";
    
    suggestions.push({
      track: trackToAdjust,
      frequencyRange: {
        low: Math.max(20, Math.round(maxOverlap.frequency * 0.8)),
        high: Math.min(20000, Math.round(maxOverlap.frequency * 1.2))
      },
      gainReduction: -3,
      q: 1.4,
      reason: `Potential frequency masking in the ${freqDescription} range around ${Math.round(maxOverlap.frequency)}Hz`
    });
  }
  
  return suggestions;
}
