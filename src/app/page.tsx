import { Metadata } from 'next';
import LandingPage from '@/components/LandingPage';

export const metadata: Metadata = {
  title: 'ManimNext - Personalized Educational Video Learning',
  description: 'Get personalized animated videos for any topic you want to learn. Simply enter your question and watch AI create custom educational content just for you.',
  keywords: ['personalized learning', 'animated videos', 'education', 'AI', 'video learning', 'visual learning', 'any topic'],
  authors: [{ name: 'ManimNext Team' }],
  openGraph: {
    title: 'ManimNext - Personalized Educational Video Learning',
    description: 'Get personalized animated videos for any topic you want to learn. Enter any subject and get custom educational content.',
    type: 'website',
    url: 'https://manimnext.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ManimNext - Personalized Educational Video Learning',
    description: 'Get personalized animated videos for any topic you want to learn. Enter any subject and get custom educational content.',
  },
};

export default function HomePage() {
  return <LandingPage />;
} 