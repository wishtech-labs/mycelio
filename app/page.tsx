import { Hero } from '@/components/Hero';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-background-primary">
      {/* Fixed Header */}
      <Header />
      
      {/* Main Content with padding for fixed footer */}
      {/* Main Content */}
      <Hero />
      
      {/* Fixed Footer */}
      <Footer />
    </main>
  );
}
