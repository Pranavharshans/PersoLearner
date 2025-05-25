'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Settings } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when clicking outside or pressing escape
  const closeMenu = () => setIsMenuOpen(false);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (isMenuOpen && !target.closest('[data-mobile-menu]')) {
        closeMenu();
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('click', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  return (
    <header className="bg-white/10 backdrop-blur-sm border-b border-white/20 relative z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-white font-bold text-base sm:text-lg">M</span>
            </div>
            <span className="text-white font-bold text-lg sm:text-xl">ManimNext</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link 
              href="/" 
              className="text-white hover:text-purple-300 transition-colors text-sm lg:text-base font-medium"
            >
              Home
            </Link>
            <Link 
              href="/about" 
              className="text-white hover:text-purple-300 transition-colors text-sm lg:text-base font-medium"
            >
              About
            </Link>
            <Link 
              href="/docs" 
              className="text-white hover:text-purple-300 transition-colors text-sm lg:text-base font-medium"
            >
              Documentation
            </Link>
            <Link 
              href="/settings" 
              className="text-white hover:text-purple-300 transition-colors text-sm lg:text-base font-medium flex items-center gap-1"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </nav>

          {/* Desktop CTA Button */}
          <div className="hidden md:block">
            <Link
              href="/get-started"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 lg:px-6 py-2 rounded-full text-sm lg:text-base font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl touch-manipulation tap-highlight-transparent"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors touch-manipulation tap-highlight-transparent"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            data-mobile-menu
          >
            {isMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-64 sm:w-80 bg-slate-900 transform transition-transform duration-300 ease-in-out z-50 md:hidden ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        data-mobile-menu
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/20">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-base">M</span>
              </div>
              <span className="text-white font-bold text-lg">ManimNext</span>
            </div>
            <button
              onClick={closeMenu}
              className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors touch-manipulation tap-highlight-transparent"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Mobile Menu Navigation */}
          <nav className="flex-1 px-4 py-6">
            <div className="space-y-4">
              <Link
                href="/"
                onClick={closeMenu}
                className="block text-white hover:text-purple-300 transition-colors text-base font-medium py-2 px-3 rounded-lg hover:bg-white/10"
              >
                Home
              </Link>
              <Link
                href="/about"
                onClick={closeMenu}
                className="block text-white hover:text-purple-300 transition-colors text-base font-medium py-2 px-3 rounded-lg hover:bg-white/10"
              >
                About
              </Link>
              <Link
                href="/docs"
                onClick={closeMenu}
                className="block text-white hover:text-purple-300 transition-colors text-base font-medium py-2 px-3 rounded-lg hover:bg-white/10"
              >
                Documentation
              </Link>
              <Link
                href="/settings"
                onClick={closeMenu}
                className="block text-white hover:text-purple-300 transition-colors text-base font-medium py-2 px-3 rounded-lg hover:bg-white/10 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </div>
          </nav>

          {/* Mobile Menu Footer */}
          <div className="p-4 border-t border-white/20">
            <Link
              href="/get-started"
              onClick={closeMenu}
              className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-full text-base font-semibold transition-all duration-300 text-center touch-manipulation tap-highlight-transparent"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
} 