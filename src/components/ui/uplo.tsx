import type { FC } from 'react'; // If you need component typing
import styled from 'styled-components';

const Uplo: FC = () => {
  return (
    <StyledWrapper>
      <form className="file-upload-form">
        <label htmlFor="file-upload-input" className="file-upload-label">
          <div className="file-upload-design">
            <svg viewBox="0 0 640 512" height="1em">
              <path d="M144 480C64.5 480 0 415.5 0 336c0-62.8 40.2-116.2 96.2-135.9c-.1-2.7-.2-5.4-.2-8.1c0-88.4 71.6-160 160-160c59.3 0 111 32.2 138.7 80.2C409.9 102 428.3 96 448 96c53 0 96 43 96 96c0 12.2-2.3 23.8-6.4 34.6C596 238.4 640 290.1 640 352c0 70.7-57.3 128-128 128H144zm79-217c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l39-39V392c0 13.3 10.7 24 24 24s24-10.7 24-24V257.9l39 39c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-80-80c-9.4-9.4-24.6-9.4-33.9 0l-80 80z" />
            </svg>
            <p>Drag and Drop Audio</p>
            <p>or</p>
            <span className="browse-button">Browse Audio Files</span>
          </div>
        </label>
      </form>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .file-upload-form {
    width: 100%;
    height: fit-content;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .file-upload-label input {
    display: none;
  }

  .file-upload-label svg {
    height: 40px;
    fill: rgba(100, 200, 255, 0.7);
    margin-bottom: 12px;
  }

  .file-upload-label {
    cursor: pointer;
    width: 100%;
    padding: 20px;
    border-radius: 12px;
    border: 2px dashed rgba(100, 200, 255, 0.3);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    color: rgba(255, 255, 255, 0.8);
    background-color: rgba(30, 30, 40, 0.6);
    transition: all 0.3s ease;
  }

  .file-upload-label:hover {
    border-color: rgba(100, 200, 255, 0.6);
    background-color: rgba(40, 40, 60, 0.7);
  }

  .file-upload-design {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }

  .file-upload-design p {
    margin: 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
  }

  .browse-button {
    background-color: rgba(100, 200, 255, 0.3);
    padding: 6px 15px;
    border-radius: 6px;
    color: white;
    font-size: 12px;
    font-weight: 600;
    margin-top: 5px;
    transition: all 0.3s ease;
  }

  .browse-button:hover {
    background-color: rgba(100, 200, 255, 0.5);
  }
`;

export default Uplo;
