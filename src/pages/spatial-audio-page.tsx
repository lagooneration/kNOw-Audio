import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Layout } from '../components/layout';
import { SpatialAudioSidebar } from '../components/audio/spatial-audio-sidebar';
import { SpatialAudioCanvas } from '../components/visualization/spatial-audio-canvas';
import { EditorToolbar } from '../components/audio/editor-toolbar';
import type { SpatialAudioData } from '../types/spatial-audio';
import {
  createSpatialAudioSource,
  updateSpatialAudioPosition,
  toggleSpatialAudioPlayback,
  createAudioAnalyzer,
  getFFTData
} from '../utils/spatial-audio-processing';

export function SpatialAudioPage() {
  const [audioSources, setAudioSources] = useState<SpatialAudioData[]>([]);
  const [visualizationType, setVisualizationType] = useState<'cinematic' | 'analytical'>('cinematic');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  
  const analyzerRef = useRef<Tone.Analyser | null>(null);
  const audioAnalysisDataRef = useRef<Float32Array>(new Float32Array(512));
  const animationFrameRef = useRef<number | null>(null);
  
  // Initialize audio context and analyzer
  useEffect(() => {
    // Start audio context
    Tone.start();
    
    // Create analyzer for visualization
    const analyzer = createAudioAnalyzer();
    analyzerRef.current = analyzer;
    
    // Connect master output to analyzer
    Tone.getDestination().connect(analyzer);
    
    // Start analysis loop
    const updateAnalysis = () => {
      if (analyzerRef.current) {
        audioAnalysisDataRef.current = getFFTData(analyzerRef.current);
      }
      
      // Update current time
      setCurrentTime(Tone.Transport.seconds);
      
      animationFrameRef.current = requestAnimationFrame(updateAnalysis);
    };
    
    updateAnalysis();
    
    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (analyzerRef.current) {
        analyzerRef.current.dispose();
      }
    };
  }, []);
  
  // Handle audio file added
  const handleAudioFileAdded = (audioData: SpatialAudioData) => {
    const newAudioSource = createSpatialAudioSource(audioData);
    setAudioSources(prev => [...prev, newAudioSource]);
    
    // Update total duration if this is the first audio source
    if (totalDuration === 0 && audioData.metadata?.duration) {
      setTotalDuration(audioData.metadata.duration);
    }
  };
  
  // Handle toggle play for a specific audio source
  const handleToggleAudio = (id: string) => {
    setAudioSources(prev => 
      prev.map(source => 
        source.id === id 
          ? toggleSpatialAudioPlayback(source, !source.isPlaying)
          : source
      )
    );
    
    // Check if any audio is now playing
    const anyPlaying = audioSources.some(source => 
      source.id === id ? !source.isPlaying : source.isPlaying
    );
    
    setIsPlaying(anyPlaying);
  };
  
  // Handle audio position changed
  const handleAudioPositionChanged = (id: string, position: { x: number; y: number; z: number }) => {
    setAudioSources(prev => 
      prev.map(source => 
        source.id === id 
          ? updateSpatialAudioPosition(source, position)
          : source
      )
    );
  };
  
  // Handle play/pause
  const handlePlayPause = () => {
    const newIsPlaying = !isPlaying;
    
    // Toggle playback for all positioned audio sources
    setAudioSources(prev => 
      prev.map(source => 
        source.position 
          ? toggleSpatialAudioPlayback(source, newIsPlaying)
          : source
      )
    );
    
    setIsPlaying(newIsPlaying);
  };
  
  // Convert visualization type between our internal state and the EditorToolbar component's expected values
  const handleVisualizationTypeChange = (type: 'mathematical' | 'cinematic' | 'spatial') => {
    if (type === 'mathematical') {
      setVisualizationType('analytical');
    } else if (type === 'cinematic' || type === 'spatial') {
      setVisualizationType('cinematic');
    }
  };
  
  return (
    <Layout>
      <div className="flex flex-col h-screen">
        <div className="flex-1 flex">
          {/* Left Sidebar */}
          <SpatialAudioSidebar 
            audioFiles={audioSources} 
            onAudioFileAdded={handleAudioFileAdded}
            onDragStart={() => {}}
            onTogglePlay={handleToggleAudio}
          />
          
          {/* Main Canvas */}
          <div className="flex-1 relative">
            <SpatialAudioCanvas 
              audioSources={audioSources}
              onAudioPositionChanged={handleAudioPositionChanged}
              visualizationType={visualizationType}
              audioAnalysisData={audioAnalysisDataRef.current}
            />
          </div>
        </div>
        
        {/* Bottom Toolbar */}
        <EditorToolbar
          visualizationType={visualizationType === 'analytical' ? 'mathematical' : 'cinematic'}
          onVisualizationTypeChange={handleVisualizationTypeChange}
          playbackSpeed={playbackSpeed}
          onPlaybackSpeedChange={setPlaybackSpeed}
          currentTime={currentTime}
          totalDuration={totalDuration}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
        />
      </div>
    </Layout>
  );
}
