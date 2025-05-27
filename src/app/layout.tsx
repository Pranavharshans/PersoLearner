import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ManimNext - AI-Powered Animation Studio",
  description: "Transform ideas into stunning educational animations with AI and Manim. Professional video creation for educators, creators, and enterprises.",
  keywords: ["manim", "animation", "AI", "education", "video", "mathematics", "science", "visualization"],
  authors: [{ name: "ManimNext Team" }],
  creator: "ManimNext",
  publisher: "ManimNext",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://manimnext.com",
    title: "ManimNext - AI-Powered Animation Studio",
    description: "Transform ideas into stunning educational animations with AI and Manim. Professional video creation for educators, creators, and enterprises.",
    siteName: "ManimNext",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ManimNext - AI-Powered Animation Studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ManimNext - AI-Powered Animation Studio",
    description: "Transform ideas into stunning educational animations with AI and Manim.",
    images: ["/og-image.png"],
    creator: "@manimnext",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
} 