import { type AudioData } from '../../types/audio';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface AudioMetadataDisplayProps {
  audioData: AudioData;
}

export function AudioMetadataDisplay({ audioData }: AudioMetadataDisplayProps) {
  const { metadata } = audioData;
  
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
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audio Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">File Name</h3>
            <p className="text-lg font-medium">{metadata.name}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">File Size</h3>
            <p className="text-lg font-medium">{formatFileSize(metadata.size)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">File Type</h3>
            <p className="text-lg font-medium">{metadata.type}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Duration</h3>
            <p className="text-lg font-medium">{formatDuration(metadata.duration)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Sample Rate</h3>
            <p className="text-lg font-medium">{metadata.sampleRate} Hz</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Channels</h3>
            <p className="text-lg font-medium">{metadata.numberOfChannels} {metadata.numberOfChannels === 1 ? 'channel' : 'channels'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
