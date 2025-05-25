'use client';

import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Zap, BookOpen, Users, Star, X } from 'lucide-react';
import TopicInputForm from './TopicInputForm';
import Header from './Header';
import Footer from './Footer';

export default function LandingPage() {
  const [showForm, setShowForm] = useState(false);

  // Handle escape key to close modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && showForm) {
      setShowForm(false);
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showForm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" onKeyDown={handleKeyDown}>
      <Header />
      
      {/* Hero Section */}
      <main className="relative">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-40 -right-32 w-60 h-60 sm:w-80 sm:h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-32 w-60 h-60 sm:w-80 sm:h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-60 h-60 sm:w-80 sm:h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-12 sm:pb-16 safe-area-inset-top">
          <div className="text-center">
            {/* Hero Content */}
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                Transform Ideas into
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent block sm:inline">
                  {" "}Stunning Videos
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-6 sm:mb-8 leading-relaxed px-4 sm:px-0">
                Generate professional educational animations using AI and Manim. 
                Turn any topic into engaging visual content in minutes.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12 px-4 sm:px-0">
                <button
                  onClick={() => setShowForm(true)}
                  className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2 w-full sm:w-auto justify-center touch-manipulation tap-highlight-transparent"
                  aria-label="Start creating your video"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" aria-hidden="true" />
                  Start Creating
                </button>
                
                <button 
                  className="text-white border border-gray-400 hover:border-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold transition-all duration-300 hover:bg-white hover:text-gray-900 w-full sm:w-auto touch-manipulation tap-highlight-transparent"
                  aria-label="Watch demonstration video"
                >
                  Watch Demo
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-3xl mx-auto px-4 sm:px-0">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-2">10x</div>
                  <div className="text-gray-400 text-sm sm:text-base">Faster than manual animation</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-2">50+</div>
                  <div className="text-gray-400 text-sm sm:text-base">Educational topics supported</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-2">4K</div>
                  <div className="text-gray-400 text-sm sm:text-base">High-quality output</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Topic Input Form Modal */}
        {showForm && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowForm(false);
              }
            }}
          >
            <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 id="modal-title" className="text-xl sm:text-2xl font-bold text-gray-900">Create Your Video</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors touch-manipulation tap-highlight-transparent"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6" aria-hidden="true" />
                </button>
              </div>
              <TopicInputForm onClose={() => setShowForm(false)} />
            </div>
          </div>
        )}

        {/* Features Section */}
        <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Why Choose ManimNext?
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto px-4 sm:px-0">
              Powered by cutting-edge AI and the proven Manim animation engine, 
              we make professional video creation accessible to everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">AI-Powered Generation</h3>
              <p className="text-gray-300 text-sm sm:text-base">
                Advanced language models understand your topic and generate perfect Manim scripts automatically.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Lightning Fast</h3>
              <p className="text-gray-300 text-sm sm:text-base">
                Cloud-based rendering delivers your videos in minutes, not hours. Scale automatically with demand.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Educational Focus</h3>
              <p className="text-gray-300 text-sm sm:text-base">
                Specifically designed for educational content with support for mathematics, science, and more.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Collaborative</h3>
              <p className="text-gray-300 text-sm sm:text-base">
                Share projects with your team, manage user permissions, and collaborate in real-time.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <Star className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Professional Quality</h3>
              <p className="text-gray-300 text-sm sm:text-base">
                Export in 4K resolution with customizable styles, perfect for presentations and online courses.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <Play className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Easy to Use</h3>
              <p className="text-gray-300 text-sm sm:text-base">
                No coding required. Simply describe your topic and let our AI handle the complex animation logic.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 text-center safe-area-inset-bottom">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
              Ready to Create Amazing Videos?
            </h2>
            <p className="text-lg sm:text-xl text-purple-100 mb-6 sm:mb-8">
              Join thousands of educators and content creators who trust ManimNext
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-white text-purple-600 px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold hover:bg-gray-100 transition-colors duration-300 shadow-lg touch-manipulation tap-highlight-transparent"
              aria-label="Get started with ManimNext for free"
            >
              Get Started Free
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
} 