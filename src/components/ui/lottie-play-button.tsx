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
  const animationRef = useRef<ReturnType<typeof lottie.loadAnimation> | null>(null);
  const [animationReady, setAnimationReady] = useState(false);
  const previousStateRef = useRef(isPlaying);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Initialize the Lottie animation
    const lottieInstance = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      path: '/lottie/play.json', // Using the pre-existing Lottie animation from the public folder
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice',
        progressiveLoad: true,
        hideOnTransparent: true
      }
    });
    
    lottieInstance.addEventListener('DOMLoaded', () => {
      // Animation is ready to be controlled
      setAnimationReady(true);
      animationRef.current = lottieInstance;
      
      // Set initial state
      if (isPlaying) {
        lottieInstance.goToAndStop(lottieInstance.totalFrames - 1, true);
      } else {
        lottieInstance.goToAndStop(0, true);
      }
    });
    
    return () => {
      lottieInstance.destroy();
      animationRef.current = null;
    };
  }, [isPlaying]); // Include isPlaying in dependency array
  
  // Update animation when isPlaying changes
  useEffect(() => {
    if (!animationRef.current || !animationReady) return;
    
    // Only animate if the state actually changed
    if (previousStateRef.current !== isPlaying) {
      console.log(`Animation state updated: ${isPlaying ? 'Playing' : 'Paused'}`);
      
      if (isPlaying) {
        // Animate to play state (0 to 100%)
        animationRef.current.setDirection(1);
        animationRef.current.playSegments([0, animationRef.current.totalFrames], true);
      } else {
        // Animate to pause state (100% to 0)
        animationRef.current.setDirection(-1);
        animationRef.current.playSegments([animationRef.current.totalFrames, 0], true);
      }
      
      previousStateRef.current = isPlaying;
    }
  }, [isPlaying, animationReady]);
  
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
      data-state={isPlaying ? 'playing' : 'paused'}
      title={isPlaying ? "Pause" : "Play"}
    />
  );
}
