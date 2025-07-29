import React from 'react';
import styled from 'styled-components';

interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
}

const Switch: React.FC<SwitchProps> = ({ checked = false, onChange, label }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.checked);
    }
  };

  return (
    <StyledWrapper>
      <div className="switch-container">
      {label && <span className="switch-label">{label}</span>}
      <label className="switch-button" htmlFor="oscillator-switch">
        <div className="switch-outer">
          <input 
            id="oscillator-switch" 
            type="checkbox" 
            checked={checked}
            onChange={handleChange}
          />
          <div className="button">
            <span className="button-toggle" />
            <span className="button-indicator" />
          </div>
        </div>
      </label>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  .switch-container {
    display: flex;
    align-items: center;
    gap: 8px;
    scale: 0.8;
  }
  .switch-label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.8);
    user-select: none;
  }

  .switch-button {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    align-items: center;
    -webkit-box-pack: center;
    justify-content: center;
    justify-content: center;
    margin: auto;
    height: 28px; /* Reduced size from 55px */
  }

  .switch-button .switch-outer {
    height: 100%;
    background: #252532;
    width: 56px; /* Reduced size from 115px */
    border-radius: 165px;
    -webkit-box-shadow: inset 0px 5px 10px 0px #16151c, 0px 3px 6px -2px #403f4e;
    box-shadow: inset 0px 5px 10px 0px #16151c, 0px 3px 6px -2px #403f4e;
    border: 1px solid #32303e;
    padding: 3px; /* Reduced padding from 6px */
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .switch-button .switch-outer input[type="checkbox"] {
    opacity: 0;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    position: absolute;
  }

  .switch-button .switch-outer .button-toggle {
    height: 22px; /* Reduced from 42px */
    width: 22px; /* Reduced from 42px */
    background: -webkit-gradient(
      linear,
      left top,
      left bottom,
      from(#3b3a4e),
      to(#272733)
    );
    background: -o-linear-gradient(#3b3a4e, #272733);
    background: linear-gradient(#3b3a4e, #272733);
    border-radius: 100%;
    -webkit-box-shadow: inset 0px 5px 4px 0px #424151, 0px 4px 15px 0px #0f0e17;
    box-shadow: inset 0px 5px 4px 0px #424151, 0px 4px 15px 0px #0f0e17;
    position: relative;
    z-index: 2;
    -webkit-transition: left 0.3s ease-in;
    -o-transition: left 0.3s ease-in;
    transition: left 0.3s ease-in;
    left: 0;
  }

  .switch-button
    .switch-outer
    input[type="checkbox"]:checked
    + .button
    .button-toggle {
    left: 28px; /* Adjusted from 58% */
  }

  .switch-button
    .switch-outer
    input[type="checkbox"]:checked
    + .button
    .button-indicator {
    -webkit-animation: indicator 1s forwards;
    animation: indicator 1s forwards;
  }

  .switch-button .switch-outer .button {
    width: 100%;
    height: 100%;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    position: relative;
    -webkit-box-pack: justify;
    justify-content: space-between;
  }

  .switch-button .switch-outer .button-indicator {
    height: 15px; /* Reduced from 25px */
    width: 15px; /* Reduced from 25px */
    top: 50%;
    -webkit-transform: translateY(-50%);
    transform: translateY(-50%);
    border-radius: 50%;
    border: 3px solid #ef565f;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    right: 5px; /* Adjusted from 10px */
    position: relative;
  }

  @-webkit-keyframes indicator {
    30% {
      opacity: 0;
    }

    0% {
      opacity: 1;
    }

    100% {
      opacity: 1;
      border: 3px solid #60d480;
      left: -68%;
    }
  }

  @keyframes indicator {
    30% {
      opacity: 0;
    }

    0% {
      opacity: 1;
    }

    100% {
      opacity: 1;
      border: 3px solid #60d480;
      left: -36px; /* Adjusted from -68% */
    }
  }`;

export default Switch;
