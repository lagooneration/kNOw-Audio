import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as Tone from 'tone';
import { spectralVertexShader, spectralFragmentShader } from '../../utils/audio-shaders';

interface SpectralAudioVisualizerProps {
  analyzer: Tone.Analyser | null;
  isPlaying: boolean;
  effects: {
    reverb: boolean;
    delay: boolean;
    distortion: boolean;
    filter: boolean;
  };
}

export function SpectralAudioVisualizer({ analyzer, isPlaying, effects }: SpectralAudioVisualizerProps) {
  // Component to create the visualization
  return (
    <div className="w-full h-full bg-black/40 backdrop-blur-sm rounded-md overflow-hidden">
      <Canvas camera={{ position: [0, 3, 5], fov: 60 }}>
        <SpectralVisualization analyzer={analyzer} isPlaying={isPlaying} effects={effects} />
        <OrbitControls enableZoom={true} enablePan={true} />
      </Canvas>
    </div>
  );
}

interface SpectralVisualizationProps {
  analyzer: Tone.Analyser | null;
  isPlaying: boolean;
  effects: {
    reverb: boolean;
    delay: boolean;
    distortion: boolean;
    filter: boolean;
  };
}

function SpectralVisualization({ analyzer, isPlaying, effects }: SpectralVisualizationProps) {
  const planeRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const dataTextureRef = useRef<THREE.DataTexture | null>(null);
  const gridRef = useRef<THREE.GridHelper>(null);
  
  // Setup the visualization
  useEffect(() => {
    // Create a data texture for audio visualization
    const size = 512; // Increased size for better resolution
    const data = new Float32Array(size * 4);
    
    // Initialize with zeros
    for (let i = 0; i < size; i++) {
      const stride = i * 4;
      data[stride] = 0;
      data[stride + 1] = 0;
      data[stride + 2] = 0;
      data[stride + 3] = 1;
    }
    
    const dataTexture = new THREE.DataTexture(
      data,
      size,
      1,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    dataTexture.needsUpdate = true;
    dataTextureRef.current = dataTexture;
    
    // Create grid helper
    if (gridRef.current) {
      gridRef.current.position.y = -2;
    }
    
    return () => {
      if (dataTextureRef.current) {
        dataTextureRef.current.dispose();
      }
    };
  }, []);
  
  // Update visualization on each frame
  useFrame(({ clock }) => {
    if (!planeRef.current || !materialRef.current || !dataTextureRef.current || !analyzer) {
      return;
    }
    
    const time = clock.getElapsedTime();
    
    // Update time uniform
    materialRef.current.uniforms.time.value = time;
    
    // Apply a baseline animation even when not playing
    const baselineIntensity = 0.2;
    materialRef.current.uniforms.audioIntensity.value = isPlaying ? 0.5 : baselineIntensity;
    
    // Get frequency data from analyzer
    const analyzerValue = analyzer.getValue();
    const audioData = analyzerValue instanceof Float32Array 
      ? analyzerValue 
      : new Float32Array(0);
    
    if (audioData && audioData.length > 0) {
      // Update the data texture with audio data
      const textureData = dataTextureRef.current.image.data as Float32Array;
      const dataSize = Math.min(audioData.length, textureData.length / 4);
      
      for (let i = 0; i < dataSize; i++) {
        // Enhance the audio response by boosting the values
        let value = (audioData[i] + 140) / 140; // Normalize from dB to 0-1
        
        // Apply some enhancement for better visual effect
        value = Math.pow(value, 1.5); // Apply curve to enhance mid-high values
        
        // Add some noise for more organic look when paused
        if (!isPlaying) {
          value = value * 0.3 + Math.random() * 0.05;
        }
        
        const stride = i * 4;
        textureData[stride] = value;     // R
        textureData[stride + 1] = value; // G
        textureData[stride + 2] = value; // B
        textureData[stride + 3] = 1;     // A
      }
      
      dataTextureRef.current.needsUpdate = true;
      
      // Update visualization intensity based on effects
      let intensity = isPlaying ? 0.5 : baselineIntensity; // Default intensity
      
      if (effects.reverb) intensity += 0.15;
      if (effects.delay) intensity += 0.15;
      if (effects.distortion) intensity += 0.25;
      if (effects.filter) intensity += 0.15;
      
      materialRef.current.uniforms.audioIntensity.value = intensity;
    }
    
    // Rotate plane slightly for more dynamic appearance
    if (planeRef.current) {
      planeRef.current.rotation.z = Math.sin(time * 0.1) * 0.02;
    }
  });
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      {/* Spectral Mountain Visualization */}
      <mesh 
        ref={planeRef}
        position={[0, -1.5, 0]} 
        rotation={[-Math.PI / 3, 0, 0]}
      >
        <planeGeometry args={[8, 6, 196, 96]} />
        <shaderMaterial 
          ref={materialRef}
          vertexShader={spectralVertexShader}
          fragmentShader={spectralFragmentShader}
          side={THREE.DoubleSide}
          transparent={true}
          uniforms={{
            time: { value: 0 },
            audioIntensity: { value: 0.5 },
            audioTexture: { value: dataTextureRef.current }
          }}
        />
      </mesh>
      
      {/* Grid for reference */}
      <gridHelper ref={gridRef} args={[20, 40, 0x444444, 0x222222]} position={[0, -2, 0]} />
    </>
  );
}
