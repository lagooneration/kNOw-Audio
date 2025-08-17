import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Container } from '../components/ui/container';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import DarkVeil from '../components/ui/DarkVeil';
import { AlertCircle, Mic, MicOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';

export function LiveAudioPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const xPosRef = useRef(0);

  // Color map for the spectrogram
  const colorMap = useMemo(() => [
    'rgba(0, 0, 0, 1)',
    'rgba(0, 0, 255, 1)',
    'rgba(0, 255, 255, 1)',
    'rgba(0, 255, 0, 1)',
    'rgba(255, 255, 0, 1)',
    'rgba(255, 0, 0, 1)'
  ], []);

  // Helper function to get a color based on value
  const getColor = useCallback((value: number) => {
    const v = Math.max(0, Math.min(1, value));
    const index = Math.floor(v * (colorMap.length - 1));
    
    if (index === colorMap.length - 1) {
      return colorMap[index];
    }
    
    const ratio = v * (colorMap.length - 1) - index;
    const color1 = colorMap[index];
    const color2 = colorMap[index + 1];
    
    // Parse colors
    const parseColor = (colorString: string) => {
      const match = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/);
      if (!match) return [0, 0, 0, 1];
      
      return [
        parseInt(match[1], 10),
        parseInt(match[2], 10),
        parseInt(match[3], 10),
        match[4] ? parseFloat(match[4]) : 1
      ];
    };
    
    const c1 = parseColor(color1);
    const c2 = parseColor(color2);
    
    // Interpolate between colors
    const r = Math.round(c1[0] + ratio * (c2[0] - c1[0]));
    const g = Math.round(c1[1] + ratio * (c2[1] - c1[1]));
    const b = Math.round(c1[2] + ratio * (c2[2] - c1[2]));
    const a = c1[3] + ratio * (c2[3] - c1[3]);
    
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }, [colorMap]);

  // Request microphone access and set up audio processing
  const startRecording = async () => {
    try {
      // Clear any previous errors
      setError(null);

      // Create audio context if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      // Request access to the microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Create an analyzer node
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 2048;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      analyser.smoothingTimeConstant = 0.85;
      analyserRef.current = analyser;

      // Connect the microphone stream to the analyzer
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyser);

      // Start the visualization
      setIsRecording(true);
      setPermissionGranted(true);
      startVisualization();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError(err instanceof Error ? err.message : 'Error accessing microphone');
      setPermissionGranted(false);
      setIsRecording(false);
    }
  };

  // Stop recording and clean up
  const stopRecording = () => {
    // Stop the animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop all audio tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Reset state
    setIsRecording(false);
  };

  // Draw the spectrogram
  const startVisualization = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current || !isRecording) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    // Set canvas dimensions
    const width = canvas.width;
    const height = canvas.height;

    // Set up the frequency data array
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Animation function
    const draw = () => {
      if (!analyserRef.current || !canvasRef.current || !isRecording) {
        return;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      // Draw current column
      const imageData = canvasCtx.createImageData(1, height);

      for (let i = 0; i < height; i++) {
        // Map canvas y coordinate to frequency bin
        const binIndex = Math.floor(i / height * bufferLength);
        const value = dataArray[binIndex] / 255.0;

        // Get color for the value
        const color = getColor(value);

        // Parse the color
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/);
        if (!match) continue;

        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        const b = parseInt(match[3], 10);
        const a = match[4] ? parseFloat(match[4]) * 255 : 255;

        // Set pixel color
        const pixelIndex = (height - i - 1) * 4;
        imageData.data[pixelIndex] = r;
        imageData.data[pixelIndex + 1] = g;
        imageData.data[pixelIndex + 2] = b;
        imageData.data[pixelIndex + 3] = a;
      }

      // Put image data
      canvasCtx.putImageData(imageData, xPosRef.current, 0);

      // Increment x position
      xPosRef.current = (xPosRef.current + 1) % width;

      // Draw vertical line at current position
      canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      canvasCtx.fillRect(xPosRef.current, 0, 1, height);

      // Draw frequency scale
      canvasCtx.save();
      
      // Draw over right edge with black box
      canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      canvasCtx.fillRect(width - 60, 0, 60, height);
      
      // Draw frequency labels
      canvasCtx.fillStyle = 'white';
      canvasCtx.font = '10px Arial';
      canvasCtx.textAlign = 'left';
      
      const labelCount = 10;
      // Safely access the sample rate with a fallback value
      const sampleRate = audioContextRef.current?.sampleRate || 44100;
      const step = Math.floor(sampleRate / 2 / labelCount);
      
      for (let i = 0; i <= labelCount; i++) {
        const freq = Math.floor(i * step);
        const y = height - (i / labelCount) * height;
        
        canvasCtx.fillText(
          freq >= 1000 ? `${(freq / 1000).toFixed(1)}kHz` : `${freq}Hz`,
          width - 55,
          y + 3
        );
      }
      
      // Restore context
      canvasCtx.restore();
    };

    // Start the animation
    draw();
  }, [isRecording, getColor]);

  // Initialize the canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    // Set canvas dimensions
    const width = 800;
    const height = 400;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas with black background
    canvasCtx.fillStyle = 'black';
    canvasCtx.fillRect(0, 0, width, height);

    // Clean up on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Handle recording state changes
  useEffect(() => {
    if (isRecording) {
      startVisualization();
    }
  }, [isRecording, startVisualization]);

  return (
    <div className="dark relative min-h-screen bg-black">
      {/* DarkVeil as background */}
      <div className="absolute inset-0 z-0">
        <DarkVeil />
      </div>
      
      <Container className="relative z-10">
        <div className="max-w-5xl mx-auto space-y-8 py-8">
          <div className='text-center mb-8'>
            <h1 className="text-4xl font-bold text-white mb-4 font-goldman tracking-wider relative z-10">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-500 to-purple-600">
                Live Audio Analysis
              </span>
              <div className="absolute inset-0 blur-sm opacity-50 bg-gradient-to-r from-purple-400 via-blue-500 to-purple-600 bg-clip-text text-transparent -z-10">
                Live Audio Analysis
              </div>
            </h1>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Analyze your microphone input in real-time with a live spectrogram visualization
            </p>
          </div>

          {permissionGranted === false && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Microphone Access Denied</AlertTitle>
              <AlertDescription>
                Please allow microphone access to use this feature. You might need to update your browser settings.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Live Spectrogram</CardTitle>
                <p className="text-sm text-gray-400 mt-1">
                  Visualize frequency content of your microphone input in real-time
                </p>
              </div>
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                className={isRecording ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary/90"}
              >
                {isRecording ? (
                  <>
                    <MicOff className="mr-2 h-4 w-4" /> Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" /> Start Recording
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent className="relative">
              <div className="w-full h-[400px] bg-black rounded-md overflow-hidden">
                <canvas 
                  ref={canvasRef} 
                  className="w-full h-full"
                />
                {!isRecording && !error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <p className="text-white text-lg">Click "Start Recording" to begin</p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">About This Visualization</h3>
                <p className="text-sm text-gray-400">
                  This spectrogram shows frequency (vertical axis) over time (horizontal axis). 
                  Brighter colors indicate stronger presence of that frequency in the audio signal.
                  The visualization scrolls from left to right as new audio data is processed.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-gray-400 mb-2">
              Note: Your audio is processed locally in your browser and is not sent to any server.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
