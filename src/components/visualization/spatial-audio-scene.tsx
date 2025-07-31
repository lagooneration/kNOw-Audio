import { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import * as Tone from 'tone';
import { type SpatialAudioData, type AudioPlacement } from '../../types/spatial-audio';
import { createAudioBlobMaterial, updateAudioBlobShader } from './audio-blob-shader';
import { AudioListener } from './audio-listener';

interface AudioBlobProps {
  position: [number, number, number];
  color: string;
  name: string;
  isPlaying: boolean;
  isSelected: boolean;
  audioData?: Float32Array;
  onClick: () => void;
  onDragStart: () => void;
  onDrag: (position: { x: number; y: number; z: number }) => void;
  onDragEnd: () => void;
  analyzer?: Tone.Analyser | null;
}

function AudioBlob({
  position,
  color,
  name,
  isPlaying,
  isSelected,
  audioData,
  onClick,
  onDragStart,
  onDrag,
  onDragEnd,
  analyzer
}: AudioBlobProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { camera, raycaster, mouse, gl } = useThree();
  const plane = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersection = useRef<THREE.Vector3>(new THREE.Vector3());
  
  // Create shader material on mount
  useEffect(() => {
    if (meshRef.current) {
      const material = createAudioBlobMaterial(color, isPlaying);
      meshRef.current.material = material;
      materialRef.current = material;
    }
  }, [color, isPlaying]);
  
  // Animation for blob when audio is playing
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Update shader uniforms
    if (materialRef.current) {
      // Get real-time FFT data if analyzer is available
      let fftData: Float32Array;
      if (analyzer && isPlaying) {
        fftData = analyzer.getValue() as Float32Array;
      } else {
        fftData = audioData || new Float32Array(512);
      }
      
      updateAudioBlobShader(
        materialRef.current,
        fftData,
        isPlaying,
        state.clock.elapsedTime
      );
    }
    
    // Simple scale animation as fallback if shader doesn't work
    if (isPlaying && !materialRef.current) {
      meshRef.current.scale.x = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.1;
      meshRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.1;
      meshRef.current.scale.z = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.1;
    } else if (!isPlaying && !materialRef.current) {
      meshRef.current.scale.set(1, 1, 1);
    }
    
    // Handle dragging
    if (isDragging) {
      raycaster.setFromCamera(mouse, camera);
      raycaster.ray.intersectPlane(plane.current, intersection.current);
      onDrag({
        x: intersection.current.x,
        y: intersection.current.y,
        z: intersection.current.z
      });
    }
  });
  
  const handlePointerDown = () => {
    setIsDragging(true);
    onDragStart();
    gl.domElement.style.cursor = 'grabbing';
  };
  
  const handlePointerUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onDragEnd();
      gl.domElement.style.cursor = 'grab';
    }
  };
  
  const handlePointerOver = () => {
    gl.domElement.style.cursor = 'grab';
  };
  
  const handlePointerOut = () => {
    gl.domElement.style.cursor = 'auto';
  };
  
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onDragEnd();
        gl.domElement.style.cursor = 'auto';
      }
    };
    
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [isDragging, onDragEnd, gl.domElement.style]);
  
  return (
    <group position={position}>
      {/* Audio source blob */}
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.5, 32, 32]} />
        {/* This material will be replaced by the shader in useEffect */}
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={0.8} 
          emissive={color}
          emissiveIntensity={isPlaying ? 0.5 : 0.2}
        />
      </mesh>
      
      {/* Selection indicator */}
      {isSelected && (
        <mesh>
          <ringGeometry args={[0.6, 0.7, 32]} />
          <meshBasicMaterial color="white" transparent opacity={0.8} />
        </mesh>
      )}
      
      {/* Label */}
      <Text
        position={[0, 0.8, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="bottom"
      >
        {name}
      </Text>
    </group>
  );
}

