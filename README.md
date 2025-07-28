# KnowAudio

A modern, user-friendly web application for audio processing and visualization.

## Features

- **Audio Analysis**: Upload audio files to analyze in both time and frequency domains
- **Detailed Audio Information**: View channels, sample rate, and detect speech/music/environmental markers
- **Advanced Visualizations**: See waveforms, frequency spectrums, and spectrograms
- **3D Sound Editor**: Manipulate audio with real-time 3D graph visualizations
- **Audio Content Analysis**: Generate reports about the audio content

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn UI
- **Visualization**: 
  - 2D: wavesurfer.js, d3
  - 3D: Three.js, @react-three/fiber, @react-three/drei
- **Audio Processing**: Web Audio API, Tone.js, fft-js, web-audio-beat-detector
- **Routing**: react-router-domTypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

## Getting Started

### Prerequisites

- Node.js (v16 or newer)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/know-audio.git
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

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
