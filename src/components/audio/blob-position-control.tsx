import { useRef, useEffect, useState } from 'react';
import { type SpatialAudioData } from '../../types/spatial-audio';

interface BlobPositionControlProps {
  audioSources: SpatialAudioData[];
  selectedSourceId: string | null;
  onPositionChange: (id: string, position: { x: number; y: number; z: number }) => void;
}

export function BlobPositionControl({
  audioSources,
  selectedSourceId,
  onPositionChange
}: BlobPositionControlProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  
  // Draw the top-down view of audio blobs
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas size
    const updateCanvasSize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        const size = Math.min(rect.width, 200);
        canvas.width = size;
        canvas.height = size;
        setCanvasSize({ width: size, height: size });
      }
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    // Draw the canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = 'rgba(30, 30, 40, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
    ctx.lineWidth = 1;
    
    // Grid lines
    const gridStep = canvas.width / 10;
    for (let i = 0; i <= 10; i++) {
      const pos = i * gridStep;
      
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(canvas.width, pos);
      ctx.stroke();
      
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, canvas.height);
      ctx.stroke();
    }
    
    // Center marker
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 10, canvas.height / 2);
    ctx.lineTo(canvas.width / 2 + 10, canvas.height / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height / 2 - 10);
    ctx.lineTo(canvas.width / 2, canvas.height / 2 + 10);
    ctx.stroke();
    
    // Draw each audio blob
    audioSources.forEach(source => {
      // Convert 3D coordinates to 2D position on canvas
      // Assuming the 3D space is from -5 to 5 in x and z
      const x = ((source.position.x + 5) / 10) * canvas.width;
      const y = ((source.position.z + 5) / 10) * canvas.height;
      
      // Draw blob
      ctx.fillStyle = source.color;
      ctx.beginPath();
      ctx.arc(x, y, source.isSelected ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw selection indicator
      if (source.isSelected || source.id === selectedSourceId) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [audioSources, selectedSourceId]);
  
  // Handle interactions
  const handleMouseDown = () => {
    if (!selectedSourceId || !canvasRef.current) return;
    setIsDragging(true);
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedSourceId || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert canvas coordinates to 3D space (-5 to 5)
    const position3D = {
      x: (x / canvasSize.width) * 10 - 5,
      y: 0.5, // Keep Y constant for the top-down view
      z: (y / canvasSize.height) * 10 - 5
    };
    
    onPositionChange(selectedSourceId, position3D);
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  return (
    <div className="audio-blob-position-control">
      <h4 className="text-sm font-medium mb-2">Audio Position (Top View)</h4>
      <div className="border border-border rounded overflow-hidden">
        <canvas 
          ref={canvasRef} 
          className="position-control-canvas w-full h-auto" 
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
      <div className="position-control-label">
        <span>Left</span>
        <span>Right</span>
      </div>
      <div className="position-control-label">
        <span>Near</span>
        <span>Far</span>
      </div>
    </div>
  );
}
