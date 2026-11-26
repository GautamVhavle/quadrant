import type { Metadata, Viewport } from 'next';
import './globals.css';

const siteUrl = process.env.PUBLIC_SITE_URL || 'https://quadrant-tasks-nine.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Quadrant · decide what actually matters',
  description:
    'Answer four short questions about a task and Quadrant places it on an urgency and importance board, with your own override always available.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Quadrant · decide what actually matters',
    description:
      'Four questions, one honest answer about what to do next. A frosted glass task board with an assistant that sorts for you.',
    url: siteUrl,
    siteName: 'Quadrant',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'The Quadrant board with a task in each area.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quadrant · decide what actually matters',
    description: 'Four questions, one honest answer about what to do next.',
    images: ['/og.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#eceeeb' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0e0d' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/** Applies a stored theme before first paint so there is no flash. */
const themeBootstrap = `(function(){try{var t=localStorage.getItem('quadrant.theme.v1');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
