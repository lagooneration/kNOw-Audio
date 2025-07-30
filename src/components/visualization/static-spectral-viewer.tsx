import { useEffect, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { type AudioData } from '../../types/audio';

interface StaticSpectralViewerProps {
  audioData: AudioData;
  color?: string;
  backgroundColor?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
}

export function StaticSpectralViewer({
  audioData,
  color = '#6366f1',
  backgroundColor = 'transparent',
  width = '100%',
  height = '100%',
  className = ''
}: StaticSpectralViewerProps) {
  const containerStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };

  return (
    <div 
      className={`three-container relative ${className}`} 
      style={containerStyle}
    >
      <Canvas
        camera={{ position: [0, 5, 15], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: backgroundColor }}
        dpr={[1, 2]} // Responsive to device pixel ratio for better quality
        shadows
      >
        <color attach="background" args={['#030712']} />
        <fog attach="fog" args={['#030712', 5, 30]} />
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[5, 8, 5]} 
          intensity={1.0} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
          color="#ffffff"
        />
        <pointLight position={[-5, 5, -5]} intensity={0.7} color="#6366f1" />
        <pointLight position={[5, -5, 5]} intensity={0.7} color="#8b5cf6" />
        <pointLight position={[0, 10, 0]} intensity={0.5} color="#ec4899" />
        <SpectralMesh audioData={audioData} color={color} />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          autoRotate={false}
          maxPolarAngle={Math.PI / 1.6}
          minPolarAngle={Math.PI / 6}
        />
      </Canvas>
    </div>
  );
}

interface SpectralMeshProps {
  audioData: AudioData;
  color: string;
}

