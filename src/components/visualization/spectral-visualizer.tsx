import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { AudioData } from '../../types/audio';

// Shader for creating dynamic, colorful spectral visualization
const vertexShader = `
  varying float x;
  varying float y;
  varying float z;
  varying vec3 vUv;

  uniform float u_time;
  uniform float u_amplitude;
  uniform float[64] u_track1_data;
  uniform float[64] u_track2_data;

  void main() {
    vUv = position;
    x = abs(position.x);
    y = abs(position.y);

    float floor_x = round(x);
    float floor_y = round(y);

    float x_multiplier = (32.0 - x) / 8.0;
    float y_multiplier = (32.0 - y) / 8.0;

    // Combine frequency data from both tracks
    float track1_z = u_track1_data[int(floor_x)] / 50.0 + u_track1_data[int(floor_y)] / 50.0;
    float track2_z = u_track2_data[int(floor_x)] / 50.0 + u_track2_data[int(floor_y)] / 50.0;
    
    // Create dynamic wave pattern
    z = sin(track1_z + track2_z + u_time * 0.002) * u_amplitude;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position.x, position.y, z, 1.0);
  }
`;

const fragmentShader = `
  varying float x;
  varying float y;
  varying float z;
  varying vec3 vUv;

  uniform float u_time;

  void main() {
    // Create a dynamic color pattern based on position and time
    vec3 color1 = vec3(0.5, 0.8, 1.0); // Light blue
    vec3 color2 = vec3(1.0, 0.5, 0.8); // Pink
    
    float blend = sin(u_time * 0.001 + (x + y) * 0.1) * 0.5 + 0.5;
    vec3 finalColor = mix(color1, color2, blend);
    
    // Add some brightness variation based on height
    float brightness = (z + 1.0) * 0.5;
    
    gl_FragColor = vec4(finalColor * brightness, 1.0);
  }
`;

interface SpectralVisualizerProps {
  track1: AudioData;
  track2: AudioData;
  width: number;
  height: number;
}

export default function SpectralVisualizer({ track1, track2, width, height }: SpectralVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: ThreeOrbitControls;
    uniforms: any;
    analyser1: AnalyserNode;
    analyser2: AnalyserNode;
    dataArray1: Uint8Array;
    dataArray2: Uint8Array;
  }>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Set up Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });

    renderer.setSize(width, height);
    camera.position.set(32, 32, 32);
    camera.lookAt(0, 0, 0);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffffff, 0.8);
    spotLight.position.set(0, 64, 32);
    scene.add(spotLight);

    // Set up audio analyzers
    const audioContext = new AudioContext();
    const analyser1 = audioContext.createAnalyser();
    const analyser2 = audioContext.createAnalyser();
    
    analyser1.fftSize = 128;
    analyser2.fftSize = 128;
    
    const source1 = audioContext.createBufferSource();
    const source2 = audioContext.createBufferSource();
    
    source1.buffer = track1.buffer;
    source2.buffer = track2.buffer;
    
    source1.connect(analyser1);
    source2.connect(analyser2);
    
    analyser1.connect(audioContext.destination);
    analyser2.connect(audioContext.destination);
    
    const dataArray1 = new Uint8Array(analyser1.frequencyBinCount);
    const dataArray2 = new Uint8Array(analyser2.frequencyBinCount);

    // Create geometry and material
    const geometry = new THREE.PlaneGeometry(64, 64, 64, 64);
    const uniforms = {
      u_time: { value: 0.0 },
      u_amplitude: { value: 3.0 },
      u_track1_data: { value: Array(64).fill(0) },
      u_track2_data: { value: Array(64).fill(0) },
    };

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      wireframe: true,
      transparent: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2 + Math.PI / 4;
    mesh.scale.set(2, 2, 2);
    mesh.position.y = 8;
    scene.add(mesh);

    // Set up controls
    const controls = new ThreeOrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;

    // Store references
    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      uniforms,
      analyser1,
      analyser2,
      dataArray1,
      dataArray2,
    };

    // Animation loop
    const animate = () => {
      if (!sceneRef.current) return;

      const {
        uniforms,
        renderer,
        scene,
        camera,
        controls,
        analyser1,
        analyser2,
        dataArray1,
        dataArray2,
      } = sceneRef.current;

      requestAnimationFrame(animate);

      // Update frequency data
      analyser1.getByteFrequencyData(dataArray1);
      analyser2.getByteFrequencyData(dataArray2);

      // Update uniforms
      uniforms.u_time.value += 0.1;
      uniforms.u_track1_data.value = Array.from(dataArray1).map(v => v / 255);
      uniforms.u_track2_data.value = Array.from(dataArray2).map(v => v / 255);

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!sceneRef.current) return;

      const { camera, renderer } = sceneRef.current;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      audioContext.close();
      if (sceneRef.current) {
        sceneRef.current.controls.dispose();
        sceneRef.current.renderer.dispose();
      }
    };
  }, [track1, track2, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-full bg-transparent rounded-lg"
    />
  );
}
