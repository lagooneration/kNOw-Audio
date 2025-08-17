import { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { SpatialAudioData, AudioBlobVisualization } from '../../types/spatial-audio';
import { SpatialAudioScene } from './spatial-audio-scene';

// Shader for analytical visualization overlay
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform sampler2D uAudioData;
  varying vec2 vUv;
  
  void main() {
    vec2 uv = vUv;
    
    // Sample audio data texture
    vec4 audioData = texture2D(uAudioData, vec2(uv.x, 0.0));
    
    // Create spectral visualization
    float frequency = uv.y;
    float amplitude = audioData.r;
    
    // Create grid lines
    float gridX = step(0.98, mod(uv.x * 10.0, 1.0));
    float gridY = step(0.98, mod(uv.y * 10.0, 1.0));
    vec3 gridColor = vec3(0.2, 0.4, 0.6) * (gridX + gridY);
    
    // Main visualization color
    vec3 color = vec3(0.1, 0.3 + amplitude * 0.5, 0.7) * smoothstep(frequency, frequency + 0.2, amplitude);
    
    // Combine
    vec3 finalColor = mix(color, gridColor, 0.2);
    
    // Add some time-based animation
    finalColor += 0.05 * sin(uTime * 0.5 + uv.x * 10.0);
    
    gl_FragColor = vec4(finalColor, 0.7); // Semi-transparent
  }
`;

// Audio Blob component
function AudioBlob({ 
  blob, 
  isSelected, 
  onClick 
}: { 
  blob: AudioBlobVisualization; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Animate the blob based on audio
  useFrame((state) => {
    if (meshRef.current) {
      // Pulse effect
      const scale = blob.scale * (1 + 0.1 * Math.sin(state.clock.elapsedTime * 2));
      meshRef.current.scale.set(scale, scale, scale);
      
      // Rotation
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });
  
  return (
    <mesh 
      ref={meshRef}
      position={[blob.position.x, blob.position.y, blob.position.z]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial 
        color={blob.color}
        emissive={blob.color}
        emissiveIntensity={isSelected ? 0.8 : 0.3}
        roughness={0.4}
        metalness={0.6}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

// Spectral Shader Overlay component
function SpectralOverlay({ 
  isVisible, 
  audioData 
}: { 
  isVisible: boolean; 
  audioData: Float32Array;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();
  
  // Create audio data texture
  const audioDataTexture = useMemo(() => {
    const data = new Float32Array(audioData.length * 4);
    for (let i = 0; i < audioData.length; i++) {
      const value = audioData[i];
      data[i * 4] = value;     // R
      data[i * 4 + 1] = value; // G
      data[i * 4 + 2] = value; // B
      data[i * 4 + 3] = 1.0;   // A
    }
    
    const texture = new THREE.DataTexture(
      data,
      audioData.length,
      1,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    texture.needsUpdate = true;
    return texture;
  }, [audioData]);
  
  // Update shader uniforms
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });
  
  if (!isVisible) return null;
  
  return (
    <mesh position={[0, 0, 10]}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        uniforms={{
          uTime: { value: 0 },
          uAudioData: { value: audioDataTexture }
        }}
      />
    </mesh>
  );
}

// Environment setup
function Environment() {
  const texture = useTexture('/textures/envmap.jpg');
  
  return (
    <>
      {/* Ambient light */}
      <ambientLight intensity={0.4} />
      
      {/* Directional light */}
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      
      {/* Environment sphere */}
      <mesh>
        <sphereGeometry args={[500, 60, 40]} />
        <meshBasicMaterial map={texture} side={THREE.BackSide} />
      </mesh>
      
      {/* Ground plane with grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[100, 100, 50, 50]} />
        <meshStandardMaterial 
          color="#111122" 
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>
    </>
  );
}

interface SpatialAudioCanvasProps {
  audioSources: SpatialAudioData[];
  onAudioPositionChanged: (id: string, position: { x: number; y: number; z: number }) => void;
  visualizationType: 'cinematic' | 'analytical';
  audioAnalysisData?: Float32Array; // FFT analysis data for visualization
}

export function SpatialAudioCanvas({
  audioSources,
  onAudioPositionChanged,
  visualizationType,
  audioAnalysisData = new Float32Array(512)
}: SpatialAudioCanvasProps) {
  const [selectedBlob, setSelectedBlob] = useState<string | null>(null);
  const [blobs, setBlobs] = useState<AudioBlobVisualization[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Get the data
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    
    const audioData = JSON.parse(data);
    
    // Get canvas dimensions
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Get the drop position relative to the canvas
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height * 2 - 1);
    
    // Create new position (default z=0 at drop time)
    const position = { x, y, z: 0 };
    
    // Notify parent
    onAudioPositionChanged(audioData.id, position);
  };
  
  // Prevent default behavior for drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  // Update blobs when audio sources change
  useEffect(() => {
    const newBlobs = audioSources
      .filter(source => source.position) // Only sources with positions
      .map(source => ({
        audioId: source.id,
        position: source.position!,
        color: source.color,
        scale: source.isPlaying ? 1.2 : 1.0,
        intensity: source.isPlaying ? 0.8 : 0.5
      }));
    
    setBlobs(newBlobs);
  }, [audioSources]);
  
  return (
    <div 
      className="w-full h-full"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {visualizationType === 'analytical' ? (
        <Canvas ref={canvasRef}>
          {/* Controls */}
          <OrbitControls enableDamping dampingFactor={0.1} />
          
          {/* Environment */}
          <Environment />
          
          {/* Audio Blobs */}
          {blobs.map(blob => (
            <AudioBlob 
              key={blob.audioId}
              blob={blob}
              isSelected={selectedBlob === blob.audioId}
              onClick={() => setSelectedBlob(blob.audioId)}
            />
          ))}
          
          {/* Spectral Overlay */}
          <SpectralOverlay 
            isVisible={true}
            audioData={audioAnalysisData}
          />
        </Canvas>
      ) : (
        <SpatialAudioScene
          audioSources={audioSources}
          audioAnalysisData={audioAnalysisData}
          onAudioPlaced={(placement) => {
            onAudioPositionChanged(placement.id, placement.position);
          }}
          onAudioSelected={(id) => setSelectedBlob(id)}
          onAudioDropped={(id, position) => {
            onAudioPositionChanged(id, position);
          }}
        />
      )}
    </div>
  );
}
