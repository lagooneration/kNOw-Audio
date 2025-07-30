import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { type AudioData } from '../../types/audio';
import { type FrequencyOverlap, type EQSuggestion } from '../../utils/audio-mixing';
import { InterferenceVisualizer } from './interference-visualizer';

interface BeforeAfterEQVisualizationProps {
  track1: AudioData;
  track2: AudioData;
  overlaps: FrequencyOverlap[];
  suggestions: EQSuggestion[];
  height?: number;
  width?: number;
}

export function BeforeAfterEQVisualization({
  track1,
  track2,
  overlaps,
  suggestions,
  height = 300,
  width = 800
}: BeforeAfterEQVisualizationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Frequency Response Visualization</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="before" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="before">Before EQ</TabsTrigger>
            <TabsTrigger value="after">After EQ</TabsTrigger>
          </TabsList>
          
          <TabsContent value="before" className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              This visualization shows how both tracks' frequencies interact before EQ processing. 
              Highlighted regions indicate where interference occurs.
            </p>
            
            <InterferenceVisualizer
              track1={track1}
              track2={track2}
              overlaps={overlaps}
              suggestions={suggestions}
              height={height}
              width={width}
              showAfterEQ={false}
            />
            
            <div className="p-3 bg-orange-500/10 dark:bg-orange-900/30 backdrop-blur-sm rounded-md border dark:border-orange-900/30 mt-4">
              <h3 className="text-sm font-medium text-orange-300 mb-2">Understanding Frequency Interactions</h3>
              <p className="text-xs text-orange-100/80">
                When sound waves with similar frequencies interact, they can either reinforce each other 
                (constructive interference) or cancel each other out (destructive interference).
              </p>
              <ul className="list-disc list-inside text-xs text-orange-100/70 mt-2">
                <li>Red regions show destructive interference that can cause masking or muddiness</li>
                <li>Orange regions show constructive interference that can enhance the sound</li>
                <li>The graphs show the frequency spectrum (horizontal) and amplitude (vertical)</li>
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="after" className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              This visualization shows how the tracks would sound after applying the recommended EQ adjustments. 
              Notice how frequency conflicts are reduced to create a clearer mix.
            </p>
            
            <InterferenceVisualizer
              track1={track1}
              track2={track2}
              overlaps={overlaps}
              suggestions={suggestions}
              height={height}
              width={width}
              showAfterEQ={true}
            />
            
            <div className="p-3 bg-emerald-500/10 dark:bg-emerald-900/30 backdrop-blur-sm rounded-md border dark:border-emerald-900/30 mt-4">
              <h3 className="text-sm font-medium text-emerald-300 mb-2">The Power of EQ</h3>
              <p className="text-xs text-emerald-100/80">
                Proper EQ adjustments create space in your mix by cutting competing frequencies, 
                allowing each track to occupy its own frequency range.
              </p>
              <ul className="list-disc list-inside text-xs text-emerald-100/70 mt-2">
                <li>Lighter blue and green lines show how each track sounds after EQ</li>
                <li>Notice how frequency conflicts are reduced in the problem areas</li>
                <li>The white line shows how the combined tracks would sound after EQ</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
