// Vertex and Fragment shaders for the 3D spectral visualization
// Inspired by: https://github.com/SuboptimalEng/three-js-games/tree/main/04-audio-visualizer

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
    
    // Enhanced audio response
    float elevation = audioValue * audioIntensity * 2.5;
    
    // Add more complex wave patterns for richer visualization
    elevation += sin(position.x * 3.0 + time * 0.7) * 0.2 * audioIntensity;
    elevation += cos(position.y * 2.5 + time * 0.4) * 0.15 * audioIntensity;
    elevation += sin(position.x * 0.8 + position.y * 0.8 + time * 0.5) * 0.1 * audioIntensity;
    
    // Add some ripple effects emanating from center
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
    
    // Use HSL color space for more vivid and consistent colors
    float hue = 0.6 + audioValue * 0.3 + sin(time * 0.1) * 0.1;  // Blue to purple range
    float saturation = 0.7 + audioValue * 0.3;                   // More saturated with higher audio
    float lightness = 0.3 + vElevation * 0.2 + audioValue * 0.1; // Brighter with elevation and audio
    
    // Convert HSL to RGB
    vec3 finalColor = hsl2rgb(vec3(hue, saturation, lightness));
    
    // Add subtle glow effect
    float glow = smoothstep(0.0, 0.5, audioValue) * audioIntensity;
    finalColor += vec3(0.1, 0.2, 0.5) * glow;
    
    // Apply a subtle gradient based on position
    finalColor *= 1.0 + 0.2 * sin(x * 0.1 + time * 0.2);
    
    // Add alpha with distance fade for a more ethereal look
    float alpha = 0.7 + audioValue * 0.3;
    
    // Add brightness variation based on height and audio
    float brightness = z * 0.5 + 0.5;
    brightness = brightness * (0.8 + audioValue * 0.4);
    
    gl_FragColor = vec4(finalColor * brightness, alpha);
  }
`;
