import { OscillatorViewer } from './oscillator-viewer';
import { BlobPositionControl } from './blob-position-control';
import { type SpatialAudioData } from '../../types/spatial-audio';

interface EditorRightSidebarProps {
  isOscillatorEnabled: boolean;
  onOscillatorEnabledChange: (enabled: boolean) => void;
  audioSources: SpatialAudioData[];
  selectedAudioId: string | null;
  onAudioPositionChange: (id: string, position: { x: number; y: number; z: number }) => void;
}

export function EditorRightSidebar({
  isOscillatorEnabled,
  onOscillatorEnabledChange,
  audioSources,
  selectedAudioId,
  onAudioPositionChange
}: EditorRightSidebarProps) {
  // Determine if we have any audio sources placed in the scene
  const hasAudioSources = audioSources.length > 0;

  return (
    <div className="bg-secondary/20 border-l border-border w-72 flex flex-col h-full">
      <div className="border-b border-border px-4 py-2">
        <h3 className="text-sm font-medium">Audio Controls</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Show blob position control if there are audio sources */}
        {hasAudioSources && (
          <BlobPositionControl 
            audioSources={audioSources}
            selectedSourceId={selectedAudioId}
            onPositionChange={onAudioPositionChange}
          />
        )}
        
        <div className="pt-1">
          <OscillatorViewer 
            isEnabled={isOscillatorEnabled} 
            onEnabledChange={onOscillatorEnabledChange} 
          />
        </div>
      </div>
    </div>
  );
}
