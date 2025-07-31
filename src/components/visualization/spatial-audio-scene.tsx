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
  disableDragging?: boolean;
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
  analyzer,
  disableDragging = false
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
    if (disableDragging) {
      onClick();
      return;
    }
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
    <>
      {/* Main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0.6} />
      </mesh>
      
      {/* Grid helper */}
      <gridHelper args={[100, 100, '#4a5568', '#2d3748']} position={[0, 0.01, 0]} />
      
      {/* Center marker */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.7, 32]} />
        <meshBasicMaterial color="#4299e1" transparent opacity={0.7} />
      </mesh>
      
      {/* Coordinate axes for reference */}
      <group position={[0, 0.05, 0]}>
        {/* X axis (red) */}
        <mesh position={[5, 0, 0]}>
          <boxGeometry args={[10, 0.05, 0.05]} />
          <meshBasicMaterial color="#f56565" />
        </mesh>
        
        {/* Z axis (blue) */}
        <mesh position={[0, 0, 5]}>
          <boxGeometry args={[0.05, 0.05, 10]} />
          <meshBasicMaterial color="#4299e1" />
        </mesh>
      </group>
    </>
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

// WASD controls component
function WASDControls() {
  const { camera, gl } = useThree();
  const keys = useRef<{[key: string]: boolean}>({});
  const moveSpeed = useRef(0.1);
  const rotateSpeed = useRef(0.02);
  const mouseDown = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const cursorPanningActive = useRef(true);
  
  // Set initial camera angle (slightly elevated and tilted)
  useEffect(() => {
    // Position the camera at an angle (not completely horizontal)
    camera.position.set(0, 5, 10);
    // Tilt the camera down slightly
    camera.rotation.x = -Math.PI / 12; // -15 degrees
  }, [camera]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) { // Right mouse button
        mouseDown.current = true;
        lastMousePosition.current = { x: e.clientX, y: e.clientY };
        gl.domElement.style.cursor = 'grabbing';
        cursorPanningActive.current = false; // Disable cursor panning during manual rotation
      }
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2) { // Right mouse button
        mouseDown.current = false;
        gl.domElement.style.cursor = 'auto';
        cursorPanningActive.current = true; // Re-enable cursor panning
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (mouseDown.current) {
        const dx = e.clientX - lastMousePosition.current.x;
        const dy = e.clientY - lastMousePosition.current.y;
        
        if (dx !== 0 || dy !== 0) {
          camera.rotation.y -= dx * rotateSpeed.current;
          camera.rotation.x -= dy * rotateSpeed.current;
          // Clamp vertical rotation to avoid flipping
          camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
        }
        
        lastMousePosition.current = { x: e.clientX, y: e.clientY };
      }
    };
    
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Prevent context menu when right-clicking
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [camera, gl.domElement.style]);
  
  useFrame(() => {
    // Get the direction vector where the camera is looking
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    // Get right vector by crossing direction with up vector
    const right = new THREE.Vector3();
    right.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
    
    // Move forward/backward
    if (keys.current['w']) {
      camera.position.addScaledVector(direction, moveSpeed.current);
    }
    if (keys.current['s']) {
      camera.position.addScaledVector(direction, -moveSpeed.current);
    }
    
    // Strafe left/right
    if (keys.current['a']) {
      camera.position.addScaledVector(right, -moveSpeed.current);
    }
    if (keys.current['d']) {
      camera.position.addScaledVector(right, moveSpeed.current);
    }
    
    // Up/down movement
    if (keys.current[' ']) { // Space to move up
      camera.position.y += moveSpeed.current;
    }
    if (keys.current['shift']) { // Shift to move down
      camera.position.y -= moveSpeed.current;
    }
    
    // Cursor-based camera panning
    if (cursorPanningActive.current) {
      // Get cursor position
      const cursor = new THREE.Vector2();
      cursor.x = (gl.domElement.offsetWidth / 2 - gl.domElement.getBoundingClientRect().left);
      cursor.y = (gl.domElement.offsetHeight / 2 - gl.domElement.getBoundingClientRect().top);
      
      // Calculate cursor distance from center in each dimension (normalized -1 to 1)
      const mousePosX = gl.domElement.offsetWidth / 2 - cursor.x;
      const mousePosY = gl.domElement.offsetHeight / 2 - cursor.y;
      
      // Calculate panning speed based on cursor position
      // The closer to the edge, the faster the panning
      const panX = (mousePosX / (gl.domElement.offsetWidth / 2)) * 0.01;
      const panY = (mousePosY / (gl.domElement.offsetHeight / 2)) * 0.005;
      
      // Apply panning if mouse is within the canvas
      if (Math.abs(mousePosX) < gl.domElement.offsetWidth / 2 && 
          Math.abs(mousePosY) < gl.domElement.offsetHeight / 2) {
        camera.rotation.y += panX;
        camera.rotation.x += panY;
        // Clamp vertical rotation to avoid flipping
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
      }
    }
  });
  
  return null;
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
  const [disableBlobDragging, setDisableBlobDragging] = useState(false);
  const [showNavigationHelp, setShowNavigationHelp] = useState(true);
  
  // Hide navigation help after 5 seconds
  useEffect(() => {
    if (showNavigationHelp) {
      const timer = setTimeout(() => {
        setShowNavigationHelp(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showNavigationHelp]);
  
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
  
  // Control whether blob dragging is enabled
  useEffect(() => {
    // Disable blob dragging when a blob is placed for the first time
    if (audioSources.length > 0 && !disableBlobDragging) {
      setDisableBlobDragging(true);
    }
  }, [audioSources, disableBlobDragging]);

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

      {/* Navigation help overlay */}
      {showNavigationHelp && (
        <div className="navigation-help">
          <p className="mb-1 font-medium">3D Navigation Controls:</p>
          <p>
            Move: <span className="key-control">W</span> <span className="key-control">A</span> <span className="key-control">S</span> <span className="key-control">D</span> | 
            Look: Move cursor or right-click drag
          </p>
        </div>
      )}
      
      <Canvas 
        camera={{ 
          position: [0, 5, 10], 
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color('#1a1a2e'));
          gl.shadowMap.enabled = true;
        }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={0.8} 
          castShadow 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024} 
        />
        
        {/* Add fog for depth perception */}
        <fog attach="fog" args={['#1a1a2e', 15, 40]} />
        
        {/* Add WASD controls */}
        <WASDControls />
        
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
            disableDragging={disableBlobDragging}
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
          enableDamping={false}
          enableRotate={false} 
          enableZoom={true} 
          enablePan={false} 
        />
      </Canvas>
      
      {/* Coordinate axis indicator */}
      <div className="coordinate-axis">
        <div className="axis-label axis-x">
          <span className="mr-2">X</span>
          <div className="w-4 h-1 bg-current"></div>
        </div>
        <div className="axis-label axis-y">
          <span className="mr-2">Y</span>
          <div className="w-4 h-1 bg-current"></div>
        </div>
        <div className="axis-label axis-z">
          <span className="mr-2">Z</span>
          <div className="w-4 h-1 bg-current"></div>
        </div>
      </div>
    </div>
  );
}
