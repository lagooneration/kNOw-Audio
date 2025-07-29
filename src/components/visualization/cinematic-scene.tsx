import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import * as Tone from 'tone';

interface CinematicSceneProps {
  effects: {
    reverb: boolean;
    delay: boolean;
    distortion: boolean;
    filter: boolean;
  };
  analyzer: Tone.Analyser | null;
  isPlaying?: boolean;
}

export function CinematicScene({ analyzer }: CinematicSceneProps) {
  const localAnalyzerRef = useRef<Tone.Analyser | null>(null);
  
  // Create a placeholder for the cinematic scene
  useEffect(() => {
    // Use provided analyzer or create a local one if needed
    const audioAnalyzer = analyzer || new Tone.Analyser('fft', 256);
    if (!analyzer && !localAnalyzerRef.current) {
      localAnalyzerRef.current = audioAnalyzer;
    }
    
    // Cleanup
    return () => {
      if (localAnalyzerRef.current) {
        localAnalyzerRef.current.dispose();
      }
    };
  }, [analyzer]);
  
  // Create a text message as a placeholder
  const PlaceholderText = () => {
    const mesh = useRef<THREE.Mesh>(null);
    
    useFrame(() => {
      if (mesh.current) {
        mesh.current.rotation.y += 0.005;
      }
    });
    
    return (
      <mesh ref={mesh} position={[0, 0, 0]}>
        <planeGeometry args={[10, 5]} />
        <meshBasicMaterial>
          <canvasTexture 
            attach="map" 
            args={[createTextCanvas("Cinematic View Coming Soon", "#ffffff")]} 
          />
        </meshBasicMaterial>
      </mesh>
    );
  };
  
  // Helper function to create text canvas
  function createTextCanvas(text: string, color: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    if (context) {
      context.fillStyle = '#000033';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add a gradient background
      const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#000044');
      gradient.addColorStop(1, '#000022');
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add grid lines
      context.strokeStyle = '#1a1a55';
      context.lineWidth = 2;
      
      // Horizontal lines
      for (let y = 50; y < canvas.height; y += 50) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(canvas.width, y);
        context.stroke();
      }
      
      // Vertical lines
      for (let x = 50; x < canvas.width; x += 50) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height);
        context.stroke();
      }
      
      // Add text
      context.font = 'bold 72px Arial, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = color;
      context.fillText(text, canvas.width / 2, canvas.height / 2);
      
      // Add subtitle
      context.font = '36px Arial, sans-serif';
      context.fillText('Use the Analytical scene for 3D spectral visualization', canvas.width / 2, canvas.height / 2 + 100);
    }
    
    return canvas;
  }
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <PlaceholderText />
    </>
  );
}
