import { 
  type AudioData, 
  type AudioMetadata, 
  type AudioFeatures, 
  type AudioAnalysis, 
  type AudioMarker, 
  type FrequencyPeak, 
  type Beat, 
  type TimeSegment,
  type FrequencyRange
} from '../types/audio';

// Decode audio file to an AudioBuffer
export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    
    fileReader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        resolve(audioBuffer);
      } catch (error) {
        reject(error);
      }
    };
    
    fileReader.onerror = (error) => {
      reject(error);
    };
    
    fileReader.readAsArrayBuffer(file);
  });
}

// Extract metadata from AudioBuffer and File
export function extractMetadata(audioBuffer: AudioBuffer, file: File): AudioMetadata {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    numberOfChannels: audioBuffer.numberOfChannels
  };
}

// Extract audio features
export function extractFeatures(audioBuffer: AudioBuffer): AudioFeatures {
  // This is a simplified implementation
  // In a real application, you would use more sophisticated algorithms
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  
  // Calculate RMS (Root Mean Square) values
  const rmsWindowSize = Math.floor(sampleRate * 0.02); // 20ms window
  const rms = calculateRMS(channelData, rmsWindowSize);
  
  // Detect beats (simplified implementation)
  const beats = detectBeats(rms, sampleRate);
  
  // Detect frequency peaks (simplified implementation)
  const frequencyPeaks = detectFrequencyPeaks(audioBuffer);
  
  // Generate spectrogram data
  const spectrogram = generateSpectrogram(audioBuffer);
  
  // Detect time markers (placeholder)
  const timeMarkers = detectTimeMarkers(beats, frequencyPeaks);
  
  return {
    timeMarkers,
    frequencyPeaks,
    beats,
    spectrogram,
    rms
  };
}

// Calculate RMS values
function calculateRMS(channelData: Float32Array, windowSize: number): number[] {
  const rmsValues: number[] = [];
  
  for (let i = 0; i < channelData.length; i += windowSize) {
    let sum = 0;
    const end = Math.min(i + windowSize, channelData.length);
    
    for (let j = i; j < end; j++) {
      sum += channelData[j] * channelData[j];
    }
    
    const rms = Math.sqrt(sum / (end - i));
    rmsValues.push(rms);
  }
  
  return rmsValues;
}

// Detect beats (simplified)
function detectBeats(rmsValues: number[], sampleRate: number): Beat[] {
  const beats: Beat[] = [];
  const threshold = 0.05;
  const minDistance = Math.floor(sampleRate * 0.01 / (sampleRate * 0.02)); // At least 10ms between beats
  
  let lastBeatIndex = -minDistance;
  
  for (let i = 1; i < rmsValues.length - 1; i++) {
    if (
      i - lastBeatIndex >= minDistance &&
      rmsValues[i] > threshold &&
      rmsValues[i] > rmsValues[i - 1] &&
      rmsValues[i] >= rmsValues[i + 1]
    ) {
      const time = i * 0.02; // Each RMS value represents 20ms
      const confidence = Math.min(1, rmsValues[i] * 5);
      
      beats.push({
        time,
        confidence
      });
      
      lastBeatIndex = i;
    }
  }
  
  return beats;
}

// Detect frequency peaks (simplified)
function detectFrequencyPeaks(audioBuffer: AudioBuffer): FrequencyPeak[] {
  const peaks: FrequencyPeak[] = [];
  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0);
  
  const fftSize = 2048;
  const hopSize = fftSize / 4;
  
  for (let offset = 0; offset < channelData.length; offset += hopSize) {
    const segment = channelData.slice(offset, offset + fftSize);
    if (segment.length < fftSize) break;
    
    // Create FFT analyzer
    const audioContext = new OfflineAudioContext(1, fftSize, sampleRate);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = fftSize;
    
    const source = audioContext.createBufferSource();
    const tempBuffer = audioContext.createBuffer(1, fftSize, sampleRate);
    tempBuffer.getChannelData(0).set(segment);
    source.buffer = tempBuffer;
    
    source.connect(analyser);
    
    const frequencyData = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(frequencyData);
    
    // Find peaks in frequency data
    const threshold = -50; // dB threshold
    for (let i = 1; i < frequencyData.length - 1; i++) {
      if (
        frequencyData[i] > threshold &&
        frequencyData[i] > frequencyData[i - 1] &&
        frequencyData[i] > frequencyData[i + 1]
      ) {
        const frequency = i * sampleRate / fftSize;
        const magnitude = frequencyData[i];
        const time = offset / sampleRate;
        
        peaks.push({
          frequency,
          magnitude,
          time
        });
      }
    }
  }
  
  // Limit to top peaks
  return peaks.sort((a, b) => b.magnitude - a.magnitude).slice(0, 100);
}

