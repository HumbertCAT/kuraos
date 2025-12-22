'use client';

import Navbar from './landing/components/Navbar';
import Hero from './landing/components/Hero';
import Features from './landing/components/Features';
import TechSection from './landing/components/TechSection';
import FeaturesGrid from './landing/components/FeaturesGrid';
import Pricing from './landing/components/Pricing';
import Footer from './landing/components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <TechSection />
        <FeaturesGrid />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
