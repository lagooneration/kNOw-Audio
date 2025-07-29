import React, { useState } from 'react';
import { FileUpload } from './file-upload';
import { Button } from '../ui/button';
import type { AudioData } from '../../types/audio';
import type { SpatialAudioData } from '../../types/spatial-audio';

interface SpatialAudioSidebarProps {
  audioFiles: SpatialAudioData[];
  onAudioFileAdded: (audioData: SpatialAudioData) => void;
  onDragStart: (audioData: SpatialAudioData) => void;
  onTogglePlay?: (id: string) => void;
}

export function SpatialAudioSidebar({
  audioFiles,
  onAudioFileAdded,
  onDragStart,
  onTogglePlay
}: SpatialAudioSidebarProps) {
  // Handle file upload
  const handleFileUpload = async (file: File) => {
    // Create a URL for the audio file
    const url = URL.createObjectURL(file);
    
    // Generate a random color for this audio file
    const color = generateRandomColor();
    
    // Create an AudioData object with metadata
    const audioData: SpatialAudioData = {
      id: `audio-${Date.now()}`,
      name: file.name,
      url,
      file,
      color,
      position: { x: 0, y: 0, z: 0 }, // Default position
      isPlaying: false,
      volume: 1.0,
      // These will be populated later
      buffer: new AudioBuffer({ length: 1, numberOfChannels: 1, sampleRate: 44100 }),
      metadata: {
        name: file.name,
        size: file.size,
        type: file.type,
        duration: 0, // Will be set when buffer is loaded
        sampleRate: 44100, // Default, will be updated
        numberOfChannels: 2 // Default, will be updated
      },
      features: {
        timeMarkers: [],
        frequencyPeaks: [],
        beats: [],
        spectrogram: {
          data: [],
          minDecibels: -100,
          maxDecibels: -30
        },
        rms: []
      },
      analysis: {
        hasSpeech: false,
        speechSegments: [],
        hasMusicElements: false,
        musicSegments: [],
        hasEnvironmentalSounds: false,
        environmentalSoundSegments: [],
        dominantFrequencyRanges: [],
        summary: ""
      }
    };
    
    onAudioFileAdded(audioData);
  };
  
  // Generate a random color for the audio blob
  const generateRandomColor = (): string => {
    // Create vibrant colors that are visually distinct
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 60%)`;
  };
  
  // Handle drag start for an audio file
  const handleDragStart = (e: React.DragEvent, audioData: SpatialAudioData) => {
    // Set the drag data
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: audioData.id,
      name: audioData.name,
      url: audioData.url,
      color: audioData.color
    }));
    
    // Notify parent component
    onDragStart(audioData);
  };
  
  return (
    <div className="bg-secondary/20 border-r border-border flex flex-col h-full w-64">
      <div className="border-b border-border px-4 py-2">
        <h3 className="text-sm font-medium">Spatial Audio Sources</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <FileUpload onFileSelected={handleFileUpload} accept="audio/*" />
        
        <div className="mt-4 space-y-2">
          <h4 className="text-xs text-muted-foreground font-medium">Your Audio Files</h4>
          
          {audioFiles.length === 0 ? (
            <div className="text-xs text-muted-foreground py-2">
              No audio files yet. Upload one to begin.
            </div>
          ) : (
            <div className="space-y-2">
              {audioFiles.map((audio) => (
                <div 
                  key={audio.id}
                  className="bg-background/50 rounded-md p-2 flex items-center gap-2"
                  draggable
                  onDragStart={(e) => handleDragStart(e, audio)}
                >
                  <div 
                    className={`w-3 h-3 rounded-full ${audio.isPlaying ? 'animate-pulse' : ''}`}
                    style={{ backgroundColor: audio.color }}
                  />
                  <span className="text-xs truncate flex-1" title={audio.name}>
                    {audio.name}
                  </span>
                  
                  <div className="flex gap-1">
                    {/* Play/Pause Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (onTogglePlay) {
                          onTogglePlay(audio.id);
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
                        {audio.isPlaying ? (
                          <>
                            <rect x="6" y="4" width="4" height="16"></rect>
                            <rect x="14" y="4" width="4" height="16"></rect>
                          </>
                        ) : (
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        )}
                      </svg>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-xs text-muted-foreground font-medium mb-2">Spatial Audio Tips</h4>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
            <li>Drag audio files onto the 3D canvas</li>
            <li>Position sounds in 3D space</li>
            <li>Move the camera to experience spatial audio</li>
            <li>Toggle between Cinematic and Analytical views</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