// Generate spectrogram data
function generateSpectrogram(audioBuffer: AudioBuffer) {
  const channelData = audioBuffer.getChannelData(0);
  const fftSize = 2048;
  const hopSize = fftSize / 4;
  const spectrogramData: Float32Array[] = [];
  
  for (let offset = 0; offset < channelData.length; offset += hopSize) {
    const segment = channelData.slice(offset, offset + fftSize);
    if (segment.length < fftSize) break;
    
    // Create FFT analyzer
    const audioContext = new OfflineAudioContext(1, fftSize, audioBuffer.sampleRate);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = fftSize;
    
    const source = audioContext.createBufferSource();
    const tempBuffer = audioContext.createBuffer(1, fftSize, audioBuffer.sampleRate);
    tempBuffer.getChannelData(0).set(segment);
    source.buffer = tempBuffer;
    
    source.connect(analyser);
    
    const frequencyData = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(frequencyData);
    
    spectrogramData.push(frequencyData);
  }
  
  return {
    data: spectrogramData,
    minDecibels: -100,
    maxDecibels: 0
  };
}

// Detect time markers (placeholder implementation)
function detectTimeMarkers(
  beats: Beat[],
  frequencyPeaks: FrequencyPeak[]
): AudioMarker[] {
  const markers: AudioMarker[] = [];
  
  // Convert some beats to markers
  beats.filter((_, i) => i % 10 === 0).forEach((beat, i) => {
    markers.push({
      id: `beat-${i}`,
      time: beat.time,
      label: `Beat ${i + 1}`,
      type: 'music',
      confidence: beat.confidence
    });
  });
  
  // Create markers for significant frequency peaks
  const significantPeaks = frequencyPeaks
    .filter(peak => peak.magnitude > -30)
    .slice(0, 5);
  
  significantPeaks.forEach((peak, i) => {
    let type: 'speech' | 'music' | 'environmental' | 'custom' = 'environmental';
    
    // Simple heuristic for type classification
    if (peak.frequency < 300) {
      type = 'environmental';
    } else if (peak.frequency < 3000) {
      type = 'speech';
    } else {
      type = 'music';
    }
    
    markers.push({
      id: `peak-${i}`,
      time: peak.time,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} @ ${Math.round(peak.frequency)}Hz`,
      type,
      confidence: (peak.magnitude + 100) / 100 // Normalize to 0-1
    });
  });
  
  return markers.sort((a, b) => a.time - b.time);
}

// Analyze audio content
export function analyzeAudio(audioBuffer: AudioBuffer, features: AudioFeatures): AudioAnalysis {
  // Simplified analysis - in a real application, you'd use machine learning models
  
  // Detect speech segments based on frequency content
  const speechSegments = detectSpeechSegments(features);
  
  // Detect music segments based on rhythmic features
  const musicSegments = detectMusicSegments(audioBuffer, features);
  
  // Detect environmental sounds
  const environmentalSoundSegments = detectEnvironmentalSounds(features);
  
  // Analyze dominant frequency ranges
  const dominantFrequencyRanges = analyzeDominantFrequencyRanges(features);
  
  // Generate summary
  const summary = generateAudioSummary(
    audioBuffer,
    features,
    speechSegments,
    musicSegments,
    environmentalSoundSegments,
    dominantFrequencyRanges
  );
  
  return {
    hasSpeech: speechSegments.length > 0,
    speechSegments,
    hasMusicElements: musicSegments.length > 0,
    musicSegments,
    hasEnvironmentalSounds: environmentalSoundSegments.length > 0,
    environmentalSoundSegments,
    dominantFrequencyRanges,
    summary
  };
}

// Detect speech segments (simplified)
function detectSpeechSegments(features: AudioFeatures): TimeSegment[] {
  const segments: TimeSegment[] = [];
  const speechMarkers = features.timeMarkers.filter(marker => marker.type === 'speech');
  
  // Group nearby speech markers into segments
  const maxGap = 0.5; // Maximum gap between markers to be considered same segment (in seconds)
  let currentSegment: TimeSegment | null = null;
  
  for (const marker of speechMarkers) {
    if (!currentSegment) {
      currentSegment = {
        start: marker.time,
        end: marker.time + 0.1,
        type: 'speech',
        confidence: marker.confidence
      };
    } else if (marker.time - currentSegment.end < maxGap) {
      // Extend current segment
      currentSegment.end = marker.time + 0.1;
      currentSegment.confidence = (currentSegment.confidence + marker.confidence) / 2;
    } else {
      // Finish current segment and start a new one
      segments.push(currentSegment);
      currentSegment = {
        start: marker.time,
        end: marker.time + 0.1,
        type: 'speech',
        confidence: marker.confidence
      };
    }
  }
  
  // Add the last segment if it exists
  if (currentSegment) {
    segments.push(currentSegment);
  }
  
  return segments;
}

// Detect music segments (simplified)
function detectMusicSegments(audioBuffer: AudioBuffer, features: AudioFeatures): TimeSegment[] {
  const segments: TimeSegment[] = [];
  
  // Use beats to detect rhythmic patterns
  if (features.beats.length > 10) {
    // Calculate average beat interval
    let totalInterval = 0;
    let intervalCount = 0;
    
    for (let i = 1; i < features.beats.length; i++) {
      const interval = features.beats[i].time - features.beats[i - 1].time;
      if (interval > 0 && interval < 2) { // Reasonable beat interval
        totalInterval += interval;
        intervalCount++;
      }
    }
    
    const avgInterval = totalInterval / intervalCount;
    const intervalRegularity = features.beats.length / audioBuffer.duration;
    
    // If we have regular beats, consider it music
    if (intervalRegularity > 0.5 && avgInterval > 0) {
      segments.push({
        start: features.beats[0].time,
        end: features.beats[features.beats.length - 1].time,
        type: 'music',
        confidence: 0.7
      });
    }
  }
  
  return segments;
}

// Detect environmental sounds (simplified)
function detectEnvironmentalSounds(features: AudioFeatures): TimeSegment[] {
  const segments: TimeSegment[] = [];
  const envMarkers = features.timeMarkers.filter(marker => marker.type === 'environmental');
  
  // Group nearby environmental markers into segments
  const maxGap = 0.5; // Maximum gap between markers to be considered same segment (in seconds)
  let currentSegment: TimeSegment | null = null;
  
  for (const marker of envMarkers) {
    if (!currentSegment) {
      currentSegment = {
        start: marker.time,
        end: marker.time + 0.1,
        type: 'environmental',
        confidence: marker.confidence
      };
    } else if (marker.time - currentSegment.end < maxGap) {
      // Extend current segment
      currentSegment.end = marker.time + 0.1;
      currentSegment.confidence = (currentSegment.confidence + marker.confidence) / 2;
    } else {
      // Finish current segment and start a new one
      segments.push(currentSegment);
      currentSegment = {
        start: marker.time,
        end: marker.time + 0.1,
        type: 'environmental',
        confidence: marker.confidence
      };
    }
  }
  
  // Add the last segment if it exists
  if (currentSegment) {
    segments.push(currentSegment);
  }
  
  return segments;
}

// Analyze dominant frequency ranges
function analyzeDominantFrequencyRanges(features: AudioFeatures): FrequencyRange[] {
  // Create frequency bins
  const ranges: FrequencyRange[] = [
    { min: 20, max: 60, intensity: 0, label: 'Sub Bass' },
    { min: 60, max: 250, intensity: 0, label: 'Bass' },
    { min: 250, max: 500, intensity: 0, label: 'Low Midrange' },
    { min: 500, max: 2000, intensity: 0, label: 'Midrange' },
    { min: 2000, max: 4000, intensity: 0, label: 'Upper Midrange' },
    { min: 4000, max: 6000, intensity: 0, label: 'Presence' },
    { min: 6000, max: 20000, intensity: 0, label: 'Brilliance' }
  ];
  
  // Count frequency peaks in each range
  for (const peak of features.frequencyPeaks) {
    for (const range of ranges) {
      if (peak.frequency >= range.min && peak.frequency < range.max) {
        // Normalize magnitude to 0-1 range (approximately)
        const normalizedMagnitude = (peak.magnitude + 100) / 100;
        range.intensity += normalizedMagnitude;
        break;
      }
    }
  }
  
  // Normalize intensities
  const maxIntensity = Math.max(...ranges.map(r => r.intensity));
  if (maxIntensity > 0) {
    ranges.forEach(range => {
      range.intensity = range.intensity / maxIntensity;
    });
  }
  
  return ranges;
}

// Generate audio summary
function generateAudioSummary(
  audioBuffer: AudioBuffer,
  features: AudioFeatures,
  speechSegments: TimeSegment[],
  musicSegments: TimeSegment[],
  environmentalSoundSegments: TimeSegment[],
  dominantFrequencyRanges: FrequencyRange[]
): string {
  let summary = `Audio file analysis (${audioBuffer.duration.toFixed(2)} seconds):\n\n`;
  
  // Describe overall content
  const contentTypes: string[] = [];
  if (speechSegments.length > 0) contentTypes.push('speech');
  if (musicSegments.length > 0) contentTypes.push('music');
  if (environmentalSoundSegments.length > 0) contentTypes.push('environmental sounds');
  
  if (contentTypes.length === 0) {
    summary += 'The audio appears to contain no easily identifiable speech, music, or environmental sounds.\n\n';
  } else {
    summary += `The audio contains ${contentTypes.join(', ')}.\n\n`;
  }
  
  // Describe speech if present
  if (speechSegments.length > 0) {
    const totalSpeechDuration = speechSegments.reduce((sum, seg) => sum + (seg.end - seg.start), 0);
    const speechPercentage = (totalSpeechDuration / audioBuffer.duration) * 100;
    
    summary += `Speech detected for approximately ${speechPercentage.toFixed(1)}% of the audio.\n`;
    
    if (speechSegments.length > 1) {
      summary += `Found ${speechSegments.length} separate speech segments.\n\n`;
    } else {
      summary += 'Speech appears to be continuous throughout the detected segment.\n\n';
    }
  }
  
  // Describe music if present
  if (musicSegments.length > 0) {
    const totalMusicDuration = musicSegments.reduce((sum, seg) => sum + (seg.end - seg.start), 0);
    const musicPercentage = (totalMusicDuration / audioBuffer.duration) * 100;
    
    summary += `Musical patterns detected for approximately ${musicPercentage.toFixed(1)}% of the audio.\n`;
    
    // Add information about rhythm if we have beats
    if (features.beats.length > 0) {
      const beatsPerMinute = (features.beats.length / audioBuffer.duration) * 60;
      if (beatsPerMinute > 40) {
        summary += `The tempo is approximately ${Math.round(beatsPerMinute)} BPM.\n\n`;
      }
    }
  }
  
  // Describe dominant frequency characteristics
  const sortedRanges = [...dominantFrequencyRanges].sort((a, b) => b.intensity - a.intensity);
  const topRanges = sortedRanges.filter(r => r.intensity > 0.3).slice(0, 3);
  
  if (topRanges.length > 0) {
    summary += 'Dominant frequency characteristics:\n';
    topRanges.forEach(range => {
      summary += `- ${range.label} (${range.min}-${range.max}Hz): ${(range.intensity * 100).toFixed(1)}% intensity\n`;
    });
    
    // Interpret what these frequencies might represent
    if (topRanges[0].min < 250) {
      summary += '\nThe audio has significant low-frequency content, suggesting bass instruments, rumbling, or low-pitched voices.\n';
    } else if (topRanges[0].min >= 250 && topRanges[0].max <= 2000) {
      summary += '\nThe audio is dominated by mid-range frequencies, typical of human speech and many musical instruments.\n';
    } else {
      summary += '\nThe audio has prominent high-frequency content, suggesting bright sounds, cymbals, or high-pitched tones.\n';
    }
  }
  
  return summary;
}

// Main function to process an audio file
export async function processAudioFile(file: File): Promise<AudioData> {
  try {
    // Create object URL for the file
    const url = URL.createObjectURL(file);
    
    // Decode the audio
    const buffer = await decodeAudioFile(file);
    
    // Extract metadata
    const metadata = extractMetadata(buffer, file);
    
    // Extract features
    const features = extractFeatures(buffer);
    
    // Analyze audio content
    const analysis = analyzeAudio(buffer, features);
    
    // Return complete audio data
    return {
      buffer,
      file,
      url,
      metadata,
      features,
      analysis
    };
  } catch (error) {
    console.error('Error processing audio file:', error);
    throw error;
  }
}
