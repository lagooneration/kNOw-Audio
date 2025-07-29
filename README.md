# KnowAudio

![3D Audio Visualization](/public/images/chord-gen.jpg)

An open source initiative to understand, visualize, and manipulate sound through innovative approaches to audio processing.

## About

KnowAudio aims to democratize audio knowledge by providing powerful tools for audio analysis and manipulation in an accessible interface. This project brings together cutting-edge web technologies and audio processing techniques to help musicians, sound engineers, audio researchers, and enthusiasts gain deeper insights into their audio content.

## Features

- **Audio Analysis**: Upload audio files to analyze in both time and frequency domains
- **Detailed Audio Information**: View channels, sample rate, and detect speech/music/environmental markers
- **Advanced Visualizations**: 
  - Waveforms with interactive zoom and selection
  - Real-time frequency spectrum analysis
  - High-resolution spectrograms with customizable color mapping
  - 3D spectral visualization with immersive frequency representation
- **3D Sound Editor**: Manipulate audio with real-time 3D graph visualizations
- **Audio Content Analysis**: Generate detailed reports about audio content including:
  - Speech detection with segment timing
  - Musical element identification
  - Environmental sound recognition
  - Dominant frequency range analysis

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn UI
- **Visualization**: 
  - 2D: wavesurfer.js, d3
  - 3D: Three.js, @react-three/fiber, @react-three/drei with custom GLSL shaders
- **Audio Processing**: 
  - Web Audio API for core audio operations
  - Tone.js for advanced synthesis and effects
  - FFT analysis for frequency domain visualization
  - GLSL shaders for real-time audio-reactive 3D visualizations
- **Machine Learning**: Simplified models for audio content classification
- **Routing**: react-router-dom

## Open Source Approach

KnowAudio embraces open source collaboration to advance the field of audio processing on the web. Our approach includes:

1. **Community-Driven Development**: We welcome contributions from audio enthusiasts, developers, and researchers
2. **Educational Focus**: The codebase is designed to be readable and well-documented to serve as a learning resource
3. **Modular Architecture**: Components are designed to be reusable in other audio-related projects
4. **Cross-Discipline Integration**: Combining expertise from DSP, data visualization, and web development

## Use Cases

- **Musicians**: Analyze tracks to understand frequency distribution and make mixing decisions
- **Sound Designers**: Visualize audio characteristics to create balanced soundscapes
- **Audio Engineers**: Identify problematic frequencies and optimize sound quality
- **Music Educators**: Demonstrate audio concepts with intuitive visual representations
- **Researchers**: Study audio patterns and characteristics with detailed analysis tools
- **Content Creators**: Ensure audio quality meets platform standards before publishing

## Getting Started

### Prerequisites

- Node.js (v16 or newer)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/lagooneration/know-audio.git
   cd know-audio
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn
   ```

3. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Build for Production

```bash
npm run build
# or
yarn build
```

## Deployment

The application can be deployed to Netlify or GitHub Pages. Build the project and upload the `dist` folder, or connect your GitHub repository for continuous deployment.

## Contributing

We welcome contributions from the community! Whether you're a developer, audio engineer, or enthusiast, there are many ways to help improve KnowAudio:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Areas for Contribution
- Audio processing algorithms
- Visualization techniques
- UI/UX improvements
- Documentation and tutorials
- Performance optimizations
- Accessibility enhancements

## Future Roadmap

- Browser-based audio recording with real-time analysis
- Audio effect plugins with visual feedback
- Collaborative audio editing capabilities
- Export capabilities for visualization and analysis results
- Mobile-optimized interface for on-the-go analysis

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- The Web Audio API community
- Three.js and React Three Fiber contributors
- All open source audio processing libraries that made this project possible
