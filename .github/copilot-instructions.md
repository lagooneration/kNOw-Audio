# KnowAudio - GitHub Copilot Instructions

## Project Overview
KnowAudio is a web application for audio processing and visualization. It allows users to upload audio files, analyze them in both time and frequency domains, visualize audio features, and edit audio with a 3D interface.

## Architecture
- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn UI
- **Visualization**: Three.js, wavesurfer.js, d3
- **Audio Processing**: Web Audio API, Tone.js
- **Routing**: react-router-dom

## Key Features
1. **Audio Analysis**: Time & frequency domain analysis
2. **Audio Details**: Display channels, sample rate, etc.
3. **Feature Visualization**: Waveforms, spectrograms, frequency spectrum
4. **3D Sound Editor**: Real-time 3D visualization of audio processing

## Project Structure
- `src/components/audio`: Audio-related components (waveform, spectrum, etc.)
- `src/components/ui`: UI components from shadcn UI
- `src/components/visualization`: 3D visualization components
- `src/hooks`: Custom React hooks for audio processing
- `src/pages`: Main application pages
- `src/utils`: Utility functions for audio processing
- `src/types`: TypeScript type definitions
- `src/lib`: Helper libraries and functions

## Development Guidelines
1. **Code Style**: Follow the existing code style with TypeScript for type safety
2. **UI Components**: Use shadcn UI components with Tailwind CSS
3. **Audio Processing**: Use Web Audio API for audio processing
4. **State Management**: Use React hooks for state management
5. **Visualization**: Use Three.js for 3D visualization
6. **Error Handling**: Include proper error handling for audio processing

## Common Tasks
1. **Adding a new audio feature**: Create a utility in `src/utils/audio-processing.ts`
2. **Adding a new visualization**: Create a component in `src/components/visualization/`
3. **Modifying the UI**: Update components in `src/components/ui/`
4. **Adding a new page**: Create a new page in `src/pages/` and add a route in `App.tsx`

## Testing
1. **Component Testing**: Use React Testing Library
2. **Audio Processing Testing**: Test with various audio files and formats

## Deployment
The application is deployable to Netlify or GitHub Pages.