function SpectralMesh({ audioData, color }: SpectralMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  
  // Create shader material for enhanced visual appeal
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color1: { value: new THREE.Color("#3b82f6") }, // Blue
        color2: { value: new THREE.Color("#8b5cf6") }, // Purple
        color3: { value: new THREE.Color("#ec4899") }, // Pink
        color4: { value: new THREE.Color("#f59e0b") }, // Amber
        color5: { value: new THREE.Color("#10b981") }, // Emerald
        time: { value: 0 }
      },
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        varying float vElevation;
        varying float vAmplitude;
        
        void main() {
          vUv = uv;
          
          // No wave animation, keeping it static
          vec3 pos = position;
          
          // Pass elevation to fragment shader for color mapping
          vElevation = pos.z * 0.08;
          
          // Calculate amplitude for frequency-based coloring
          vAmplitude = abs(pos.z) / 10.0;
          
          vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * viewMatrix * modelPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 color3;
        uniform vec3 color4;
        uniform vec3 color5;
        uniform float time;
        
        varying vec2 vUv;
        varying float vElevation;
        varying float vAmplitude;
        
        void main() {
          // Map different colors based on elevation (audio peaks)
          vec3 color;
          
          // Frequency-based color mapping (5 color bands)
          if (vAmplitude > 0.8) {
            // Highest peaks - Pink
            color = color3;
          } else if (vAmplitude > 0.6) {
            // High peaks - Amber
            color = color4;
          } else if (vAmplitude > 0.4) {
            // Medium peaks - Purple
            color = color2;
          } else if (vAmplitude > 0.2) {
            // Low peaks - Blue
            color = color1;
          } else {
            // Valleys - Emerald
            color = color5;
          }
          
          // Add subtle gradient based on position
          float xGradient = smoothstep(0.0, 1.0, vUv.x);
          float yGradient = smoothstep(0.0, 1.0, vUv.y);
          
          // Blend with position-based gradient (more subtle)
          vec3 positionColor = mix(color1, color3, xGradient);
          positionColor = mix(positionColor, color4, yGradient);
          
          // Final color with 80% amplitude-based, 20% position-based
          color = mix(color, positionColor, 0.2);
          
          // Add edge highlight for better definition
          float edgeFactor = max(0.0, 1.0 - 2.0 * length(vUv - 0.5));
          edgeFactor = pow(edgeFactor, 3.0) * 0.3;
          
          // No time-based animation, keep it static
          gl_FragColor = vec4(color + edgeFactor, 1.0);
        }
      `,
      wireframe: true,
      transparent: true
    });
  }, []);
  
  // Store reference to material
  useEffect(() => {
    materialRef.current = shaderMaterial;
  }, [shaderMaterial]);

  useEffect(() => {
    if (!meshRef.current) return;
    
    // Create a static representation of the audio data
    const sampleSize = 128; // Number of samples to analyze
    const audioBuffer = audioData.buffer;
    const channelData = audioBuffer.getChannelData(0);
    const samples = new Float32Array(sampleSize);
    const peakValues = new Float32Array(sampleSize);
    
    // Find overall peak for normalization
    let overallPeak = 0;
    for (let i = 0; i < channelData.length; i++) {
      const abs = Math.abs(channelData[i]);
      if (abs > overallPeak) overallPeak = abs;
    }
    
    // Get evenly spaced samples and track peak values
    const blockSize = Math.floor(channelData.length / sampleSize);
    for (let i = 0; i < sampleSize; i++) {
      const offset = Math.floor(i * blockSize);
      let sum = 0;
      let peak = 0;
      
      for (let j = 0; j < blockSize; j++) {
        const value = Math.abs(channelData[offset + j]);
        sum += value;
        if (value > peak) peak = value;
      }
      
      samples[i] = sum / blockSize;
      peakValues[i] = peak / overallPeak; // Normalize peak values 0-1
    }
    
    // Update mesh geometry
    if (meshRef.current && meshRef.current.geometry instanceof THREE.PlaneGeometry) {
      const geometry = meshRef.current.geometry;
      const position = geometry.attributes.position;
      
      // Apply audio data to geometry
      for (let i = 0; i < position.count; i++) {
        const x = position.getX(i);
        const y = position.getY(i);
        
        // Get sample index based on x position
        const col = Math.floor((x + 10) / 20 * 64);
        const row = Math.floor((y + 10) / 20 * 64);
        
        if (col >= 0 && col < 64 && row >= 0 && row < 64) {
          const sampleIndex = col % sampleSize;
          const amplitude = samples[sampleIndex] * 5;
          const peakFactor = peakValues[sampleIndex] * 2; // Emphasize peaks
          
          // Create a more detailed terrain based on frequency content
          const freqFactor = sampleIndex / sampleSize; // 0-1 based on frequency
          const rowFactor = row / 64; // 0-1 based on row position
          
          // Higher frequencies get more elevation variation
          const frequencyWeight = Math.pow(freqFactor, 0.5) * 1.5;
          
          // Create wave pattern (static, not animated)
          const waveX = Math.sin(col * 0.2 + row * 0.3) * amplitude * frequencyWeight;
          const waveY = Math.cos(row * 0.2) * amplitude;
          const waveZ = Math.sin(col * 0.1 + row * 0.1) * amplitude * 0.5;
          
          // Add peak-based elevation
          const peakHeight = peakFactor * 3 * rowFactor;
          
          // Set new Z position based on audio data and wave pattern
          position.setZ(i, waveX + waveY + waveZ + (amplitude * 3) + peakHeight);
        }
      }
      
      position.needsUpdate = true;
      
      // Create color attribute for vertex coloring with more variation
      const colors = new Float32Array(position.count * 3);
      const color1 = new THREE.Color("#3b82f6"); // Blue
      const color2 = new THREE.Color("#8b5cf6"); // Purple
      const color3 = new THREE.Color("#ec4899"); // Pink
      const color4 = new THREE.Color("#f59e0b"); // Amber
      const color5 = new THREE.Color("#10b981"); // Emerald
      const tempColor = new THREE.Color();
      
      for (let i = 0; i < position.count; i++) {
        const z = position.getZ(i);
        
        // Normalize height for color mapping
        const nz = Math.min(1, Math.max(0, z / 15)); // Normalize height
        
        // Determine color based on height (audio amplitude)
        let baseColor;
        if (nz > 0.8) {
          baseColor = color3.clone(); // Highest peaks - Pink
        } else if (nz > 0.6) {
          baseColor = color4.clone(); // High peaks - Amber
          baseColor.lerp(color3, (nz - 0.6) * 5); // Smooth transition
        } else if (nz > 0.4) {
          baseColor = color2.clone(); // Medium peaks - Purple
          baseColor.lerp(color4, (nz - 0.4) * 5); // Smooth transition
        } else if (nz > 0.2) {
          baseColor = color1.clone(); // Low peaks - Blue
          baseColor.lerp(color2, (nz - 0.2) * 5); // Smooth transition
        } else {
          baseColor = color5.clone(); // Valleys - Emerald
          baseColor.lerp(color1, nz * 5); // Smooth transition
        }
        
        // Add spatial variation based on position
        tempColor.copy(baseColor);
        
        // Set colors
        colors[i * 3] = tempColor.r;
        colors[i * 3 + 1] = tempColor.g;
        colors[i * 3 + 2] = tempColor.b;
      }
      
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }
  }, [audioData]);
  
  // Update shader uniforms once - no animation
  useEffect(() => {
    // Set initial time value
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = 0;
    }
    
    // No need for animation loop since we want a static visualization
  }, []);
  
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 5, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 20, 80, 80]} />
      {shaderMaterial ? (
        <primitive object={shaderMaterial} />
      ) : (
        <meshStandardMaterial 
          color={color}
          wireframe={true}
          metalness={0.7}
          roughness={0.2}
          vertexColors
        />
      )}
    </mesh>
  );
}
