import { useRef, useEffect, useState } from 'react';
import { type AudioData } from '../../types/audio';
import { SpectralAudioVisualizer } from '../visualization/spectral-audio-visualizer';
import * as Tone from 'tone';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface SpectralAnalysisProps {
  audioData: AudioData;
}

export function SpectralAnalysis({ audioData }: SpectralAnalysisProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [analyzer, setAnalyzer] = useState<Tone.Analyser | null>(null);
  const playerRef = useRef<Tone.Player | null>(null);
  
  // Effects state for visualization enhancements
  const [effects, setEffects] = useState({
    reverb: false,
    delay: false,
    distortion: false,
    filter: true
  });

  // Set up Tone.js audio processor and analyzer
  useEffect(() => {
    // Make sure Tone.js context is started
    Tone.start();

    // Create an analyzer
    const fftAnalyzer = new Tone.Analyser('fft', 1024);
    setAnalyzer(fftAnalyzer);

    // Create audio player
    const player = new Tone.Player({
      url: audioData.url,
      loop: true,
      onload: () => {
        console.log('Audio loaded for spectral analysis');
      }
    }).toDestination();
    
    // Connect player to analyzer
    player.connect(fftAnalyzer);
    playerRef.current = player;
    
    return () => {
      // Clean up
      if (playerRef.current) {
        playerRef.current.stop();
        playerRef.current.disconnect();
      }
      
      fftAnalyzer.dispose();
    };
  }, [audioData.url]);

  // Play/pause audio
  const togglePlayback = () => {
    if (!playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.stop();
    } else {
      playerRef.current.start();
    }
    
    setIsPlaying(!isPlaying);
  };

  // Toggle effect function for visualization enhancements
  const toggleEffect = (effect: keyof typeof effects) => {
    setEffects(prev => ({
      ...prev,
      [effect]: !prev[effect]
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>3D Spectral Analysis</span>
          <Button 
            onClick={togglePlayback}
            variant="outline"
            size="sm"
            className="ml-auto"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-video rounded-md overflow-hidden border dark:border-slate-700/50 bg-black/20 backdrop-blur-sm">
          <SpectralAudioVisualizer
            analyzer={analyzer}
            isPlaying={isPlaying}
            effects={effects}
          />
        </div>
        <div className="flex gap-2 mt-3">
          <Button 
            size="sm" 
            variant={effects.filter ? "default" : "outline"}
            onClick={() => toggleEffect('filter')}
          >
            Filter
          </Button>
          <Button 
            size="sm" 
            variant={effects.reverb ? "default" : "outline"}
            onClick={() => toggleEffect('reverb')}
          >
            Reverb
          </Button>
          <Button 
            size="sm" 
            variant={effects.delay ? "default" : "outline"}
            onClick={() => toggleEffect('delay')}
          >
            Delay
          </Button>
          <Button 
            size="sm" 
            variant={effects.distortion ? "default" : "outline"}
            onClick={() => toggleEffect('distortion')}
          >
            Distortion
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          3D visualization of frequency content. Click and drag to rotate the view. Scroll to zoom. Toggle effects to enhance visualization.
        </p>
      </CardContent>
    </Card>
  );
}
