import { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { type AudioLibraryItem } from '../../types/spatial-audio';
import Uplo from '../ui/uplo';

interface AudioLibraryTabProps {
  audioItems: AudioLibraryItem[];
  selectedItemId: string | null;
  onAddAudio: (file: File) => Promise<void>;
  onRemoveAudio: (id: string) => void;
  onSelectAudio: (id: string) => void;
  onTogglePlay?: (id: string) => void;
  maxFiles: number;
}

export function AudioLibraryTab({
  audioItems,
  selectedItemId,
  onAddAudio,
  onRemoveAudio,
  onSelectAudio,
  onTogglePlay,
  maxFiles
}: AudioLibraryTabProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const [dragActive, setDragActive] = useState(false);
  
  const handleFileSelected = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadError(null);
      await onAddAudio(file);
    } catch (err) {
      console.error("Error uploading file:", err);
      setUploadError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsUploading(false);
    }
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
    
    // Validate and process the file
    const file = files[0];
    if (!file.type.startsWith('audio/')) {
      setUploadError('Please upload an audio file');
      return;
    }
    
    handleFileSelected(file);
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium mb-2">Audio Library</h3>
      
      {/* Upload component */}
      <div className="mb-4">
        {audioItems.length < maxFiles ? (
          <div 
            className={`uplo-wrapper ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <div 
              className="w-full h-full flex items-center justify-center"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
                if (fileInput) {
                  fileInput.click();
                }
              }}
            >
              <Uplo />
            </div>
            <input 
              id="file-upload-input"
              type="file"
              accept="audio/*"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelected(e.target.files[0]);
                }
              }}
              style={{ display: 'none' }}
              disabled={isUploading}
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-xl">
                <div className="text-white">Processing...</div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-amber-400">Maximum number of files reached ({maxFiles})</p>
        )}
        
        {uploadError && (
          <p className="text-xs text-red-500 mt-1">{uploadError}</p>
        )}
      </div>
      
      {/* Audio item list */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {audioItems.length === 0 ? (
          <p className="text-xs text-muted-foreground">No audio files uploaded yet</p>
        ) : (
          audioItems.map(item => (
            <div 
              key={item.id}
              className={`p-2 rounded-md audio-item flex items-center justify-between text-sm border ${
                selectedItemId === item.id 
                  ? 'bg-primary/20 border-primary' 
                  : 'bg-card border-border hover:border-primary/50'
              }`}
              onClick={() => onSelectAudio(item.id)}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('audio/id', item.id);
                e.dataTransfer.effectAllowed = 'move';
              }}
            >
              <div className="flex items-center">
                <div 
                  className={`w-3 h-3 rounded-full mr-2 ${item.isPlaying ? 'animate-pulse' : ''}`}
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate max-w-[120px]">{item.name}</span>
              </div>
              
              {item.isLoading && <span className="text-xs">Loading...</span>}
              
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 mr-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Toggle play/pause for this audio item
                    if (onTogglePlay) {
                      onTogglePlay(item.id);
                    }
                  }}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {item.isPlaying ? (
                      <>
                        <rect x="6" y="4" width="4" height="16"></rect>
                        <rect x="14" y="4" width="4" height="16"></rect>
                      </>
                    ) : (
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    )}
                  </svg>
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveAudio(item.id);
                  }}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Drag and drop instructions */}
      <div className="mt-4 p-3 bg-card/30 rounded-md border border-dashed border-border">
        <h4 className="text-xs font-medium mb-1">How to use:</h4>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Upload audio files</li>
          <li>Drag & Drop to canvas</li>
          <li>Create your spatial mix</li>
        </ol>
      </div>
    </div>
  );
}
