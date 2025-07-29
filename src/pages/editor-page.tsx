import { Container } from '../components/ui/container';
import { FileUpload } from '../components/audio/file-upload';
import { AudioEditor } from '../components/audio/audio-editor';
import { useAudioProcessing } from '../hooks/use-audio-processing';
import DarkVeil from '../components/ui/DarkVeil';

export function EditorPage() {
  const { audioData, isProcessing, processAudio } = useAudioProcessing();

  const handleFileSelected = async (file: File) => {
    try {
      await processAudio(file);
    } catch (err) {
      console.error('Error processing audio:', err);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* DarkVeil as background */}
      <div className="fixed inset-0 z-0">
        <DarkVeil />
      </div>
      
      <Container className="relative z-10">
        <div className="mx-auto space-y-4 py-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">3D Audio Editor</h1>
          <p className="text-muted-foreground">
            Upload an audio file to edit and visualize in 3D. Apply effects and see how they change the sound in real-time.
          </p>
        </div>
        
        {!audioData ? (
          <FileUpload 
            onFileSelected={handleFileSelected} 
            isProcessing={isProcessing} 
          />
        ) : (
          <div className="bg-background border border-border rounded-lg overflow-hidden">
            <AudioEditor audioData={audioData} />
          </div>
        )}
      </div>
      </Container>
    </div>
  );
}
