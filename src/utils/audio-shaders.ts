// Vertex and Fragment shaders for the 3D spectral visualization
// Inspired by: https://github.com/SuboptimalEng/three-js-games/tree/main/04-audio-visualizer

// Vertex shader
export const spectralVertexShader = `
  varying float x;
  varying float y;
  varying float z;
  varying vec3 vUv;

  uniform float u_time;
  uniform float u_amplitude;
  uniform float[64] u_audio_data;

  void main() {
    vUv = position;
    x = abs(position.x);
    y = abs(position.y);

    float floor_x = round(x);
    float floor_y = round(y);

    // Calculate z-position based on audio data
    z = sin(u_audio_data[int(floor_x)] + u_audio_data[int(floor_y)] + u_time * 0.002) * u_amplitude;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position.x, position.y, z, 1.0);
  }
`;

// Fragment shader
export const spectralFragmentShader = `
  varying float x;
  varying float y;
  varying float z;
  varying vec3 vUv;

  uniform float u_time;

  void main() {
    // Create dynamic color gradient based on position and audio data
    vec3 color1 = vec3(0.1, 0.3, 0.9); // Deep blue
    vec3 color2 = vec3(0.9, 0.1, 0.3); // Red/pink
    
    float blend = sin(u_time * 0.001 + (x + y) * 0.1) * 0.5 + 0.5;
    vec3 finalColor = mix(color1, color2, blend);
    
    // Add brightness variation based on height
    float brightness = (z + 1.0) * 0.5;
    
    gl_FragColor = vec4(finalColor * brightness, 1.0);
  }
`;
