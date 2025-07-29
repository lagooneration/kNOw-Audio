import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { type AudioData } from '../types/audio';
import { type AudioLibrary, type AudioLibraryItem, type SpatialAudioData } from '../types/spatial-audio';
import { processAudioFile } from '../utils/audio-processing';
import { createSpatialAudioSource, updateSpatialAudioPosition } from '../utils/spatial-audio-processing';

const MAX_AUDIO_FILES = 3;

// Default colors for audio visualizations
const AUDIO_COLORS = [
  '#FF5F6D', // Pink
  '#38AECC', // Blue
  '#57CC99', // Green
];

export function useAudioLibrary() {
  const [library, setLibrary] = useState<AudioLibrary>({
    items: [],
    selectedItemId: null
  });
  
  // Add a new audio file to the library
  const addAudioFile = useCallback(async (file: File) => {
    // Check if we've reached the maximum number of files
    if (library.items.length >= MAX_AUDIO_FILES) {
      throw new Error(`Maximum of ${MAX_AUDIO_FILES} audio files allowed`);
    }
    
    // Create a new library item
    const id = uuidv4();
    const colorIndex = library.items.length % AUDIO_COLORS.length;
    
    const newItem: AudioLibraryItem = {
      id,
      name: file.name,
      color: AUDIO_COLORS[colorIndex],
      isLoading: true
    };
    
    // Add the item to the library
    setLibrary(prev => ({
      ...prev,
      items: [...prev.items, newItem],
      selectedItemId: prev.selectedItemId || id // Select this item if none selected
    }));
    
    try {
      // Process the audio file
      const audioData = await processAudioFile(file);
      
      // Update the library item with the processed data
      setLibrary(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.id === id 
            ? { ...item, audioData, isLoading: false }
            : item
        )
      }));
      
      return id;
    } catch (error) {
      // Update the library item with the error
      setLibrary(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.id === id 
            ? { ...item, error: (error as Error).message, isLoading: false }
            : item
        )
      }));
      
      throw error;
    }
  }, [library.items]);
  
  // Remove an audio file from the library
  const removeAudioFile = useCallback((id: string) => {
    setLibrary(prev => {
      // Get the item to remove
      const itemToRemove = prev.items.find(item => item.id === id);
      
      // If the item has an audio URL, revoke it
      if (itemToRemove?.audioData?.url) {
        URL.revokeObjectURL(itemToRemove.audioData.url);
      }
      
      // Remove the item from the library
      const updatedItems = prev.items.filter(item => item.id !== id);
      
      // Update the selected item if necessary
      let selectedItemId = prev.selectedItemId;
      if (selectedItemId === id) {
        selectedItemId = updatedItems.length > 0 ? updatedItems[0].id : null;
      }
      
      return {
        ...prev,
        items: updatedItems,
        selectedItemId
      };
    });
  }, []);
  
  // Select an audio file
  const selectAudioFile = useCallback((id: string | null) => {
    setLibrary(prev => ({
      ...prev,
      selectedItemId: id
    }));
  }, []);
  
  // Get the currently selected audio file
  const getSelectedAudio = useCallback((): AudioLibraryItem | null => {
    if (!library.selectedItemId) return null;
    return library.items.find(item => item.id === library.selectedItemId) || null;
  }, [library]);
  
  // Convert a library item to a spatial audio source
  const createSpatialAudio = useCallback((item: AudioLibraryItem, position: { x: number; y: number; z: number }): SpatialAudioData | null => {
    if (!item.audioData) return null;
    
    const spatialData: SpatialAudioData = {
      ...item.audioData,
      id: item.id,
      name: item.name,
      color: item.color,
      position,
      isPlaying: false,
      volume: 1,
      isSelected: library.selectedItemId === item.id
    };
    
    return createSpatialAudioSource(spatialData);
  }, [library.selectedItemId]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Revoke all object URLs
      library.items.forEach(item => {
        if (item.audioData?.url) {
          URL.revokeObjectURL(item.audioData.url);
        }
      });
    };
  }, [library.items]);
  
  return {
    library,
    addAudioFile,
    removeAudioFile,
    selectAudioFile,
    getSelectedAudio,
    createSpatialAudio,
    MAX_AUDIO_FILES
  };
}
