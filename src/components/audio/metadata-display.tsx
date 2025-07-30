import { type AudioData } from '../../types/audio';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { MiniWaveform } from './mini-waveform';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { StaticSpectralViewer } from '../visualization/static-spectral-viewer';

interface AudioMetadataDisplayProps {
  audioData: AudioData;
}

export function AudioMetadataDisplay({ audioData }: AudioMetadataDisplayProps) {
  const { metadata } = audioData;
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const handleOpenEditor = () => {
    navigate('/editor');
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audio Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column - Audio Information */}
          <div className="group relative flex w-full flex-col rounded-xl bg-slate-950 p-4 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/20">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm transition-opacity duration-300 group-hover:opacity-30" />
            <div className="absolute inset-px rounded-[11px] bg-slate-950" />
            <div className="relative">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-none">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M11.25 16.9999C11.25 16.5857 10.9142 16.2499 10.5 16.2499C10.0858 16.2499 9.75 16.5857 9.75 16.9999C9.75 17.4142 10.0858 17.7499 10.5 17.7499C10.9142 17.7499 11.25 17.4142 11.25 16.9999Z" fill="#4364d0ff"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M8.67239 7.54199H15.3276C18.7024 7.54199 20.3898 7.54199 21.3377 8.52882C22.2855 9.51564 22.0625 11.0403 21.6165 14.0895L21.1935 16.9811C20.8437 19.3723 20.6689 20.5679 19.7717 21.2839C18.8745 21.9999 17.5512 21.9999 14.9046 21.9999H9.09534C6.4488 21.9999 5.12553 21.9999 4.22834 21.2839C3.33115 20.5679 3.15626 19.3723 2.80648 16.9811L2.38351 14.0895C1.93748 11.0403 1.71447 9.51565 2.66232 8.52882C3.61017 7.54199 5.29758 7.54199 8.67239 7.54199ZM12.75 10.4999C12.75 10.0857 12.4142 9.74995 12 9.74995C11.5858 9.74995 11.25 10.0857 11.25 10.4999V14.878C11.0154 14.7951 10.763 14.7499 10.5 14.7499C9.25736 14.7499 8.25 15.7573 8.25 16.9999C8.25 18.2426 9.25736 19.2499 10.5 19.2499C11.7426 19.2499 12.75 18.2426 12.75 16.9999V13.3197C13.4202 13.8633 14.2617 14.2499 15 14.2499C15.4142 14.2499 15.75 13.9142 15.75 13.4999C15.75 13.0857 15.4142 12.7499 15 12.7499C14.6946 12.7499 14.1145 12.5313 13.5835 12.0602C13.0654 11.6006 12.75 11.0386 12.75 10.4999Z" fill="#4364d0ff"></path> <path opacity="0.4" d="M8.50956 2.00001H15.4897C15.7221 1.99995 15.9004 1.99991 16.0562 2.01515C17.164 2.12352 18.0708 2.78958 18.4553 3.68678H5.54395C5.92846 2.78958 6.83521 2.12352 7.94303 2.01515C8.09884 1.99991 8.27708 1.99995 8.50956 2.00001Z" fill="#39509d"></path> <path opacity="0.7" d="M6.3102 4.72266C4.91958 4.72266 3.77931 5.56241 3.39878 6.67645C3.39085 6.69967 3.38325 6.72302 3.37598 6.74647C3.77413 6.6259 4.18849 6.54713 4.60796 6.49336C5.68833 6.35485 7.05367 6.35492 8.6397 6.35501H15.5318C17.1178 6.35492 18.4832 6.35485 19.5635 6.49336C19.983 6.54713 20.3974 6.6259 20.7955 6.74647C20.7883 6.72302 20.7806 6.69967 20.7727 6.67645C20.3922 5.56241 19.2519 4.72266 17.8613 4.72266H6.3102Z" fill="#39509d"></path> </g></svg>
                  </div>
                  <h3 className="text-sm font-semibold text-white">{metadata.name}</h3>
                  <button 
                  className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-2 text-xs font-medium text-white transition-all duration-300 hover:from-indigo-600 hover:to-purple-600"
                  onClick={handleOpenEditor}
                >
                  Explore 
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                </div>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-slate-900/50 p-3">
                  <p className="text-xs font-medium text-slate-400">{metadata.type}</p>
                  <p className="text-lg font-semibold text-white">{formatFileSize(metadata.size)}</p>
                  <span className="text-xs font-medium text-emerald-500">{formatDuration(metadata.duration)}s</span>
                </div>
                <div className="rounded-lg bg-slate-900/50 p-3">
                  <p className="text-xs font-medium text-slate-400">Sample rate</p>
                  <p className="text-lg font-semibold text-white">{metadata.sampleRate} Hz</p>
                  <span className="text-xs font-medium text-emerald-500">{metadata.numberOfChannels} {metadata.numberOfChannels === 1 ? 'channel' : 'channels'}</span>
                </div>
              </div>
              
              {/* Display mini waveform */}
              <div className="mb-4 h-24 w-full overflow-hidden rounded-lg bg-slate-900/50 p-3 flex items-center justify-center">
                <MiniWaveform 
                  audioData={audioData} 
                  height={70} 
                  width={420}
                  waveColor="rgba(99, 102, 241, 0.8)"
                  progressColor="rgba(129, 140, 248, 1)"
                  backgroundColor="transparent"
                />
              </div>
              
              {/* Audio playback controls */}
              <div className="mb-4 rounded-lg bg-slate-900/50 p-3">
                <audio 
                  ref={audioRef}
                  src={audioData.url} 
                  controls 
                  className="w-full" 
                ></audio>
              </div>
            </div>
          </div>

          {/* Right column - Spectral Information */}
          <div className="group relative flex w-full flex-col rounded-xl bg-slate-950 p-4 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/20">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm transition-opacity duration-300 group-hover:opacity-30" />
            <div className="absolute inset-px rounded-[11px] bg-slate-950" />
            <div className="relative">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-white">Spectral Information</h3>
              </div>
              
              {/* Spectral Visualization */}
              <div className="h-64 w-full">
                <StaticSpectralViewer 
                  audioData={audioData}
                  backgroundColor="#111827"
                  className="rounded-lg"
                  height="100%"
                  width="100%"
                />
              </div>
              
              <div className="mt-6 text-center text-xs text-slate-400">
                <p>3D spectral visualization shows the frequency distribution and harmonic content of your audio</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
