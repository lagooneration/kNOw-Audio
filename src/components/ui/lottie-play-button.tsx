import { useRef, useEffect, useState } from 'react';
import lottie from 'lottie-web';
import '../audio/editor-styles.css';

interface LottiePlayButtonProps {
  isPlaying: boolean;
  onClick: () => void;
  size?: number;
}

export function LottiePlayButton({ isPlaying, onClick, size = 40 }: LottiePlayButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [animation, setAnimation] = useState<ReturnType<typeof lottie.loadAnimation> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Initialize the Lottie animation
    const lottieInstance = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      path: '/lottie/play.json', // Using the pre-existing Lottie animation from the public folder
    });
    
    setAnimation(lottieInstance);
    
    return () => {
      lottieInstance.destroy();
    };
  }, []);
  
  // Update animation when isPlaying changes
  useEffect(() => {
    if (!animation) return;
    
    if (isPlaying) {
      animation.playSegments([30, 60], true); // Play to pause state
    } else {
      animation.playSegments([0, 30], true); // Play to play state
    }
  }, [isPlaying, animation]);
  
  return (
    <div 
      ref={containerRef} 
      onClick={() => {
        console.log(`Play button clicked. Current state: ${isPlaying ? 'Playing' : 'Paused'}`);
        onClick();
      }}
      className="lottie-play-button"
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        cursor: 'pointer'
      }}
    />
  );
}
