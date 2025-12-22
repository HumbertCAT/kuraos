import React from 'react';

// Simple mushroom SVG icon
const MushroomIcon = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" style={{ width: size, height: size }}>
    <path d="M12 2C6 2 2 7 2 10c0 2 1 3 3 3h14c2 0 3-1 3-3 0-3-4-8-10-8z" fill="#10b981" />
    <path d="M9 13v7c0 1 1 2 3 2s3-1 3-2v-7" fill="#a78bfa" />
    <circle cx="7" cy="7" r="1.5" fill="#fbcfe8" />
    <circle cx="14" cy="5" r="1" fill="#fbcfe8" />
    <circle cx="10" cy="9" r="1" fill="#fbcfe8" />
  </svg>
);

const psychedelicColors = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa', '#f783ac', '#20c997', '#845ef7', '#ff8787', '#66d9e8'];

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#010409] border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">

        <div className="flex items-center space-x-2">
          <img
            src="/kura-logo-icon.png"
            alt="KURA OS"
            className="h-8 w-auto"
          />
          <span className="text-lg font-bold tracking-tight text-white">
            KURA<span className="text-brand-accent">OS</span>
          </span>
        </div>

        <div className="flex gap-6 text-sm text-gray-500">
          <a href="#" className="hover:text-white transition-colors">Términos</a>
          <a href="#" className="hover:text-white transition-colors">Privacidad</a>
          <a href="#" className="hover:text-white transition-colors">Contacto</a>
        </div>

        <div className="text-xs text-gray-600">
          © 2024 KURA OS. Sistema Operativo para Terapeutas.
        </div>
      </div>
    </footer>
  );
};

export default Footer;