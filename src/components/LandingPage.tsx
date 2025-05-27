'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardBadge } from './ui/card';
import { cn } from '@/lib/utils';
import { 
  Sparkles, 
  Zap, 
  Wand2, 
  Video, 
  Download, 
  Users, 
  Star, 
  ArrowRight, 
  Play,
  Code2,
  Palette,
  Clock,
  TrendingUp,
  Shield,
  Globe,
  Check,
  X
} from 'lucide-react';

// Animated background components
const FloatingElement = ({ delay = 0, duration = 20, children, className }: {
  delay?: number
  duration?: number
  children: React.ReactNode
  className?: string
}) => (
  <motion.div
    className={cn('absolute opacity-60', className)}
    animate={{
      y: [-20, 20, -20],
      x: [-10, 10, -10],
      rotate: [0, 5, -5, 0],
    }}
    transition={{
      duration,
      repeat: Infinity,
      delay,
      ease: 'easeInOut',
    }}
  >
    {children}
  </motion.div>
);

const GridPattern = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="grid-pattern opacity-30" />
    <div className="grid-pattern-large opacity-10" />
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
      const startCount = 0;
      
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
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <GridPattern />
        
        {/* Floating geometric elements */}
        <FloatingElement delay={0} duration={25} className="top-20 left-20">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 blur-sm" />
        </FloatingElement>
        
        <FloatingElement delay={5} duration={30} className="top-40 right-32">
          <div className="w-12 h-12 rotate-45 bg-gradient-to-r from-pink-500 to-red-500 opacity-20 blur-sm" />
        </FloatingElement>
        
        <FloatingElement delay={10} duration={35} className="bottom-40 left-40">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-blue-500 opacity-15 blur-sm" />
        </FloatingElement>
        
        <FloatingElement delay={15} duration={28} className="bottom-20 right-20">
          <div className="w-14 h-14 rotate-12 bg-gradient-to-r from-yellow-500 to-orange-500 opacity-20 blur-sm" />
        </FloatingElement>

        {/* Large background gradients */}
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-blue-500/10 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-radial from-purple-500/10 to-transparent blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 bg-gradient-radial from-pink-500/5 to-transparent blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-6 pt-20 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center max-w-5xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium mb-8"
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>Powered by Advanced AI Technology</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 bg-green-400 rounded-full"
              />
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tight mb-8"
            >
              <span className="block">Create Stunning</span>
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-shift">
                Math Animations
              </span>
              <span className="block">in Seconds</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-xl md:text-2xl lg:text-3xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed"
            >
              Transform complex mathematical concepts into beautiful, engaging animations with the power of AI. 
              No coding required, just describe what you want to visualize.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
            >
              <Button
                variant="gradient-cosmic"
                size="xl"
                className="text-lg px-8 py-4 shadow-2xl hover:shadow-glow-blue hover:scale-105 transition-all duration-300"
                leftIcon={<Play className="w-5 h-5" />}
                onClick={() => setShowModal(true)}
              >
                Try ManimNext Free
              </Button>
              
              <Button
                variant="glass"
                size="xl"
                className="text-lg px-8 py-4"
                leftIcon={<Video className="w-5 h-5" />}
              >
                Watch Demo
              </Button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="flex flex-wrap justify-center items-center gap-8 text-slate-400 text-sm"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span>No Coding Required</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Results in Seconds</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-400" />
                <span>Used by 10,000+ Educators</span>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-6 py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Everything you need to create professional mathematical animations that captivate and educate
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {[
              {
                icon: <Wand2 className="w-8 h-8" />,
                title: "AI-Powered Creation",
                description: "Simply describe your mathematical concept in natural language and watch as our AI transforms it into stunning animations.",
                gradient: "from-blue-500 to-cyan-500",
                badge: "Most Popular"
              },
              {
                icon: <Code2 className="w-8 h-8" />,
                title: "No Coding Required",
                description: "Create complex mathematical visualizations without writing a single line of code. Perfect for educators and students.",
                gradient: "from-purple-500 to-pink-500",
              },
              {
                icon: <Palette className="w-8 h-8" />,
                title: "Customizable Styles",
                description: "Choose from dozens of professional themes and color schemes to match your brand or presentation style.",
                gradient: "from-green-500 to-blue-500",
              },
              {
                icon: <Clock className="w-8 h-8" />,
                title: "Lightning Fast",
                description: "Generate high-quality animations in seconds, not hours. Save time and focus on what matters most - teaching.",
                gradient: "from-yellow-500 to-orange-500",
              },
              {
                icon: <Download className="w-8 h-8" />,
                title: "Multiple Formats",
                description: "Export your animations as MP4, GIF, or interactive web components. Perfect for any platform or presentation.",
                gradient: "from-red-500 to-pink-500",
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: "Analytics & Insights",
                description: "Track engagement and understanding with built-in analytics. See how your animations perform in real-time.",
                gradient: "from-indigo-500 to-purple-500",
                badge: "New"
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card
                  variant="glass"
                  size="lg"
                  hover="lift"
                  interactive
                  className="h-full relative group"
                >
                  {feature.badge && (
                    <div className="absolute -top-2 -right-2 z-20">
                      <CardBadge variant="primary" className="text-xs font-bold">
                        {feature.badge}
                      </CardBadge>
                    </div>
                  )}
                  
                  <CardHeader center>
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.gradient} mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                      {feature.icon}
                    </div>
                    <CardTitle size="lg" className="mb-3">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <CardDescription className="text-slate-300 leading-relaxed text-center">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-6 py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Trusted by Educators <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">Worldwide</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 10000, suffix: '+', label: 'Active Users', icon: <Users className="w-6 h-6" /> },
              { value: 50000, suffix: '+', label: 'Animations Created', icon: <Video className="w-6 h-6" /> },
              { value: 95, suffix: '%', label: 'Satisfaction Rate', icon: <Star className="w-6 h-6" /> },
              { value: 150, suffix: '+', label: 'Countries', icon: <Globe className="w-6 h-6" /> },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card variant="glass-strong" size="lg" className="text-center">
                  <CardContent>
                    <div className="flex justify-center mb-4 text-blue-400">
                      {stat.icon}
                    </div>
                    <div className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                      <StatCounter end={stat.value} suffix={stat.suffix} />
                    </div>
                    <p className="text-slate-400 font-medium">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <Card variant="gradient-cosmic" size="2xl" className="text-center relative overflow-hidden">
              {/* Background effects */}
              <div className="absolute inset-0">
                <div className="dot-pattern opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20" />
              </div>
              
              <CardContent className="relative z-10">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                  Ready to Transform Your
                  <span className="block bg-gradient-to-r from-yellow-300 to-white bg-clip-text text-transparent">
                    Teaching Experience?
                  </span>
                </h2>
                
                <p className="text-xl md:text-2xl text-slate-200 mb-10 leading-relaxed">
                  Join thousands of educators who are already creating engaging mathematical content with ManimNext
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <Button
                    variant="premium"
                    size="xl"
                    className="text-lg px-10 py-4 shadow-2xl hover:shadow-glow-white hover:scale-105"
                    leftIcon={<Sparkles className="w-5 h-5" />}
                    onClick={() => setShowModal(true)}
                  >
                    Start Creating Today
                  </Button>
                  
                  <div className="flex items-center gap-2 text-slate-300">
                    <Check className="w-5 h-5 text-green-400" />
                    <span>No credit card required</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>
      </div>

      {/* Modal */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Card variant="glass-strong" size="xl" className="relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
              
              <CardHeader center>
                <CardTitle size="xl" className="mb-4">
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Get Started with ManimNext
                  </span>
                </CardTitle>
                <CardDescription className="text-lg text-slate-300">
                  Enter your email to start creating amazing mathematical animations
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  
                  <Button
                    variant="gradient-cosmic"
                    size="lg"
                    fullWidth
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                    className="text-lg py-4"
                  >
                    Start Creating Animations
                  </Button>
                  
                  <div className="flex items-center justify-center gap-6 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <Check className="w-4 h-4 text-green-400" />
                      <span>Free trial</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Check className="w-4 h-4 text-green-400" />
                      <span>No credit card</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Check className="w-4 h-4 text-green-400" />
                      <span>Cancel anytime</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
} 