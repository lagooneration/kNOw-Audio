import * as THREE from 'three';

// Perlin noise implementation for the audio blob
export const createPerlinNoiseBlobMaterial = (color: string, isPlaying: boolean) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uFrequency: { value: 0.0 }, // Audio frequency data
      uIsPlaying: { value: isPlaying ? 1.0 : 0.0 },
      uAudioData: { value: new Float32Array(512) },
      uOpacity: { value: 0.8 }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uIsPlaying;
      uniform float uAudioData[512];
      uniform float uFrequency;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vAudioValue;

      // Modulo 289 without a division
      vec3 mod289(vec3 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }

      vec4 mod289(vec4 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }

      // Permutation polynomial (expanded and optimized)
      vec4 permute(vec4 x) {
        return mod289(((x*34.0)+10.0)*x);
      }

      // Taylor's inverse square root approximation
      vec4 taylorInvSqrt(vec4 r) {
        return 1.79284291400159 - 0.85373472095314 * r;
      }

      // Quintic interpolation curve
      vec3 fade(vec3 t) {
        return t*t*t*(t*(t*6.0-15.0)+10.0);
      }

      // Classic Perlin noise with periodic variant
      float pnoise(vec3 P, vec3 rep) {
        vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
        vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
        Pi0 = mod289(Pi0);
        Pi1 = mod289(Pi1);
        vec3 Pf0 = fract(P); // Fractional part for interpolation
        vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
        vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
        vec4 iy = vec4(Pi0.yy, Pi1.yy);
        vec4 iz0 = Pi0.zzzz;
        vec4 iz1 = Pi1.zzzz;

        vec4 ixy = permute(permute(ix) + iy);
        vec4 ixy0 = permute(ixy + iz0);
        vec4 ixy1 = permute(ixy + iz1);

        vec4 gx0 = ixy0 * (1.0 / 7.0);
        vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
        gx0 = fract(gx0);
        vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
        vec4 sz0 = step(gz0, vec4(0.0));
        gx0 -= sz0 * (step(0.0, gx0) - 0.5);
        gy0 -= sz0 * (step(0.0, gy0) - 0.5);

        vec4 gx1 = ixy1 * (1.0 / 7.0);
        vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
        gx1 = fract(gx1);
        vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
        vec4 sz1 = step(gz1, vec4(0.0));
        gx1 -= sz1 * (step(0.0, gx1) - 0.5);
        gy1 -= sz1 * (step(0.0, gy1) - 0.5);

        vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
        vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
        vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
        vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
        vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
        vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
        vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
        vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

        vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
        vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));

        float n000 = norm0.x * dot(g000, Pf0);
        float n010 = norm0.y * dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
        float n100 = norm0.z * dot(g100, vec3(Pf1.x, Pf0.yz));
        float n110 = norm0.w * dot(g110, vec3(Pf1.xy, Pf0.z));
        float n001 = norm1.x * dot(g001, vec3(Pf0.xy, Pf1.z));
        float n011 = norm1.y * dot(g011, vec3(Pf0.x, Pf1.yz));
        float n101 = norm1.z * dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
        float n111 = norm1.w * dot(g111, Pf1);

        vec3 fade_xyz = fade(Pf0);
        vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
        vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
        float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
        return 2.2 * n_xyz;
      }

      float getAudioValue(vec3 position) {
        // Calculate the audio data index based on position and angle
        float angleRatio = (atan(position.z, position.x) + 3.14159) / 6.28318;
        int index = int(mod(angleRatio * 128.0, 128.0));
        
        // Add influence from nearby indices for smoother transitions
        float value = uAudioData[index] * 0.6;
        value += uAudioData[int(mod(float(index) + 1.0, 128.0))] * 0.2;
        value += uAudioData[int(mod(float(index) - 1.0, 128.0))] * 0.2;
        
        return value;
      }

      void main() {
        vUv = uv;
        vNormal = normal;
        vPosition = position;
        
        // Base position
        vec3 newPosition = position;
        float audioValue = 0.0;
        
        if (uIsPlaying > 0.5) {
          // Calculate Perlin noise
          float noise = 4.0 * pnoise(position + uTime, vec3(10.0));
          
          // Calculate displacement based on audio frequency
          float displacement = (uFrequency / 60.0) * (noise / 10.0);
          
          // Get audio value for this vertex
          audioValue = getAudioValue(position);
          vAudioValue = audioValue; // Pass to fragment shader
          
          // Audio-reactive vertex displacement
          // Combine noise and audio for more organic motion
          // Increase the audio influence for more dramatic effect in wireframe mode
          newPosition = position + normal * (displacement + audioValue * 0.8);
        } else {
          // Subtle ambient motion when not playing
          float ambientNoise = pnoise(position * 2.0 + uTime * 0.2, vec3(10.0)) * 0.05;
          newPosition = position + normal * ambientNoise;
          vAudioValue = 0.0;
        }
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uIsPlaying;
      uniform float uOpacity;
      
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vAudioValue;
      
      void main() {
        // Base color
        vec3 baseColor = uColor;
        
        // Dynamic coloring when playing - enhanced for wireframe mode
        if (uIsPlaying > 0.5) {
          // Add shimmer effect based on time and position
          float shimmer = sin(uTime * 5.0 + vPosition.x * 10.0 + vPosition.y * 8.0 + vPosition.z * 6.0) * 0.1 + 0.9;
          baseColor *= shimmer;
          
          // Add audio reactivity to color - increased for wireframe visibility
          baseColor *= 1.0 + vAudioValue * 1.2;
          
          // Add color shift with audio intensity - more pronounced for wireframe
          float hueShift = sin(uTime * 0.2) * 0.1 + vAudioValue * 0.5;
          baseColor.r += hueShift;
          baseColor.g += hueShift * 0.7;
          baseColor.b += sin(uTime * 0.3) * 0.1 + vAudioValue * 0.4;
          
          // Add audio-reactive highlights - brighter for wireframe
          float highlight = pow(vAudioValue, 1.8) * 1.5;
          baseColor += vec3(highlight * 0.7, highlight * 0.5, highlight * 0.3);
        }
        
        // Apply rim lighting effect
        vec3 viewDirection = normalize(cameraPosition - vPosition);
        float rimLight = 1.0 - max(0.0, dot(vNormal, viewDirection));
        rimLight = pow(rimLight, 3.0);
        vec3 rimColor = uColor * 2.0;
        
        // Blend base color with rim lighting
        vec3 finalColor = mix(baseColor, rimColor, rimLight * 0.7);
        
        // Dynamic opacity based on audio intensity
        float finalOpacity = uOpacity;
        if (uIsPlaying > 0.5) {
          finalOpacity = uOpacity * (0.7 + vAudioValue * 0.5);
        }
        
        gl_FragColor = vec4(finalColor, finalOpacity);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    wireframe: true
  });
};

