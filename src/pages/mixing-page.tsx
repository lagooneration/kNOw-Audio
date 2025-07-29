import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '../components/ui/container';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FileUpload } from '../components/audio/file-upload';
import { FrequencyOverlapVisualizer } from '../components/audio/frequency-overlap';
import { EQSuggestionsDisplay } from '../components/audio/eq-suggestions';
import { FrequencySpectrum } from '../components/audio/frequency-spectrum';
import { useAudioMixing } from '../hooks/use-audio-mixing';
import { analyzeFrequencyOverlap, generateEQSuggestions } from '../utils/audio-mixing';
import type { FrequencyOverlap, EQSuggestion } from '../utils/audio-mixing';
import DarkVeil from '../components/ui/DarkVeil';
import MagicBento from '../components/ui/MagicBento';

export function MixingPage() {
  const { mixingState, processTrack, clearTrack } = useAudioMixing();
  const [overlaps, setOverlaps] = useState<FrequencyOverlap[]>([]);
  const [suggestions, setSuggestions] = useState<EQSuggestion[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (mixingState.track1 && mixingState.track2) {
      setAnalyzing(true);
      setTimeout(() => {
        try {
          const frequencyOverlaps = analyzeFrequencyOverlap(
            mixingState.track1!, 
            mixingState.track2!
          );
          setOverlaps(frequencyOverlaps);
          const eqSuggestions = generateEQSuggestions(frequencyOverlaps);
          setSuggestions(eqSuggestions);
        } catch (err) {
          console.error('Error analyzing audio:', err);
        } finally {
          setAnalyzing(false);
        }
      }, 100);
    } else {
      setOverlaps([]);
      setSuggestions([]);
    }
  }, [mixingState.track1, mixingState.track2]);
  
  // Calculate overlapping duration when both tracks are loaded
  const getOverlappingInfo = () => {
    if (!mixingState.track1 || !mixingState.track2) return null;
    
    const duration1 = mixingState.track1.metadata.duration;
    const duration2 = mixingState.track2.metadata.duration;
    const overlapDuration = Math.min(duration1, duration2);
    
    const hasDifferentLengths = Math.abs(duration1 - duration2) > 0.5; // More than 0.5 seconds difference
    
    return {
      overlapDuration,
      hasDifferentLengths,
      track1IsShorter: duration1 < duration2
    };
  };

  const handleTrack1Selected = async (file: File) => {
    try {
      await processTrack(file, 1);
    } catch (err) {
      console.error('Error processing audio:', err);
    }
  };

  const handleTrack2Selected = async (file: File) => {
    try {
      await processTrack(file, 2);
    } catch (err) {
      console.error('Error processing audio:', err);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0">
        <DarkVeil />
      </div>
      
      <Container className="relative z-10">
        <div className="max-w-6xl mx-auto space-y-8 py-8">
          <div className='text-center mb-8'>
            <h1 className="text-3xl font-bold mb-4">Audio Mixer</h1>
            <p className="text-muted-foreground mb-8">
              Upload two audio tracks to analyze frequency overlaps and get EQ suggestions for better mixing.
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
                  navigate('/');
                } else if (index === 1) {
                  navigate('/editor');
                } else if (index === 2) {
                  window.scrollTo({ top: 500, behavior: "smooth" });
                }
              }}
            />
          </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Track 1</h2>
              {!mixingState.track1 ? (
                <FileUpload 
                  onFileSelected={handleTrack1Selected} 
                  isProcessing={mixingState.isProcessing} 
                />
              ) : (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex justify-between items-center">
                      <span>{mixingState.track1.metadata.name}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => clearTrack(1)}
                        className="text-xs h-7"
                      >
                        Change
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2 mb-3">
                      <div>Duration: {mixingState.track1.metadata.duration.toFixed(2)}s</div>
                      <div>Sample Rate: {mixingState.track1.metadata.sampleRate}Hz</div>
                      <div>Channels: {mixingState.track1.metadata.numberOfChannels}</div>
                      <div>Format: {mixingState.track1.metadata.type}</div>
                    </div>
                    <audio 
                      src={mixingState.track1.url} 
                      controls 
                      className="w-full h-8" 
                    />
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Track 2</h2>
              {!mixingState.track2 ? (
                <FileUpload 
                  onFileSelected={handleTrack2Selected} 
                  isProcessing={mixingState.isProcessing} 
                />
              ) : (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex justify-between items-center">
                      <span>{mixingState.track2.metadata.name}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => clearTrack(2)}
                        className="text-xs h-7"
                      >
                        Change
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2 mb-3">
                      <div>Duration: {mixingState.track2.metadata.duration.toFixed(2)}s</div>
                      <div>Sample Rate: {mixingState.track2.metadata.sampleRate}Hz</div>
                      <div>Channels: {mixingState.track2.metadata.numberOfChannels}</div>
                      <div>Format: {mixingState.track2.metadata.type}</div>
                    </div>
                    <audio 
                      src={mixingState.track2.url} 
                      controls 
                      className="w-full h-8" 
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          
          {mixingState.track1 && mixingState.track2 ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Frequency Overlap Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {analyzing ? (
                    <div className="flex justify-center items-center h-80">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-4">
                        This visualization shows the frequency spectrum of both tracks and highlights areas where they overlap.
                        <span className="block mt-1">
                          <span className="inline-block w-3 h-3 bg-orange-500/60 mr-1"></span> Constructive overlaps enhance and complement each other.
                          <span className="inline-block w-3 h-3 bg-red-500/60 mx-1 ml-3"></span> Destructive overlaps compete and create muddiness or masking.
                        </span>
                      </p>
                      
                      {/* Show track length difference warning if applicable */}
                      {(() => {
                        const overlapInfo = getOverlappingInfo();
                        if (overlapInfo && overlapInfo.hasDifferentLengths) {
                          return (
                            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-md">
                              <p className="text-sm text-amber-200">
                                <span className="font-medium">Note:</span> These tracks have different lengths 
                                ({Math.abs(mixingState.track1!.metadata.duration - mixingState.track2!.metadata.duration).toFixed(1)}s difference).
                                Analysis is performed on the first {overlapInfo.overlapDuration.toFixed(1)} seconds of both tracks.
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      <div className="space-y-6">
                        <FrequencyOverlapVisualizer
                          track1={mixingState.track1}
                          track2={mixingState.track2}
                          overlaps={overlaps}
                          height={300}
                          width={800}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-lg font-medium mb-2">Track 1 Spectrum</h3>
                            <FrequencySpectrum
                              audioData={mixingState.track1}
                              height={200}
                              width={400}
                            />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium mb-2">Track 2 Spectrum</h3>
                            <FrequencySpectrum
                              audioData={mixingState.track2}
                              height={200}
                              width={400}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              {!analyzing && (
                <EQSuggestionsDisplay 
                  suggestions={suggestions}
                  track1Name={mixingState.track1.metadata.name}
                  track2Name={mixingState.track2.metadata.name}
                />
              )}
            </div>
          ) : (
            <Card className="bg-muted/40 border border-dashed border-muted">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-4xl text-muted-foreground mb-4">🎛️ + 🎚️</div>
                <h3 className="text-xl font-medium mb-2">Ready to Mix</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Upload two audio tracks to see where their frequencies overlap and get suggestions for better mixing.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </Container>
    </div>
  );
}
