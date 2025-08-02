import { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as Tone from 'tone';
import { v4 as uuidv4 } from 'uuid';
import { EditorSidebar } from './editor-sidebar';
import { EditorRightSidebar } from './editor-right-sidebar';
import { EditorToolbar } from './editor-toolbar';
import './editor-styles.css';
import './mobile-styles.css';
// Import visualization components
import { CinematicScene } from '../visualization/cinematic-scene';
import { SpectralAudioVisualizer } from '../visualization/spectral-audio-visualizer';
import { SpatialAudioScene } from '../visualization/spatial-audio-scene';
import { useAudioLibrary } from '../../hooks/use-audio-library';
import { type AudioData } from '../../types/audio';
import { type AudioPlacement, type SpatialAudioData } from '../../types/spatial-audio';
import { updateListenerPosition, createSpatialAudioSource, updateSpatialAudioPosition } from '../../utils/spatial-audio-processing';

interface AudioEditorProps {
  audioData?: AudioData;
}

export function AudioEditor({ audioData }: AudioEditorProps) {
  // Audio library state
  const {
    library,
    addAudioFile,
    removeAudioFile,
    selectAudioFile,
    MAX_AUDIO_FILES
  } = useAudioLibrary();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [effects, setEffects] = useState({
    reverb: false,
    delay: false,
    distortion: false,
    filter: false,
  });
  const [filterFreq, setFilterFreq] = useState(1000);
  const [visualizationType, setVisualizationType] = useState<'mathematical' | 'cinematic' | 'spatial'>('spatial');
  const [isOscillatorEnabled, setIsOscillatorEnabled] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState('library');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  
  // Audio processing references
  const playerRefs = useRef(new Map<string, Tone.Player>());
  const pannerRefs = useRef(new Map<string, Tone.Panner3D>());
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const delayRef = useRef<Tone.FeedbackDelay | null>(null);
  const distortionRef = useRef<Tone.Distortion | null>(null);
  const filterRef = useRef<Tone.Filter | null>(null);
  const analyzerRef = useRef<Tone.Analyser | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Spatial audio state
  const [spatialAudioSources, setSpatialAudioSources] = useState<SpatialAudioData[]>([]);

  // Initialize Tone.js
  useEffect(() => {
    // Setup Tone.js - initiate audio context
    Tone.start().then(() => {
      console.log("Tone.js started successfully");
    }).catch(err => {
      console.error("Error starting Tone.js:", err);
    });
    
    // Create effects
    const reverb = new Tone.Reverb({
      decay: 3,
      wet: 0.5
    }).toDestination();
    
    const delay = new Tone.FeedbackDelay({
      delayTime: 0.25,
      feedback: 0.5,
      wet: 0.5
    }).toDestination();
    
    const distortion = new Tone.Distortion({
      distortion: 0.4,
      wet: 0.5
    }).toDestination();
    
    const filter = new Tone.Filter({
      frequency: filterFreq,
      type: 'lowpass',
      Q: 1
    }).toDestination();
    
    // Create analyzer - will be connected to all audio sources
    const analyzer = new Tone.Analyser({
      type: 'fft',
      size: 512
    });
    analyzer.toDestination();
    
    // Store references to dispose later
    const playersToDispose = new Map<string, Tone.Player>();
    const pannersToDispose = new Map<string, Tone.Panner3D>();
    
    // Copy current panners to dispose list
    pannerRefs.current.forEach((panner, id) => {
      pannersToDispose.set(id, panner);
    });
    
    // Save references
    reverbRef.current = reverb;
    delayRef.current = delay;
    distortionRef.current = distortion;
    filterRef.current = filter;
    analyzerRef.current = analyzer;
    
    // Add initial audio if provided
    if (audioData) {
      const initialAudioId = uuidv4();
      
      try {
        const player = new Tone.Player({
          url: audioData.url,
          loop: true,
          playbackRate: playbackSpeed,
          onload: () => {
            console.log('Initial audio loaded successfully');
            // Set total duration once loaded
            if (player.buffer) {
              setTotalDuration(player.buffer.duration);
            }
          }
        });
        
        // Create panner for 3D positioning
        const panner = new Tone.Panner3D({
          positionX: 0,
          positionY: 0.5,
          positionZ: 0,
          refDistance: 1,
          rolloffFactor: 1.5,
          distanceModel: "exponential",
          maxDistance: 10000,
          panningModel: "HRTF"
        });
        
        // Connect player to panner to analyzer
        player.connect(panner);
        panner.connect(analyzer);
        
        // Store in refs and for cleanup
        playerRefs.current.set(initialAudioId, player);
        pannerRefs.current.set(initialAudioId, panner);
        playersToDispose.set(initialAudioId, player);
        pannersToDispose.set(initialAudioId, panner);
        
        // Create spatial audio source
        const initialSource: SpatialAudioData = {
          ...audioData,
          id: initialAudioId,
          name: audioData.file.name,
          color: '#FF5F6D',
          position: { x: 0, y: 0.5, z: 0 },
          isPlaying: false,
          volume: 1,
          isSelected: true
        };
        
        setSpatialAudioSources([initialSource]);
      } catch (error) {
        console.error("Error setting up initial audio:", error);
      }
    }
    
    // Cleanup
    return () => {
      // Dispose of all players
      playersToDispose.forEach((player, id) => {
        try {
          console.log(`Disposing player ${id}`);
          player.stop();
          player.disconnect();
          player.dispose();
        } catch (error) {
          console.error(`Error disposing player ${id}:`, error);
        }
      });
      
      // Dispose of all panners
      pannersToDispose.forEach((panner, id) => {
        try {
          console.log(`Disposing panner ${id}`);
          panner.disconnect();
          panner.dispose();
        } catch (error) {
          console.error(`Error disposing panner ${id}:`, error);
        }
      });
      
      // Dispose of effects
      if (reverbRef.current) {
        reverbRef.current.disconnect();
        reverbRef.current.dispose();
      }
      
      if (delayRef.current) {
        delayRef.current.disconnect();
        delayRef.current.dispose();
      }
      
      if (distortionRef.current) {
        distortionRef.current.disconnect();
        distortionRef.current.dispose();
      }
      
      if (filterRef.current) {
        filterRef.current.disconnect();
        filterRef.current.dispose();
      }
      
      if (analyzerRef.current) {
        analyzerRef.current.disconnect();
        analyzerRef.current.dispose();
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioData, filterFreq, playbackSpeed]);

  // Update effect chain when effects change
  useEffect(() => {
    if (!reverbRef.current || !delayRef.current || 
        !distortionRef.current || !filterRef.current || !analyzerRef.current) {
      return;
    }
    
    const reverb = reverbRef.current;
    const delay = delayRef.current;
    const distortion = distortionRef.current;
    const filter = filterRef.current;
    const analyzer = analyzerRef.current;
    
    // For each player, update the effect chain
    playerRefs.current.forEach((player) => {
      // Store player state before disconnecting
      const wasPlaying = player.state === "started";
      const currentTime = player.now();
      
      // Disconnect all
      player.disconnect();
      
      // Build chain based on active effects
      const chain: (Tone.ToneAudioNode)[] = [player];
      
      if (effects.reverb) chain.push(reverb);
      if (effects.delay) chain.push(delay);
      if (effects.distortion) chain.push(distortion);
      if (effects.filter) chain.push(filter);
      
      // Always end with analyzer and connect to destination
      chain.push(analyzer);
      
      // Connect chain
      for (let i = 0; i < chain.length - 1; i++) {
        chain[i].connect(chain[i + 1]);
      }
      
      // Connect last node to destination
      chain[chain.length - 1].toDestination();
      
      // Restore player state
      if (wasPlaying) {
        player.start();
        try {
          player.seek(currentTime);
        } catch (error) {
          console.warn("Could not restore exact playback position", error);
        }
      }
    });
  }, [effects]);
  
  // Initialize audio context when user clicks play button
  useEffect(() => {
    // Add click event listener to document to initialize audio context
    const handleUserInteraction = () => {
      if (Tone.context.state !== "running") {
        console.log("Resuming audio context on user interaction");
        Tone.context.resume();
      }
    };

    document.addEventListener("click", handleUserInteraction);
    document.addEventListener("touchstart", handleUserInteraction);

    return () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
    };
  }, []);
  
  // Update filter frequency
  useEffect(() => {
    if (filterRef.current) {
      filterRef.current.frequency.value = filterFreq;
    }
  }, [filterFreq]);
  
  // Setup visualization
  useEffect(() => {
    if (!canvasRef.current || !analyzerRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const analyzer = analyzerRef.current;
    
    // Track playback time
    const updateTime = () => {
      if (isPlaying) {
        // Get current time from first player
        const firstPlayer = playerRefs.current.values().next().value;
        if (firstPlayer) {
          setCurrentTime(firstPlayer.now());
        }
        requestAnimationFrame(updateTime);
      }
    };
    
    if (isPlaying) {
      updateTime();
    }
    
    // Resize canvas
    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    
    // Call resize initially
    resizeCanvas();
    
    // Add resize listener
    window.addEventListener('resize', resizeCanvas);
    
    // Draw function
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      
      // Get data from analyzer
      const data = analyzer.getValue() as Float32Array;
      
      // Clear canvas
      ctx.fillStyle = 'rgba(20, 20, 30, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw waveform
      ctx.strokeStyle = 'rgba(100, 120, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const sliceWidth = canvas.width / data.length;
      let x = 0;
      
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] as number) / 100;
        const y = (v * canvas.height / 2) + canvas.height / 2;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      ctx.stroke();
    };
    
    // Start drawing
    draw();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);
  
  // Handle adding a new audio file
  const handleAddAudio = useCallback(async (file: File) => {
    try {
      await addAudioFile(file);
      
      // After adding a file, recalculate the max duration for all audio files
      setTimeout(() => {
        let maxDuration = 0;
        playerRefs.current.forEach((player) => {
          if (player.buffer && player.buffer.duration > maxDuration) {
            maxDuration = player.buffer.duration;
          }
        });
        
        if (maxDuration > 0) {
          setTotalDuration(maxDuration);
        }
      }, 500); // Give a short delay for the audio to load
    } catch (error) {
      console.error("Error adding audio file:", error);
    }
  }, [addAudioFile]);
  
  // Track the maximum duration among all loaded audio files
  useEffect(() => {
    // Find the maximum duration among all players
    let maxDuration = 0;
    
    playerRefs.current.forEach((player) => {
      if (player.buffer && player.buffer.duration > maxDuration) {
        maxDuration = player.buffer.duration;
      }
    });
    
    if (maxDuration > 0) {
      setTotalDuration(maxDuration);
    }
  }, [library.items]);
  // Add initial audio if provided
  useEffect(() => {
    if (audioData && audioData.file) {
      handleAddAudio(audioData.file).catch(error => {
        console.error("Error adding initial audio file:", error);
      });
    }
  }, [audioData, handleAddAudio]);
  
  // Track the maximum duration among all loaded audio files and handle time updates
  const updateTimeTracking = useCallback(() => {
    if (!isPlaying) return;
    
    // Find the maximum duration among all players
    let maxDuration = 0;
    let currentTimeValue = 0;
    let longestDurationPlayerId = '';
    
    // First find the longest duration track
    playerRefs.current.forEach((player, id) => {
      try {
        // Only check players that are loaded
        if (player.buffer) {
          if (player.buffer.duration > maxDuration) {
            maxDuration = player.buffer.duration;
            longestDurationPlayerId = id;
          }
        }
      } catch (error: unknown) {
        // Ignore errors from players that might be in an invalid state
        console.debug("Error getting player state:", error);
      }
    });
    
    // Get current time from the player with the longest duration if playing
    if (isPlaying && longestDurationPlayerId) {
      try {
        const longestPlayer = playerRefs.current.get(longestDurationPlayerId);
        if (longestPlayer && longestPlayer.state === "started") {
          // Get the current time of the longest player
          currentTimeValue = longestPlayer.now() % maxDuration; // Handle looping
          
          // If we're near the end of the track, prepare for looping or stopping
          if (currentTimeValue > maxDuration - 0.1) {
            currentTimeValue = 0;
            
            // Handle what happens at the end - loop back to beginning
            console.log("End of track reached, looping back to beginning");
            
            // Optional: implement auto-stop at end by calling togglePlayback()
            // if you want playback to stop at the end instead of looping
          }
          
          // Ensure all other players are in sync with the longest one
          playerRefs.current.forEach((player, id) => {
            if (id !== longestDurationPlayerId && player.buffer && player.state === "started") {
              try {
                // Calculate normalized position
                const normalizedPosition = currentTimeValue / maxDuration;
                const expectedPlayerTime = normalizedPosition * player.buffer.duration;
                const actualPlayerTime = player.now() % player.buffer.duration;
                
                // If the difference is too large, re-sync this player
                if (Math.abs(actualPlayerTime - expectedPlayerTime) > 0.1) {
                  console.log(`Re-syncing player ${id}: expected=${expectedPlayerTime.toFixed(2)}s, actual=${actualPlayerTime.toFixed(2)}s`);
                  player.seek(expectedPlayerTime);
                }
              } catch (error) {
                // Ignore sync errors
                console.debug(`Error syncing player ${id}:`, error);
              }
            }
          });
        }
      } catch (error: unknown) {
        console.debug("Error getting player time:", error);
      }
    }
    
    // Update the state with the new values
    if (maxDuration > 0) {
      setTotalDuration(maxDuration);
      
      if (isPlaying) {
        setCurrentTime(currentTimeValue);
      }
    }
    
    // Continue the animation loop if playing
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateTimeTracking);
    }
  }, [isPlaying]);
  
  // Start or stop time tracking when play state changes
  useEffect(() => {
    if (isPlaying) {
      // Start the animation loop for time tracking
      updateTimeTracking();
    } else if (animationRef.current) {
      // Stop the animation loop
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, updateTimeTracking]);
  // Toggle play/pause for all audio sources
  const togglePlayback = useCallback(() => {
    const newIsPlaying = !isPlaying;
    
    if (newIsPlaying) {
      // First ensure Tone.js context is started
      Tone.context.resume().then(() => {
        console.log("Audio context resumed successfully");
        
        // Create a master analyzer if it doesn't exist
        if (!analyzerRef.current) {
          analyzerRef.current = new Tone.Analyser('fft', 512);
          analyzerRef.current.toDestination();
        }
        
        // Find the longest audio track to use as a reference
        let maxDuration = 0;
        let currentPlayTime = currentTime;
        
        // Make sure we don't exceed the longest track's duration
        playerRefs.current.forEach((player) => {
          if (player.buffer && player.buffer.duration > maxDuration) {
            maxDuration = player.buffer.duration;
          }
        });
        
        // Ensure current playback time is valid
        if (currentPlayTime > maxDuration) {
          currentPlayTime = 0;
        }
        
        // Start all players with proper spatial positioning and synchronized timing
        playerRefs.current.forEach((player, id) => {
          try {
            // Find the spatial data for this player
            const sourceData = spatialAudioSources.find(source => source.id === id);
            
            if (sourceData) {
              // Ensure the player is properly configured with a panner
              let panner = pannerRefs.current.get(id);
              
              // If we don't have a panner yet, create one
              if (!panner) {
                console.log(`Creating new panner for audio source ${id}`);
                panner = new Tone.Panner3D({
                  positionX: sourceData.position.x,
                  positionY: sourceData.position.y,
                  positionZ: sourceData.position.z,
                  refDistance: 1,
                  rolloffFactor: 1.5,
                  distanceModel: "exponential",
                  maxDistance: 10000,
                  panningModel: "HRTF"
                });
                
                // Store panner reference
                pannerRefs.current.set(id, panner);
              }
              
              // Disconnect everything to rebuild the audio chain
              player.disconnect();
              
              // Connect player to panner
              player.connect(panner);
              
              // Connect panner to analyzer and destination
              if (analyzerRef.current) {
                panner.connect(analyzerRef.current);
              } else {
                panner.toDestination();
              }
              
              // Calculate normalized seek position based on the longest track
              // This ensures all tracks stay in sync relative to their position in the overall timeline
              if (player.buffer) {
                const normalizedPosition = currentPlayTime / maxDuration;
                const playerStartTime = normalizedPosition * player.buffer.duration;
                
                // Start playback with synchronized timing
                if (player.state !== "started") {
                  console.log(`Starting playback for audio source ${id} at position ${playerStartTime}`);
                  player.start();
                  player.seek(playerStartTime);
                }
              } else {
                // If no buffer yet (still loading), just start the player
                if (player.state !== "started") {
                  player.start();
                }
              }
            }
          } catch (error) {
            console.error(`Error starting audio ${id}:`, error);
          }
        });
        
        // Update playing state
        setIsPlaying(true);
        
        // Update playing state in spatial audio sources
        setSpatialAudioSources(prev => 
          prev.map(source => ({ ...source, isPlaying: true }))
        );
      }).catch(error => {
        console.error("Could not resume audio context:", error);
      });
    } else {
      // Stop all players
      playerRefs.current.forEach((player) => {
        try {
          console.log(`Stopping playback for audio source ${player}`);
          player.stop();
        } catch (error) {
          console.error("Error stopping player:", error);
        }
      });
      
      setIsPlaying(false);
      
      // Update playing state in spatial audio sources
      setSpatialAudioSources(prev => 
        prev.map(source => ({ ...source, isPlaying: false }))
      );
    }
  }, [isPlaying, spatialAudioSources, currentTime]);
  
  // Toggle effects
  const toggleEffect = useCallback((effect: keyof typeof effects) => {
    setEffects(prev => ({
      ...prev,
      [effect]: !prev[effect]
    }));
  }, []);
  
  // Handle playback speed change
  const handlePlaybackSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    
    // Update all players
    playerRefs.current.forEach((player) => {
      player.playbackRate = speed;
    });
  }, []);
  
  // Handle placing audio in 3D space
  const handleAudioPlaced = useCallback((placement: AudioPlacement) => {
    setSpatialAudioSources(prevSources => {
      return prevSources.map(source => {
        if (source.id === placement.id) {
          // Update the position
          return {
            ...source,
            position: placement.position
          };
        }
        return source;
      });
    });

    // Update the panner position for this audio source
    const panner = pannerRefs.current.get(placement.id);
    if (panner) {
      panner.positionX.value = placement.position.x;
      panner.positionY.value = placement.position.y;
      panner.positionZ.value = placement.position.z;
    } else {
      // If no panner exists yet, create one
      const player = playerRefs.current.get(placement.id);
      if (player) {
        // Create a new panner with updated position
        const newPanner = new Tone.Panner3D({
          positionX: placement.position.x,
          positionY: placement.position.y,
          positionZ: placement.position.z,
          refDistance: 1,
          rolloffFactor: 1.5,
          distanceModel: "exponential",
          maxDistance: 10000,
          panningModel: "HRTF"
        });
        
        // Disconnect player from all outputs
        player.disconnect();
        
        // Connect to new panner
        player.connect(newPanner);
        
        // Connect to effects chain
        if (analyzerRef.current) {
          newPanner.connect(analyzerRef.current);
          analyzerRef.current.toDestination();
        } else {
          newPanner.toDestination();
        }
        
        // Store the panner reference
        pannerRefs.current.set(placement.id, newPanner);
      }
    }
  }, []);
  
  // Handle audio dropped from library to canvas
  const handleAudioDropped = useCallback((id: string, position: { x: number; y: number; z: number }) => {
    // Find the audio item in the library
    const audioItem = library.items.find(item => item.id === id);
    if (!audioItem || !audioItem.audioData) {
      console.error("Could not find audio item in library:", id);
      return;
    }
    
    console.log(`Adding audio source ${id} at position:`, position);
    
    // Check if the audio is already in the scene
    const existingSource = spatialAudioSources.find(source => source.id === id);
    if (existingSource) {
      console.log(`Audio source ${id} already exists, updating position`);
      // Update position of existing source
      handleAudioPlaced({
        id,
        position,
        isDragging: false
      });
      return;
    }
    
    // Create or get player for this audio
    let player = playerRefs.current.get(id);
    
    if (!player) {
      // Create new player with the audio URL
      try {
        console.log(`Creating new player for audio ${id}`);
        player = new Tone.Player({
          url: audioItem.audioData.url,
          loop: true,
          playbackRate: playbackSpeed,
          onload: () => {
            console.log(`Audio ${id} loaded for spatial positioning`);
            // Set total duration once loaded
            if (player && player.buffer) {
              // Update max duration if this file is longer
              const newDuration = player.buffer.duration;
              if (newDuration > totalDuration) {
                setTotalDuration(newDuration);
              }
            }
          }
        });
        
        // Create panner for spatial audio
        const panner = new Tone.Panner3D({
          positionX: position.x,
          positionY: position.y,
          positionZ: position.z,
          refDistance: 1,
          rolloffFactor: 1.5,
          distanceModel: "exponential",
          maxDistance: 10000,
          panningModel: "HRTF" // More realistic 3D audio
        });
        
        // Connect player to panner
        player.connect(panner);
        
        // Connect to analyzer if available
        if (analyzerRef.current) {
          panner.connect(analyzerRef.current);
        } else {
          // Connect directly to destination if no analyzer
          panner.toDestination();
        }
        
        // Store player and panner for later use
        playerRefs.current.set(id, player);
        pannerRefs.current.set(id, panner);
        
        // Start playing if currently playing
        if (isPlaying) {
          console.log(`Starting playback for new audio ${id}`);
          Tone.context.resume().then(() => {
            player?.start();
          }).catch(err => {
            console.error("Could not resume audio context:", err);
          });
        }
      } catch (error) {
        console.error(`Error creating player for audio ${id}:`, error);
        return;
      }
    }
    
    // Create a new spatial audio source
    const newSource: SpatialAudioData = {
      ...audioItem.audioData,
      id: audioItem.id,
      name: audioItem.name,
      color: audioItem.color || '#' + Math.floor(Math.random()*16777215).toString(16), // Random color if none
      position,
      isPlaying: isPlaying,
      volume: 1,
      isSelected: true
    };
    
    // Add to spatial sources
    setSpatialAudioSources(prev => [...prev, newSource]);
    
    // Select this audio
    selectAudioFile(id);
  }, [library.items, spatialAudioSources, isPlaying, selectAudioFile, handleAudioPlaced, playbackSpeed, totalDuration]);
  
  // Handle selecting an audio in the 3D scene
  const handleAudioSelected = useCallback((id: string) => {
    selectAudioFile(id);
    
    // Update isSelected flag in spatialAudioSources
    setSpatialAudioSources(prevSources => {
      return prevSources.map(source => ({
        ...source,
        isSelected: source.id === id
      }));
    });
  }, [selectAudioFile]);

  // Setup visualization
  useEffect(() => {
    if (!canvasRef.current || !analyzerRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const analyzer = analyzerRef.current;
    
    // Track playback time
    const updateTime = () => {
      if (isPlaying) {
        // Get current time from first player
        const firstPlayer = playerRefs.current.values().next().value;
        if (firstPlayer) {
          setCurrentTime(firstPlayer.now());
        }
        requestAnimationFrame(updateTime);
      }
    };
    
    if (isPlaying) {
      updateTime();
    }
    
    // Resize canvas
    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    
    // Call resize initially
    resizeCanvas();
    
    // Add resize listener
    window.addEventListener('resize', resizeCanvas);
    
    // Draw function
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      
      // Get data from analyzer
      const data = analyzer.getValue() as Float32Array;
      
      // Clear canvas
      ctx.fillStyle = 'rgba(20, 20, 30, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw waveform
      ctx.strokeStyle = 'rgba(100, 120, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const sliceWidth = canvas.width / data.length;
      let x = 0;
      
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] as number) / 100;
        const y = (v * canvas.height / 2) + canvas.height / 2;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      ctx.stroke();
    };
    
    // Start drawing
    draw();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);
  
  // Handle audio position change (from 2D view)
  const handleAudioPositionChange = useCallback((id: string, position: { x: number; y: number; z: number }) => {
    handleAudioPlaced({
      id,
      position,
      isDragging: false
    });
  }, [handleAudioPlaced]);

  // Handle seeking to a specific time
  const handleSeek = useCallback((time: number) => {
    // Store current playback state
    const wasPlaying = isPlaying;
    
    // If playing, temporarily pause to avoid timing issues during seek
    if (wasPlaying) {
      // Instead of stopping the players, we'll just prepare for repositioning
      // We'll restart them after seeking
      console.log("Pausing players for seek operation");
    }
    
    // Find the longest audio track
    let maxDuration = 0;
    
    playerRefs.current.forEach((player) => {
      if (player.buffer && player.buffer.duration > maxDuration) {
        maxDuration = player.buffer.duration;
      }
    });
    
    // Clamp time to valid range
    const clampedTime = Math.max(0, Math.min(time, maxDuration));
    
    // Calculate normalized position (0-1) of the seek point relative to max duration
    const normalizedPosition = clampedTime / maxDuration;
    console.log(`Seeking to normalized position: ${normalizedPosition} (${clampedTime}s / ${maxDuration}s)`);
    
    // Update all players with the new position
    playerRefs.current.forEach((player, id) => {
      try {
        if (player.buffer) {
          // Calculate the appropriate time for this specific player based on its duration
          const playerTime = normalizedPosition * player.buffer.duration;
          const seekTime = Math.min(playerTime, player.buffer.duration);
          
          console.log(`Setting player ${id} to position: ${seekTime}s / ${player.buffer.duration}s`);
          
          // If player was already started, we need to restart it at the new position
          const playerWasStarted = player.state === "started";
          
          if (playerWasStarted) {
            // For players that were playing, stop and restart at new position
            player.stop();
            player.start();
            player.seek(seekTime);
            
            // If we're not supposed to be playing, stop it again
            if (!wasPlaying) {
              setTimeout(() => player.stop(), 10);
            }
          } else {
            // For stopped players, just set the seek position
            player.seek(seekTime);
            
            // If we should be playing, start the player
            if (wasPlaying) {
              player.start();
            }
          }
        }
      } catch (error: unknown) {
        console.error(`Error seeking player ${id}:`, error);
      }
    });
    
    // Update current time display
    setCurrentTime(clampedTime);
    
    // Update time tracking
    if (wasPlaying) {
      // Restart animation frame loop for time tracking
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animationRef.current = requestAnimationFrame(updateTimeTracking);
    }
  }, [isPlaying, updateTimeTracking]);

  return (
    <div className="visualization-container flex flex-col h-screen w-full dark text-foreground">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar */}
        <EditorSidebar 
          activeTab={activeSidebarTab}
          onTabChange={setActiveSidebarTab}
          effects={effects}
          onToggleEffect={(effect) => toggleEffect(effect as keyof typeof effects)}
          filterFreq={filterFreq}
          onFilterFreqChange={setFilterFreq}
          audioLibraryItems={library.items}
          selectedAudioItemId={library.selectedItemId}
          onAddAudio={handleAddAudio}
          onRemoveAudio={removeAudioFile}
          onSelectAudio={selectAudioFile}
          maxAudioFiles={MAX_AUDIO_FILES}
        />
        
        {/* Main Editor Area */}
        <div className="flex-1 overflow-hidden bg-background/10 backdrop-blur-md flex flex-col relative ml-[60px]">
          {/* Main Canvas */}
          <div className="flex-1 relative">
            <div className="absolute inset-0">
              {visualizationType === 'spatial' ? (
                <SpatialAudioScene 
                  audioSources={spatialAudioSources}
                  onAudioPlaced={handleAudioPlaced}
                  onAudioSelected={handleAudioSelected}
                  onAudioDropped={handleAudioDropped}
                  analyzer={analyzerRef.current}
                  isPlaying={isPlaying}
                />
              ) : visualizationType === 'cinematic' ? (
                <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
                  <ambientLight intensity={0.5} />
                  <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                  <pointLight position={[-10, -10, -10]} intensity={1} />
                  <CinematicScene effects={effects} analyzer={analyzerRef.current} isPlaying={isPlaying} />
                  <OrbitControls enableZoom={true} enablePan={true} />
                </Canvas>
              ) : (
                <SpectralAudioVisualizer 
                  analyzer={analyzerRef.current} 
                  isPlaying={isPlaying} 
                  effects={effects} 
                />
              )}
            </div>
          </div>
        </div>
        
        {/* Right Sidebar */}
        <EditorRightSidebar 
          isOscillatorEnabled={isOscillatorEnabled}
          onOscillatorEnabledChange={setIsOscillatorEnabled}
          audioSources={spatialAudioSources}
          selectedAudioId={library.selectedItemId}
          onAudioPositionChange={handleAudioPositionChange}
        />
      </div>
      
      {/* Bottom Toolbar */}
      <EditorToolbar 
        visualizationType={visualizationType}
        onVisualizationTypeChange={(type) => setVisualizationType(type)}
        playbackSpeed={playbackSpeed}
        onPlaybackSpeedChange={handlePlaybackSpeedChange}
        currentTime={currentTime}
        totalDuration={totalDuration}
        isPlaying={isPlaying}
        onPlayPause={togglePlayback}
        onSeek={handleSeek}
      />
    </div>
  );
}
