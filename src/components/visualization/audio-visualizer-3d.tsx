import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { type AudioData } from '../../types/audio';
import { spectralVertexShader, spectralFragmentShader } from '../../utils/audio-shaders';

interface AudioVisualizerProps {
  audioData: AudioData;
  mode?: 'frequency' | 'waveform' | '3d' | 'spectral';
  color?: string;
  backgroundColor?: string;
  externalAudio?: HTMLAudioElement;
  sharedAnalyser?: AnalyserNode | null;
}

export function AudioVisualizer({
  audioData,
  mode = '3d',
  color = '#4a88ff',
  backgroundColor = '#060010', // Matching the app theme
  externalAudio,
  sharedAnalyser
}: AudioVisualizerProps) {
  return (
    <div className="three-container w-full h-full rounded-md overflow-hidden">
      <Canvas
        camera={{ position: [0, 2, 15], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: backgroundColor }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8800ff" />
        <AudioVisualization 
          audioData={audioData} 
          mode={mode} 
          color={color} 
          externalAudio={externalAudio} 
          sharedAnalyser={sharedAnalyser}
        />
        <OrbitControls enableZoom={true} enablePan={true} />
      </Canvas>
    </div>
  );
}

interface AudioVisualizationProps {
  audioData: AudioData;
  mode: 'frequency' | 'waveform' | '3d' | 'spectral';
  color: string;
  externalAudio?: HTMLAudioElement;
  sharedAnalyser?: AnalyserNode | null;
}

function AudioVisualization({ audioData, mode, color, externalAudio, sharedAnalyser }: AudioVisualizationProps) {
  const { scene } = useThree();
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Setup audio analyzer
  useEffect(() => {
    // Use shared analyser if provided, otherwise create our own
    if (sharedAnalyser) {
      analyzerRef.current = sharedAnalyser;
      const bufferLength = sharedAnalyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      // Monitor external audio playback state if using shared analyser
      if (externalAudio) {
        const updatePlaybackState = () => {
          setIsPlaying(!externalAudio.paused);
        };
        
        externalAudio.addEventListener('play', updatePlaybackState);
        externalAudio.addEventListener('pause', updatePlaybackState);
        externalAudio.addEventListener('ended', updatePlaybackState);
        
        // Initial state
        setIsPlaying(!externalAudio.paused);
        
        // Cleanup function
        return () => {
          externalAudio.removeEventListener('play', updatePlaybackState);
          externalAudio.removeEventListener('pause', updatePlaybackState);
          externalAudio.removeEventListener('ended', updatePlaybackState);
        };
      }
    } else {
      // Create audio context
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      // Create analyzer
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 512;
      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Handle audio source based on whether external audio is provided
      if (externalAudio) {
        // Use external audio element
        try {
          const source = audioContext.createMediaElementSource(externalAudio);
          source.connect(analyzer);
          analyzer.connect(audioContext.destination);
          
          // Monitor external audio playback state
          const updatePlaybackState = () => {
            setIsPlaying(!externalAudio.paused);
          };
          
          externalAudio.addEventListener('play', updatePlaybackState);
          externalAudio.addEventListener('pause', updatePlaybackState);
          externalAudio.addEventListener('ended', updatePlaybackState);
          
          // Initial state
          setIsPlaying(!externalAudio.paused);
          
          // Cleanup function
          return () => {
            externalAudio.removeEventListener('play', updatePlaybackState);
            externalAudio.removeEventListener('pause', updatePlaybackState);
            externalAudio.removeEventListener('ended', updatePlaybackState);
            if (audioContextRef.current) {
              audioContextRef.current.close();
            }
          };
        } catch (err) {
          console.warn('Audio element already connected, cannot create new MediaElementSource:', err instanceof Error ? err.message : 'Unknown error');
        }
      } else if (audioData?.buffer) {
        // Create source from buffer
        const source = audioContext.createBufferSource();
        source.buffer = audioData.buffer;
        source.connect(analyzer);
        analyzer.connect(audioContext.destination);
        
        // Don't start playback automatically
        // Only play when user clicks play button
        setIsPlaying(false);
        
        // Save source reference
        audioSourceRef.current = source;
      } else {
        console.warn('No valid audio buffer available for 3D visualization');
      }
      
      // Save references
      analyzerRef.current = analyzer;
      dataArrayRef.current = dataArray;
      
      // Clean up on unmount
      return () => {
        if (audioSourceRef.current) {
          try {
            audioSourceRef.current.stop();
          } catch {
            // Ignore if already stopped
          }
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };
    }
  }, [audioData, externalAudio, sharedAnalyser]);

  // Create 3D visualization
  useEffect(() => {
    if (!analyzerRef.current || !dataArrayRef.current) return;
    
    // Clear existing objects
    while (scene.children.length > 0) {
      const obj = scene.children[0];
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Group) {
        scene.remove(obj);
      } else {
        break;
      }
    }
    
    const analyzer = analyzerRef.current;
    const bufferLength = analyzer.frequencyBinCount;
    
    if (mode === 'spectral') {
      // Create a spectral plane with shader material
      const planeGeometry = new THREE.PlaneGeometry(20, 20, 128, 128); // Higher resolution for better detail
      
      // Create audio data texture
      const audioTextureData = new Uint8Array(64 * 4); // RGBA format
      const audioTexture = new THREE.DataTexture(
        audioTextureData,
        64,
        1,
        THREE.RGBAFormat
      );
      audioTexture.needsUpdate = true;
      
      const uniforms = {
        time: { value: 0.0 },
        audioIntensity: { value: 3.0 },
        audioTexture: { value: audioTexture },
        u_time: { value: 0.0 },               // For backward compatibility
        u_amplitude: { value: 3.0 },          // For backward compatibility
        u_audio_data: { value: Array(64).fill(0) }  // For backward compatibility
      };
      
      const planeMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: spectralVertexShader,
        fragmentShader: spectralFragmentShader,
        wireframe: false,  // Change to solid rendering for better visuals
        transparent: true,
        side: THREE.DoubleSide,  // Make it visible from both sides
      });
      
      const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
      planeMesh.rotation.x = -Math.PI / 2 + Math.PI / 4; // Rotate for better viewing angle
      scene.add(planeMesh);
      
    } else if (mode === 'frequency' || mode === '3d') {
      // Create frequency bars
      const group = new THREE.Group();
      const barMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        metalness: 0.5,
        roughness: 0.3
      });
      
      const barWidth = 0.2;
      const barSpacing = 0.05;
      const barCount = Math.min(bufferLength, 128); // Limit to 128 bars for performance
      const totalWidth = barCount * (barWidth + barSpacing);
      
      for (let i = 0; i < barCount; i++) {
        const barGeometry = new THREE.BoxGeometry(barWidth, 1, barWidth);
        const bar = new THREE.Mesh(barGeometry, barMaterial);
        
        const x = -totalWidth / 2 + i * (barWidth + barSpacing);
        bar.position.set(x, 0, 0);
        
        group.add(bar);
      }
      
      scene.add(group);
    } else if (mode === 'waveform') {
      // Create waveform
      const lineGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(bufferLength * 3);
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const lineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color(color)
      });
      
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
    }
  }, [audioData, mode, color, scene]);

  // Update visualization on each frame
  useFrame(() => {
    if (!analyzerRef.current || !dataArrayRef.current || !isPlaying) return;
    
    // If using internal source and not using external audio, start it when play button is clicked
    if (!externalAudio && audioSourceRef.current && audioContextRef.current && isPlaying && audioData?.buffer) {
      try {
        // Start the audio source if it's not already started
        if (audioContextRef.current.state !== 'running') {
          // Create a new source node
          const newSource = audioContextRef.current.createBufferSource();
          newSource.buffer = audioData.buffer;
          newSource.connect(analyzerRef.current);
          analyzerRef.current.connect(audioContextRef.current.destination);
          newSource.start();
          
          // Store the new source
          audioSourceRef.current = newSource;
        }
      } catch (error) {
        console.error('Error starting audio source:', error);
      }
    }
    
    const analyzer = analyzerRef.current;
    const dataArray = dataArrayRef.current;
    
    if (mode === 'spectral') {
      // Update spectral plane with audio data
      analyzer.getByteFrequencyData(dataArray);
      
      scene.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) {
          // Update time uniform (for both naming conventions)
          child.material.uniforms.time.value += 0.1;
          child.material.uniforms.u_time.value += 0.1;
          
          // Update audio texture
          if (child.material.uniforms.audioTexture?.value instanceof THREE.DataTexture) {
            const audioTexture = child.material.uniforms.audioTexture.value;
            const audioTextureData = audioTexture.image.data;
            
            // Update texture data with audio frequencies
            for (let i = 0; i < 64; i++) {
              const value = dataArray[i] / 255.0;
              // Cast to Uint8Array to avoid TypeScript errors
              const textureData = audioTextureData as Uint8Array;
              textureData[i * 4] = Math.floor(value * 255);     // R
              textureData[i * 4 + 1] = Math.floor(value * 255); // G
              textureData[i * 4 + 2] = Math.floor(value * 255); // B
              textureData[i * 4 + 3] = 255;                     // A
            }
            
            audioTexture.needsUpdate = true;
          }
          
          // Map audio data to legacy shader array for backward compatibility
          const audioDataArray = Array.from(dataArray.slice(0, 64)).map(v => v / 255.0);
          child.material.uniforms.u_audio_data.value = audioDataArray;
          
          // Add some dynamic movement
          child.rotation.z = Math.sin(Date.now() * 0.0005) * 0.1;
        }
      });
    } else if (mode === 'frequency' || mode === '3d') {
      // Update frequency bars
      analyzer.getByteFrequencyData(dataArray);
      
      scene.children.forEach(child => {
        if (child instanceof THREE.Group) {
          const bars = child.children;
          
          for (let i = 0; i < bars.length; i++) {
            const bar = bars[i];
            if (bar instanceof THREE.Mesh) {
              const value = dataArray[i] / 255;
              const height = value * 5 + 0.1;
              
              bar.scale.y = height;
              bar.position.y = height / 2;
              
              if (mode === '3d') {
                // Add some movement in z-axis for 3D effect
                bar.position.z = Math.sin(Date.now() * 0.001 + i * 0.1) * value;
                
                // Rotate for more dynamic visualization
                bar.rotation.y = Math.sin(Date.now() * 0.001 + i * 0.1) * 0.2;
              }
            }
          }
        }
      });
    } else if (mode === 'waveform') {
      // Update waveform
      analyzer.getByteTimeDomainData(dataArray);
      
      scene.children.forEach(child => {
        if (child instanceof THREE.Line) {
          const positions = child.geometry.attributes.position.array as Float32Array;
          
          for (let i = 0; i < dataArray.length; i++) {
            const value = dataArray[i] / 128 - 1;
            const index = i * 3;
            
            positions[index] = (i / dataArray.length) * 20 - 10;
            positions[index + 1] = value * 5;
            positions[index + 2] = 0;
          }
          
          child.geometry.attributes.position.needsUpdate = true;
        }
      });
    }
  });

  return null;
}
