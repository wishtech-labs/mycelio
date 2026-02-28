import { Hero } from '@/components/Hero';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LiveLedger } from '@/components/LiveLedger';
import { Leaderboard } from '@/components/Leaderboard';
import { Container } from '@/components/ui';

export default function Home() {
  return (
    <main className="bg-background-primary overflow-x-hidden">
      {/* Fixed Header */}
      <Header />
      
      {/* Hero Section - 全屏首屏 */}
      <Hero />
      
      {/* Live Network Activity Section */}
      <section className="py-24 px-4 bg-background-secondary/20 border-t border-white/5">
        <Container size="lg">
          <LiveLedger />
        </Container>
      </section>
      
      {/* Global Leaderboard Section */}
      <section className="py-24 px-4">
        <Container size="lg">
          <Leaderboard maxRows={50} />
        </Container>
      </section>
      
      {/* Fixed Footer */}
      <Footer />
    </main>
  );
}
