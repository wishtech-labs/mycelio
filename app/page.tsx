import { Hero } from '@/components/Hero';
import { LiveLedger } from '@/components/LiveLedger';
import { Leaderboard } from '@/components/Leaderboard';
import { Footer } from '@/components/Footer';
import { Container } from '@/components/ui';

export default function Home() {
  return (
    <main className="min-h-screen bg-background-primary">
      {/* Hero Section */}
      <Hero />

      {/* Live Network Activity */}
      <section className="py-16">
        <Container>
          <LiveLedger />
        </Container>
      </section>

      {/* Global Leaderboard */}
      <section className="py-16">
        <Container>
          <Leaderboard />
        </Container>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
