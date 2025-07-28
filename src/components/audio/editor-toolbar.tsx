import { Button } from '../ui/button';

interface EditorToolbarProps {
  visualizationMode: 'frequency' | 'waveform';
  onVisualizationModeChange: (mode: 'frequency' | 'waveform') => void;
}

export function EditorToolbar({ 
  visualizationMode, 
  onVisualizationModeChange 
}: EditorToolbarProps) {
  return (
    <div className="bg-secondary/30 border-t border-border h-12 flex items-center px-4">
      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">View:</span>
          <Button 
            variant={visualizationMode === 'frequency' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => onVisualizationModeChange('frequency')}
            className="h-7 px-2 text-xs"
          >
            Frequency
          </Button>
          <Button 
            variant={visualizationMode === 'waveform' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => onVisualizationModeChange('waveform')}
            className="h-7 px-2 text-xs"
          >
            Waveform
          </Button>
        </div>
        
        <div className="h-6 w-px bg-border"></div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">Playback Speed:</span>
          <select className="h-7 px-2 text-xs bg-background border border-border rounded-md">
            <option>0.5x</option>
            <option selected>1.0x</option>
            <option>1.5x</option>
            <option>2.0x</option>
          </select>
        </div>
        
        <div className="h-6 w-px bg-border"></div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">Time:</span>
          <span className="text-xs font-mono">00:00:00</span>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="text-xs font-mono">00:00:00</span>
        </div>
      </div>
    </div>
  );
}
