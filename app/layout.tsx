import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Balloony — Interactive Language Adventure',
  description:
    'A joyful 2D interactive language-learning game where children and beginners master world alphabets and first words through floating balloons and voice play.',
  openGraph: {
    title: 'Balloony — Interactive Language Adventure',
    description:
      'A joyful 2D interactive language-learning game where children and beginners master world alphabets and first words through floating balloons and voice play.',
    siteName: 'Learning Balloon',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Balloony — Interactive Language Adventure',
    description:
      'A joyful 2D interactive language-learning game where children and beginners master world alphabets and first words through floating balloons and voice play.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Learning Balloon — Interactive Language Adventure',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'All',
  description:
    'Interactive 2D/3D voice-powered language learning game covering complete real-world alphabets, 43 essential travel and daily words, and 30 full-sentence abroad conversations across 65+ languages.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="font-sans antialiased selection:bg-amber-300 selection:text-slate-900 overflow-x-hidden"
      >
        {children}
      </body>
    </html>
  );
}
