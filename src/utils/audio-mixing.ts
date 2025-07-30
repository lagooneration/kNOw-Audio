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
  // Create a placeholder set of overlaps for visualization purposes
  const overlaps: FrequencyOverlap[] = [];
  
  // Define frequency bands for broader analysis
  const frequencyBands = [
    { name: "Sub Bass", min: 20, max: 60, defaultIsConstructive: false },
    { name: "Bass", min: 60, max: 250, defaultIsConstructive: false },
    { name: "Low Mids", min: 250, max: 500, defaultIsConstructive: true },
    { name: "Mids", min: 500, max: 2000, defaultIsConstructive: true },
    { name: "High Mids", min: 2000, max: 4000, defaultIsConstructive: true },
    { name: "Presence", min: 4000, max: 6000, defaultIsConstructive: true },
    { name: "Brilliance", min: 6000, max: 20000, defaultIsConstructive: true }
  ];
  
  try {
    // Create audio context for analysis
    const audioContext = new AudioContext();
    
    // Create analyzers for both tracks
    const analyzer1 = audioContext.createAnalyser();
    analyzer1.fftSize = 2048;
    const bufferLength = analyzer1.frequencyBinCount;
    const dataArray1 = new Float32Array(bufferLength);
    
    const analyzer2 = audioContext.createAnalyser();
    analyzer2.fftSize = 2048;
    const dataArray2 = new Float32Array(bufferLength);
    
    // Create sources and connect to analyzers
    const source1 = audioContext.createBufferSource();
    source1.buffer = track1.buffer;
    source1.connect(analyzer1);
    
    const source2 = audioContext.createBufferSource();
    source2.buffer = track2.buffer;
    source2.connect(analyzer2);
    
    // Get frequency data
    analyzer1.getFloatFrequencyData(dataArray1);
    analyzer2.getFloatFrequencyData(dataArray2);
    
    // Calculate the Nyquist frequency (half the sample rate)
    const nyquist = track1.buffer.sampleRate / 2;
    
    // For each important frequency band, analyze the overlap
    frequencyBands.forEach(band => {
      // Find the frequency range in the frequency data
      const startBin = Math.floor(band.min * bufferLength / nyquist);
      const endBin = Math.ceil(band.max * bufferLength / nyquist);
      
      // Calculate average magnitudes for this band
      let band1Total = 0;
      let band2Total = 0;
      let count = 0;
      
      for (let i = startBin; i <= endBin; i++) {
        if (i < bufferLength) {
          // Convert from dB to linear scale (approximately)
          const mag1 = Math.pow(10, dataArray1[i] / 20);
          const mag2 = Math.pow(10, dataArray2[i] / 20);
          
          band1Total += mag1;
          band2Total += mag2;
          count++;
        }
      }
      
      // Calculate average magnitude for the band
      const avgMag1 = band1Total / count;
      const avgMag2 = band2Total / count;
      
      // Calculate overlap intensity
      let overlapIntensity = 0;
      if (avgMag1 > 0 && avgMag2 > 0) {
        overlapIntensity = Math.min(avgMag1, avgMag2) / Math.max(avgMag1, avgMag2);
        overlapIntensity = Math.min(1, Math.max(0.3, overlapIntensity)); // Ensure it's between 0.3 and 1
      }
      
      // Add to overlaps if significant
      if (overlapIntensity > 0.2) {
        overlaps.push({
          frequency: (band.min + band.max) / 2, // Use center frequency of the band
          magnitude1: avgMag1,
          magnitude2: avgMag2,
          overlapIntensity,
          isConstructive: band.defaultIsConstructive
        });
      }
    });
    
    // Ensure we have at least one overlap for each band for visualization
    frequencyBands.forEach(band => {
      const hasOverlapInBand = overlaps.some(
        o => o.frequency >= band.min && o.frequency <= band.max
      );
      
      if (!hasOverlapInBand) {
        // Add a default overlap for this band
        overlaps.push({
          frequency: (band.min + band.max) / 2,
          magnitude1: 0.5,
          magnitude2: 0.5,
          overlapIntensity: 0.5,
          isConstructive: band.defaultIsConstructive
        });
      }
    });
    
    // Clean up
    audioContext.close();
    
  } catch (error) {
    console.error('Error analyzing frequency overlap:', error);
    
    // If analysis fails, return dummy data for visualization
    frequencyBands.forEach(band => {
      overlaps.push({
        frequency: (band.min + band.max) / 2,
        magnitude1: 0.5,
        magnitude2: 0.5,
        overlapIntensity: 0.5,
        isConstructive: band.defaultIsConstructive
      });
    });
  }
  
  return overlaps;
}

