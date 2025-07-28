import { useState, useRef, useEffect } from 'react';

interface KnobProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  label: string;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function Knob({
  min,
  max,
  value,
  onChange,
  label,
  unit = '',
  size = 'md',
  color
}: KnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);
  
  // Convert value to degrees for rotation
  const valueToDegrees = (val: number) => {
    // Map value range to 0-270 degrees
    return ((val - min) / (max - min)) * 270 - 135;
  };
  
  // Set knob rotation based on value
  useEffect(() => {
    if (knobRef.current) {
      knobRef.current.style.transform = `rotate(${valueToDegrees(value)}deg)`;
    }
  }, [value]);
  
  // Handle mouse down event
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartY(e.clientY);
    setStartValue(value);
    
    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Handle mouse move event
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    // Calculate delta and apply sensitivity
    const deltaY = startY - e.clientY;
    const sensitivity = (max - min) / 200;
    
    // Calculate new value with constraints
    let newValue = startValue + deltaY * sensitivity;
    newValue = Math.max(min, Math.min(max, newValue));
    
    // Update value
    onChange(Math.round(newValue));
  };
  
  // Handle mouse up event
  const handleMouseUp = () => {
    setIsDragging(false);
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  // Get size class
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'w-10 h-10';
      case 'lg': return 'w-16 h-16';
      default: return 'w-12 h-12';
    }
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="knob-label">{label}</div>
      <div className="knob-container" style={{ width: getSizeClass(), height: getSizeClass() }}>
        <div 
          ref={knobRef}
          className="knob"
          onMouseDown={handleMouseDown}
          style={color ? { backgroundColor: color } : undefined}
        ></div>
        <div className="knob-value">
          {value}{unit}
        </div>
      </div>
    </div>
  );
}
