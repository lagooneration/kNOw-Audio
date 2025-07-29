import * as Tone from 'tone';
import type { SpatialAudioData } from '../types/spatial-audio';

/**
 * Create a new spatial audio source
 */
export function createSpatialAudioSource(
  audioData: SpatialAudioData
): SpatialAudioData {
  // Create a panner node for spatial positioning
  const panner = new Tone.Panner3D({
    positionX: audioData.position?.x || 0,
    positionY: audioData.position?.y || 0,
    positionZ: audioData.position?.z || 0,
    // These are good defaults for realistic spatial audio
    refDistance: 1,
    rolloffFactor: 1.5,
    distanceModel: "exponential",
    maxDistance: 10000,
    panningModel: "HRTF" // More realistic 3D audio
  }).toDestination();
  
  // Return updated audio data with panner
  return {
    ...audioData,
    panner: panner.context.rawContext.createPanner() // Access the Web Audio API panner node
  };
}

/**
 * Update the position of a spatial audio source
 */
export function updateSpatialAudioPosition(
  audioData: SpatialAudioData, 
  position: { x: number; y: number; z: number }
): SpatialAudioData {
  if (audioData.panner) {
    audioData.panner.positionX.value = position.x;
    audioData.panner.positionY.value = position.y;
    audioData.panner.positionZ.value = position.z;
  }
  
  return {
    ...audioData,
    position
  };
}

/**
 * Update the listener position based on camera
 */
export function updateListenerPosition(
  position: { x: number; y: number; z: number },
  orientation: { 
    forward: { x: number; y: number; z: number }; 
    up: { x: number; y: number; z: number }; 
  }
) {
  // Get Tone.js context
  const listener = Tone.getContext().rawContext.listener;
  
  // Some browsers use the older setPosition method
  if (listener.positionX) {
    listener.positionX.value = position.x;
    listener.positionY.value = position.y;
    listener.positionZ.value = position.z;
  } else if (typeof listener.setPosition === 'function') {
    listener.setPosition(position.x, position.y, position.z);
  }
  
  // Set orientation (forward and up vectors)
  // [forward.x, forward.y, forward.z, up.x, up.y, up.z]
  if (listener.forwardX) {
    listener.forwardX.value = orientation.forward.x;
    listener.forwardY.value = orientation.forward.y;
    listener.forwardZ.value = orientation.forward.z;
    listener.upX.value = orientation.up.x;
    listener.upY.value = orientation.up.y;
    listener.upZ.value = orientation.up.z;
  } else if (typeof listener.setOrientation === 'function') {
    listener.setOrientation(
      orientation.forward.x, orientation.forward.y, orientation.forward.z,
      orientation.up.x, orientation.up.y, orientation.up.z
    );
  }
}

/**
 * Play or pause a spatial audio source
 */
export function toggleSpatialAudioPlayback(
  audioData: SpatialAudioData,
  shouldPlay: boolean
): SpatialAudioData {
  const player = new Tone.Player({
    url: audioData.url,
    loop: true,
    onload: () => {
      console.log(`Loaded audio: ${audioData.name}`);
    }
  });
  
  if (shouldPlay) {
    // Connect to panner for spatial audio
    if (audioData.panner) {
      player.connect(audioData.panner);
    } else {
      player.toDestination();
    }
    
    // Start playback
    player.start();
  } else {
    // Stop playback
    player.stop();
    player.disconnect();
  }
  
  return {
    ...audioData,
    isPlaying: shouldPlay
  };
}

/**
 * Create an FFT analyzer for visualizing audio frequency data
 */
export function createAudioAnalyzer(): Tone.Analyser {
  return new Tone.Analyser('fft', 512);
}

/**
 * Get FFT data from the analyzer
 */
export function getFFTData(analyzer: Tone.Analyser): Float32Array {
  return analyzer.getValue() as Float32Array;
}
