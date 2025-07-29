import { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as Tone from 'tone';
import { v4 as uuidv4 } from 'uuid';
import { EditorSidebar } from './editor-sidebar';
import { EditorRightSidebar } from './editor-right-sidebar';
import { EditorToolbar } from './editor-toolbar';
import './editor-styles.css';
// Import visualization components
import { CinematicScene } from '../visualization/cinematic-scene';
import { SpectralAudioVisualizer } from '../visualization/spectral-audio-visualizer';
import { SpatialAudioScene } from '../visualization/spatial-audio-scene';
import { useAudioLibrary } from '../../hooks/use-audio-library';
import { type AudioData } from '../../types/audio';
import { type AudioPlacement, type SpatialAudioData } from '../../types/spatial-audio';

interface AudioEditorProps {
  audioData?: AudioData;
}

export function AudioEditor({ audioData }: AudioEditorProps) {
  // Audio library state
  const {
    library,
    addAudioFile,
    removeAudioFile,
    selectAudioFile,
    createSpatialAudio,
    MAX_AUDIO_FILES
  } = useAudioLibrary();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [effects, setEffects] = useState({
    reverb: false,
    delay: false,
    distortion: false,
    filter: false,
  });
  const [filterFreq, setFilterFreq] = useState(1000);
  const [visualizationType, setVisualizationType] = useState<'mathematical' | 'cinematic' | 'spatial'>('spatial');
  const [isOscillatorEnabled, setIsOscillatorEnabled] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState('library');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  
  // Audio processing references
  const playerRefs = useRef(new Map<string, Tone.Player>());
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const delayRef = useRef<Tone.FeedbackDelay | null>(null);
  const distortionRef = useRef<Tone.Distortion | null>(null);
  const filterRef = useRef<Tone.Filter | null>(null);
  const analyzerRef = useRef<Tone.Analyser | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Spatial audio state
  const [spatialAudioSources, setSpatialAudioSources] = useState<SpatialAudioData[]>([]);

  // Initialize Tone.js
  useEffect(() => {
    // Setup Tone.js
    Tone.start();
    
    // Create effects
    const reverb = new Tone.Reverb(3);
    const delay = new Tone.FeedbackDelay(0.25, 0.5);
    const distortion = new Tone.Distortion(0.4);
    const filter = new Tone.Filter(filterFreq, 'lowpass');
    
    // Create analyzer
    const analyzer = new Tone.Analyser('fft', 512);
    
    // Save references
    reverbRef.current = reverb;
    delayRef.current = delay;
    distortionRef.current = distortion;
    filterRef.current = filter;
    analyzerRef.current = analyzer;
    
    // Add initial audio if provided
    if (audioData) {
      const initialAudioId = uuidv4();
      const player = new Tone.Player({
        url: audioData.url,
        loop: true,
        playbackRate: playbackSpeed,
        onload: () => {
          console.log('Audio loaded');
          // Set total duration once loaded
          if (player.buffer) {
            setTotalDuration(player.buffer.duration);
          }
        }
      }).toDestination();
      
      // Connect player to analyzer
      player.connect(analyzer);
      
      // Store in playerRefs
      playerRefs.current.set(initialAudioId, player);
      
      // Create spatial audio source
      const initialSource: SpatialAudioData = {
        ...audioData,
        id: initialAudioId,
        name: audioData.file.name,
        color: '#FF5F6D',
        position: { x: 0, y: 0.5, z: 0 },
        isPlaying: false,
        volume: 1,
        isSelected: true
      };
      
      setSpatialAudioSources([initialSource]);
    }
    
    // Cleanup
    return () => {
      // Dispose of all players
      const players = playerRefs.current;
      players.forEach(player => {
        player.stop();
        player.dispose();
      });
      
      if (reverbRef.current) reverbRef.current.dispose();
      if (delayRef.current) delayRef.current.dispose();
      if (distortionRef.current) distortionRef.current.dispose();
      if (filterRef.current) filterRef.current.dispose();
      if (analyzerRef.current) analyzerRef.current.dispose();
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioData, filterFreq, playbackSpeed]);

  // Update effect chain when effects change
  useEffect(() => {
    if (!reverbRef.current || !delayRef.current || 
        !distortionRef.current || !filterRef.current || !analyzerRef.current) {
      return;
    }
    
    const reverb = reverbRef.current;
    const delay = delayRef.current;
    const distortion = distortionRef.current;
    const filter = filterRef.current;
    const analyzer = analyzerRef.current;
    
    // For each player, update the effect chain
    playerRefs.current.forEach((player) => {
      // Store player state before disconnecting
      const wasPlaying = player.state === "started";
      const currentTime = player.now();
      
      // Disconnect all
      player.disconnect();
      
      // Build chain based on active effects
      const chain: (Tone.ToneAudioNode)[] = [player];
      
      if (effects.reverb) chain.push(reverb);
      if (effects.delay) chain.push(delay);
      if (effects.distortion) chain.push(distortion);
      if (effects.filter) chain.push(filter);
      
      // Always end with analyzer and connect to destination
      chain.push(analyzer);
      
      // Connect chain
      for (let i = 0; i < chain.length - 1; i++) {
        chain[i].connect(chain[i + 1]);
      }
      
      // Connect last node to destination
      chain[chain.length - 1].toDestination();
      
      // Restore player state
      if (wasPlaying) {
        player.start();
        try {
          player.seek(currentTime);
        } catch (error) {
          console.warn("Could not restore exact playback position", error);
        }
      }
    });
  }, [effects]);
  
  // Update filter frequency
  useEffect(() => {
    if (filterRef.current) {
      filterRef.current.frequency.value = filterFreq;
    }
  }, [filterFreq]);
  
  // Add initial audio if provided
  useEffect(() => {
    if (audioData && audioData.file) {
      handleAddAudio(audioData.file).catch(error => {
        console.error("Error adding initial audio file:", error);
      });
    }
  }, [audioData]);
  
  // Toggle play/pause for all audio sources
  const togglePlayback = useCallback(() => {
    const newIsPlaying = !isPlaying;
    
    playerRefs.current.forEach((player) => {
      if (newIsPlaying) {
        player.start();
      } else {
        player.stop();
      }
    });
    
    setIsPlaying(newIsPlaying);
    
    // Update playing state in spatial audio sources
    setSpatialAudioSources(prev => 
      prev.map(source => ({ ...source, isPlaying: newIsPlaying }))
    );
  }, [isPlaying]);
  
  // Toggle effects
  const toggleEffect = useCallback((effect: keyof typeof effects) => {
    setEffects(prev => ({
      ...prev,
      [effect]: !prev[effect]
    }));
  }, []);
  
  // Handle playback speed change
  const handlePlaybackSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    
    // Update all players
    playerRefs.current.forEach((player) => {
      player.playbackRate = speed;
    });
  }, []);
  
  // Handle adding a new audio file
  const handleAddAudio = useCallback(async (file: File) => {
    try {
      await addAudioFile(file);
    } catch (error) {
      console.error("Error adding audio file:", error);
    }
  }, [addAudioFile]);
  
  // Handle placing audio in 3D space
  const handleAudioPlaced = useCallback((placement: AudioPlacement) => {
    setSpatialAudioSources(prevSources => {
      return prevSources.map(source => {
        if (source.id === placement.id) {
          // Update the position
          return {
            ...source,
            position: placement.position
          };
        }
        return source;
      });
    });
  }, []);
  
  // Handle selecting an audio in the 3D scene
  const handleAudioSelected = useCallback((id: string) => {
    selectAudioFile(id);
    
    // Update isSelected flag in spatialAudioSources
    setSpatialAudioSources(prevSources => {
      return prevSources.map(source => ({
        ...source,
        isSelected: source.id === id
      }));
    });
  }, [selectAudioFile]);

  // Setup visualization
  useEffect(() => {
    if (!canvasRef.current || !analyzerRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const analyzer = analyzerRef.current;
    
    // Track playback time
    const updateTime = () => {
      if (isPlaying) {
        // Get current time from first player
        const firstPlayer = playerRefs.current.values().next().value;
        if (firstPlayer) {
          setCurrentTime(firstPlayer.now());
        }
        requestAnimationFrame(updateTime);
      }
    };
    
    if (isPlaying) {
      updateTime();
    }
    
    // Resize canvas
    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    
    // Call resize initially
    resizeCanvas();
    
    // Add resize listener
    window.addEventListener('resize', resizeCanvas);
    
    // Draw function
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      
      // Get data from analyzer
      const data = analyzer.getValue() as Float32Array;
      
      // Clear canvas
      ctx.fillStyle = 'rgba(20, 20, 30, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw waveform
      ctx.strokeStyle = 'rgba(100, 120, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const sliceWidth = canvas.width / data.length;
      let x = 0;
      
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] as number) / 100;
        const y = (v * canvas.height / 2) + canvas.height / 2;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      ctx.stroke();
    };
    
    // Start drawing
    draw();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);
  
  return (
    <div className="visualization-container flex flex-col h-[calc(100vh-14rem)]">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar */}
        <EditorSidebar 
          activeTab={activeSidebarTab}
          onTabChange={setActiveSidebarTab}
          effects={effects}
          onToggleEffect={(effect) => toggleEffect(effect as keyof typeof effects)}
          filterFreq={filterFreq}
          onFilterFreqChange={setFilterFreq}
          audioLibraryItems={library.items}
          selectedAudioItemId={library.selectedItemId}
          onAddAudio={handleAddAudio}
          onRemoveAudio={removeAudioFile}
          onSelectAudio={selectAudioFile}
          maxAudioFiles={MAX_AUDIO_FILES}
        />
        
        {/* Main Editor Area */}
        <div className="flex-1 overflow-hidden bg-black/50 flex flex-col relative ml-[60px]">
          {/* Main Canvas */}
          <div className="flex-1 relative">
            <div className="absolute inset-0">
              {visualizationType === 'spatial' ? (
                <SpatialAudioScene 
                  audioSources={spatialAudioSources}
                  onAudioPlaced={handleAudioPlaced}
                  onAudioSelected={handleAudioSelected}
                />
              ) : visualizationType === 'cinematic' ? (
                <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
                  <ambientLight intensity={0.5} />
                  <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                  <pointLight position={[-10, -10, -10]} intensity={1} />
                  <CinematicScene effects={effects} analyzer={analyzerRef.current} isPlaying={isPlaying} />
                  <OrbitControls enableZoom={true} enablePan={true} />
                </Canvas>
              ) : (
                <SpectralAudioVisualizer 
                  analyzer={analyzerRef.current} 
                  isPlaying={isPlaying} 
                  effects={effects} 
                />
              )}
            </div>
          </div>
        </div>
        
        {/* Right Sidebar */}
        <EditorRightSidebar 
          isOscillatorEnabled={isOscillatorEnabled}
          onOscillatorEnabledChange={setIsOscillatorEnabled}
        />
      </div>
      
      {/* Bottom Toolbar */}
      <EditorToolbar 
        visualizationType={visualizationType}
        onVisualizationTypeChange={(type) => setVisualizationType(type)}
        playbackSpeed={playbackSpeed}
        onPlaybackSpeedChange={handlePlaybackSpeedChange}
        currentTime={currentTime}
        totalDuration={totalDuration}
        isPlaying={isPlaying}
        onPlayPause={togglePlayback}
      />
    </div>
  );
}
