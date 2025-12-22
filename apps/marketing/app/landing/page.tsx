'use client';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import TechSection from './components/TechSection';
import FeaturesGrid from './components/FeaturesGrid';
import Pricing from './components/Pricing';
import Footer from './components/Footer';

export default function LandingPage() {
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

