'use client';

import React from 'react';
import Link from 'next/link';
import { Github, Twitter, Mail, Heart, ExternalLink } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900/50 backdrop-blur-sm border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Brand Section */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-3 sm:mb-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-base sm:text-lg">M</span>
              </div>
              <span className="text-white font-bold text-lg sm:text-xl">ManimNext</span>
            </div>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-4">
              Transform your ideas into stunning educational videos with AI-powered Manim script generation.
            </p>
            {/* Social Links */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link
                href="https://github.com/manimnext"
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10 touch-manipulation tap-highlight-transparent"
                aria-label="Follow us on GitHub"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link
                href="https://twitter.com/manimnext"
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10 touch-manipulation tap-highlight-transparent"
                aria-label="Follow us on Twitter"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link
                href="mailto:hello@manimnext.com"
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10 touch-manipulation tap-highlight-transparent"
                aria-label="Contact us via email"
              >
                <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-white font-semibold text-sm sm:text-base mb-3 sm:mb-4">Product</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link
                  href="/features"
                  className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base block py-1"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base block py-1"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/gallery"
                  className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base block py-1"
                >
                  Gallery
                </Link>
              </li>
              <li>
                <Link
                  href="/api"
                  className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base block py-1 flex items-center gap-1"
                >
                  API
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-white font-semibold text-sm sm:text-base mb-3 sm:mb-4">Resources</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link
                  href="/docs"
                  className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base block py-1"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/tutorials"
                  className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base block py-1"
                >
                  Tutorials
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base block py-1"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/community"
                  className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base block py-1"
                >
                  Community
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-semibold text-sm sm:text-base mb-3 sm:mb-4">Company</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base block py-1"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base block py-1"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base block py-1"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base block py-1"
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="flex items-center text-gray-400 text-xs sm:text-sm">
              <span>© {currentYear} ManimNext. Made with</span>
              <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 mx-1" aria-hidden="true" />
              <span>for educators worldwide.</span>
            </div>

            {/* Legal Links */}
            <div className="flex items-center space-x-4 sm:space-x-6">
              <Link
                href="/privacy"
                className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookies"
                className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm"
              >
                Cookie Policy
              </Link>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-gray-500 text-xs sm:text-sm">
              Powered by{' '}
              <Link
                href="https://manim.community"
                className="text-purple-400 hover:text-purple-300 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Manim Community Edition
              </Link>
              {' '}and cutting-edge AI technology.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
} 