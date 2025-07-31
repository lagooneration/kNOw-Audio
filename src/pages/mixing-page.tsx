import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '../components/ui/container';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FileUpload } from '../components/audio/file-upload';
import { FrequencyOverlapVisualizer } from '../components/audio/frequency-overlap';
import { EQSuggestionsDisplay } from '../components/audio/eq-suggestions';
import { FrequencySpectrum } from '../components/audio/frequency-spectrum';
import { FrequencyInterferenceExplanation } from '../components/audio/frequency-interference-explanation';
import { CombinedAudioVisualizer } from '../components/audio/combined-audio-visualizer';
import { TrackInfoCard } from '../components/audio/track-info-card';
import { useAudioMixing } from '../hooks/use-audio-mixing';
import { analyzeFrequencyOverlap, generateEQSuggestions } from '../utils/audio-mixing';
import type { FrequencyOverlap, EQSuggestion } from '../utils/audio-mixing';
import DarkVeil from '../components/ui/DarkVeil';
import MagicBento from '../components/ui/MagicBento';
import Search from '../components/ui/Search';
import MetaBalls from '../components/ui/MetaBalls';

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
    <div className="dark relative min-h-screen bg-black">
      <div className="absolute inset-0 z-0">
        <DarkVeil />
      </div>
      
      <Container className="relative z-10">
        <div className="max-w-6xl mx-auto space-y-8 py-8">
          <div className='text-center mb-8'>
            <h1 className="text-4xl font-bold text-white mb-4 font-goldman tracking-wider relative z-10">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-500 to-purple-600">
                Know Audio
              </span>
              <div className="absolute inset-0 blur-sm opacity-50 bg-gradient-to-r from-purple-400 via-blue-500 to-purple-600 bg-clip-text text-transparent -z-10">
                Know Audio
              </div>
            </h1>
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

          <div className="h-[1px]"/>
          <div className='text-center mb-8'>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bitcount text-white/80 font-bold mb-4">Audio Mixer</h1>
            <p className="text-foreground text-white/80 font-goldman text-lg mb-4">
              Upload two audio tracks to analyze frequency overlaps and get EQ suggestions for better mixing.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl text-white/70 font-semibold mb-4">Track 1</h2>
              {!mixingState.track1 ? (
                <FileUpload 
                  onFileSelected={handleTrack1Selected} 
                  isProcessing={mixingState.isProcessing} 
                />
              ) : (
                <TrackInfoCard 
                  audioData={mixingState.track1}
                  trackTitle="Track 1"
                  onChangeTrack={() => clearTrack(1)}
                />
              )}
            </div>
            
            <div>
              <h2 className="text-xl text-white/70 font-semibold mb-4">Track 2</h2>
              {!mixingState.track2 ? (
                <FileUpload 
                  onFileSelected={handleTrack2Selected} 
                  isProcessing={mixingState.isProcessing} 
                />
              ) : (
                <TrackInfoCard 
                  audioData={mixingState.track2}
                  trackTitle="Track 2"
                  onChangeTrack={() => clearTrack(2)}
                />
              )}
            </div>
          </div>
          
          {mixingState.track1 && mixingState.track2 ? (
            <div className="space-y-6">
              <Card className="bg-secondary/20 dark:bg-slate-800/40 backdrop-blur-sm border dark:border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white/90">Frequency Overlap Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {analyzing ? (
                    <div className="flex justify-center items-center h-80">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-white/70 mb-4">
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
                            <h3 className="text-lg font-medium text-white/90 mb-2">Track 1 Spectrum</h3>
                            <FrequencySpectrum
                              audioData={mixingState.track1}
                              height={200}
                              width={400}
                            />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-white/90 mb-2">Track 2 Spectrum</h3>
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
                <>
                  <FrequencyInterferenceExplanation overlaps={overlaps} />
                  
                  <Card className="bg-secondary/20 dark:bg-slate-800/40 backdrop-blur-sm border dark:border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-white/90">Frequency Band Interference Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-white/70 mb-4">
                        This visualization shows both audio tracks in the time domain and how they combine together.
                        Areas with potential interference are highlighted across broader frequency bands.
                      </p>
                      <CombinedAudioVisualizer
                        track1={mixingState.track1}
                        track2={mixingState.track2}
                        overlaps={overlaps}
                        suggestions={suggestions}
                        height={300}
                        width={800}
                      />
                    </CardContent>
                  </Card>

                  <EQSuggestionsDisplay 
                    suggestions={suggestions}
                    track1Name={mixingState.track1.metadata.name}
                    track2Name={mixingState.track2.metadata.name}
                  />
                </>
              )}
            </div>
          ) : (
            <Card className="bg-blue-900/20 border border-dashed border-muted">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="relative w-full h-64">
                  <MetaBalls 
                    color="#4B56D2"
                    speed={0.8}
                    enableMouseInteraction={true}
                    ballCount={15}
                    clumpFactor={0.6}
                    enableTransparency={true}
                  />
                </div>
                <h3 className="text-xl text-white/70 font-medium mb-2">Ready to Mix</h3>
                <p className="text-white/60 text-center max-w-md mx-auto">
                  Upload two audio tracks to analyze frequency overlaps and get EQ suggestions for better mixing.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </Container>
    </div>
  );
}
