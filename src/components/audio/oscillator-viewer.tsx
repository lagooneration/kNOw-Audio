import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Knob } from '../ui/knob';
import Switch from '../ui/Switch';
import './oscillator-styles.css';

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
      
      // When turning off, request a single animation frame to clear the display
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
          ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          // Draw a flat line
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(60, 60, 80, 0.5)';
          ctx.lineWidth = 1;
          const y = canvasRef.current.height / 2;
          ctx.moveTo(0, y);
          ctx.lineTo(canvasRef.current.width, y);
          ctx.stroke();
        }
      }
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
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
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
      if (!isEnabled || !analyzerRef.current) {
        // Clear canvas when oscillator is off
        ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw a flat line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(60, 60, 80, 0.5)';
        ctx.lineWidth = 1;
        const y = canvas.height / 2;
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
        
        // Continue animation even when off
        animationRef.current = requestAnimationFrame(draw);
        return;
      }
      
      animationRef.current = requestAnimationFrame(draw);
      
      // Get data from analyzer
      const waveform = analyzerRef.current.getValue() as Float32Array;
      
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
    
    // Start drawing always, but draw differently based on oscillator state
    draw();
    
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
      <div className="flex flex-row justify-between items-center gap-2">
      <h3 className="text-xs font-medium mb-2">Oscillator</h3>
          <Switch 
            checked={isEnabled}
            onChange={toggleOscillator}
            label={isEnabled ? "ON" : "OFF"}
          />
          </div>
      <div className="flex flex-col gap-2">
        <div className="h-20">
          <canvas ref={canvasRef} className="w-full h-full bg-black/50 rounded-lg"></canvas>
        </div>
        
        <div className="flex justify-around mt-1">
          <div className="text-center">
            <div className="text-[9px] text-muted-foreground mb-1">Freq</div>
            <Knob
              min={20}
              max={2000}
              value={frequency}
              onChange={setFrequency}
              label=""
              unit="Hz"
              size="sm"
            />
          </div>
          
          <div className="text-center">
            <div className="text-[9px] text-muted-foreground mb-1">Vol</div>
            <Knob
              min={-40}
              max={0}
              value={volume}
              onChange={setVolume}
              label=""
              unit="dB"
              size="sm"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-2 justify-around">
          <button 
            className={`waveform-btn ${oscillatorType === 'sine' ? 'active' : ''}`}
            onClick={() => setOscillatorType('sine')}
            title="Sine Wave"
          >
            <img 
              src="/images/sine.svg" 
              alt="Sine" 
              width="24" 
              height="24" 
              className={`waveform-icon ${oscillatorType === 'sine' ? 'active' : ''}`}
            />
          </button>
          <button 
            className={`waveform-btn ${oscillatorType === 'square' ? 'active' : ''}`}
            onClick={() => setOscillatorType('square')}
            title="Square Wave"
          >
            <img 
              src="/images/square.svg" 
              alt="Square" 
              width="24" 
              height="24" 
              className={`waveform-icon ${oscillatorType === 'square' ? 'active' : ''}`}
            />
          </button>
          <button 
            className={`waveform-btn ${oscillatorType === 'triangle' ? 'active' : ''}`}
            onClick={() => setOscillatorType('triangle')}
            title="Triangle Wave"
          >
            <img 
              src="/images/triangle.svg" 
              alt="Triangle" 
              width="24" 
              height="24" 
              className={`waveform-icon ${oscillatorType === 'triangle' ? 'active' : ''}`}
            />
          </button>
          <button 
            className={`waveform-btn ${oscillatorType === 'sawtooth' ? 'active' : ''}`}
            onClick={() => setOscillatorType('sawtooth')}
            title="Sawtooth Wave"
          >
            <img 
              src="/images/saw.svg" 
              alt="Sawtooth" 
              width="24" 
              height="24" 
              className={`waveform-icon ${oscillatorType === 'sawtooth' ? 'active' : ''}`}
            />
          </button>
        </div>
        
        
        
        <div className="mt-3 border-t border-border/50 pt-2">
          <h4 className="coming-soon-title">Coming Soon</h4>
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
