import { useState } from 'react';
import { Button } from '../ui/button';

interface EditorSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  effects: {
    reverb: boolean;
    delay: boolean;
    distortion: boolean;
    filter: boolean;
  };
  onToggleEffect: (effect: string) => void;
  filterFreq: number;
  onFilterFreqChange: (value: number) => void;
  visualizationMode: 'mathematical' | 'cinematic';
  onVisualizationModeChange: (mode: 'mathematical' | 'cinematic') => void;
}

export function EditorSidebar({
  activeTab,
  onTabChange,
  effects,
  onToggleEffect,
  filterFreq,
  onFilterFreqChange,
  visualizationMode,
  onVisualizationModeChange
}: EditorSidebarProps) {
  const tabs = [
    { id: 'effects', label: 'Effects' },
    { id: 'visualization', label: 'Visualization' },
    { id: 'mixing', label: 'Mixing' },
    { id: 'export', label: 'Export' },
  ];

  return (
    <div className="bg-secondary/20 border-r border-border w-60 flex flex-col h-full">
      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-secondary/50'
              }`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'effects' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium mb-2">Audio Effects</h3>
            
            <div className="space-y-2">
              <Button 
                variant={effects.reverb ? 'default' : 'outline'} 
                onClick={() => onToggleEffect('reverb')}
                size="sm"
                className="w-full justify-start"
              >
                Reverb
              </Button>
              
              <Button 
                variant={effects.delay ? 'default' : 'outline'} 
                onClick={() => onToggleEffect('delay')}
                size="sm"
                className="w-full justify-start"
              >
                Delay
              </Button>
              
              <Button 
                variant={effects.distortion ? 'default' : 'outline'} 
                onClick={() => onToggleEffect('distortion')}
                size="sm"
                className="w-full justify-start"
              >
                Distortion
              </Button>
              
              <Button 
                variant={effects.filter ? 'default' : 'outline'} 
                onClick={() => onToggleEffect('filter')}
                size="sm"
                className="w-full justify-start"
              >
                Filter
              </Button>
            </div>
            
            {effects.filter && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium">Filter: {filterFreq}Hz</h4>
                <input
                  type="range"
                  min="20"
                  max="20000"
                  step="1"
                  value={filterFreq}
                  onChange={(e) => onFilterFreqChange(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'visualization' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium mb-2">Visualization Mode</h3>
            
            <div className="scene-mode-switch" data-state={visualizationMode}>
              <div 
                className="scene-mode-option" 
                data-active={visualizationMode === 'mathematical'} 
                onClick={() => onVisualizationModeChange('mathematical')}
              >
                Analytical
              </div>
              <div 
                className="scene-mode-option" 
                data-active={visualizationMode === 'cinematic'} 
                onClick={() => onVisualizationModeChange('cinematic')}
              >
                Cinematic
              </div>
            </div>
            
            <div className="pt-4 space-y-2">
              <h4 className="text-xs font-medium">Visualization Parameters</h4>
              
              <div className="space-y-1">
                <label className="text-xs">Intensity</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs">Detail</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs">Speed</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mixing' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium mb-2">Audio Mixing</h3>
            
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-xs">Master Volume</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs">Low EQ</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs">Mid EQ</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs">High EQ</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium mb-2">Export Options</h3>
            
            <div className="space-y-2">
              <select className="w-full p-2 bg-background border border-border rounded-md">
                <option>MP3</option>
                <option>WAV</option>
                <option>FLAC</option>
                <option>OGG</option>
              </select>
              
              <div className="space-y-1">
                <label className="text-xs">Quality</label>
                <select className="w-full p-2 bg-background border border-border rounded-md">
                  <option>High (320kbps)</option>
                  <option>Medium (192kbps)</option>
                  <option>Low (128kbps)</option>
                </select>
              </div>
              
              <Button className="w-full mt-4">
                Export
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
