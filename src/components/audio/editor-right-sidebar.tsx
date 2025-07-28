import { OscillatorViewer } from './oscillator-viewer';
import { Button } from '../ui/button';

interface EditorRightSidebarProps {
  isOscillatorEnabled: boolean;
  onOscillatorEnabledChange: (enabled: boolean) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
}

export function EditorRightSidebar({
  isOscillatorEnabled,
  onOscillatorEnabledChange,
  isPlaying,
  onPlayPause
}: EditorRightSidebarProps) {
  return (
    <div className="bg-secondary/20 border-l border-border w-72 flex flex-col h-full">
      <div className="border-b border-border px-4 py-2">
        <h3 className="text-sm font-medium">Audio Controls</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center space-x-2">
          <Button 
            className="flex-1"
            onClick={onPlayPause}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          
          <Button 
            variant="outline"
            size="icon"
            className="w-10 h-10"
            onClick={() => {}}
          >
            <StopIcon className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline"
            size="icon"
            className="w-10 h-10"
            onClick={() => {}}
          >
            <LoopIcon className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="pt-4">
          <h4 className="text-sm font-medium mb-2">Oscillator</h4>
          <OscillatorViewer 
            isEnabled={isOscillatorEnabled} 
            onEnabledChange={onOscillatorEnabledChange} 
          />
        </div>
      </div>
    </div>
  );
}

// Simple icon components
function StopIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
  );
}

function LoopIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11v-1a4 4 0 014-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v1a4 4 0 01-4 4H3" />
    </svg>
  );
}
