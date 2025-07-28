import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as Tone from 'tone';

// Fragment shader for cinematic audio visualization
const cinematicFragmentShader = `
  uniform float time;
  uniform float audioIntensity;
  uniform vec3 baseColor;
  uniform vec3 accentColor;
  uniform sampler2D audioTexture;
  uniform float pulseRate;
  varying vec2 vUv;

  // Noise function
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    // Get audio data from texture
    float audioValue = texture2D(audioTexture, vec2(vUv.x, 0.0)).r;
    
    // Create multiple layers of visual effects
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(vUv, center);
    
    // Ripple effect based on audio
    float ripple = sin(dist * 50.0 - time * pulseRate) * 0.5 + 0.5;
    
    // Noise pattern
    float noisePattern = noise(vUv * 10.0 + time * 0.1) * 0.1;
    
    // Color gradient based on distance from center
    vec3 gradientColor = mix(accentColor, baseColor, smoothstep(0.0, 0.8, dist));
    
    // Mix audio intensity into the color
    float intensity = audioValue * audioIntensity;
    vec3 color = mix(gradientColor, vec3(1.0), intensity * ripple * (1.0 - dist * 1.2));
    
    // Add glow effect
    float glow = smoothstep(0.4, 0.0, dist) * intensity;
    color += baseColor * glow * 2.0;
    
    // Add noise detail
    color += noisePattern * intensity;
    
    // Vignette effect
    float vignette = smoothstep(1.0, 0.5, dist);
    color *= vignette;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Vertex shader for cinematic audio visualization
const cinematicVertexShader = `
  varying vec2 vUv;
  uniform float time;
  uniform float audioIntensity;
  uniform sampler2D audioTexture;
  
  void main() {
    vUv = uv;
    
    // Get audio data from texture for this vertex
    float audioValue = texture2D(audioTexture, vec2(position.x * 0.5 + 0.5, 0.0)).r;
    
    // Apply audio data to vertex position for waveform effect
    vec3 newPosition = position;
    if (audioIntensity > 0.1) {
      // Create more organic movement
      float displacement = sin(position.x * 10.0 + time) * audioValue * audioIntensity * 0.3;
      displacement += cos(position.y * 8.0 + time * 0.7) * audioValue * audioIntensity * 0.2;
      newPosition.z += displacement;
    }
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

interface CinematicSceneProps {
  effects: {
    reverb: boolean;
    delay: boolean;
    distortion: boolean;
    filter: boolean;
  };
}

export function CinematicScene({ effects }: CinematicSceneProps) {
  const shaderMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const analyzerRef = useRef<Tone.Analyser | null>(null);
  
  // Environment texture for reflections
  const envMap = useTexture('/textures/envmap.jpg');
  
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
    baseColor: { value: new THREE.Color(0x4a88ff) },
    accentColor: { value: new THREE.Color(0x1a28ff) },
    audioTexture: { value: audioDataTexture },
    pulseRate: { value: 2.0 }
  }), [audioDataTexture]);
  
  useEffect(() => {
    // Setup analyzer
    const analyzer = new Tone.Analyser('fft', 256);
    analyzerRef.current = analyzer;
    
    // Create a shader material
    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: cinematicVertexShader,
      fragmentShader: cinematicFragmentShader,
      transparent: true,
    });
    
    // Create a sphere with shader material
    const sphereGeometry = new THREE.SphereGeometry(2, 128, 128);
    const sphere = new THREE.Mesh(sphereGeometry, shaderMaterial);
    shaderMaterialRef.current = shaderMaterial;
    sphereRef.current = sphere;
    
    // Create particles for environment
    const particleCount = 3000;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Create a spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 5 + Math.random() * 15; // Between 5 and 20
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      // Add some color variation
      colors[i3] = 0.5 + Math.random() * 0.5; // R: 0.5-1.0
      colors[i3 + 1] = 0.5 + Math.random() * 0.5; // G: 0.5-1.0
      colors[i3 + 2] = 0.5 + Math.random() * 0.5; // B: 0.5-1.0
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      transparent: true,
      opacity: 0.7,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particlesRef.current = particles;
    
    return () => {
      if (analyzerRef.current) {
        analyzerRef.current.dispose();
      }
      
      if (shaderMaterialRef.current) {
        shaderMaterialRef.current.dispose();
      }
      
      if (particleGeometry) {
        particleGeometry.dispose();
      }
      
      if (particleMaterial) {
        particleMaterial.dispose();
      }
    };
  }, [uniforms]);
  
  // Update visualization based on effects
  useEffect(() => {
    if (!sphereRef.current || !particlesRef.current || !shaderMaterialRef.current) return;
    
    const shaderMaterial = shaderMaterialRef.current;
    const particles = particlesRef.current;
    
    // Change material properties based on active effects
    const baseColorValue = shaderMaterial.uniforms.baseColor.value;
    const accentColorValue = shaderMaterial.uniforms.accentColor.value;
    
    if (effects.reverb) {
      baseColorValue.setHSL(0.6, 0.8, 0.5); // Vibrant blue
      accentColorValue.setHSL(0.7, 0.9, 0.3); // Deep blue accent
      shaderMaterial.uniforms.audioIntensity.value = 0.8;
      shaderMaterial.uniforms.pulseRate.value = 3.0;
    } else {
      baseColorValue.setHSL(0.6, 0.6, 0.4); // Regular blue
      accentColorValue.setHSL(0.55, 0.7, 0.2); // Subtle accent
      shaderMaterial.uniforms.audioIntensity.value = 0.5;
      shaderMaterial.uniforms.pulseRate.value = 2.0;
    }
    
    if (effects.distortion) {
      shaderMaterial.uniforms.audioIntensity.value *= 1.5;
    }
    
    const particleMaterial = particles.material as THREE.PointsMaterial;
    
    if (effects.delay) {
      particleMaterial.size = 0.15;
      particleMaterial.opacity = 0.9;
    } else {
      particleMaterial.size = 0.1;
      particleMaterial.opacity = 0.7;
    }
    
    if (effects.filter) {
      baseColorValue.offsetHSL(0.1, 0, 0); // Shift hue slightly
    }
  }, [effects]);
  
  // Use frame for animation and audio data update
  useFrame(({ clock, scene }) => {
    if (!sphereRef.current || !particlesRef.current || !shaderMaterialRef.current) return;
    
    const sphere = sphereRef.current;
    const particles = particlesRef.current;
    const shaderMaterial = shaderMaterialRef.current;
    
    // Add sphere and particles to scene if not already added
    if (!scene.children.includes(sphere)) {
      scene.add(sphere);
    }
    
    if (!scene.children.includes(particles)) {
      scene.add(particles);
    }
    
    // Update shader time uniform
    shaderMaterial.uniforms.time.value = clock.getElapsedTime();
    
    // Animate the sphere with subtle movements
    sphere.rotation.x = Math.sin(clock.getElapsedTime() * 0.3) * 0.2;
    sphere.rotation.y = Math.sin(clock.getElapsedTime() * 0.2) * 0.3;
    
    // Animate the particles - slow rotation
    particles.rotation.y = clock.getElapsedTime() * 0.03;
    
    // If we have analyzer data, update the audio texture
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
        
        // Scale the intensity based on average audio level
        let sum = 0;
        for (let i = 0; i < dataSize; i++) {
          sum += (audioData[i] as number + 140) / 140;
        }
        const avg = sum / dataSize;
        
        // Smooth changes to intensity
        const currentIntensity = shaderMaterial.uniforms.audioIntensity.value;
        const targetIntensity = effects.distortion ? avg * 1.5 : avg;
        shaderMaterial.uniforms.audioIntensity.value = 
          currentIntensity * 0.9 + targetIntensity * 0.1;
      }
    }
  });
  
  return null;
}
