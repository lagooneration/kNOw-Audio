import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import * as Tone from 'tone';

// Fragment shader for analytical audio visualization
const analyticalFragmentShader = `
  uniform float time;
  uniform float audioIntensity;
  uniform vec3 baseColor;
  uniform sampler2D audioTexture;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    // Get audio data from texture
    float audioValue = texture2D(audioTexture, vec2(vUv.x, 0.0)).r;
    
    // Create a more analytical visualization with grids and precision
    vec3 color = baseColor;
    
    // Add grid pattern
    float gridX = step(0.98, mod(vUv.x * 20.0, 1.0));
    float gridY = step(0.98, mod(vUv.y * 20.0, 1.0));
    float grid = max(gridX, gridY) * 0.2;
    
    // Add horizontal frequency bands
    float bands = step(0.97, mod(vUv.y * 10.0, 1.0)) * 0.3;
    
    // Add elevation-based coloring
    float elevation = smoothstep(-0.5, 0.5, vElevation);
    color = mix(color, vec3(1.0, 1.0, 1.0), elevation * 0.3);
    
    // Apply audio intensity
    color = mix(color, vec3(1.0, 1.0, 1.0), audioValue * audioIntensity * 0.4);
    
    // Add grid and bands
    color += vec3(grid + bands);
    
    // Add subtle time-based variation
    color += vec3(sin(time * 0.5) * 0.05);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Vertex shader for analytical audio visualization
const analyticalVertexShader = `
  varying vec2 vUv;
  varying float vElevation;
  uniform float time;
  uniform float audioIntensity;
  uniform sampler2D audioTexture;
  
  void main() {
    vUv = uv;
    
    // Get audio data from texture for this vertex
    float audioValue = texture2D(audioTexture, vec2(position.x * 0.5 + 0.5, 0.0)).r;
    float frequency = position.x * 0.5 + 0.5; // Normalized frequency (0-1)
    
    // Apply precise audio data mapping to create a spectral visualization
    vec3 newPosition = position;
    
    // Calculate elevation based on audio spectrum
    float elevation = 0.0;
    if (audioIntensity > 0.1) {
      // More precise frequency response visualization
      float spectrum = audioValue * audioIntensity * (1.0 - frequency * 0.5);
      elevation = spectrum * 2.0;
      
      // Add mathematical visualization elements
      elevation += sin(position.x * 10.0 + time) * 0.05; // Add sine wave pattern
      
      newPosition.z += elevation;
    }
    
    vElevation = elevation;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

interface AnalyticalSceneProps {
  effects: {
    reverb: boolean;
    delay: boolean;
    distortion: boolean;
    filter: boolean;
  };
}

export function AnalyticalScene({ effects }: AnalyticalSceneProps) {
  const shaderMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const axesRef = useRef<THREE.AxesHelper | null>(null);
  const analyzerRef = useRef<Tone.Analyser | null>(null);
  const freqBarsRef = useRef<THREE.InstancedMesh | null>(null);
  
  // Create a data texture for audio data
  const audioDataTexture = useMemo(() => {
    const size = 256;
    const data = new Float32Array(size * 4);
    // Fill with initial data
    for (let i = 0; i < size; i++) {
      const stride = i * 4;
      data[stride] = 0;
      data[stride + 1] = 0;
      data[stride + 2] = 0;
      data[stride + 3] = 1;
    }
    const texture = new THREE.DataTexture(
      data,
      size,
      1,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    texture.needsUpdate = true;
    return texture;
  }, []);
  
  // Create shader uniforms
  const uniforms = useMemo(() => ({
    time: { value: 0 },
    audioIntensity: { value: 0.5 },
    baseColor: { value: new THREE.Color(0x3a78ef) },
    audioTexture: { value: audioDataTexture }
  }), [audioDataTexture]);
  
  useEffect(() => {
    // Setup analyzer
    const analyzer = new Tone.Analyser('fft', 256);
    analyzerRef.current = analyzer;
    
    // Create a shader material
    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: analyticalVertexShader,
      fragmentShader: analyticalFragmentShader,
      side: THREE.DoubleSide,
      wireframe: false,
    });
    
    // Create a plane mesh for frequency visualization
    const planeGeometry = new THREE.PlaneGeometry(8, 6, 128, 128);
    const plane = new THREE.Mesh(planeGeometry, shaderMaterial);
    plane.rotation.x = -Math.PI / 3; // Tilt it for better visibility
    plane.position.y = -1;
    
    shaderMaterialRef.current = shaderMaterial;
    meshRef.current = plane;
    
    // Create grid helper for analytical look
    const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
    gridHelper.position.y = -3;
    gridRef.current = gridHelper;
    
    // Create axes helper
    const axesHelper = new THREE.AxesHelper(5);
    axesHelper.position.set(-10, -3, -10);
    axesRef.current = axesHelper;
    
    // Create frequency bars for spectrum visualization
    const barGeometry = new THREE.BoxGeometry(0.15, 1, 0.15);
    const barMaterial = new THREE.MeshBasicMaterial({ color: 0x4a88ff });
    
    const barCount = 64;
    const freqBars = new THREE.InstancedMesh(barGeometry, barMaterial, barCount);
    freqBars.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    
    const dummy = new THREE.Object3D();
    
    // Position the bars in a semicircle
    for (let i = 0; i < barCount; i++) {
      const angle = (Math.PI / barCount) * i - Math.PI / 2;
      const radius = 8;
      
      dummy.position.set(
        Math.cos(angle) * radius,
        -2.5,
        Math.sin(angle) * radius
      );
      
      dummy.scale.set(1, 0.1, 1); // Initial height is small
      dummy.updateMatrix();
      
      freqBars.setMatrixAt(i, dummy.matrix);
    }
    
    freqBars.instanceMatrix.needsUpdate = true;
    freqBarsRef.current = freqBars;
    
    return () => {
      if (analyzerRef.current) {
        analyzerRef.current.dispose();
      }
      
      if (shaderMaterialRef.current) {
        shaderMaterialRef.current.dispose();
      }
      
      if (planeGeometry) {
        planeGeometry.dispose();
      }
      
      if (barGeometry) {
        barGeometry.dispose();
      }
      
      if (barMaterial) {
        barMaterial.dispose();
      }
    };
  }, [uniforms]);
  
  // Update visualization based on effects
  useEffect(() => {
    if (!meshRef.current || !shaderMaterialRef.current || !freqBarsRef.current) return;
    
    const shaderMaterial = shaderMaterialRef.current;
    const freqBars = freqBarsRef.current;
    
    // Change material properties based on active effects
    const baseColorValue = shaderMaterial.uniforms.baseColor.value;
    
    if (effects.reverb) {
      baseColorValue.setHSL(0.6, 0.5, 0.5);
      shaderMaterial.uniforms.audioIntensity.value = 0.6;
      shaderMaterial.wireframe = false;
    } else {
      baseColorValue.setHSL(0.6, 0.4, 0.4);
      shaderMaterial.uniforms.audioIntensity.value = 0.5;
      shaderMaterial.wireframe = false;
    }
    
    if (effects.distortion) {
      shaderMaterial.wireframe = true;
      (freqBars.material as THREE.MeshBasicMaterial).color.setHSL(0.1, 0.7, 0.5); // More orange for distortion
    } else {
      (freqBars.material as THREE.MeshBasicMaterial).color.setHSL(0.6, 0.7, 0.5); // Blue for clean
    }
    
    if (effects.filter) {
      baseColorValue.offsetHSL(0.05, 0, 0); // Slight hue shift
    }
  }, [effects]);
  
  // Use frame for animation and audio data update
  useFrame(({ clock, scene }) => {
    if (!meshRef.current || !gridRef.current || !axesRef.current || 
        !shaderMaterialRef.current || !freqBarsRef.current) return;
    
    const mesh = meshRef.current;
    const grid = gridRef.current;
    const axes = axesRef.current;
    const freqBars = freqBarsRef.current;
    const shaderMaterial = shaderMaterialRef.current;
    
    // Add elements to scene if not already added
    if (!scene.children.includes(mesh)) {
      scene.add(mesh);
    }
    
    if (!scene.children.includes(grid)) {
      scene.add(grid);
    }
    
    if (!scene.children.includes(axes)) {
      scene.add(axes);
    }
    
    if (!scene.children.includes(freqBars)) {
      scene.add(freqBars);
    }
    
    // Update shader time uniform
    shaderMaterial.uniforms.time.value = clock.getElapsedTime();
    
    // If we have analyzer data, update the audio texture and visualizations
    if (analyzerRef.current) {
      const audioData = analyzerRef.current.getValue() as Float32Array;
      if (audioData) {
        // Update the data texture with new audio data
        const textureData = shaderMaterial.uniforms.audioTexture.value.image.data;
        const dataSize = Math.min(audioData.length, textureData.length / 4);
        
        for (let i = 0; i < dataSize; i++) {
          const value = (audioData[i] as number + 140) / 140; // Normalize
          const stride = i * 4;
          textureData[stride] = value;     // R
          textureData[stride + 1] = value; // G
          textureData[stride + 2] = value; // B
          textureData[stride + 3] = 1;     // A
        }
        
        shaderMaterial.uniforms.audioTexture.value.needsUpdate = true;
        
        // Update frequency bars
        const barCount = freqBars.count;
        const dummy = new THREE.Object3D();
        const barStep = Math.floor(dataSize / barCount);
        
        for (let i = 0; i < barCount; i++) {
          const dataIndex = i * barStep;
          const audioValue = (audioData[dataIndex] as number + 140) / 140; // Normalize to 0-1
          const angle = (Math.PI / barCount) * i - Math.PI / 2;
          const radius = 8;
          
          freqBars.getMatrixAt(i, dummy.matrix);
          
          // Decompose the matrix to get position, rotation, scale
          const position = new THREE.Vector3();
          const quaternion = new THREE.Quaternion();
          const scale = new THREE.Vector3();
          dummy.matrix.decompose(position, quaternion, scale);
          
          // Update the scale (height) based on the audio data
          const height = Math.max(0.1, audioValue * 5.0);
          
          dummy.position.set(
            Math.cos(angle) * radius,
            -2.5 + (height / 2), // Center the bar on its base
            Math.sin(angle) * radius
          );
          
          dummy.scale.set(1, height, 1);
          dummy.updateMatrix();
          
          freqBars.setMatrixAt(i, dummy.matrix);
        }
        
        freqBars.instanceMatrix.needsUpdate = true;
        
        // Update shader intensity based on average audio level
        let sum = 0;
        for (let i = 0; i < dataSize; i++) {
          sum += (audioData[i] as number + 140) / 140;
        }
        const avg = sum / dataSize;
        
        // Smooth changes to intensity
        const currentIntensity = shaderMaterial.uniforms.audioIntensity.value;
        const targetIntensity = effects.distortion ? avg * 1.2 : avg;
        shaderMaterial.uniforms.audioIntensity.value = 
          currentIntensity * 0.9 + targetIntensity * 0.1;
      }
    }
  });
  
  return null;
}
