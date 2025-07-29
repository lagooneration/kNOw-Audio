import { useEffect, useState } from 'react';
import { AudioEditor } from '../components/audio/audio-editor';

export function EditorPage() {
  const [showTip, setShowTip] = useState(true);
  
  // Hide the tip after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTip(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="dark relative min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {showTip && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-cyan-800/80 text-white px-4 py-2 rounded-md shadow-lg backdrop-blur-sm text-sm">
          Upload audio files from the Library tab and drag them onto the 3D canvas
        </div>
      )}
      <div className="relative z-10 h-screen w-full">
        <div className="h-full w-full overflow-hidden">
          <AudioEditor />
        </div>
      </div>
    </div>
  );
}