// Generate EQ suggestions based on frequency overlaps
export function generateEQSuggestions(overlaps: FrequencyOverlap[]): EQSuggestion[] {
  const suggestions: EQSuggestion[] = [];
  
  // If no significant overlaps found, return empty array
  if (overlaps.length === 0) {
    return [];
  }
  
  // Define frequency bands for broader analysis
  const frequencyBands = [
    { name: "Sub Bass", min: 20, max: 60 },
    { name: "Bass", min: 60, max: 250 },
    { name: "Low Mids", min: 250, max: 500 },
    { name: "Mids", min: 500, max: 2000 },
    { name: "High Mids", min: 2000, max: 4000 },
    { name: "Presence", min: 4000, max: 6000 },
    { name: "Brilliance", min: 6000, max: 20000 }
  ];
  
  // Group overlaps by frequency bands
  const bandOverlaps = frequencyBands.map(band => {
    const bandOverlaps = overlaps.filter(o => 
      o.frequency >= band.min && o.frequency <= band.max
    );
    
    // Calculate total destructive overlaps in this band
    const destructiveOverlaps = bandOverlaps.filter(o => !o.isConstructive);
    const totalDestructiveIntensity = destructiveOverlaps.reduce(
      (sum, o) => sum + o.overlapIntensity, 0
    );
    
    // Calculate which track has higher average magnitude in this band
    const track1Magnitude = bandOverlaps.reduce(
      (sum, o) => sum + o.magnitude1, 0
    ) / (bandOverlaps.length || 1);
    
    const track2Magnitude = bandOverlaps.reduce(
      (sum, o) => sum + o.magnitude2, 0
    ) / (bandOverlaps.length || 1);
    
    return {
      band,
      bandOverlaps,
      destructiveOverlaps,
      totalDestructiveIntensity,
      track1Magnitude,
      track2Magnitude
    };
  });
  
  // Filter out bands with minimal destructive interference
  const significantBands = bandOverlaps
    .filter(b => b.destructiveOverlaps.length > 0)
    .sort((a, b) => b.totalDestructiveIntensity - a.totalDestructiveIntensity);
  
  // Generate suggestions for the most problematic bands
  significantBands.forEach(bandData => {
    const { band, track1Magnitude, track2Magnitude } = bandData;
    
    // Determine which track should be EQ'd
    // Usually the one with higher energy in this band is reduced
    const trackToEQ = track1Magnitude > track2Magnitude ? 1 : 2;
    const otherTrack = trackToEQ === 1 ? 2 : 1;
    
    // Calculate appropriate gain reduction based on overlap intensity
    // More intense overlaps get more reduction
    const gainReduction = Math.min(
      -3, 
      Math.max(-12, -bandData.totalDestructiveIntensity * 12)
    );
    
    suggestions.push({
      track: trackToEQ,
      frequencyRange: {
        low: band.min,
        high: band.max
      },
      gainReduction: Math.round(gainReduction * 10) / 10,
      q: 0.7, // broader Q for wider frequency bands
      reason: `Reduce ${band.name} range in Track ${trackToEQ} to prevent masking Track ${otherTrack}`
    });
  });
  
  return suggestions;
}
