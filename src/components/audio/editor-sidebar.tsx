import { useState } from 'react';
import { Button } from '../ui/button';
import { AudioLibraryTab } from './audio-library-tab';
import { type AudioLibraryItem } from '../../types/spatial-audio';
import '../audio/editor-styles.css';

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
  audioLibraryItems: AudioLibraryItem[];
  selectedAudioItemId: string | null;
  onAddAudio: (file: File) => Promise<void>;
  onRemoveAudio: (id: string) => void;
  onSelectAudio: (id: string) => void;
  maxAudioFiles: number;
}

export function EditorSidebar({
  activeTab,
  onTabChange,
  effects,
  onToggleEffect,
  filterFreq,
  onFilterFreqChange,
  audioLibraryItems,
  selectedAudioItemId,
  onAddAudio,
  onRemoveAudio,
  onSelectAudio,
  maxAudioFiles
}: EditorSidebarProps) {
  const [expanded, setExpanded] = useState(false);

  const tabs = [
    { id: 'library', label: 'Library', icon: '🎵' },
    { id: 'effects', label: 'Effects', icon: '🎛️' },
    { id: 'mixing', label: 'Mixing', icon: '🔊' },
    { id: 'export', label: 'Export', icon: '💾' },
  ];

  return (
    <div className={`editor-sidebar ${expanded ? 'expanded' : ''}`} 
         onMouseEnter={() => setExpanded(true)}
         onMouseLeave={() => setExpanded(false)}>
      {/* Sidebar Nav */}
      <div className="sidebar-nav">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`sidebar-nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="item-icon">{tab.icon}</span>
            <span className="item-label">{tab.label}</span>
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div className="sidebar-content">
        {activeTab === 'library' && (
          <AudioLibraryTab
            audioItems={audioLibraryItems}
            selectedItemId={selectedAudioItemId}
            onAddAudio={onAddAudio}
            onRemoveAudio={onRemoveAudio}
            onSelectAudio={onSelectAudio}
            maxFiles={maxAudioFiles}
          />
        )}
        
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
