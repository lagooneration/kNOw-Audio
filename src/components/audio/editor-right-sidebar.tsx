import { OscillatorViewer } from './oscillator-viewer';

interface EditorRightSidebarProps {
  isOscillatorEnabled: boolean;
  onOscillatorEnabledChange: (enabled: boolean) => void;
}

export function EditorRightSidebar({
  isOscillatorEnabled,
  onOscillatorEnabledChange
}: EditorRightSidebarProps) {
  return (
    <div className="bg-secondary/20 border-l border-border w-72 flex flex-col h-full">
      <div className="border-b border-border px-4 py-2">
        <h3 className="text-sm font-medium">Audio Controls</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
