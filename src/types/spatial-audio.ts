import type { AudioData } from './audio';

// Extending the existing AudioData type with spatial audio properties
export interface SpatialAudioData extends AudioData {
  id: string;
  name: string;
  color: string;
  position: { x: number; y: number; z: number };
  isPlaying: boolean;
  volume: number;
  panner?: PannerNode;
  isSelected?: boolean;
}

// Types for the 3D spatial audio environment
export interface SpatialAudioEnvironment {
  audioSources: SpatialAudioData[];
  listenerPosition: { x: number; y: number; z: number };
  listenerOrientation: { 
    forward: { x: number; y: number; z: number };
    up: { x: number; y: number; z: number };
  };
  reverbLevel: number;
  roomSize: number;
}

// Audio placement information
export interface AudioPlacement {
  id: string;
  position: { x: number; y: number; z: number };
  isDragging: boolean;
}

export interface AudioLibraryItem {
  id: string;
  name: string;
  color: string;
  isLoading?: boolean;
  isPlaying?: boolean;
  error?: string;
  audioData?: AudioData;
}

export interface AudioLibrary {
  items: AudioLibraryItem[];
  selectedItemId: string | null;
}

// Types for audio blob visualization
export interface AudioBlobVisualization {
  audioId: string;
  position: { x: number; y: number; z: number };
  color: string;
  scale: number;
  intensity: number;
}
