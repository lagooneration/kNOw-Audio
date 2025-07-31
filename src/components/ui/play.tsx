import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

interface PlayProps {
  isPlaying: boolean;
  onClick: () => void;
  size?: number;
}

const Play: React.FC<PlayProps> = ({ isPlaying, onClick, size = 60 }) => {
  const checkboxRef = useRef<HTMLInputElement>(null);
  
  // Sync the checkbox state with isPlaying prop
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.checked = isPlaying;
    }
  }, [isPlaying]);
  
  return (
    <StyledWrapper style={{ transform: `scale(${size / 120})` }}>
      <div className="container">
        <label>
          <input 
            className="play-btn" 
            type="checkbox" 
            ref={checkboxRef}
            checked={isPlaying}
            onChange={() => onClick()}
          />
          <div className="play-icon" />
          <div className="pause-icon" />
        </label>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .container {
    width: 120px;
    height: 120px;
    position: relative;
    border-radius: 50%;
  }

  .play-btn {
    position: absolute;
    appearance: none;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: conic-gradient(#426cdeff, #426cdeff);
    cursor: pointer;
    outline: none;
  }

  .play-btn::before {
    content: "";
    position: absolute;
    width: 93%;
    height: 93%;
    background-color: #000;
    border-radius: 50%;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  .play-btn:checked {
    animation: borderAnimate 700ms ease-in-out 1;
    animation-fill-mode: forwards;
  }

  @keyframes borderAnimate {
    0% {
      transform: rotate(0);
      background: conic-gradient(#426cdeff, transparent 20%);
    }

    80% {
      background: conic-gradient(#426cdeff, transparent 90%);
    }

    100% {
      transform: rotate(360deg);
      background: conic-gradient(#426cdeff, #426cdeff);
    }
  }

  .play-icon {
    position: absolute;
    width: 40px;
    height: 40px;
    left: 60%;
    top: 50%;
    background-color: #426cdeff;
    transform: translate(-60%, -50%) rotate(90deg);
    clip-path: polygon(50% 15%, 0% 100%, 100% 100%);
    transition: all 400ms ease-in-out;
    cursor: pointer;
  }

  .play-btn:checked + .play-icon {
    clip-path: polygon(0 100%, 0% 100%, 100% 100%);
  }

  .pause-icon {
    position: absolute;
    width: 40px;
    height: 40px;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    cursor: pointer;
  }

  .pause-icon::before {
    content: "";
    position: absolute;
    width: 0%;
    height: 100%;
    background-color: #426cdeff;
    left: 0;
  }

  .pause-icon::after {
    content: "";
    position: absolute;
    width: 0;
    height: 100%;
    background-color: #426cdeff;
    right: 0;
  }

  .play-btn:checked ~ .pause-icon::before {
    animation: reveal 300ms ease-in-out 350ms 1;
    animation-fill-mode: forwards;
  }

  .play-btn:checked ~ .pause-icon::after {
    animation: reveal 300ms ease-in-out 600ms 1;
    animation-fill-mode: forwards;
  }

  @keyframes reveal {
    0% {
      width: 0;
    }

    100% {
      width: 35%;
    }
  }`;

export default Play;
