import { useRef, useState } from 'react';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  accept?: string;
  maxSize?: number;
  isProcessing?: boolean;
}

export function FileUpload({
  onFileSelected,
  accept = 'audio/*',
  maxSize = 50 * 1024 * 1024, // 50MB default
  isProcessing = false
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    validateAndProcessFile(files[0]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    validateAndProcessFile(files[0]);
  };

  const validateAndProcessFile = (file: File) => {
    setError(null);
    
    // Check file type
    if (!file.type.startsWith('audio/')) {
      setError('Please upload an audio file');
      return;
    }
    
    // Check file size
    if (file.size > maxSize) {
      setError(`File too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB`);
      return;
    }
    
    // Pass file to parent component
    onFileSelected(file);
  };

  return (
    <div className="group/dropzone">
      <div
        className={`
          relative rounded-xl border-2 border-dashed p-8 transition-colors
          ${dragActive ? 'border-cyan-500/50' : 'border-slate-700'} 
          bg-slate-900/50 group-hover/dropzone:border-cyan-500/50
        `}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={inputRef}
          className="absolute inset-0 z-50 h-full w-full cursor-pointer opacity-0"
          accept={accept}
          onChange={handleFileChange}
          disabled={isProcessing}
        />
        
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-900">
            <svg
              className="h-10 w-10 text-cyan-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <p className="text-base font-medium text-white">
              {isProcessing ? 'Processing audio file...' : 'Upload'}
            </p>
            <p className="text-sm text-slate-400">
              MP3, WAV, OGG, FLAC
            </p>
            <p className="text-xs text-slate-400">
              Upto {Math.round(maxSize / (1024 * 1024))}MB
            </p>
            
            {error && (
              <p className="text-red-500 font-medium">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
