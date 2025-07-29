import { useRef, useEffect } from 'react';
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
}

export function AudioVisualizer({
  audioData,
  mode = '3d',
  color = '#4a88ff',
  backgroundColor = '#000000'
}: AudioVisualizerProps) {
  return (
    <div className="three-container">
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        gl={{ antialias: true }}
        style={{ background: backgroundColor }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <AudioVisualization audioData={audioData} mode={mode} color={color} />
        <OrbitControls enableZoom={true} enablePan={true} />
      </Canvas>
    </div>
  );
}

interface AudioVisualizationProps {
  audioData: AudioData;
  mode: 'frequency' | 'waveform' | '3d' | 'spectral';
  color: string;
}

function AudioVisualization({ audioData, mode, color }: AudioVisualizationProps) {
  const { scene } = useThree();
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Setup audio analyzer
  useEffect(() => {
    // Create audio context
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    
    // Create analyzer
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 512;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Create source
    const source = audioContext.createBufferSource();
    source.buffer = audioData.buffer;
    
    // Connect nodes
    source.connect(analyzer);
    analyzer.connect(audioContext.destination);
    
    // Start playback
    source.start();
    
    // Save references
    analyzerRef.current = analyzer;
    audioSourceRef.current = source;
    dataArrayRef.current = dataArray;
    
    // Clean up on unmount
    return () => {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioData]);

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
      const planeGeometry = new THREE.PlaneGeometry(20, 20, 64, 64);
      
      const uniforms = {
        u_time: { value: 0.0 },
        u_amplitude: { value: 3.0 },
        u_audio_data: { value: Array(64).fill(0) },
      };
      
      const planeMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: spectralVertexShader,
        fragmentShader: spectralFragmentShader,
        wireframe: true,
        transparent: true,
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
      const barCount = bufferLength;
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
    if (!analyzerRef.current || !dataArrayRef.current) return;
    
    const analyzer = analyzerRef.current;
    const dataArray = dataArrayRef.current;
    
    if (mode === 'spectral') {
      // Update spectral plane with audio data
      analyzer.getByteFrequencyData(dataArray);
      
      scene.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) {
          // Update shader uniforms
          child.material.uniforms.u_time.value += 0.1;
          
          // Map audio data to shader array
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
