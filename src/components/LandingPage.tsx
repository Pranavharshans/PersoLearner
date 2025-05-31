'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { cn } from '@/lib/utils';
import { 
  Play,
  Video,
  Users,
  Globe,
  ArrowRight,
  Check,
  X,
  Zap,
  Brain,
  Target,
  Lightbulb,
  BookOpen,
  Award,
  TrendingUp,
  Clock
} from 'lucide-react';

// Subtle floating elements for premium feel
const FloatingOrb = ({ delay = 0, className }: {
  delay?: number
  className?: string
}) => (
  <motion.div
    className={cn('absolute rounded-full opacity-20', className)}
    animate={{
      y: [-15, 15, -15],
      scale: [1, 1.1, 1],
    }}
    transition={{
      duration: 12,
      repeat: Infinity,
      delay,
      ease: 'easeInOut',
    }}
  />
);

const GridOverlay = () => (
  <div className="absolute inset-0 overflow-hidden">
    <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgb(148 163 184)" strokeWidth="0.5" opacity="0.1"/>
        </pattern>
        <linearGradient id="gridFade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0"/>
          <stop offset="50%" stopColor="white" stopOpacity="1"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" mask="url(#gridFade)"/>
    </svg>
  </div>
);

interface StatCounterProps {
  end: number
  duration?: number
  suffix?: string
  prefix?: string
}

const StatCounter = ({ end, duration = 2, suffix = '', prefix = '' }: StatCounterProps) => {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true });

  useEffect(() => {
    if (inView) {
      let startTime: number;
      
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / (duration * 1000), 1);
        
        const currentCount = Math.floor(progress * end);
        setCount(currentCount);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [inView, end, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

export default function LandingPage() {
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0">
        <GridOverlay />
        
        {/* Elegant floating orbs */}
        <FloatingOrb 
          delay={0} 
          className="top-32 left-16 w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100" 
        />
        <FloatingOrb 
          delay={8} 
          className="top-64 right-24 w-24 h-24 bg-gradient-to-br from-slate-100 to-gray-100" 
        />
        <FloatingOrb 
          delay={4} 
          className="bottom-48 left-32 w-40 h-40 bg-gradient-to-br from-amber-50 to-orange-50" 
        />
        <FloatingOrb 
          delay={12} 
          className="bottom-24 right-16 w-28 h-28 bg-gradient-to-br from-emerald-50 to-teal-50" 
        />

        {/* Subtle light effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-radial from-blue-50/50 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-radial from-indigo-50/50 to-transparent blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section - More organic layout */}
        <section className="container mx-auto px-6 pt-24 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="max-w-6xl mx-auto"
          >
            {/* Refined badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center mb-12"
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white shadow-sm border border-slate-200/60 text-sm font-medium text-slate-600">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span>Trusted by 50,000+ learners worldwide</span>
              </div>
            </motion.div>

            {/* Elegant headline with better typography */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 1 }}
              className="text-center mb-16"
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-light tracking-tight mb-8 leading-[0.9]">
                <span className="block font-extralight text-slate-600">Learn Any Topic</span>
                <span className="block font-semibold text-slate-900">Through Personalized</span>
                <span className="block font-light text-slate-800">Animated Videos</span>
              </h1>

              <div className="max-w-3xl mx-auto mb-12">
                <p className="text-xl md:text-2xl text-slate-700 leading-relaxed font-light">
                  Simply enter any topic you want to learn and get a 
                  <span className="text-slate-900 font-medium"> personalized animated video</span> created just for you.
                </p>
              </div>

              {/* Refined CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  variant="default"
                  size="xl"
                  className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                  leftIcon={<Play className="w-5 h-5" />}
                  onClick={() => setShowModal(true)}
                >
                  Start Learning Now
                </Button>
                
                <Button
                  variant="outline"
                  size="xl"
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 px-8 py-4 rounded-2xl"
                  leftIcon={<Video className="w-5 h-5" />}
                >
                  Watch Sample Video
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section - Organic card-less design */}
        <section className="container mx-auto px-6 py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center mb-24"
          >
            <h2 className="text-4xl md:text-5xl font-light mb-8 text-slate-900">
              Designed for 
              <span className="font-semibold"> Modern Learners</span>
            </h2>
            <p className="text-xl text-slate-700 leading-relaxed font-light max-w-2xl mx-auto">
              Every video is tailored to your learning style and current knowledge level
            </p>
          </motion.div>

          {/* Feature grid with elegant spacing */}
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
              {[
                {
                  icon: <Brain className="w-8 h-8 text-slate-700" />,
                  title: "Personalized Learning Videos",
                  description: "Enter any topic - from basic math to quantum physics. Our AI creates animated videos specifically tailored to your learning level and interests.",
                  highlight: "AI-Personalized"
                },
                {
                  icon: <Target className="w-8 h-8 text-slate-700" />,
                  title: "Instant Visual Understanding",
                  description: "Complex concepts become crystal clear through beautiful animations. No more struggling with textbooks or boring lectures.",
                  highlight: "Visual Learning"
                },
                {
                  icon: <Lightbulb className="w-8 h-8 text-slate-700" />,
                  title: "Adaptive to Your Pace",
                  description: "Learn at your own speed with videos that adjust to your current understanding. Build knowledge progressively with confidence.",
                  highlight: "Self-Paced"
                },
                {
                  icon: <BookOpen className="w-8 h-8 text-slate-700" />,
                  title: "Any Subject, Any Level",
                  description: "From elementary concepts to advanced topics across mathematics, science, history, and more. Your curiosity is the only limit.",
                  highlight: "Universal"
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, duration: 0.8 }}
                  className="group"
                >
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 p-3 bg-white rounded-2xl shadow-sm border border-slate-200/60 group-hover:shadow-md transition-all duration-300">
                      {feature.icon}
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                            {feature.highlight}
                          </span>
                        </div>
                        <h3 className="text-2xl font-medium text-slate-900 mb-3 leading-tight">
                          {feature.title}
                        </h3>
                      </div>
                      
                      <p className="text-slate-700 leading-relaxed text-lg font-light">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section - More refined */}
        <section className="container mx-auto px-6 py-32">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-light text-slate-900 mb-4">
                Built on <span className="font-semibold">Proven Results</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {[
                { value: 150000, suffix: '+', label: 'Happy Learners', icon: <Users className="w-6 h-6 text-slate-600" /> },
                { value: 500000, suffix: '+', label: 'Videos Created', icon: <Video className="w-6 h-6 text-slate-600" /> },
                { value: 95, suffix: '%', label: 'Learning Success', icon: <Award className="w-6 h-6 text-slate-600" /> },
                { value: 185, suffix: '+', label: 'Countries', icon: <Globe className="w-6 h-6 text-slate-600" /> },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="text-center group"
                >
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/60 hover:shadow-md transition-all duration-300">
                    <div className="flex justify-center mb-4">
                      {stat.icon}
                    </div>
                    <div className="text-3xl md:text-4xl font-light text-slate-900 mb-2">
                      <StatCounter end={stat.value} suffix={stat.suffix} />
                    </div>
                    <p className="text-slate-700 font-medium text-sm uppercase tracking-wider">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Section - Visual storytelling */}
        <section className="container mx-auto px-6 py-32 bg-gradient-to-b from-slate-50/50 to-white">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-5xl font-light mb-8 text-slate-900">
                From Question to 
                <span className="font-semibold"> Understanding</span>
              </h2>
              <p className="text-xl text-slate-700 max-w-2xl mx-auto font-light">
                Three simple steps to get your personalized animated learning video
              </p>
            </motion.div>

            <div className="space-y-24">
              {[
                {
                  step: "01",
                  title: "Enter Your Topic",
                  description: "Type any subject you want to learn - from algebra to astrophysics. Our AI understands your learning needs and current level.",
                  icon: <Lightbulb className="w-12 h-12 text-slate-700" />
                },
                {
                  step: "02", 
                  title: "AI Creates Your Video",
                  description: "Our intelligent system generates a personalized animated video tailored specifically to your learning style and comprehension level.",
                  icon: <Zap className="w-12 h-12 text-slate-700" />
                },
                {
                  step: "03",
                  title: "Learn and Master",
                  description: "Watch your custom video, pause and replay as needed, and truly understand complex concepts through beautiful visualizations.",
                  icon: <TrendingUp className="w-12 h-12 text-slate-700" />
                }
              ].map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2, duration: 0.8 }}
                  className={`flex items-center gap-16 ${index % 2 === 1 ? 'flex-row-reverse' : ''}`}
                >
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-4">
                      <span className="text-6xl font-extralight text-slate-300">
                        {step.step}
                      </span>
                      <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200/60">
                        {step.icon}
                      </div>
                    </div>
                    
                    <h3 className="text-3xl font-medium text-slate-900">
                      {step.title}
                    </h3>
                    
                    <p className="text-lg text-slate-700 leading-relaxed font-light max-w-lg">
                      {step.description}
                    </p>
                  </div>
                  
                  <div className="flex-1 hidden lg:block">
                    <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl border border-slate-200/60 shadow-sm" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Elegant and refined */}
        <section className="container mx-auto px-6 py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="bg-white p-16 rounded-[3rem] shadow-xl border border-slate-200/60 relative overflow-hidden">
              {/* Subtle background elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl opacity-60" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-amber-50 to-orange-50 rounded-full blur-3xl opacity-60" />
              
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-light mb-8 text-slate-900 leading-tight">
                  Ready to 
                  <span className="font-semibold"> Transform</span>
                  <br />
                  Your Learning?
                </h2>
                
                <p className="text-xl text-slate-700 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                  Join millions of learners who are discovering new concepts through personalized animated videos tailored just for them.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                  <Button
                    variant="default"
                    size="xl"
                    className="bg-slate-900 hover:bg-slate-800 text-white px-10 py-4 rounded-2xl shadow-lg hover:shadow-xl"
                    leftIcon={<Play className="w-5 h-5" />}
                    onClick={() => setShowModal(true)}
                  >
                    Start Learning Today
                  </Button>
                </div>
                
                <div className="flex items-center justify-center gap-8 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Free to start</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Instant video generation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Any topic, any level</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </div>

      {/* Modal - Refined design */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white p-12 rounded-3xl shadow-2xl border border-slate-200/60 relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
              
              <div className="text-center mb-8">
                <h3 className="text-3xl font-light text-slate-900 mb-4">
                  Start Your 
                  <span className="font-semibold"> Learning Journey</span>
                </h3>
                <p className="text-slate-700 font-light">
                  Enter your email to get your first personalized learning video
                </p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200"
                  />
                </div>
                
                <Button
                  variant="default"
                  size="lg"
                  fullWidth
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                  className="bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl"
                >
                  Get My First Video
                </Button>
                
                <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Free forever</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Ready in seconds</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
} 