import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Button } from '../ui/button';
import { Knob } from '../ui/knob';

interface OscillatorViewerProps {
  isEnabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

export function OscillatorViewer({ isEnabled, onEnabledChange }: OscillatorViewerProps) {
  const [frequency, setFrequency] = useState(440);
  const [oscillatorType, setOscillatorType] = useState<Tone.ToneOscillatorType>('sine');
  const [volume, setVolume] = useState(-10);
  
  const oscillatorRef = useRef<Tone.Oscillator | null>(null);
  const analyzerRef = useRef<Tone.Analyser | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Initialize Tone.js oscillator
  useEffect(() => {
    // Setup Tone.js
    Tone.start();
    
    // Create oscillator
    const oscillator = new Tone.Oscillator(frequency, oscillatorType).toDestination();
    oscillator.volume.value = volume;
    
    // Create analyzer
    const analyzer = new Tone.Analyser('waveform', 1024);
    oscillator.connect(analyzer);
    
    // Save references
    oscillatorRef.current = oscillator;
    analyzerRef.current = analyzer;
    
    // Start oscillator if enabled
    if (isEnabled) {
      oscillator.start();
    }
    
    // Cleanup
    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.dispose();
      }
      
      if (analyzerRef.current) {
        analyzerRef.current.dispose();
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [frequency, oscillatorType, volume, isEnabled]);
  
  // Toggle oscillator
  const toggleOscillator = () => {
    if (!oscillatorRef.current) return;
    
    if (isEnabled) {
      oscillatorRef.current.stop();
    } else {
      oscillatorRef.current.start();
    }
    
    onEnabledChange(!isEnabled);
  };
  
  // Update oscillator when parameters change
  useEffect(() => {
    if (!oscillatorRef.current) return;
    
    oscillatorRef.current.frequency.value = frequency;
    oscillatorRef.current.type = oscillatorType;
    oscillatorRef.current.volume.value = volume;
  }, [frequency, oscillatorType, volume]);
  
  // Setup visualization
  useEffect(() => {
    if (!canvasRef.current || !analyzerRef.current || !isEnabled) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const analyzer = analyzerRef.current;
    
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
      const waveform = analyzer.getValue() as Float32Array;
      
      // Clear canvas
      ctx.fillStyle = 'rgba(20, 20, 30, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw waveform
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
      ctx.lineWidth = 2;
      
      const sliceWidth = canvas.width / waveform.length;
      let x = 0;
      
      for (let i = 0; i < waveform.length; i++) {
        const v = waveform[i] as number;
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
    
    // Start drawing if oscillator is enabled
    if (isEnabled) {
      draw();
    }
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isEnabled]);
  
  return (
    <div className="p-3 bg-secondary/30 rounded-lg">
      <h3 className="text-xs font-medium mb-2">Oscillator</h3>
      
      <div className="flex flex-col gap-2">
        <div className="h-20">
          <canvas ref={canvasRef} className="w-full h-full bg-black/50 rounded-lg"></canvas>
        </div>
        
        <div className="flex justify-around mt-1">
          <Knob
            min={20}
            max={2000}
            value={frequency}
            onChange={setFrequency}
            label="Frequency"
            unit="Hz"
            size="sm"
          />
          
          <Knob
            min={-40}
            max={0}
            value={volume}
            onChange={setVolume}
            label="Volume"
            unit="dB"
            size="sm"
          />
        </div>
        
        <div className="flex flex-wrap gap-1 mt-1">
          <Button 
            variant={oscillatorType === 'sine' ? 'default' : 'outline'} 
            onClick={() => setOscillatorType('sine')}
            size="sm"
            className="text-xs px-2 py-1 h-6"
          >
            Sine
          </Button>
          <Button 
            variant={oscillatorType === 'square' ? 'default' : 'outline'} 
            onClick={() => setOscillatorType('square')}
            size="sm"
            className="text-xs px-2 py-1 h-6"
          >
            Square
          </Button>
          <Button 
            variant={oscillatorType === 'triangle' ? 'default' : 'outline'} 
            onClick={() => setOscillatorType('triangle')}
            size="sm"
            className="text-xs px-2 py-1 h-6"
          >
            Triangle
          </Button>
          <Button 
            variant={oscillatorType === 'sawtooth' ? 'default' : 'outline'} 
            onClick={() => setOscillatorType('sawtooth')}
            size="sm"
            className="text-xs px-2 py-1 h-6"
          >
            Saw
          </Button>
        </div>
        
        <Button 
          onClick={toggleOscillator} 
          size="sm"
          className="mt-1 h-7 text-xs"
        >
          {isEnabled ? 'Stop Oscillator' : 'Start Oscillator'}
        </Button>
        
        <div className="mt-3 border-t border-border/50 pt-2">
          <h4 className="text-xs font-medium mb-1 text-muted-foreground">Coming Soon</h4>
          <div className="feature-item">
            <span className="feature-icon">🎹</span>
            <span className="text-xs">MIDI Input</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎛️</span>
            <span className="text-xs">Modulation Matrix</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔊</span>
            <span className="text-xs">FM Synthesis</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎚️</span>
            <span className="text-xs">ADSR Envelope</span>
          </div>
        </div>
      </div>
    </div>
  );
}
