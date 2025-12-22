import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Inter, Outfit, Space_Mono } from "next/font/google";
import { AuthProvider } from "@/context/auth-context";
import "../globals.css";

// Body text - Clean, readable
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

// Headlines - Character, personality
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-headline",
  weight: ["400", "500", "600", "700", "800"],
});

// Captions, labels, badges - Technical, precise
const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-caption",
  weight: ["400", "700"],
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
    <html lang={locale}>
      <body className={`${inter.variable} ${outfit.variable} ${spaceMono.variable} font-body antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

