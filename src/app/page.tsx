import { Metadata } from 'next';
import LandingPage from '@/components/LandingPage';

export const metadata: Metadata = {
  title: 'ManimNext - AI-Powered Educational Video Generator',
  description: 'Transform any educational topic into stunning animated videos using AI and Manim. Create professional mathematical and scientific animations in minutes.',
  keywords: ['manim', 'animation', 'education', 'AI', 'video generation', 'mathematics', 'science'],
  authors: [{ name: 'ManimNext Team' }],
  openGraph: {
    title: 'ManimNext - AI-Powered Educational Video Generator',
    description: 'Transform any educational topic into stunning animated videos using AI and Manim.',
    type: 'website',
    url: 'https://manimnext.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ManimNext - AI-Powered Educational Video Generator',
    description: 'Transform any educational topic into stunning animated videos using AI and Manim.',
  },
};

export default function HomePage() {
  return <LandingPage />;
} 