interface WaveformIconProps {
  active?: boolean;
}

export function SineIcon({ active = false }: WaveformIconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path 
        d="M3 12C3 12 6 6 12 6C18 6 21 12 21 12C21 12 18 18 12 18C6 18 3 12 3 12Z" 
        stroke={active ? "#ffffff" : "#666666"} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SquareIcon({ active = false }: WaveformIconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path 
        d="M3 6H9V18H15V6H21" 
        stroke={active ? "#ffffff" : "#666666"} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TriangleIcon({ active = false }: WaveformIconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path 
        d="M3 18L9 6L15 18L21 6" 
        stroke={active ? "#ffffff" : "#666666"} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SawtoothIcon({ active = false }: WaveformIconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path 
        d="M3 6L9 18V6L15 18V6L21 18" 
        stroke={active ? "#ffffff" : "#666666"} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
