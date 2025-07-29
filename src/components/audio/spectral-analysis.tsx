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

  // Effects state (defaults)
  const [effects, setEffects] = useState({
    reverb: false,
    delay: false,
    distortion: false,
    filter: false
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
        <p className="text-xs text-muted-foreground mt-2">
          3D visualization of frequency content. Click and drag to rotate the view. Scroll to zoom.
        </p>
      </CardContent>
    </Card>
  );
}
