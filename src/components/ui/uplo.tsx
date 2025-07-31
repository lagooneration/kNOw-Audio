import React from 'react';
import styled from 'styled-components';

const Uplo = () => {
  return (
    <StyledWrapper>
      <form className="file-upload-form">
        <label htmlFor="file" className="file-upload-label">
          <div className="file-upload-design">
            <svg viewBox="0 0 640 512" height="1em">
              <path d="M144 480C64.5 480 0 415.5 0 336c0-62.8 40.2-116.2 96.2-135.9c-.1-2.7-.2-5.4-.2-8.1c0-88.4 71.6-160 160-160c59.3 0 111 32.2 138.7 80.2C409.9 102 428.3 96 448 96c53 0 96 43 96 96c0 12.2-2.3 23.8-6.4 34.6C596 238.4 640 290.1 640 352c0 70.7-57.3 128-128 128H144zm79-217c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l39-39V392c0 13.3 10.7 24 24 24s24-10.7 24-24V257.9l39 39c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-80-80c-9.4-9.4-24.6-9.4-33.9 0l-80 80z" />
            </svg>
            <p>Drag and Drop</p>
            <p>or</p>
            <span className="browse-button">Browse file</span>
          </div>
          <input id="file" type="file" />
        </label>
      </form>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .file-upload-form {
    width: fit-content;
    height: fit-content;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #1e1e1e; /* Dark background for the form */
  }

  .file-upload-label input {
    display: none;
  }

  .file-upload-label svg {
    height: 50px;
    fill: #666; /* Lighter gray for the SVG fill */
    margin-bottom: 20px;
  }

  .file-upload-label {
    cursor: pointer;
    background-color: #333; /* Darker background for the label */
    padding: 30px 70px;
    border-radius: 40px;
    border: 2px dashed #666; /* Lighter gray dashed border */
    box-shadow: 0px 0px 200px -50px rgba(0, 0, 0, 0.5); /* Adjusted shadow */
    color: #eee; /* Text color for the label */
  }

  .file-upload-design {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }

  .browse-button {
    background-color: #666; /* Lighter gray for the button */
    padding: 5px 15px;
    border-radius: 10px;
    color: #eee; /* Off-white text for better contrast */
    transition: all 0.3s;
  }

  .browse-button:hover {
    background-color: #888; /* Slightly lighter gray on hover */
    color: #fff; /* White text on hover */
  }`;

export default Uplo;
