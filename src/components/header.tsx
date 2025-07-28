import { Link } from 'react-router-dom';
import { Container } from './ui/container';

export function Header() {
  return (
    <header className="py-4 border-b bg-card">
      <Container>
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-primary">
            KnowAudio
          </Link>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Analyzer
                </Link>
              </li>
              <li>
                <Link to="/editor" className="hover:text-primary transition-colors">
                  3D Editor
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </Container>
    </header>
  );
}
