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
      emissiveIntensity: { value: isPlaying ? 0.6 : 0.2 }, // Reduced intensity
      frequencyRange: { value: new THREE.Vector2(0, 512) },
      scale: { value: 1.0 }
    },
    vertexShader: `
      uniform float time;
      uniform float isPlaying;
      uniform float audioData[512];

      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec3 vViewPosition;
      varying float vAudioValue;

      // Hash function for noise
      float hash(float n) {
        return fract(sin(n) * 43758.5453);
      }
      
      // Noise function for more organic movement
      float noise(vec3 x) {
        vec3 p = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        
        float n = p.x + p.y * 157.0 + 113.0 * p.z;
        return mix(
          mix(
            mix(hash(n + 0.0), hash(n + 1.0), f.x),
            mix(hash(n + 157.0), hash(n + 158.0), f.x),
            f.y),
          mix(
            mix(hash(n + 113.0), hash(n + 114.0), f.x),
            mix(hash(n + 270.0), hash(n + 271.0), f.x),
            f.y),
          f.z);
      }

      float getAudioValue(vec3 position) {
        // Calculate the audio data index based on position and angle
        float angleRatio = (atan(position.z, position.x) + 3.14159) / 6.28318;
        int index = int(mod(angleRatio * 128.0, 128.0));
        
        // Add influence from nearby indices for smoother transitions
        float value = audioData[index] * 0.6;
        value += audioData[int(mod(float(index) + 1.0, 128.0))] * 0.2;
        value += audioData[int(mod(float(index) - 1.0, 128.0))] * 0.2;
        
        return value;
      }

      void main() {
        vNormal = normal;
        vPosition = position;

        // Base position
        vec3 pos = position;
        float audioValue = 0.0;
        
        if (isPlaying > 0.5) {
          // Get audio value for this vertex
          audioValue = getAudioValue(position);
          vAudioValue = audioValue; // Pass to fragment shader
          
          // Create more organic deformation using noise
          float noiseValue = noise(position * 3.0 + time * 0.5) * 0.2;
          
          // Calculate overall amplitude for global scaling
          float globalAmplitude = 0.0;
          for (int i = 0; i < 128; i++) {
            globalAmplitude += abs(audioData[i]);
          }
          globalAmplitude = globalAmplitude / 128.0;
          
          // Apply non-linear mapping for more responsive scaling
          float amplitudeScale = pow(globalAmplitude, 1.2) * 0.6;
          
          // Combine effects for vertex displacement
          float deformation = audioValue * 0.4 + noiseValue;
          
          // Add frequency-dependent details - higher frequencies create more detailed displacement
          float radius = length(position.xz);
          float frequencyScale = smoothstep(0.0, 1.0, radius * 2.0);
          
          // Add dynamic spikes based on audio amplitude
          if (audioValue > 0.3) {
            float spikeIntensity = (audioValue - 0.3) * 1.5;
            float spikes = noise(position * 10.0 + time) * spikeIntensity;
            deformation += spikes * frequencyScale * 0.5;
          }
          
          // Scale vertex position based on combined deformation and global amplitude
          pos = position * (1.0 + deformation * max(0.3, frequencyScale) + amplitudeScale);
        } else {
          // Subtle ambient motion when not playing
          float ambientMotion = noise(position * 2.0 + time * 0.2) * 0.05;
          pos = position * (1.0 + ambientMotion);
          vAudioValue = 0.0;
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
      varying float vAudioValue;

      void main() {
        // Base color
        vec3 baseColor = color;
        
        // Enhance when playing
        if (isPlaying > 0.5) {
          // Add shimmer effect based on audio intensity
          float shimmerSpeed = 5.0 + vAudioValue * 10.0;
          float shimmer = sin(time * shimmerSpeed + vPosition.x * 10.0 + vPosition.y * 8.0 + vPosition.z * 6.0) * 0.1 + 0.9;
          baseColor *= shimmer;
          
          // Add audio reactivity to color intensity
          float intensity = emissiveIntensity + vAudioValue * 1.3;
          baseColor *= 1.0 + intensity * 0.6;
          
          // Add subtle color shift based on audio intensity
          float hueShift = sin(time * 0.2) * 0.1 + vAudioValue * 0.3;
          baseColor.r += hueShift;
          baseColor.g += hueShift * 0.5;
          baseColor.b += sin(time * 0.3) * 0.1 + vAudioValue * 0.2;
          
          // Add frequency-based color highlights
          float highlight = pow(vAudioValue, 2.5) * 1.0;
          baseColor += vec3(highlight * 0.6, highlight * 0.4, highlight * 0.2);
        }
        
        // Apply rim lighting effect for 3D depth
        vec3 viewDir = normalize(vViewPosition);
        float rimFactor = 1.0 - max(0.0, dot(vNormal, viewDir));
        rimFactor = pow(rimFactor, 3.0);
        vec3 rimColor = color * 1.5; // Reduced intensity
        
        // Final color with rim effect
        vec3 finalColor = mix(baseColor, rimColor, rimFactor * 0.5);
        
        // Add extra glow effect when playing based on audio amplitude
        if (isPlaying > 0.5) {
          // Calculate audio-responsive glow intensity
          float glowIntensity = emissiveIntensity * 0.6 + vAudioValue * 0.8;
          finalColor *= 1.0 + glowIntensity;
          
          // Add audio-reactive highlights for peaks
          if (vAudioValue > 0.5) {
            float pulseHighlight = (vAudioValue - 0.5) * 2.0;
            finalColor += vec3(pulseHighlight, pulseHighlight * 0.7, pulseHighlight * 0.4);
          }
        }
        
        // Dynamic opacity based on audio for pulse effect
        float finalOpacity = opacity;
        if (isPlaying > 0.5) {
          // Make opacity respond to audio amplitude for a subtle pulsing effect
          finalOpacity = opacity * (0.8 + vAudioValue * 0.4);
        }
        
        gl_FragColor = vec4(finalColor, finalOpacity);
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
      
      // Get previous frame data for smooth transitions
      const previousData = material.uniforms.audioData.value;
      
      // Get audio spectrum average for scaling effects
      let spectrumAvg = 0;
      let peakValue = 0;
      
      // Enhanced normalization of FFT data for better visualization
      for (let i = 0; i < fftData.length && i < 512; i++) {
        // Convert dB values (typically -100 to 0) to normalized range (0 to 1)
        let value = Math.max(0, (fftData[i] + 140) / 60);
        
        // Boost middle frequencies for more interesting visuals - less aggressive
        if (i > 20 && i < 100) {
          value *= 1.5;
        }
        
        // Boost high frequencies to make them visible but less intense
        if (i > 100) {
          value *= 1.8;
        }
        
        // Apply a lower limit to ensure some movement even with quiet audio
        value = Math.max(value, 0.05);
        
        // Clamp maximum values to avoid excessive glow
        value = Math.min(value, 0.8);
        
        // Track peak and average values
        peakValue = Math.max(peakValue, value);
        spectrumAvg += value;
        
        // Apply smoothing with previous frame if available
        if (previousData && previousData[i]) {
          // Adaptive smoothing - less smoothing for sudden peaks
          const smoothFactor = value > previousData[i] * 1.5 ? 0.8 : 0.7;
          audioDataArray[i] = value * smoothFactor + previousData[i] * (1.0 - smoothFactor);
        } else {
          audioDataArray[i] = value;
        }
      }
      
      // Calculate average
      spectrumAvg /= fftData.length;
      
      // Apply some smoothing across adjacent frequency bins
      for (let i = 1; i < audioDataArray.length - 1; i++) {
        audioDataArray[i] = (
          audioDataArray[i-1] * 0.2 + 
          audioDataArray[i] * 0.6 + 
          audioDataArray[i+1] * 0.2
        );
      }
      
      // Set dynamic scale based on audio intensity
      // Calculate the overall audio intensity from the spectrum
      const audioIntensity = Math.min(1.0, spectrumAvg * 3.0);
      
      // Map the intensity to a scale value with a non-linear response curve
      // This creates more dynamic movement that responds to the audio energy
      const baseBlobScale = 1.0;
      const maxScaleIncrease = 0.6; // Maximum size increase
      const dynamicScale = baseBlobScale + (Math.pow(audioIntensity, 1.2) * maxScaleIncrease);
      
      material.uniforms.scale.value = dynamicScale;
      
      material.uniforms.audioData.value = audioDataArray;
    }
  }
};
