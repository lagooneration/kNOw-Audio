import { useRef, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import ThreeForceGraph from 'three-forcegraph';
import * as Tone from 'tone';
import { analyzeTonality, frequencyToColor, analyzeSpectralFeatures } from '../../utils/audio-analysis';

// Fragment shader for spectral analysis visualization
const spectralFragmentShader = `
  uniform float time;
  uniform float audioIntensity;
  uniform sampler2D audioTexture;
  uniform vec3 baseColor;
  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vPosition;

  // HSL to RGB conversion
  vec3 hsl2rgb(vec3 hsl) {
    vec3 rgb = clamp(abs(mod(hsl.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return hsl.z + hsl.y * (rgb - 0.5) * (1.0 - abs(2.0 * hsl.z - 1.0));
  }

  void main() {
    // Get audio data from textures
    float audioValue = texture2D(audioTexture, vec2(vUv.x, 0.0)).r;
    
    // Calculate frequency-based color
    // Lower frequencies (red) at lower x, higher frequencies (blue/violet) at higher x
    float frequency = vUv.x; // Normalize to 0-1 range
    vec3 freqColor;
    
    // Spectral color gradient based on elevation and frequency
    float hue = mix(0.0, 0.75, frequency); // Red to Violet
    float saturation = 0.8;
    float lightness = 0.4 + vElevation * 0.3; // Higher elevation is brighter
    freqColor = hsl2rgb(vec3(hue, saturation, lightness));
    
    // Add topographic-like contour lines based on elevation
    float contourLines = step(0.98, mod(vElevation * 10.0, 1.0)) * 0.15;
    
    // Add grid pattern for data visualization - fixed grid
    float gridX = step(0.98, mod(vUv.x * 20.0, 1.0));
    float gridZ = step(0.98, mod(vPosition.z * 5.0, 1.0));
    float grid = max(gridX, gridZ) * 0.2;
    
    // Combine all elements for a spectral mountain visualization
    vec3 color = freqColor;
    color += vec3(grid);
    color += vec3(contourLines);
    
    // Add highlight at higher elevations to simulate snow caps or light reflection
    if (vElevation > 0.5) {
      color = mix(color, vec3(1.0, 1.0, 1.0), (vElevation - 0.5) * 0.8);
    }
    
    // Final color with analytical visualization appearance
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Vertex shader for spectral analysis visualization
const spectralVertexShader = `
  uniform float time;
  uniform float audioIntensity;
  uniform sampler2D audioTexture;
  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    
    // Get audio data at this frequency (x position mapped to frequency)
    float audioValue = texture2D(audioTexture, vec2(position.x * 0.5 + 0.5, 0.0)).r;
    
    // Calculate elevation based on audio data and position
    float elevation = 0.0;
    
    if (audioIntensity > 0.1) {
      // Map x position to frequency band and z position to time/frame
      float frequencyResponse = audioValue * (1.0 - abs(position.x) * 0.5);
      
      // Calculate the base elevation for this position
      float baseElevation = position.z < 0.0 ? 
                           frequencyResponse * 4.0 * audioIntensity * (1.0 + position.z) : 
                           frequencyResponse * 4.0 * audioIntensity;
      
      // Create mountain-like extrusion
      elevation = baseElevation * (1.0 - abs(position.z) * 0.5);
    }
    
    // Set the vertex elevation
    vec3 newPosition = position;
    newPosition.y = elevation;
    vElevation = elevation;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

interface AnalyticalSceneProps {
  effects: {
    reverb: boolean;
    delay: boolean;
    distortion: boolean;
    filter: boolean;
  };
  analyzer: Tone.Analyser | null;
  isPlaying?: boolean;
}

export function AnalyticalScene({ effects, analyzer, isPlaying = true }: AnalyticalSceneProps) {
  const spectrogramRef = useRef<THREE.Mesh | null>(null);
  const shaderMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const forceGraphRef = useRef<ThreeForceGraph | null>(null);
  const localAnalyzerRef = useRef<Tone.Analyser | null>(null);
  const prevSpectrumRef = useRef<Float32Array | null>(null);
  const frameCountRef = useRef(0);
  const referenceLineRef = useRef<THREE.Line | null>(null);
  const graphDataRef = useRef<any>({
    nodes: [],
    links: []
  });
  
  // State for tonality info
  const [tonalityInfo, setTonalityInfo] = useState({
    isMajor: true,
    isMinor: false,
    dominantKey: 'C',
    intensity: 0.5,
    lowFrequencyImpact: 0
  });

  // Frequency bands for the visualization
  const frequencyBands = useMemo(() => {
    const bands = [];
    const minFreq = 20;
    const maxFreq = 20000;
    const bandCount = 64;
    
    // Create logarithmic frequency bands
    for (let i = 0; i < bandCount; i++) {
      const normalizedPos = i / (bandCount - 1);
      // Logarithmic scaling for better perceptual distribution
      const freq = minFreq * Math.pow(maxFreq/minFreq, normalizedPos);
      
      bands.push({
        id: `freq-${i}`,
        frequency: freq,
        amplitude: 0.01, // Initial tiny amplitude
        x: (normalizedPos * 2 - 1) * 4, // Position along x-axis from -4 to 4
        y: 0, // Initial height
        z: 0,
        color: frequencyToColor(freq).getHexString()
      });
    }
    
    // Create initial graph data
    const initialGraphData = {
      nodes: bands,
      links: []
    };
    
    // Connect adjacent frequency bands
    for (let i = 0; i < bands.length - 1; i++) {
      initialGraphData.links.push({
        source: bands[i].id,
        target: bands[i + 1].id,
        value: 1
      });
    }
    
    graphDataRef.current = initialGraphData;
    return bands;
  }, []);

  // Create data texture for audio data
  const audioDataTexture = useMemo(() => {
    const size = 256;
    const data = new Float32Array(size * 4);
    for (let i = 0; i < size; i++) {
      const stride = i * 4;
      data[stride] = 0;
      data[stride + 1] = 0;
      data[stride + 2] = 0;
      data[stride + 3] = 1;
    }
    const texture = new THREE.DataTexture(
      data,
      size,
      1,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    texture.needsUpdate = true;
    return texture;
  }, []);
  
  // Create shader uniforms
  const uniforms = useMemo(() => ({
    time: { value: 0 },
    audioIntensity: { value: 0.5 },
    audioTexture: { value: audioDataTexture },
    baseColor: { value: new THREE.Color(0x4466ff) }
  }), [audioDataTexture]);
  
  // Setup analyzer and visualization elements
  useEffect(() => {
    // Use provided analyzer or create a local one
    const audioAnalyzer = analyzer || new Tone.Analyser('fft', 1024);
    if (!analyzer) {
      localAnalyzerRef.current = audioAnalyzer;
    }
    
    // Create shader material
    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: spectralVertexShader,
      fragmentShader: spectralFragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
    });
    shaderMaterialRef.current = shaderMaterial;
    
    // Create 3D spectrogram surface
    const spectrogramGeometry = new THREE.PlaneGeometry(8, 6, 128, 64);
    spectrogramGeometry.rotateX(-Math.PI / 3); // Steeper tilt for mountain-like appearance
    const spectrogram = new THREE.Mesh(spectrogramGeometry, shaderMaterial);
    spectrogram.position.z = -2;
    spectrogram.position.y = -1.5;
    spectrogramRef.current = spectrogram;
    
    // Create grid helper for analytical look - static grid
    const gridHelper = new THREE.GridHelper(10, 20, 0x444444, 0x222222);
    gridHelper.position.y = -2;
    gridRef.current = gridHelper;
    
    // Add a reference line at the front of the spectrogram - will be added to scene later
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-4, -1.5, 1),
      new THREE.Vector3(4, -1.5, 1)
    ]);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x88ff88, linewidth: 2 });
    const referenceLine = new THREE.Line(lineGeometry, lineMaterial);
    referenceLineRef.current = referenceLine;
    
    // Initialize 3D force graph
    const forceGraph = new ThreeForceGraph()
      .graphData(graphDataRef.current)
      .nodeRelSize(0.5)
      .nodeAutoColorBy('color')
      .nodeVal((node) => node.amplitude * 50)
      .linkWidth(0.1)
      .linkOpacity(0.2)
      .linkColor(() => new THREE.Color(0x88aaff));
    
    forceGraphRef.current = forceGraph;
    
    // Clean up
    return () => {
      if (localAnalyzerRef.current) {
        localAnalyzerRef.current.dispose();
      }
      
      if (spectrogramGeometry) {
        spectrogramGeometry.dispose();
      }
      
      if (shaderMaterial) {
        shaderMaterial.dispose();
      }
      
      if (lineGeometry) {
        lineGeometry.dispose();
      }
      
      if (lineMaterial) {
        lineMaterial.dispose();
      }
    };
  }, [uniforms, analyzer, graphDataRef]);
  
  // Update visualization based on effects
  useEffect(() => {
    if (!shaderMaterialRef.current) return;
    
    const shaderMaterial = shaderMaterialRef.current;
    
    // Apply effect-specific modifications
    if (effects.reverb) {
      shaderMaterial.uniforms.audioIntensity.value = 0.7;
    } else {
      shaderMaterial.uniforms.audioIntensity.value = 0.5;
    }
    
    // Update base color based on tonality
    if (tonalityInfo.isMinor) {
      // Minor keys get reddish tint
      shaderMaterial.uniforms.baseColor.value.setHSL(0.05, 0.8, 0.5); // Red
    } else {
      // Major keys get bluish tint
      shaderMaterial.uniforms.baseColor.value.setHSL(0.6, 0.8, 0.5); // Blue
    }
    
  }, [effects, tonalityInfo]);
  
  // Animation and audio data updates
  useFrame(({ clock, scene }) => {
    frameCountRef.current += 1;
    
    if (!spectrogramRef.current || !gridRef.current || !shaderMaterialRef.current || !forceGraphRef.current) return;
    
    const spectrogram = spectrogramRef.current;
    const grid = gridRef.current;
    const shaderMaterial = shaderMaterialRef.current;
    const forceGraph = forceGraphRef.current;
    const referenceLine = referenceLineRef.current;
    
    // Add objects to scene if not already added
    if (!scene.children.includes(spectrogram)) {
      scene.add(spectrogram);
    }
    
    if (!scene.children.includes(grid)) {
      scene.add(grid);
    }
    
    if (!scene.children.includes(forceGraph)) {
      scene.add(forceGraph);
      forceGraph.position.set(0, 2, 0); // Position above the spectrogram
    }
    
    // Add reference line if it exists and is not already in the scene
    if (referenceLine && !scene.children.includes(referenceLine)) {
      scene.add(referenceLine);
    }
    
    // Update time uniform
    shaderMaterial.uniforms.time.value = clock.getElapsedTime();
    
    // Stop visualization if audio is paused
    if (!isPlaying) {
      // Reset visual elements to static state when paused
      if (shaderMaterial.uniforms.audioIntensity.value > 0.1) {
        shaderMaterial.uniforms.audioIntensity.value = 0.1;
      }
      grid.position.y = -2; // Reset grid position
      
      // Reset force graph nodes to neutral position
      const graphData = graphDataRef.current;
      if (graphData.nodes) {
        for (let i = 0; i < graphData.nodes.length; i++) {
          const node = graphData.nodes[i];
          if (node) {
            node.y = 0.01; // Almost flat but not completely to keep some dimension
            node.amplitude = 0.01;
          }
        }
        forceGraph.graphData(graphData);
      }
      
      return; // Skip the rest of the animation loop when paused
    }
    
    // Get the appropriate analyzer
    const activeAnalyzer = analyzer || localAnalyzerRef.current;
    
    // Update audio data visualizations
    if (activeAnalyzer) {
      const audioData = activeAnalyzer.getValue() as Float32Array;
      
      if (audioData) {
        // Update the data texture with audio data
        const textureData = audioDataTexture.image.data;
        const dataSize = Math.min(audioData.length, textureData.length / 4);
        
        for (let i = 0; i < dataSize; i++) {
          const value = (audioData[i] as number + 140) / 140; // Normalize
          const stride = i * 4;
          textureData[stride] = value;     // R
          textureData[stride + 1] = value; // G
          textureData[stride + 2] = value; // B
          textureData[stride + 3] = 1;     // A
        }
        
        audioDataTexture.needsUpdate = true;
        
        // Update frequency graph nodes with new amplitude data
        if (frameCountRef.current % 2 === 0) {
          const graphData = graphDataRef.current;
          const bandCount = frequencyBands.length;
          const dataStep = Math.floor(dataSize / bandCount);
          
          for (let i = 0; i < bandCount; i++) {
            const dataIndex = i * dataStep;
            if (dataIndex < dataSize) {
              const audioValue = (audioData[dataIndex] as number + 140) / 140; // Normalize to 0-1
              const node = graphData.nodes[i];
              
              // Update node properties
              node.amplitude = audioValue;
              node.y = audioValue * 4; // Height based on amplitude
              
              // Use tonality info to adjust colors
              if (tonalityInfo.isMinor) {
                // For minor keys, shift colors towards red
                const baseHue = parseInt(node.color, 16);
                const redShift = new THREE.Color(baseHue).offsetHSL(-0.1, 0, 0);
                node.color = redShift.getHexString();
              }
            }
          }
          
          // Update the force graph
          forceGraph.graphData(graphData);
        }
        
        // Update tonality analysis once every few frames for performance
        if (frameCountRef.current % 30 === 0) {
          const tonality = analyzeTonality(audioData);
          setTonalityInfo(tonality);
          
          // Analyze spectral features
          const spectralFeatures = analyzeSpectralFeatures(
            audioData, 
            prevSpectrumRef.current || undefined
          );
          
          // Update the scene based on spectral features
          if (spectralFeatures.flux > 0.1) {
            // Strong spectral flux indicates transients/beats
            grid.material.color.setHSL(0.6, 0.5, 0.3 + spectralFeatures.flux * 0.3);
          }
          
          // Store current spectrum for next frame comparison
          prevSpectrumRef.current = new Float32Array(audioData);
        }
        
        // Low frequency impact visualization
        if (isPlaying && tonalityInfo.lowFrequencyImpact > 0.1) {
          // Only apply subtle visual effects to the shader, not the grid
          shaderMaterial.uniforms.audioIntensity.value = 0.5 + tonalityInfo.lowFrequencyImpact * 0.3;
          // Keep grid static
          grid.position.y = -2;
        } else {
          grid.position.y = -2;
        }
      }
    }
  });
  
  return (
    <>
      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} />
        <Vignette eskil={false} offset={0.1} darkness={0.2} />
      </EffectComposer>
      <OrbitControls enableDamping dampingFactor={0.05} />
    </>
  );
}
