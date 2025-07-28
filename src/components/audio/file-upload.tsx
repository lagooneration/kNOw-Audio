import { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

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

  const handleButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <Card className={`border-2 ${dragActive ? 'border-primary' : 'border-dashed'} transition-colors`}>
      <CardHeader>
        <CardTitle>Upload Audio File</CardTitle>
        <CardDescription>
          Drag and drop your audio file here or click to browse
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div
          className={`
            flex flex-col items-center justify-center p-8 rounded-md
            ${dragActive ? 'bg-primary/10' : 'bg-secondary/50'} 
            transition-colors
          `}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-muted-foreground mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
          
          <p className="text-lg text-center mb-4">
            {isProcessing ? 'Processing audio file...' : 'Upload audio to analyze'}
          </p>
          
          {error && (
            <p className="text-destructive mb-4">{error}</p>
          )}
          
          <input
            type="file"
            ref={inputRef}
            className="hidden"
            accept={accept}
            onChange={handleFileChange}
            disabled={isProcessing}
          />
          
          <Button
            onClick={handleButtonClick}
            disabled={isProcessing}
            className="w-full max-w-xs"
          >
            {isProcessing ? 'Processing...' : 'Select File'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
