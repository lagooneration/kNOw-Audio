import { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as Tone from 'tone';
import { type AudioData } from '../../types/audio';
import { EditorSidebar } from './editor-sidebar';
import { EditorRightSidebar } from './editor-right-sidebar';
import { EditorToolbar } from './editor-toolbar';
// Direct import with explicit path
import { AnalyticalScene } from '../visualization/analytical-scene.tsx';
import { CinematicScene } from '../visualization/cinematic-scene.tsx';

interface AudioEditorProps {
  audioData: AudioData;
}

export function AudioEditor({ audioData }: AudioEditorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [effects, setEffects] = useState({
    reverb: false,
    delay: false,
    distortion: false,
    filter: false,
  });
  const [filterFreq, setFilterFreq] = useState(1000);
  const [visualizationMode, setVisualizationMode] = useState<'frequency' | 'waveform'>('frequency');
  const [visualizationType, setVisualizationType] = useState<'mathematical' | 'cinematic'>('mathematical');
  const [isOscillatorEnabled, setIsOscillatorEnabled] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState('effects');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  
  const playerRef = useRef<Tone.Player | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const delayRef = useRef<Tone.FeedbackDelay | null>(null);
  const distortionRef = useRef<Tone.Distortion | null>(null);
  const filterRef = useRef<Tone.Filter | null>(null);
  const analyzerRef = useRef<Tone.Analyser | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  
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
    
    // Create player
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
    
    // Save references
    playerRef.current = player;
    reverbRef.current = reverb;
    delayRef.current = delay;
    distortionRef.current = distortion;
    filterRef.current = filter;
    analyzerRef.current = analyzer;
    
    // Setup initial chain with analyzer
    player.connect(analyzer);
    
    // Cleanup
    return () => {
      if (playerRef.current) {
        playerRef.current.stop();
        playerRef.current.dispose();
      }
      
      if (reverbRef.current) reverbRef.current.dispose();
      if (delayRef.current) delayRef.current.dispose();
      if (distortionRef.current) distortionRef.current.dispose();
      if (filterRef.current) filterRef.current.dispose();
      if (analyzerRef.current) analyzerRef.current.dispose();
      
      if (animationRef.current) {
        const id = animationRef.current;
        cancelAnimationFrame(id);
      }
    };
  }, [audioData, filterFreq, playbackSpeed]);
  
  // Update effect chain when effects change
  useEffect(() => {
    if (!playerRef.current || !reverbRef.current || !delayRef.current || 
        !distortionRef.current || !filterRef.current || !analyzerRef.current) {
      return;
    }
    
    const player = playerRef.current;
    const reverb = reverbRef.current;
    const delay = delayRef.current;
    const distortion = distortionRef.current;
    const filter = filterRef.current;
    const analyzer = analyzerRef.current;
    
    // Disconnect all
    player.disconnect();
    reverb.disconnect();
    delay.disconnect();
    distortion.disconnect();
    filter.disconnect();
    
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
    
  }, [effects]);
  
  // Update filter frequency
  useEffect(() => {
    if (filterRef.current) {
      filterRef.current.frequency.value = filterFreq;
    }
  }, [filterFreq]);
  
  // Toggle play/pause
  const togglePlayback = () => {
    if (!playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.stop();
    } else {
      playerRef.current.start();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Toggle effects
  const toggleEffect = (effect: keyof typeof effects) => {
    setEffects(prev => ({
      ...prev,
      [effect]: !prev[effect]
    }));
  };
  
  // Handle playback speed change
  const handlePlaybackSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (playerRef.current) {
      playerRef.current.playbackRate = speed;
    }
  };
  
  // Setup visualization
  useEffect(() => {
    if (!canvasRef.current || !analyzerRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const analyzer = analyzerRef.current;
    
    // Track playback time
    const updateTime = () => {
      if (playerRef.current && isPlaying) {
        setCurrentTime(playerRef.current.now());
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
      
      if (visualizationMode === 'frequency') {
        // Draw frequency spectrum
        const barWidth = canvas.width / data.length;
        
        ctx.fillStyle = 'rgba(100, 120, 255, 0.8)';
        
        for (let i = 0; i < data.length; i++) {
          const x = i * barWidth;
          const height = ((data[i] as number) + 140) * canvas.height / 140;
          
          ctx.fillRect(x, canvas.height - height, barWidth - 1, height);
        }
      } else {
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
      }
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
  }, [visualizationMode, isPlaying]);
  
  return (
    <div className="visualization-container flex flex-col h-[calc(100vh-14rem)]">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <EditorSidebar 
          activeTab={activeSidebarTab}
          onTabChange={setActiveSidebarTab}
          effects={effects}
          onToggleEffect={(effect) => toggleEffect(effect as keyof typeof effects)}
          filterFreq={filterFreq}
          onFilterFreqChange={setFilterFreq}
          visualizationMode={visualizationType}
          onVisualizationModeChange={setVisualizationType}
        />
        
        {/* Main Editor Area */}
        <div className="flex-1 overflow-hidden bg-black/30 flex flex-col relative">
          {/* Main Canvas */}
          <div className="flex-1 relative">
            <div className="absolute inset-0">
              <AudioEditor3D 
                effects={effects} 
                visualizationType={visualizationType}
                analyzer={analyzerRef.current}
                isPlaying={isPlaying}
              />
            </div>
          </div>
        </div>
        
        {/* Right Sidebar */}
        <EditorRightSidebar 
          isOscillatorEnabled={isOscillatorEnabled}
          onOscillatorEnabledChange={setIsOscillatorEnabled}
          isPlaying={isPlaying}
          onPlayPause={togglePlayback}
        />
      </div>
      
      {/* Bottom Toolbar */}
      <EditorToolbar 
        visualizationMode={visualizationMode}
        onVisualizationModeChange={setVisualizationMode}
        playbackSpeed={playbackSpeed}
        onPlaybackSpeedChange={handlePlaybackSpeedChange}
        currentTime={currentTime}
        totalDuration={totalDuration}
      />
    </div>
  );
}

interface AudioEditor3DProps {
  effects: {
    reverb: boolean;
    delay: boolean;
    distortion: boolean;
    filter: boolean;
  };
  visualizationType: 'mathematical' | 'cinematic';
  analyzer: Tone.Analyser | null;
  isPlaying: boolean;
}

function AudioEditor3D({ effects, visualizationType, analyzer, isPlaying }: AudioEditor3DProps) {
  return (
    <div className="three-container h-full">
      <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} intensity={1} />
        {visualizationType === 'cinematic' 
          ? <CinematicScene effects={effects} analyzer={analyzer} isPlaying={isPlaying} />
          : <AnalyticalScene effects={effects} analyzer={analyzer} isPlaying={isPlaying} />
        }
        <OrbitControls enableZoom={true} enablePan={true} />
      </Canvas>
    </div>
  );
}
