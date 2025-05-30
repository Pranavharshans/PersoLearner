'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { 
  Sparkles,
  Github,
  Twitter,
  Linkedin,
  Mail,
  ArrowRight,
  MapPin,
  Phone,
  Send,
  Heart,
  ExternalLink,
  CheckCircle
} from 'lucide-react';

const Logo = () => (
  <motion.div
    className="flex items-center gap-3"
    whileHover={{ scale: 1.05 }}
    transition={{ type: "spring", stiffness: 400, damping: 10 }}
  >
    <div className="relative">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
        <Sparkles className="w-5 h-5 text-white" />
      </div>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-30 blur-md animate-pulse" />
    </div>
    <div className="flex flex-col">
      <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        ManimNext
      </span>
      <span className="text-xs text-muted-foreground font-medium">
        AI Animation Studio
      </span>
    </div>
  </motion.div>
);

const NewsletterSignup = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Stay Updated</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Get the latest updates, tips, and resources delivered straight to your inbox.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-2 bg-muted/50 border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
            required
          />
          <Button 
            type="submit" 
            size="sm" 
            variant="gradient"
            className="px-4"
            disabled={isSubscribed}
          >
            {isSubscribed ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {isSubscribed && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1"
          >
            <CheckCircle className="w-4 h-4" />
            Successfully subscribed!
          </motion.p>
        )}
      </form>
      
      <p className="text-xs text-muted-foreground">
        No spam. Unsubscribe at any time.
      </p>
    </div>
  );
};

const FooterLink = ({ 
  href, 
  children, 
  external = false 
}: { 
  href: string; 
  children: React.ReactNode; 
  external?: boolean;
}) => {
  return (
    <motion.a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-1 group"
      whileHover={{ x: 2 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {children}
      {external && (
        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </motion.a>
  );
};

const SocialLink = ({ 
  href, 
  icon: Icon, 
  label 
}: { 
  href: string; 
  icon: React.ComponentType<{ className?: string }>; 
  label: string;
}) => {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-10 h-10 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 group"
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
      aria-label={label}
    >
      <Icon className="w-5 h-5" />
    </motion.a>
  );
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "API", href: "#api" },
        { label: "Integrations", href: "#integrations" },
        { label: "Examples", href: "#examples" },
      ]
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "#docs" },
        { label: "Tutorials", href: "#tutorials" },
        { label: "Blog", href: "#blog" },
        { label: "Community", href: "#community" },
        { label: "Support", href: "#support" },
      ]
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "#about" },
        { label: "Careers", href: "#careers" },
        { label: "Press", href: "#press" },
        { label: "Partners", href: "#partners" },
        { label: "Contact", href: "#contact" },
      ]
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "#privacy" },
        { label: "Terms of Service", href: "#terms" },
        { label: "Cookie Policy", href: "#cookies" },
        { label: "Security", href: "#security" },
        { label: "GDPR", href: "#gdpr" },
      ]
    }
  ];

  const socialLinks = [
    { href: "https://github.com", icon: Github, label: "GitHub" },
    { href: "https://twitter.com", icon: Twitter, label: "Twitter" },
    { href: "https://linkedin.com", icon: Linkedin, label: "LinkedIn" },
    { href: "mailto:hello@manimnext.com", icon: Mail, label: "Email" },
  ];

  return (
    <footer className="relative bg-background border-t border-border">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="dot-pattern" />
      </div>

      <div className="relative z-10">
        {/* Main Footer Content */}
        <div className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-4 space-y-6">
              <Logo />
              
              <p className="text-muted-foreground leading-relaxed max-w-md">
                Learn any topic through personalized animated videos created just for you. 
                Enter your question and watch AI transform complex concepts into visual understanding.
              </p>

              {/* Key Features */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                  <span className="text-muted-foreground">Personalized Learning Videos</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500" />
                  <span className="text-muted-foreground">Any Topic, Any Level</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                  <span className="text-muted-foreground">Instant AI-Generated Content</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <SocialLink
                    key={social.label}
                    href={social.href}
                    icon={social.icon}
                    label={social.label}
                  />
                ))}
              </div>
            </div>

            {/* Links Sections */}
            <div className="lg:col-span-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {footerSections.map((section) => (
                  <div key={section.title} className="space-y-4">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground">
                      {section.title}
                    </h3>
                    <ul className="space-y-3">
                      {section.links.map((link) => (
                        <li key={link.label}>
                          <FooterLink href={link.href}>
                            {link.label}
                          </FooterLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Newsletter Section */}
            <div className="lg:col-span-2">
              <NewsletterSignup />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border">
          <div className="container mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>© {currentYear} ManimNext. Made with</span>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Heart className="w-4 h-4 text-red-500 fill-current" />
                </motion.div>
                <span>for learners.</span>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <FooterLink href="#status">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span>All systems operational</span>
                  </div>
                </FooterLink>
                
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>San Francisco, CA</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 