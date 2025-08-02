import { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import * as Tone from 'tone';
import { type SpatialAudioData, type AudioPlacement } from '../../types/spatial-audio';
import { createPerlinNoiseBlobMaterial, updatePerlinNoiseBlobShader } from './perlin-noise-blob-shader';
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
      // Use the Perlin noise blob material instead of the regular blob material
      const material = createPerlinNoiseBlobMaterial(color, isPlaying);
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
      
      // Use the new Perlin noise blob shader updater
      updatePerlinNoiseBlobShader(
        materialRef.current,
        fftData,
        isPlaying,
        state.clock.elapsedTime
      );
    }
    // Note: Removed scale animation as we're only using shader-based animation
    
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
  
  const handlePointerDown = (e: React.PointerEvent) => {
    // Prevent event propagation to ensure we don't trigger other events
    e.stopPropagation();
    
    if (disableDragging) {
      onClick();
      return;
    }
    
    // First select the audio blob
    onClick();
    
    // Then enable dragging - capture the pointer to ensure all subsequent events go to this element
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    onDragStart();
    gl.domElement.style.cursor = 'grabbing';
  };
  
  const handlePointerUp = (e: React.PointerEvent) => {
    // Release pointer capture
    e.currentTarget.releasePointerCapture(e.pointerId);
    
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
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerMove={(e) => {
          if (isDragging) {
            e.stopPropagation();
            raycaster.setFromCamera(mouse, camera);
            raycaster.ray.intersectPlane(plane.current, intersection.current);
            onDrag({
              x: intersection.current.x,
              y: intersection.current.y,
              z: intersection.current.z
            });
          }
        }}
      >
        {/* Use an icosahedron for better Perlin noise displacement, but with moderate detail for wireframe clarity */}
        <icosahedronGeometry args={[0.5, 4]} />
        {/* This material will be replaced by the shader in useEffect */}
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={0.8} 
          emissive={color}
          emissiveIntensity={isPlaying ? 0.6 : 0.2}
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

// Camera placeholder indicator for 2D view
function CameraPlaceholder() {
  const { camera } = useThree();
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      // Position the placeholder on the ground (y=0) directly below the camera
      meshRef.current.position.x = camera.position.x;
      meshRef.current.position.z = camera.position.z;
      
      // Calculate rotation based on camera's horizontal direction
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      const horizontalDirection = new THREE.Vector3(direction.x, 0, direction.z).normalize();
      meshRef.current.rotation.y = Math.atan2(horizontalDirection.x, horizontalDirection.z);
    }
  });
  
  return (
    <group position={[0, 0.05, 0]}>
      {/* Camera position indicator with all components in one group for consistent movement */}
      <group ref={meshRef}>
        {/* Main camera position marker */}
        <mesh>
          <cylinderGeometry args={[0.3, 0.3, 0.02, 16]} />
          <meshBasicMaterial color="#22DDAA" transparent opacity={0.7} />
        </mesh>
        
        {/* Direction indicator */}
        <mesh position={[0, 0, -0.4]}>
          <coneGeometry args={[0.15, 0.3, 8]} />
          <meshBasicMaterial color="#22DDAA" transparent opacity={0.7} />
        </mesh>
        
        {/* Line connecting the camera position to the direction indicator */}
        <mesh position={[0, 0, -0.2]}>
          <boxGeometry args={[0.05, 0.01, 0.4]} />
          <meshBasicMaterial color="#22DDAA" transparent opacity={0.7} />
        </mesh>
      </group>
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
  const cursorPanningActive = useRef(false); // Disable cursor panning by default for free roam
  const fixedHeight = useRef(0.5); // Set camera at the same height as audio blobs
  
  // Set initial camera angle (parallel to the grid)
  useEffect(() => {
    // Position the camera at a higher position to see the grid from above
    camera.position.set(0, fixedHeight.current, 8); // Maintain the same distance
    // Set camera to look parallel to the grid (no tilt)
    camera.rotation.x = 0; // 0 degrees - horizontal view
  }, [camera]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) { // Right mouse button only
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
        // Keep cursor panning disabled for free roam
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (mouseDown.current) {
        const dx = e.clientX - lastMousePosition.current.x;
        
        if (dx !== 0) {
          // Only apply horizontal rotation (left/right)
          camera.rotation.y -= dx * rotateSpeed.current;
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
    
    // We'll use this for horizontal movement only (ignore y component)
    const horizontalDirection = new THREE.Vector3(direction.x, 0, direction.z).normalize();
    
    // Get right vector by crossing direction with up vector
    const right = new THREE.Vector3();
    right.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
    
    // Calculate movement vector based on keys pressed
    const movementVector = new THREE.Vector3(0, 0, 0);
    
    // Move forward/backward (in the horizontal plane only)
    if (keys.current['w']) {
      movementVector.add(horizontalDirection.clone().multiplyScalar(moveSpeed.current));
    }
    if (keys.current['s']) {
      movementVector.add(horizontalDirection.clone().multiplyScalar(-moveSpeed.current));
    }
    
    // Strafe left/right
    if (keys.current['a']) {
      movementVector.add(right.clone().multiplyScalar(-moveSpeed.current));
    }
    if (keys.current['d']) {
      movementVector.add(right.clone().multiplyScalar(moveSpeed.current));
    }
    
    // Apply movement directly to camera position
    camera.position.add(movementVector);
    
    // Lock camera height at fixed position
    camera.position.y = fixedHeight.current;
    
    // Ensure camera remains parallel to the grid
    camera.rotation.x = 0; // Keep horizontal (parallel to grid)
    camera.rotation.z = 0; // Prevent any roll
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
  const [showNavigationHelp] = useState(true); // Always show navigation help
  
  // Fetch FFT data periodically when playing
  useEffect(() => {
    if (!isPlaying || !analyzer) return;
    
    const updateFFT = () => {
      try {
        const data = analyzer.getValue() as Float32Array;
        
        // Apply some pre-processing to the FFT data for better visualization
        const processedData = new Float32Array(data.length);
        for (let i = 0; i < data.length; i++) {
          // Convert dB values to normalized range
          let value = Math.max(0, (data[i] + 140) / 60);
          
          // Apply frequency-dependent boosts
          if (i > 20 && i < 100) {
            value *= 1.8; // Boost mid-range
          } else if (i > 100) {
            value *= 2.0; // Boost highs
          } else {
            value *= 1.5; // Boost lows
          }
          
          // Apply minimum value to ensure some activity
          value = Math.max(value, 0.05);
          
          // Clamp to prevent excessive values
          value = Math.min(value, 1.0);
          
          processedData[i] = value;
        }
        
        setFftData(processedData);
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

      {/* Navigation help overlay */}
      {showNavigationHelp && (
        <div className="navigation-help">
          <div className="flex items-center">
            <div className="mr-1">Move:</div>
            <span className="key-control">W</span><span className="key-control">A</span><span className="key-control">S</span><span className="key-control">D</span>
            <div className="mx-1 h-3 w-px bg-gray-500"></div>
            <div className="mr-1">Rotate:</div>
            <span className="key-control">Right Click + Drag Horizontally</span>
          </div>
        </div>
      )}
      
      <Canvas 
        camera={{ 
          position: [0, 0.5, 8], 
          fov: 75,  // Wider field of view for better visibility of blobs
          near: 0.1,
          far: 1000,
          // Don't set any lookAt property to avoid constraining the camera
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color('#0a0a15')); // Darker background
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Better performance
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
        
        {/* Add a subtle point light for more balanced lighting on blobs */}
        <pointLight position={[0, 3, 0]} intensity={0.4} color="#5555dd" />
        
        {/* Add volumetric fog for depth perception */}
        <fog attach="fog" args={['#0a0a15', 15, 35]} />
        
        {/* Add WASD controls */}
        <WASDControls />
        
        {/* Add post-processing effects */}
        <EffectComposer>
          <Bloom 
            intensity={0.4} 
            luminanceThreshold={0.2} 
            luminanceSmoothing={0.9} 
            mipmapBlur
            radius={0.5}
          />
          <Vignette 
            darkness={0.4} 
            offset={0.2} 
            eskil={false} 
            blendFunction={BlendFunction.NORMAL} 
          />
        </EffectComposer>
        
        {/* Audio listener to update audio based on camera */}
        <AudioListener />
        
        {/* Scene elements */}
        <GridFloor />
        
        {/* Camera placeholder on ground */}
        <CameraPlaceholder />
        
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
            disableDragging={false} // Always allow dragging for all audio blobs
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
          enabled={false} /* Disable OrbitControls completely for free roam */
          enableDamping={false}
          enableRotate={false} 
          enableZoom={true} 
          enablePan={false} 
        />
      </Canvas>
    </div>
  );
}