// Update shader uniforms with audio frequency data
export const updatePerlinNoiseBlobShader = (
  material: THREE.ShaderMaterial, 
  fftData: Float32Array,
  isPlaying: boolean,
  time: number
) => {
  if (!material || !material.uniforms) return;
  
  // Update time and playing state
  material.uniforms.uTime.value = time;
  material.uniforms.uIsPlaying.value = isPlaying ? 1.0 : 0.0;
  
  // Only update audio data if playing
  if (isPlaying && fftData && fftData.length > 0) {
    // Create a normalized copy of the audio data
    const audioDataArray = new Float32Array(512);
    
    // Get the average frequency value for global scale
    let averageFrequency = 0;
    
      // Process and normalize the FFT data
    for (let i = 0; i < fftData.length && i < 512; i++) {
      // Convert dB values (typically -100 to 0) to normalized range (0 to 1)
      let value = Math.max(0, (fftData[i] + 140) / 60);
      
      // Boost middle frequencies for more interesting visuals
      if (i > 20 && i < 100) {
        value *= 2.0; // Increased boost for wireframe
      }
      
      // Boost high frequencies 
      if (i > 100) {
        value *= 2.5; // Increased boost for wireframe
      }
      
      // Apply a minimum threshold to ensure some movement
      value = Math.max(value, 0.05);
      
      // Clamp maximum values, but allow higher values for wireframe mode
      value = Math.min(value, 1.5);
      
      // Update average
      averageFrequency += value;      // Store in array
      audioDataArray[i] = value;
    }
    
    // Calculate the average frequency
    averageFrequency /= fftData.length;
    
    // Set frequency value for displacement - increased multiplier for wireframe visibility
    material.uniforms.uFrequency.value = averageFrequency * 150;
    
    // Set audio data array
    material.uniforms.uAudioData.value = audioDataArray;
  }
};
