import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout'
import { HomePage } from './pages/home-page'
import { EditorPage } from './pages/editor-page'
import { MixingPage } from './pages/mixing-page'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/mixing" element={<MixingPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App