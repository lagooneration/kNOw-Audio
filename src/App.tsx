import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/home-page'
import { EditorPage } from './pages/editor-page'
import { MixingPage } from './pages/mixing-page'
import { SpatialAudioPage } from './pages/spatial-audio-page'
import { LiveAudioPage } from './pages/live-audio-page'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/mixing" element={<MixingPage />} />
        <Route path="/spatial-audio" element={<SpatialAudioPage />} />
        <Route path="/live-audio" element={<LiveAudioPage />} />
      </Routes>
    </Router>
  )
}

export default App