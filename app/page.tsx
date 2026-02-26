import { Hero } from '@/components/Hero';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-background-primary">
      {/* Hero Section */}
      <Hero />

      {/* Footer */}
      <Footer />
    </main>
  );
}
