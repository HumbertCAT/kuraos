import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Inter, Space_Grotesk, JetBrains_Mono, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/context/auth-context";
import { ThemeProvider } from "@/components/theme-provider";
import { HydrationMarker } from "@/components/HydrationMarker";
import type { Metadata, Viewport } from 'next';
import "../globals.css";

export const metadata: Metadata = {
  title: 'Kura OS',
  description: 'Plataforma clínica inteligente para profesionales de salud mental',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kura OS',
    startupImage: '/icons/icon-512.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Body text - Clean, readable
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

// Headlines - Technical, bold personality (Architect Spec)
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"],
});

// Mono for data, captions, technical info (Architect Spec)
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

// Serif for elegant, premium feel (Optional)
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
});

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable} font-body antialiased bg-background text-foreground`}>
        <HydrationMarker />
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            <AuthProvider>
              {children}
            </AuthProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
