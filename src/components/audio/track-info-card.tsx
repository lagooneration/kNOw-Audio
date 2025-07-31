import { type AudioData } from '../../types/audio';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface TrackInfoCardProps {
  audioData: AudioData;
  trackTitle?: string;
  onChangeTrack: () => void;
}

export function TrackInfoCard({ audioData, trackTitle, onChangeTrack }: TrackInfoCardProps) {
  return (
    <Card className="bg-secondary/20 dark:bg-slate-800/40 backdrop-blur-sm border dark:border-slate-700/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex justify-between items-center text-white/90">
          <span>{trackTitle && `${trackTitle}: `}{audioData.metadata.name}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onChangeTrack}
            className="text-xs h-7 text-white/80 hover:text-white"
          >
            Change
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="flex flex-col p-3 bg-secondary/20 dark:bg-slate-700/30 backdrop-blur-sm rounded-md border dark:border-slate-600/30">
            <span className="text-xs text-white/60">Duration</span>
            <span className="text-sm font-medium text-white/90">{audioData.metadata.duration.toFixed(2)}s</span>
          </div>
          
          <div className="flex flex-col p-3 bg-secondary/20 dark:bg-slate-700/30 backdrop-blur-sm rounded-md border dark:border-slate-600/30">
            <span className="text-xs text-white/60">Sample Rate</span>
            <span className="text-sm font-medium text-white/90">{audioData.metadata.sampleRate}Hz</span>
          </div>
          
          <div className="flex flex-col p-3 bg-secondary/20 dark:bg-slate-700/30 backdrop-blur-sm rounded-md border dark:border-slate-600/30">
            <span className="text-xs text-white/60">Channels</span>
            <span className="text-sm font-medium text-white/90">{audioData.metadata.numberOfChannels}</span>
          </div>
          
          <div className="flex flex-col p-3 bg-secondary/20 dark:bg-slate-700/30 backdrop-blur-sm rounded-md border dark:border-slate-600/30">
            <span className="text-xs text-white/60">Format</span>
            <span className="text-sm font-medium text-white/90">{audioData.metadata.type}</span>
          </div>
        </div>
        <audio 
          src={audioData.url} 
          controls 
          className="w-full h-8" 
        />
      </CardContent>
    </Card>
  );
}
