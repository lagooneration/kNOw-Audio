// Audio Blob Shaders for real-time FFT visualization
import * as THREE from 'three';

export const createAudioBlobMaterial = (color: string, isPlaying: boolean) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color(color) },
      isPlaying: { value: isPlaying ? 1.0 : 0.0 },
      audioData: { value: new Float32Array(512) },
      opacity: { value: 0.8 },
      emissiveIntensity: { value: isPlaying ? 0.5 : 0.2 }
    },
    vertexShader: `
      uniform float time;
      uniform float isPlaying;
      uniform float audioData[512];

      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec3 vViewPosition;

      float getAudioValue(vec3 position) {
        // Calculate the audio data index based on position
        float angleRatio = (atan(position.z, position.x) + 3.14159) / 6.28318;
        int index = int(angleRatio * 128.0) % 128;
        return audioData[index] * 0.5;
      }

      void main() {
        vNormal = normal;
        vPosition = position;

        // Static position
        vec3 pos = position;
        
        if (isPlaying > 0.5) {
          // Get audio value for this vertex
          float audioValue = getAudioValue(position);
          
          // Apply audio-driven deformation
          float deformation = audioValue * 0.3;
          
          // Add time-based pulsing
          deformation += sin(time * 5.0) * 0.05;
          
          // Scale vertex position based on audio data
          pos = position * (1.0 + deformation);
        }
        
        // Calculate view position
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        vViewPosition = -mvPosition.xyz;
        
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float time;
      uniform float isPlaying;
      uniform float opacity;
      uniform float emissiveIntensity;

      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec3 vViewPosition;

      void main() {
        // Base color
        vec3 baseColor = color;
        
        // Enhance when playing
        if (isPlaying > 0.5) {
          // Add shimmer effect
          float shimmer = sin(time * 5.0 + vPosition.x * 10.0 + vPosition.y * 8.0 + vPosition.z * 6.0) * 0.1 + 0.9;
          baseColor *= shimmer;
          
          // Add subtle color shift with time
          float hueShift = sin(time * 0.2) * 0.1;
          baseColor.r += hueShift;
          baseColor.g += hueShift * 0.5;
          baseColor.b += hueShift * 0.25;
        }
        
        // Apply rim lighting effect
        vec3 viewDir = normalize(vViewPosition);
        float rimFactor = 1.0 - max(0.0, dot(vNormal, viewDir));
        rimFactor = pow(rimFactor, 3.0);
        vec3 rimColor = color * 1.5;
        
        // Final color with rim effect
        vec3 finalColor = mix(baseColor, rimColor, rimFactor * 0.6);
        
        // Add glow effect when playing
        if (isPlaying > 0.5) {
          finalColor *= 1.0 + emissiveIntensity * 0.5;
        }
        
        gl_FragColor = vec4(finalColor, opacity);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide
  });
};

// Update shader uniforms with FFT data
export const updateAudioBlobShader = (
  material: THREE.ShaderMaterial, 
  fftData: Float32Array,
  isPlaying: boolean,
  time: number
) => {
  if (material && material.uniforms) {
    material.uniforms.time.value = time;
    material.uniforms.isPlaying.value = isPlaying ? 1.0 : 0.0;
    
    // Only update audio data if playing
    if (isPlaying && fftData && fftData.length > 0) {
      // Create a copy of the data to avoid reference issues
      const audioDataArray = new Float32Array(512);
      
      // Normalize FFT data for better visualization
      for (let i = 0; i < fftData.length && i < 512; i++) {
        // Convert dB values to normalized range and add some base value
        audioDataArray[i] = Math.max(0, (fftData[i] + 140) / 70);
      }
      
      material.uniforms.audioData.value = audioDataArray;
    }
  }
};
