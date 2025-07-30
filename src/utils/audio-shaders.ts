// Vertex and Fragment shaders for the 3D spectral visualization
// Adapted from: https://github.com/SuboptimalEng/three-js-games/tree/main/04-audio-visualizer

// Vertex shader
export const spectralVertexShader = `
  varying float x;
  varying float y;
  varying float z;
  varying vec3 vUv;
  varying float vElevation;

  uniform float time;
  uniform float audioIntensity;
  uniform sampler2D audioTexture;

  void main() {
    vUv = position;
    x = position.x;
    y = position.y;
    
    // Sample the audio data from texture with improved frequency mapping
    float audioValue = texture2D(audioTexture, vec2(abs(position.x) / 4.0, 0.0)).r;
    
    // Calculate floor values for grid-based visualization (SuboptimalEng approach)
    float floor_x = round(abs(position.x));
    float floor_y = round(abs(position.y));
    
    // Calculate multipliers for dynamic range
    float x_multiplier = (32.0 - abs(position.x)) / 8.0;
    float y_multiplier = (32.0 - abs(position.y)) / 8.0;
    
    // Enhanced audio response with SuboptimalEng's sine wave approach
    float elevation = sin(audioValue * 10.0) * audioIntensity * 2.5;
    
    // Add wave patterns inspired by SuboptimalEng
    elevation += sin(audioValue * 10.0 + time * 0.5) * audioIntensity;
    
    // Add ripple effects emanating from center (our original effect)
    float dist = sqrt(position.x * position.x + position.y * position.y);
    elevation += sin(dist * 3.0 - time * 1.0) * 0.1 * audioIntensity;
    
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

  uniform float time;
  uniform float audioIntensity;
  uniform sampler2D audioTexture;

  // HSL to RGB conversion function for more vibrant colors
  vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
  }

  void main() {
    // Sample audio data for coloring
    float audioValue = texture2D(audioTexture, vec2(abs(x) / 4.0, 0.0)).r;
    
    // Use SuboptimalEng's color mapping approach combined with our HSL approach
    // Calculate position-based color (from SuboptimalEng)
    vec3 positionColor = vec3(
      (32.0 - abs(x)) / 32.0, 
      (32.0 - abs(y)) / 32.0, 
      (abs(x + y) / 2.0) / 32.0
    );
    
    // Use HSL color space for more vibrant and audio-reactive colors (our approach)
    float hue = 0.6 + audioValue * 0.3 + sin(time * 0.1) * 0.1;  // Blue to purple range
    float saturation = 0.7 + audioValue * 0.3;                   // More saturated with higher audio
    float lightness = 0.3 + vElevation * 0.2 + audioValue * 0.1; // Brighter with elevation and audio
    
    // Convert HSL to RGB
    vec3 hslColor = hsl2rgb(vec3(hue, saturation, lightness));
    
    // Blend the two color approaches
    vec3 finalColor = mix(positionColor, hslColor, 0.5 + audioValue * 0.5);
    
    // Add audio-reactive glow
    float glow = smoothstep(0.0, 0.5, audioValue) * audioIntensity;
    finalColor += vec3(0.1, 0.2, 0.5) * glow;
    
    // Add time-based animation
    finalColor += 0.05 * sin(time * 0.5 + vUv.x * 10.0);
    
    // Adjust alpha for a more ethereal look
    float alpha = 0.7 + audioValue * 0.3;
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;
