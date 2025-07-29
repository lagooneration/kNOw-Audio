import { Button } from '../ui/button';

// Format time in seconds to mm:ss format
const formatTime = (timeInSeconds: number): string => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

interface EditorToolbarProps {
  visualizationMode: 'frequency' | 'waveform';
  onVisualizationModeChange: (mode: 'frequency' | 'waveform') => void;
  playbackSpeed?: number;
  onPlaybackSpeedChange?: (speed: number) => void;
  currentTime?: number;
  totalDuration?: number;
}

export function EditorToolbar({ 
  visualizationMode, 
  onVisualizationModeChange,
  playbackSpeed = 1,
  onPlaybackSpeedChange = () => {},
  currentTime = 0,
  totalDuration = 0
}: EditorToolbarProps) {
  return (
    <div className="bg-secondary/30 border-t border-border h-14 flex items-center px-4 justify-between">
      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">Playback Speed:</span>
          <select 
            className="h-7 px-2 text-xs bg-background border border-border rounded-md"
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
          <Button 
            variant={visualizationMode === 'frequency' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => onVisualizationModeChange('frequency')}
            className="h-7 px-3 text-xs"
          >
            Frequency
          </Button>
          <Button 
            variant={visualizationMode === 'waveform' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => onVisualizationModeChange('waveform')}
            className="h-7 px-3 text-xs"
          >
            Waveform
          </Button>
        </div>
      </div>
    </div>
  );
}
