import { Link } from 'react-router-dom';
import { Container } from './ui/container';

export function Header() {
  return (
    <header className="py-4 border-b bg-gradient-to-r from-slate-950 to-slate-900 shadow-md">
      <Container>
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold font-goldman text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-500 to-purple-600 hover:opacity-90 transition-opacity">
            KnowAudio
          </Link>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link to="/" className="font-goldman text-slate-300 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all">
                  Analyzer
                </Link>
              </li>
              <li>
                <Link to="/mixing" className="font-goldman text-slate-300 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all">
                  Mixing
                </Link>
              </li>
              <li>
                <Link to="/editor" className="font-goldman text-slate-300 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all">
                  3D Editor
                </Link>
              </li>
              <li>
                <Link to="/spatial-audio" className="font-goldman text-slate-300 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all">
                  Spatial Audio
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </Container>
    </header>
  );
}
