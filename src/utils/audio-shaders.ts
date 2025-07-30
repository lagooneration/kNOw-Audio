// Vertex and Fragment shaders for the 3D spectral visualization
// Adapted from: https://github.com/SuboptimalEng/three-js-games/tree/main/04-audio-visualizer

// Vertex shader
export const spectralVertexShader = `
  varying float x;
  varying float y;
  varying float z;
  varying vec3 vUv;
  varying float vElevation;

  // Support both naming conventions for backward compatibility
  uniform float time;
  uniform float u_time;
  uniform float audioIntensity;
  uniform float u_amplitude;
  uniform sampler2D audioTexture;
  uniform float u_audio_data[64];

  void main() {
    vUv = position;
    x = position.x;
    y = position.y;
    
    // Use either time variable that's available
    float t = time > 0.0 ? time : u_time;
    
    // Use either amplitude variable that's available
    float amplitude = audioIntensity > 0.0 ? audioIntensity : u_amplitude;
    
    // Get normalized position for sampling
    float sampleX = abs(position.x) / 10.0;
    
    // Try to sample from texture first
    float audioValue;
    if (sampleX <= 1.0) {
      audioValue = texture2D(audioTexture, vec2(sampleX, 0.0)).r;
    } else {
      // Fallback to array if texture sampling gives zero
      int index = int(min(abs(position.x * 3.0), 63.0));
      audioValue = u_audio_data[index];
    }
    
    // Calculate elevation
    float elevation = sin(audioValue * 10.0) * amplitude * 2.5;
    
    // Add wave patterns
    elevation += sin(audioValue * 10.0 + t * 0.5) * amplitude;
    
    // Add ripple effects emanating from center
    float dist = sqrt(position.x * position.x + position.y * position.y);
    elevation += sin(dist * 3.0 - t * 1.0) * 0.1 * amplitude;
    
    // Store elevation for fragment shader coloring
    vElevation = elevation;
    
    // Apply the elevation to vertex position
    z = position.z + elevation;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position.x, position.y, z, 1.0);
  }
`;

// Fragment shader
export const spectralFragmentShader = `
  varying float x;
  varying float y;
  varying float z;
  varying vec3 vUv;
  varying float vElevation;

  // Support both naming conventions for backward compatibility
  uniform float time;
  uniform float u_time;
  uniform float audioIntensity;
  uniform float u_amplitude;
  uniform sampler2D audioTexture;
  uniform float u_audio_data[64];

  // HSL to RGB conversion function for more vibrant colors
  vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
  }

  void main() {
    // Use either time variable that's available
    float t = time > 0.0 ? time : u_time;
    
    // Use either amplitude variable that's available
    float amplitude = audioIntensity > 0.0 ? audioIntensity : u_amplitude;
    
    // Get normalized position for sampling
    float sampleX = abs(x) / 10.0;
    
    // Try to sample from texture first
    float audioValue;
    if (sampleX <= 1.0) {
      audioValue = texture2D(audioTexture, vec2(sampleX, 0.0)).r;
    } else {
      // Fallback to array if texture sampling gives zero
      int index = int(min(abs(x * 3.0), 63.0));
      audioValue = u_audio_data[index];
    }
    
    // Ensure we have a valid audio value
    if (audioValue < 0.01) {
      audioValue = 0.01;
    }
    
    // Use HSL color space for more vibrant and audio-reactive colors
    float hue = 0.6 + audioValue * 0.3 + sin(t * 0.1) * 0.1;  // Blue to purple range
    float saturation = 0.7 + audioValue * 0.3;                // More saturated with higher audio
    float lightness = 0.3 + vElevation * 0.2 + audioValue * 0.1; // Brighter with elevation and audio
    
    // Convert HSL to RGB
    vec3 hslColor = hsl2rgb(vec3(hue, saturation, lightness));
    
    // Add audio-reactive glow
    float glow = smoothstep(0.0, 0.5, audioValue) * amplitude;
    vec3 finalColor = hslColor + vec3(0.1, 0.2, 0.5) * glow;
    
    // Add time-based animation
    finalColor += 0.05 * sin(t * 0.5 + vUv.x * 10.0);
    
    // Adjust alpha for a more ethereal look
    float alpha = 0.7 + audioValue * 0.3;
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;
