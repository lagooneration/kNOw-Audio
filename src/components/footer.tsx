import { Container } from './ui/container';

export function Footer() {
  return (
    <footer className="py-6 border-t bg-gradient-to-r from-slate-950 to-slate-900 mt-auto">
      <Container>
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-slate-400"
           style={{ fontFamily: "bitcount, monospace" }}
          >
            &copy; {new Date().getFullYear()} <span className="font-goldman text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">KnowAudio</span>. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm font-bitcount text-slate-400 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all"
            >
              GitHub
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
