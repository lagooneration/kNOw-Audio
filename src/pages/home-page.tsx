import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '../components/ui/container';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FileUpload } from '../components/audio/file-upload';
import { Waveform } from '../components/audio/waveform';
import { FrequencySpectrum } from '../components/audio/frequency-spectrum';
import { Spectrogram } from '../components/audio/spectrogram';
import { AudioMetadataDisplay } from '../components/audio/metadata-display';
import { AnalysisResults } from '../components/audio/analysis-results';
import { AudioVisualizer } from '../components/visualization/audio-visualizer-3d';
import { useAudioProcessing } from '../hooks/use-audio-processing';
import DarkVeil from '../components/ui/DarkVeil';
import MagicBento from '../components/ui/MagicBento';

export function HomePage() {
  const { audioData, isProcessing, processAudio } = useAudioProcessing();
  const [activeVisualization, setActiveVisualization] = useState<'waveform' | 'frequency' | 'spectrogram' | '3d'>('waveform');
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

  return (
    <div className="relative min-h-screen">
      {/* DarkVeil as background */}
      <div className="fixed inset-0 z-0">
        <DarkVeil />
      </div>
      
      <Container className="relative z-10">
        <div className="max-w-5xl mx-auto space-y-8 py-8">
          <div className='text-center mb-8'>
            <h1 className="text-3xl font-regular mb-4">kNOw Audio</h1>
            <p className="text-muted-foreground mb-8">
              Upload an audio file to analyze its properties and visualize its content.
            </p>
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
                  // Already on the analyzer page, just scroll to content
                  window.scrollTo({ top: 500, behavior: "smooth" });
                } else if (index === 1) {
                  navigate('/editor');
                } else if (index === 2) {
                  navigate('/mixing');
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AudioMetadataDisplay audioData={audioData} />
              
              <Card>
                <CardHeader>
                  <CardTitle>Audio Playback</CardTitle>
                </CardHeader>
                <CardContent>
                  <audio 
                    src={audioData.url} 
                    controls 
                    className="w-full" 
                  ></audio>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Audio Visualization</CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  <button 
                    className={`px-3 py-1 rounded-md ${activeVisualization === 'waveform' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                    onClick={() => setActiveVisualization('waveform')}
                  >
                    Waveform
                  </button>
                  <button 
                    className={`px-3 py-1 rounded-md ${activeVisualization === 'frequency' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                    onClick={() => setActiveVisualization('frequency')}
                  >
                    Frequency
                  </button>
                  <button 
                    className={`px-3 py-1 rounded-md ${activeVisualization === 'spectrogram' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                    onClick={() => setActiveVisualization('spectrogram')}
                  >
                    Spectrogram
                  </button>
                  <button 
                    className={`px-3 py-1 rounded-md ${activeVisualization === '3d' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                    onClick={() => setActiveVisualization('3d')}
                  >
                    3D View
                  </button>
                </div>
              </CardHeader>
              <CardContent className="h-96">
                {activeVisualization === 'waveform' && (
                  <Waveform 
                    audioData={audioData} 
                    height={300} 
                    barWidth={2} 
                    barGap={1} 
                  />
                )}
                
                {activeVisualization === 'frequency' && (
                  <FrequencySpectrum 
                    audioData={audioData} 
                    height={300} 
                    width={800} 
                  />
                )}
                
                {activeVisualization === 'spectrogram' && (
                  <Spectrogram 
                    audioData={audioData} 
                    height={300} 
                    width={800} 
                  />
                )}
                
                {activeVisualization === '3d' && (
                  <AudioVisualizer 
                    audioData={audioData} 
                    mode="spectral" 
                  />
                )}
              </CardContent>
            </Card>
            
            <AnalysisResults audioData={audioData} />
            
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
        </div>
      </Container>
    </div>
  );
}
