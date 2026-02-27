import { Hero } from '@/components/Hero';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LiveLedger } from '@/components/LiveLedger';
import { Leaderboard } from '@/components/Leaderboard';
import { Container } from '@/components/ui';

export default function Home() {
  return (
    <main className="min-h-screen bg-background-primary">
      {/* Fixed Header */}
      <Header />
      
      {/* Hero Section */}
      <Hero />
      
      {/* Live Network Activity Section */}
      <section className="py-20 px-4 bg-background-secondary/30">
        <Container size="lg">
          <LiveLedger />
        </Container>
      </section>
      
      {/* Global Leaderboard Section */}
      <section className="py-20 px-4">
        <Container size="lg">
          <Leaderboard maxRows={50} />
        </Container>
      </section>
      
      {/* Fixed Footer */}
      <Footer />
    </main>
  );
}
