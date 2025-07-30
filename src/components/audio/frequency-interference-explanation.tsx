import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { FrequencyOverlap } from '../../utils/audio-mixing';

interface FrequencyInterferenceExplanationProps {
  overlaps: FrequencyOverlap[];
}

export function FrequencyInterferenceExplanation({ overlaps }: FrequencyInterferenceExplanationProps) {
  // Count constructive vs destructive overlaps
  const constructiveCount = overlaps.filter(o => o.isConstructive).length;
  const destructiveCount = overlaps.length - constructiveCount;
  
  // Get key frequency ranges where interference occurs
  const keyRanges = getKeyFrequencyRanges(overlaps);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Understanding Audio Interference</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            When two audio tracks play together, their sound waves interact with each other, creating 
            either constructive or destructive interference. This affects how the mix sounds.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-blue-500/10 dark:bg-blue-900/30 backdrop-blur-sm rounded-md border dark:border-blue-900/30">
              <h3 className="text-sm font-medium text-blue-300 mb-2">Constructive Interference</h3>
              <div className="flex gap-2 mb-2">
                <div className="w-12 h-12 flex-shrink-0 bg-blue-900/50 rounded-md flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 12H4C5.5 12 6 11 7.5 11C9 11 9.5 12 11 12C12.5 12 13 11 14.5 11C16 11 16.5 12 18 12C19.5 12 20 11 22 11" stroke="#94c4ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-blue-100/80">
                    Waves add together, making sounds louder. Found {constructiveCount} instances in your tracks.
                  </p>
                </div>
              </div>
              <p className="text-xs text-blue-100/60">
                These can create pleasing harmony when the frequencies complement each other.
              </p>
            </div>
            
            <div className="p-3 bg-red-500/10 dark:bg-red-900/30 backdrop-blur-sm rounded-md border dark:border-red-900/30">
              <h3 className="text-sm font-medium text-red-300 mb-2">Destructive Interference</h3>
              <div className="flex gap-2 mb-2">
                <div className="w-12 h-12 flex-shrink-0 bg-red-900/50 rounded-md flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 12H4C5.5 12 6 13 7.5 13C9 13 9.5 12 11 12C12.5 12 13 13 14.5 13C16 13 16.5 12 18 12C19.5 12 20 13 22 13" stroke="#ff9494" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-red-100/80">
                    Waves cancel each other out, causing masking or muddiness. Found {destructiveCount} instances.
                  </p>
                </div>
              </div>
              <p className="text-xs text-red-100/60">
                These are the areas where EQ adjustments can significantly improve your mix.
              </p>
            </div>
          </div>
          
          <h3 className="text-sm font-semibold mt-4 mb-2">Key Frequency Regions in Your Mix</h3>
          
          <div className="space-y-3">
            {keyRanges.map((range, index) => (
              <div key={index} className="text-xs bg-gray-800/50 p-2 rounded-md border border-gray-700/50">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{range.label} Range</span>
                  <span className="text-muted-foreground">
                    {range.low}Hz - {range.high}Hz
                  </span>
                </div>
                <p className="text-muted-foreground">{range.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-3 bg-indigo-500/10 dark:bg-indigo-900/30 backdrop-blur-sm rounded-md border dark:border-indigo-900/30">
            <h3 className="text-sm font-medium text-indigo-300 mb-2">Pro Mixing Tip</h3>
            <p className="text-xs text-indigo-100/80">
              Instead of boosting frequencies, try cutting competing frequencies in one track to make room for another. 
              This creates cleaner separation without increasing overall volume.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface FrequencyRange {
  low: number;
  high: number;
  label: string;
  description: string;
}

function getKeyFrequencyRanges(overlaps: FrequencyOverlap[]): FrequencyRange[] {
  // If no overlaps, return empty array
  if (overlaps.length === 0) {
    return [];
  }
  
  // Group overlaps into frequency ranges
  const ranges: FrequencyRange[] = [];
  
  // Check for sub-bass overlaps (20-60Hz)
  const subBassOverlaps = overlaps.filter(o => o.frequency >= 20 && o.frequency <= 60);
  if (subBassOverlaps.length > 0) {
    const isMainlyDestructive = subBassOverlaps.filter(o => !o.isConstructive).length > subBassOverlaps.length / 2;
    ranges.push({
      low: 20,
      high: 60,
      label: "Sub-Bass",
      description: isMainlyDestructive 
        ? "Destructive interference in this range can cause phase cancellation and weak bass. Consider high-pass filtering one track."
        : "Constructive interference here can reinforce the foundation of your mix, giving it weight and power."
    });
  }
  
  // Check for bass overlaps (60-250Hz)
  const bassOverlaps = overlaps.filter(o => o.frequency > 60 && o.frequency <= 250);
  if (bassOverlaps.length > 0) {
    const isMainlyDestructive = bassOverlaps.filter(o => !o.isConstructive).length > bassOverlaps.length / 2;
    ranges.push({
      low: 60,
      high: 250,
      label: "Bass",
      description: isMainlyDestructive 
        ? "Destructive interference here creates muddy, undefined bass. Consider cutting some frequencies from one track."
        : "Constructive interference in this range adds warmth and fullness to your mix."
    });
  }
  
  // Check for low-mid overlaps (250-500Hz)
  const lowMidOverlaps = overlaps.filter(o => o.frequency > 250 && o.frequency <= 500);
  if (lowMidOverlaps.length > 0) {
    const isMainlyDestructive = lowMidOverlaps.filter(o => !o.isConstructive).length > lowMidOverlaps.length / 2;
    ranges.push({
      low: 250,
      high: 500,
      label: "Low-Mid",
      description: isMainlyDestructive 
        ? "Destructive interference in low-mids often creates a boxy, confined sound. Consider using a bell EQ to create space."
        : "Constructive interference here adds body and thickness to your instruments."
    });
  }
  
  // Check for mid overlaps (500-2000Hz)
  const midOverlaps = overlaps.filter(o => o.frequency > 500 && o.frequency <= 2000);
  if (midOverlaps.length > 0) {
    const isMainlyDestructive = midOverlaps.filter(o => !o.isConstructive).length > midOverlaps.length / 2;
    ranges.push({
      low: 500,
      high: 2000,
      label: "Mid",
      description: isMainlyDestructive 
        ? "Destructive interference in mids can make tracks fight for attention. Consider carving out space with complementary EQ."
        : "Constructive interference in this range enhances presence and clarity in your mix."
    });
  }
  
  // Check for high-mid overlaps (2000-5000Hz)
  const highMidOverlaps = overlaps.filter(o => o.frequency > 2000 && o.frequency <= 5000);
  if (highMidOverlaps.length > 0) {
    const isMainlyDestructive = highMidOverlaps.filter(o => !o.isConstructive).length > highMidOverlaps.length / 2;
    ranges.push({
      low: 2000,
      high: 5000,
      label: "High-Mid",
      description: isMainlyDestructive 
        ? "Destructive interference here can cause harshness or loss of definition. Consider subtle shelving EQ to balance."
        : "Constructive interference in high-mids adds definition and presence to your mix."
    });
  }
  
  // Check for high overlaps (5000-20000Hz)
  const highOverlaps = overlaps.filter(o => o.frequency > 5000);
  if (highOverlaps.length > 0) {
    const isMainlyDestructive = highOverlaps.filter(o => !o.isConstructive).length > highOverlaps.length / 2;
    ranges.push({
      low: 5000,
      high: 20000,
      label: "High",
      description: isMainlyDestructive 
        ? "Destructive interference in highs can dull your mix. Consider boosting air frequencies in one track."
        : "Constructive interference here adds sparkle and air to your mix."
    });
  }
  
  return ranges;
}
