'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Sparkles, 
  Github, 
  Twitter,
  Sun,
  Moon,
  Settings,
  User,
  LogOut,
  ChevronDown,
  ArrowRight,
  PlayCircle,
  BookOpen,
  Users,
  MessageCircle
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

const Logo = ({ className }: { className?: string }) => (
  <motion.div
    className={cn("flex items-center gap-3", className)}
    whileHover={{ scale: 1.05 }}
    transition={{ type: "spring", stiffness: 400, damping: 10 }}
  >
    <motion.div
      className="relative"
      animate={{ 
        rotate: [0, 360],
        scale: [1, 1.1, 1]
      }}
      transition={{
        rotate: { duration: 20, repeat: Infinity, ease: "linear" },
        scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
      }}
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
        <Sparkles className="w-5 h-5 text-white" />
      </div>
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-30 blur-md"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
    <div className="flex flex-col">
      <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
        ManimNext
      </span>
      <span className="text-xs text-muted-foreground font-medium">
        AI Animation Studio
      </span>
    </div>
  </motion.div>
);

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative overflow-hidden group"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: theme === "dark" ? 0 : 1, rotate: theme === "dark" ? -180 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <Sun className="h-4 w-4" />
      </motion.div>
      <motion.div
        initial={{ scale: 1, rotate: 0 }}
        animate={{ scale: theme === "dark" ? 1 : 0, rotate: theme === "dark" ? 0 : 180 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <Moon className="h-4 w-4" />
      </motion.div>
    </Button>
  );
};

const DropdownMenu = ({ 
  trigger, 
  children, 
  className 
}: { 
  trigger: React.ReactNode
  children: React.ReactNode
  className?: string 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
      >
        {trigger}
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 p-2 bg-background/80 backdrop-blur-xl border border-border rounded-xl shadow-lg z-50",
              className
            )}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MobileMenu = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 lg:hidden"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Menu */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-80 bg-background/95 backdrop-blur-xl border-l border-border p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-8">
            <Logo />
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <nav className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Product
              </h3>
              <div className="space-y-3">
                <a href="#" className="flex items-center gap-3 text-base font-medium hover:text-primary transition-colors">
                  <PlayCircle className="w-5 h-5" />
                  Features
                </a>
                <a href="#" className="flex items-center gap-3 text-base font-medium hover:text-primary transition-colors">
                  <BookOpen className="w-5 h-5" />
                  Documentation
                </a>
                <a href="#" className="flex items-center gap-3 text-base font-medium hover:text-primary transition-colors">
                  <Users className="w-5 h-5" />
                  Examples
                </a>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Support
              </h3>
              <div className="space-y-3">
                <a href="#" className="flex items-center gap-3 text-base font-medium hover:text-primary transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  Community
                </a>
                <a href="#" className="flex items-center gap-3 text-base font-medium hover:text-primary transition-colors">
                  <Github className="w-5 h-5" />
                  GitHub
                </a>
                <a href="#" className="flex items-center gap-3 text-base font-medium hover:text-primary transition-colors">
                  <Twitter className="w-5 h-5" />
                  Twitter
                </a>
              </div>
            </div>
          </nav>
          
          <div className="mt-8 space-y-4">
            <Button variant="outline" size="lg" fullWidth>
              Sign In
            </Button>
            <Button variant="gradient" size="lg" fullWidth rightIcon={<ArrowRight className="w-4 h-4" />}>
              Get Started Free
            </Button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-500",
          isScrolled 
            ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-lg" 
            : "bg-transparent"
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Logo />

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <DropdownMenu
                trigger="Product"
                className="w-72"
              >
                <div className="space-y-1">
                  <a href="#" className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors group">
                    <div className="w-8 h-8 rounded-md bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <PlayCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm group-hover:text-primary transition-colors">Features</h4>
                      <p className="text-xs text-muted-foreground">Explore our AI-powered tools</p>
                    </div>
                  </a>
                  <a href="#" className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors group">
                    <div className="w-8 h-8 rounded-md bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm group-hover:text-primary transition-colors">Documentation</h4>
                      <p className="text-xs text-muted-foreground">Learn how to get started</p>
                    </div>
                  </a>
                  <a href="#" className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors group">
                    <div className="w-8 h-8 rounded-md bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm group-hover:text-primary transition-colors">Examples</h4>
                      <p className="text-xs text-muted-foreground">See what others have created</p>
                    </div>
                  </a>
                </div>
              </DropdownMenu>

              <a href="#" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
                Pricing
              </a>
              
              <DropdownMenu
                trigger="Resources"
                className="w-64"
              >
                <div className="space-y-1">
                  <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Community</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                    <Github className="w-4 h-4" />
                    <span className="text-sm font-medium">GitHub</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                    <Twitter className="w-4 h-4" />
                    <span className="text-sm font-medium">Twitter</span>
                  </a>
                </div>
              </DropdownMenu>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-4">
              <ThemeToggle />
              
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
              
              <Button 
                variant="gradient" 
                size="sm" 
                className="shadow-lg hover:shadow-xl"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="lg:hidden flex items-center space-x-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </>
  );
} 