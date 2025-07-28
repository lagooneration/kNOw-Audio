import { type ReactNode, useEffect } from 'react';
import { Header } from './header';
import { Footer } from './footer';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  // Set dark mode by default
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="flex flex-col min-h-screen dark:bg-gray-900 transition-colors duration-200">
      <Header />
      <main className="flex-1 py-8 px-4 md:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
