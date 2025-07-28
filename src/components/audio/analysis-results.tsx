import { type AudioData } from '../../types/audio';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface AnalysisResultsProps {
  audioData: AudioData;
}

export function AnalysisResults({ audioData }: AnalysisResultsProps) {
  const { analysis } = audioData;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Content Detection</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col p-4 bg-secondary rounded-md">
                <span className="text-sm text-muted-foreground">Speech</span>
                <span className="text-xl font-bold">{analysis.hasSpeech ? 'Detected' : 'Not Detected'}</span>
                {analysis.hasSpeech && (
                  <span className="text-sm text-muted-foreground mt-1">
                    {analysis.speechSegments.length} segments
                  </span>
                )}
              </div>
              
              <div className="flex flex-col p-4 bg-secondary rounded-md">
                <span className="text-sm text-muted-foreground">Music</span>
                <span className="text-xl font-bold">{analysis.hasMusicElements ? 'Detected' : 'Not Detected'}</span>
                {analysis.hasMusicElements && (
                  <span className="text-sm text-muted-foreground mt-1">
                    {analysis.musicSegments.length} segments
                  </span>
                )}
              </div>
              
              <div className="flex flex-col p-4 bg-secondary rounded-md">
                <span className="text-sm text-muted-foreground">Environmental</span>
                <span className="text-xl font-bold">{analysis.hasEnvironmentalSounds ? 'Detected' : 'Not Detected'}</span>
                {analysis.hasEnvironmentalSounds && (
                  <span className="text-sm text-muted-foreground mt-1">
                    {analysis.environmentalSoundSegments.length} segments
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Frequency Distribution</h3>
            <div className="space-y-2">
              {analysis.dominantFrequencyRanges
                .sort((a, b) => b.intensity - a.intensity)
                .map((range, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span>{range.label} ({range.min}-{range.max}Hz)</span>
                      <span>{Math.round(range.intensity * 100)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2.5">
                      <div 
                        className="bg-primary h-2.5 rounded-full" 
                        style={{ width: `${Math.round(range.intensity * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Summary</h3>
            <div className="p-4 bg-secondary rounded-md">
              <pre className="whitespace-pre-wrap text-sm">{analysis.summary}</pre>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
