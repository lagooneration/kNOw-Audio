import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/home-page'
import { EditorPage } from './pages/editor-page'
import { MixingPage } from './pages/mixing-page'
import { SpatialAudioPage } from './pages/spatial-audio-page'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/mixing" element={<MixingPage />} />
        <Route path="/spatial-audio" element={<SpatialAudioPage />} />
      </Routes>
    </Router>
  )
}

export default App