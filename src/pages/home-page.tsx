import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '../components/ui/container';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import Gitbutton from '../components/ui/gitbutton';
import { FileUpload } from '../components/audio/file-upload';
import { FrequencySpectrum } from '../components/audio/frequency-spectrum';
import { Spectrogram } from '../components/audio/spectrogram';
import { AudioMetadataDisplay } from '../components/audio/metadata-display';
import { AudioVisualizer } from '../components/visualization/audio-visualizer-3d';
import { useAudioProcessing } from '../hooks/use-audio-processing';
import DarkVeil from '../components/ui/DarkVeil';
import MagicBento from '../components/ui/MagicBento';
import Search from '../components/ui/Search';
import { PlayButton } from '../components/ui/play-button';
import '../components/audio/visualization-styles.css';

export function HomePage() {
  const { audioData, isProcessing, processAudio } = useAudioProcessing();
  const [activeVisualization, setActiveVisualization] = useState<'frequency' | 'spectrogram' | '3d'>('frequency');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const navigate = useNavigate();

  const handleFileSelected = async (file: File) => {
    try {
      await processAudio(file);
    } catch (err) {
      console.error('Error processing audio:', err);
    }
  };
  
  const handleLoadIn3DEditor = () => {
    if (audioData) {
      navigate('/editor');
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Setup audio context and analyser when audio data is loaded
  useEffect(() => {
    if (!audioData || !audioRef.current) return;

    // Create audio context if it doesn't exist
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    // Create analyser
    const analyser = audioContextRef.current.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;

    // Connect audio element to analyser only once
    if (!audioSourceRef.current) {
      audioSourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      audioSourceRef.current.connect(analyser);
      analyser.connect(audioContextRef.current.destination);
    }

    // Cleanup function
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        audioSourceRef.current = null;
        analyserRef.current = null;
      }
    };
  }, [audioData]);

  const handleVisualizationChange = (newVisualization: 'frequency' | 'spectrogram' | '3d') => {
    // Only set the new visualization if audio data exists and is ready
    if (audioData?.buffer) {
      // Set the new visualization
      setActiveVisualization(newVisualization);
      
      // If audio is currently playing, continue playing with the new visualization
      // Otherwise, keep it paused
      if (audioRef.current && isPlaying) {
        // Ensure audio continues playing
        audioRef.current.play().catch(err => console.error('Error playing audio:', err));
      }
    } else {
      console.warn('Cannot change visualization: Audio data not fully loaded');
    }
  };

  return (
    <div className="dark relative min-h-screen">
      {/* DarkVeil as background */}
      <div className="fixed inset-0 z-0">
        <DarkVeil />
      </div>
      
      <Container className="relative z-10">
        <div className="max-w-5xl mx-auto space-y-8 py-8">
          <div className='text-center mb-8'>
            <h1 className="text-3xl font-semibold text-white/90 mb-4">Know Audio</h1>
            <Search />
          </div>

          <div className="mb-8 min-h-[400px] flex items-center">
            <div className="w-full flex items-center justify-center">
            <MagicBento 
              textAutoHide={true}
              enableStars={true}
              enableSpotlight={true}
              enableBorderGlow={true}
              enableTilt={true}
              enableMagnetism={true}
              clickEffect={true}
              spotlightRadius={300}
              particleCount={12}
              glowColor="132, 0, 255"
              onCardClick={(index) => {
                if (index === 0) {
                  // Analysis card clicked
                  if (!audioData) {
                    // If no audio data, scroll to file upload
                    window.scrollTo({ top: 500, behavior: "smooth" });
                  } else {
                    // If audio data exists, show frequency visualization as default
                    setActiveVisualization('frequency');
                    window.scrollTo({ top: 500, behavior: "smooth" });
                  }
                } else if (index === 1) {
                  navigate('/mixing');
                } else if (index === 2) {
                  navigate('/editor');
                }
              }}
            />
            </div>
          </div>
        
        {!audioData ? (
          <FileUpload 
            onFileSelected={handleFileSelected} 
            isProcessing={isProcessing} 
          />
        ) : (
          <div className="space-y-8">
            <AudioMetadataDisplay audioData={audioData} />
            
            {/* Hidden audio element for controlling playback */}
            <audio 
              ref={audioRef} 
              src={audioData.url} 
              style={{ display: 'none' }}
              onEnded={() => setIsPlaying(false)} 
            />
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Audio Visualization</CardTitle>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button 
                      className={`px-3 py-1 rounded-md ${activeVisualization === 'frequency' ? 'bg-primary text-primary-foreground' : 'bg-secondary/70 dark:bg-slate-700/50 text-secondary-foreground border border-slate-600/30'}`}
                      onClick={() => handleVisualizationChange('frequency')}
                    >
                      Frequency
                    </button>
                    <button 
                      className={`px-3 py-1 rounded-md ${activeVisualization === 'spectrogram' ? 'bg-primary text-primary-foreground' : 'bg-secondary/70 dark:bg-slate-700/50 text-secondary-foreground border border-slate-600/30'}`}
                      onClick={() => handleVisualizationChange('spectrogram')}
                    >
                      Spectrogram
                    </button>
                    <button 
                      className={`px-3 py-1 rounded-md ${activeVisualization === '3d' ? 'bg-primary text-primary-foreground' : 'bg-secondary/70 dark:bg-slate-700/50 text-secondary-foreground border border-slate-600/30'}`}
                      onClick={() => handleVisualizationChange('3d')}
                    >
                      3D View
                    </button>
                  </div>
                </div>
                <PlayButton 
                  isPlaying={isPlaying}
                  onClick={handlePlayPause}
                  size="md"
                />
              </CardHeader>
              <CardContent className="h-96 relative">
                {audioData?.buffer ? (
                  <>
                    {activeVisualization === 'frequency' && (
                      <FrequencySpectrum 
                        audioData={audioData} 
                        height={300} 
                        width={800}
                        externalAudio={audioRef.current || undefined}
                        sharedAnalyser={analyserRef.current}
                      />
                    )}
                    
                    {activeVisualization === 'spectrogram' && (
                      <Spectrogram 
                        audioData={audioData} 
                        height={300} 
                        width={800}
                        externalAudio={audioRef.current || undefined}
                        sharedAnalyser={analyserRef.current}
                      />
                    )}
                    
                    {activeVisualization === '3d' && (
                      <AudioVisualizer 
                        audioData={audioData} 
                        mode="spectral"
                        externalAudio={audioRef.current || undefined}
                        sharedAnalyser={analyserRef.current}
                      />
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400">Audio data is still loading or not available...</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* <AnalysisResults audioData={audioData} /> */}
            
            <div className="flex justify-center">
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
                onClick={handleLoadIn3DEditor}
              >
                Load in 3D Editor
              </Button>
            </div>
          </div>
        )}
        
        {/* Contribution Card */}
        <div className="mt-16 mb-8">
          <Card className="border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm overflow-hidden relative">
            {/* Glowing effect in the background */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-xl"></div>
            
            <CardContent className="p-8 relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-semibold text-white mb-2">Want to Contribute?</h3>
                  <p className="text-slate-300 max-w-md">
                    KnowAudio is an open-source project. We welcome contributions from developers, 
                    audio engineers, and music enthusiasts.
                  </p>
                </div>
                <div className="flex justify-center">
                  <Gitbutton repoUrl="https://github.com/lagooneration/know-audio" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </Container>
    </div>
  );
}
