export interface AudioData {
  buffer: AudioBuffer;
  file: File;
  url: string;
  metadata: AudioMetadata;
  features: AudioFeatures;
  analysis: AudioAnalysis;
}

export interface AudioMetadata {
  name: string;
  size: number;
  type: string;
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
}

export interface AudioFeatures {
  timeMarkers: AudioMarker[];
  frequencyPeaks: FrequencyPeak[];
  beats: Beat[];
  spectrogram: SpectrogramData;
  rms: number[];
}

export interface AudioAnalysis {
  hasSpeech: boolean;
  speechSegments: TimeSegment[];
  hasMusicElements: boolean;
  musicSegments: TimeSegment[];
  hasEnvironmentalSounds: boolean;
  environmentalSoundSegments: TimeSegment[];
  dominantFrequencyRanges: FrequencyRange[];
  summary: string;
}

export interface AudioMarker {
  id: string;
  time: number;
  label: string;
  type: 'speech' | 'music' | 'environmental' | 'custom';
  confidence: number;
}

export interface FrequencyPeak {
  frequency: number;
  magnitude: number;
  time: number;
}

export interface Beat {
  time: number;
  confidence: number;
}

export interface SpectrogramData {
  data: Float32Array[];
  minDecibels: number;
  maxDecibels: number;
}

export interface TimeSegment {
  start: number;
  end: number;
  type: string;
  confidence: number;
}

export interface FrequencyRange {
  min: number;
  max: number;
  intensity: number;
  label: string;
}
