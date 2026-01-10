import createNextIntlPlugin from 'next-intl/plugin';
import createMDX from '@next/mdx';
import withPWAInit from 'next-pwa';

const withNextIntl = createNextIntlPlugin();

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

// PWA configuration
const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Disable in dev mode
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
};

// Compose plugins: PWA -> MDX -> i18n
export default withPWA(withNextIntl(withMDX(nextConfig)));

