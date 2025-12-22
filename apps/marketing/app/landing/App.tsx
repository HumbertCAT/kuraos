import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import TechSection from './components/TechSection';
import FeaturesGrid from './components/FeaturesGrid';
import Pricing from './components/Pricing';
import Footer from './components/Footer';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-dark selection:bg-brand-accent selection:text-brand-dark overflow-x-hidden">
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
};

export default App;