// Grid floor component
function GridFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#222" transparent opacity={0.5} />
      <gridHelper args={[20, 20, '#666', '#444']} position={[0, 0.01, 0]} rotation={[Math.PI / 2, 0, 0]} />
    </mesh>
  );
}

interface SpatialAudioSceneProps {
  audioSources: SpatialAudioData[];
  audioAnalysisData?: Float32Array;
  onAudioPlaced: (placement: AudioPlacement) => void;
  onAudioSelected: (id: string) => void;
  onAudioDropped?: (id: string, position: { x: number; y: number; z: number }) => void;
  analyzer?: Tone.Analyser | null;
  isPlaying?: boolean;
}

export function SpatialAudioScene({
  audioSources,
  audioAnalysisData,
  onAudioPlaced,
  onAudioSelected,
  onAudioDropped,
  analyzer,
  isPlaying = false
}: SpatialAudioSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dropPosition, setDropPosition] = useState({ x: 0, y: 0 });
  const [fftData, setFftData] = useState<Float32Array | null>(null);
  
  // Fetch FFT data periodically when playing
  useEffect(() => {
    if (!isPlaying || !analyzer) return;
    
    const updateFFT = () => {
      try {
        const data = analyzer.getValue() as Float32Array;
        setFftData(data);
      } catch (error) {
        console.error("Error getting FFT data:", error);
      }
    };
    
    // Update FFT data at animation frame rate
    const intervalId = setInterval(updateFFT, 1000 / 30); // ~30fps
    
    return () => {
      clearInterval(intervalId);
    };
  }, [isPlaying, analyzer]);
  
  // Handle drops from audio library
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!containerRef.current || !onAudioDropped) return;
    
    setIsDraggingOver(false);
    
    // Get audio ID from dataTransfer
    const audioId = e.dataTransfer.getData('audio/id');
    if (!audioId) return;
    
    // Calculate position based on drop location
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 10 - 5;
    const z = ((e.clientY - rect.top) / rect.height) * 10 - 5;
    
    // Add the audio to the scene at this position
    onAudioDropped(audioId, { x, y: 0.5, z });
  }, [onAudioDropped]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Update drop indicator position
    if (containerRef.current) {
      setDropPosition({
        x: e.clientX,
        y: e.clientY
      });
    }
    
    setIsDraggingOver(true);
  }, []);
  
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  }, []);

  return (
    <div 
      className="w-full h-full relative" 
      ref={containerRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      {isDraggingOver && (
        <div 
          className="audio-drop-indicator"
          style={{
            left: dropPosition.x - 50,
            top: dropPosition.y - 50
          }}
        />
      )}
      <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={0.8} 
          castShadow 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024} 
        />
        
        {/* Audio listener to update audio based on camera */}
        <AudioListener />
        
        {/* Scene elements */}
        <GridFloor />
        
        {/* Audio blobs */}
        {audioSources.map((source) => (
          <AudioBlob
            key={source.id}
            position={[source.position.x, source.position.y, source.position.z]}
            color={source.color}
            name={source.name}
            isPlaying={source.isPlaying}
            isSelected={!!source.isSelected}
            audioData={fftData || audioAnalysisData}
            analyzer={analyzer}
            onClick={() => onAudioSelected(source.id)}
            onDragStart={() => {
              onAudioPlaced({
                id: source.id,
                position: source.position,
                isDragging: true
              });
            }}
            onDrag={(position) => {
              onAudioPlaced({
                id: source.id,
                position,
                isDragging: true
              });
            }}
            onDragEnd={() => {
              onAudioPlaced({
                id: source.id,
                position: source.position,
                isDragging: false
              });
            }}
          />
        ))}
        
        {/* Controls */}
        <OrbitControls 
          enableDamping 
          dampingFactor={0.1} 
          rotateSpeed={0.5} 
          minDistance={2} 
          maxDistance={20} 
          minPolarAngle={0} 
          maxPolarAngle={Math.PI / 2} 
        />
      </Canvas>
    </div>
  );
}
