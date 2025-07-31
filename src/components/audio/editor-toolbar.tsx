import '../audio/editor-styles.css';
import '../audio/play-button.css';
import Play from '../ui/play';

// Format time in seconds to mm:ss format
const formatTime = (timeInSeconds: number): string => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

interface EditorToolbarProps {
  visualizationType: 'mathematical' | 'cinematic' | 'spatial';
  onVisualizationTypeChange: (type: 'mathematical' | 'cinematic' | 'spatial') => void;
  playbackSpeed?: number;
  onPlaybackSpeedChange?: (speed: number) => void;
  currentTime?: number;
  totalDuration?: number;
  isPlaying?: boolean;
  onPlayPause?: () => void;
}

export function EditorToolbar({ 
  visualizationType,
  onVisualizationTypeChange,
  playbackSpeed = 1,
  onPlaybackSpeedChange = () => {},
  currentTime = 0,
  totalDuration = 0,
  isPlaying = false,
  onPlayPause = () => {}
}: EditorToolbarProps) {
  return (
    <div className="bg-background/60 backdrop-blur-md border-t border-border h-14 flex items-center px-4 justify-between">
      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">Playback Speed:</span>
          <select 
            className="h-7 px-2 text-xs bg-background/80 border border-border rounded-md"
            value={playbackSpeed}
            onChange={(e) => onPlaybackSpeedChange(parseFloat(e.target.value))}
          >
            <option value="0.5">0.5x</option>
            <option value="1">1.0x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2.0x</option>
          </select>
        </div>
        
        <div className="h-6 w-px bg-border"></div>
         
        {/* Play/Pause Button */}
        <div className="flex items-center justify-center w-12 mx-2 editor-play-button">
          <Play 
            isPlaying={isPlaying} 
            onClick={onPlayPause}
            size={36}
          />
        </div>
        
        <div className="h-6 w-px bg-border"></div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">Time:</span>
          <span className="text-xs font-mono">{formatTime(currentTime)}</span>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="text-xs font-mono">{formatTime(totalDuration)}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
       
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">Visualization:</span>
          <div className="scene-type-options">
            <div 
              className={`scene-type-option ${visualizationType === 'mathematical' ? 'active' : ''}`}
              onClick={() => onVisualizationTypeChange('mathematical')}
            >
              Analytical
            </div>
            <div 
              className={`scene-type-option ${visualizationType === 'spatial' ? 'active' : ''}`}
              onClick={() => onVisualizationTypeChange('spatial')}
            >
              Spatial
            </div>
            <div 
              className={`scene-type-option ${visualizationType === 'cinematic' ? 'active' : ''}`}
              onClick={() => onVisualizationTypeChange('cinematic')}
            >
              Cinematic
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
