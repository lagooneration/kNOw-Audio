import { type EQSuggestion } from '../../utils/audio-mixing';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface EQSuggestionsDisplayProps {
  suggestions: EQSuggestion[];
  track1Name: string;
  track2Name: string;
}

export function EQSuggestionsDisplay({
  suggestions,
  track1Name,
  track2Name
}: EQSuggestionsDisplayProps) {
  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>EQ Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Based on our analysis, these tracks don't have significant destructive frequency overlaps. 
            Here are some general mixing tips:
          </p>
          <ul className="list-disc pl-5 mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Try panning the tracks slightly to create separation in the stereo field</li>
            <li>Consider using sidechain compression if one track needs to give way to another</li>
            <li>Listen for any overall tonal balance issues that might need subtle EQ adjustments</li>
            <li>Try automating EQ or volume to create more dynamic interest</li>
          </ul>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>EQ Suggestions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The following EQ adjustments are recommended to improve the mix between these tracks:
          </p>
          
          {suggestions.map((suggestion, index) => (
            <div 
              key={index} 
              className="p-3 bg-background/50 dark:bg-slate-700/40 backdrop-blur-sm rounded-md border dark:border-slate-600/30"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">
                  {suggestion.track === 1 ? track1Name : track2Name}
                </span>
                <span className="text-xs px-2 py-1 bg-primary/10 rounded-full text-primary">
                  {Math.round(suggestion.frequencyRange.low)}Hz - {Math.round(suggestion.frequencyRange.high)}Hz
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Center Freq</div>
                  <div className="font-mono">
                    {Math.round((suggestion.frequencyRange.low + suggestion.frequencyRange.high) / 2)}Hz
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Gain</div>
                  <div className="font-mono text-destructive">{suggestion.gainReduction}dB</div>
                </div>
                
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Q</div>
                  <div className="font-mono">{suggestion.q}</div>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                {suggestion.reason}
              </p>
            </div>
          ))}
          
          <div className="mt-4 p-3 bg-primary/10 dark:bg-primary/20 backdrop-blur-sm rounded-md border dark:border-primary/30">
            <h4 className="text-sm font-medium mb-1">How to apply these suggestions:</h4>
            <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1">
              <li>Use a parametric EQ plugin on each track</li>
              <li>Create bell/peak filters with the recommended settings</li>
              <li>Adjust to taste - trust your ears!</li>
              <li>Consider sidechaining instead of EQ for competing low frequencies</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
