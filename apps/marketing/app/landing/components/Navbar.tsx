import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

// Simple mushroom SVG icon
const MushroomIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <path d="M12 2C6 2 2 7 2 10c0 2 1 3 3 3h14c2 0 3-1 3-3 0-3-4-8-10-8z" fill="#10b981" />
    <path d="M9 13v7c0 1 1 2 3 2s3-1 3-2v-7" fill="#a78bfa" />
    <circle cx="7" cy="7" r="1.5" fill="#fbcfe8" />
    <circle cx="14" cy="5" r="1" fill="#fbcfe8" />
    <circle cx="10" cy="9" r="1" fill="#fbcfe8" />
  </svg>
);

// Psychedelic colors for each letter
const psychedelicColors = [
  '#ff6b6b', // P - red
  '#ffa94d', // s - orange
  '#ffd43b', // y - yellow
  '#69db7c', // c - green
  '#4dabf7', // h - blue
  '#9775fa', // e - purple
  '#f783ac', // d - pink
  '#20c997', // e - teal
  '#845ef7', // l - violet
  '#ff8787', // i - coral
  '#66d9e8', // c - cyan
];

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full z-50 top-0 start-0 border-b border-white/5 bg-brand-dark/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center space-x-2 rtl:space-x-reverse">
          <img
            src="/kura-logo-dark.png"
            alt="KURA OS"
            className="h-36 w-auto"
          />
        </Link>

        <div className="flex md:order-2 space-x-3 rtl:space-x-reverse">
          <a href="https://app.kuraos.ai/es/register" className="text-brand-dark bg-brand-accent hover:bg-brand-glow focus:ring-4 focus:outline-none focus:ring-emerald-800 font-medium rounded-lg text-sm px-4 py-2 text-center transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            Empezar Gratis
          </a>
          <a href="https://app.kuraos.ai/es/login" className="text-white bg-white/5 border border-white/20 hover:bg-white/10 font-medium rounded-lg text-sm px-4 py-2 text-center transition-all duration-300">
            Login
          </a>
          <button
            onClick={() => setIsOpen(!isOpen)}
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-400 rounded-lg md:hidden hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-600"
          >
            <span className="sr-only">Open main menu</span>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>

        <div className={`${isOpen ? 'block' : 'hidden'} items-center justify-between w-full md:flex md:w-auto md:order-1`}>
          <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-800 rounded-lg bg-gray-900/50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-transparent">
            <li>
              <a href="#features" className="block py-2 px-3 text-gray-300 hover:text-brand-accent md:p-0 transition-colors">Características</a>
            </li>
            <li>
              <a href="#tech" className="block py-2 px-3 text-gray-300 hover:text-brand-accent md:p-0 transition-colors">Motor AletheIA</a>
            </li>
            <li>
              <a href="#pricing" className="block py-2 px-3 text-gray-300 hover:text-brand-accent md:p-0 transition-colors">Precios</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;