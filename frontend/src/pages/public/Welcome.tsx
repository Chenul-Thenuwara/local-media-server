import { motion } from 'framer-motion';
import { Play, HardDrive, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import TrendingBackground from '../../components/ui/TrendingBackground';

export default function Welcome() {
  return (
    <div className="relative min-h-screen bg-[#000] text-white font-sans selection:bg-apple-blue selection:text-white overflow-hidden">

      {/* Dynamic Background */}
      <TrendingBackground />

      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold tracking-tight text-lg">
            <div className="w-8 h-8 bg-apple-blue rounded-lg text-white flex items-center justify-center">
              <Play size={16} fill="currentColor" />
            </div>
            <span>LMS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            Your Media. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-apple-blue to-purple-500">
              Unleashed.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            A powerful, self-hosted streaming server for your personal collection.
            No subscriptions. No tracking. Just your content, everywhere.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/signup">
              <Button size="lg" className="shadow-xl shadow-blue-500/20 bg-apple-blue hover:bg-blue-600 border-none">
                Start Watching Now
              </Button>
            </Link>
            <Button variant="glass" size="lg" className="group text-white hover:bg-white/20">
              <span className="mr-2">View Demo</span>
              <Play size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <div className="max-w-7xl mx-auto mt-32 grid md:grid-cols-3 gap-8">
          {[
            {
              icon: HardDrive,
              title: 'Self-Hosted',
              desc: 'Your files stay on your hardware. Complete ownership with zero cloud dependency.'
            },
            {
              icon: ShieldCheck,
              title: 'Private & Secure',
              desc: 'No data tracking or analytics. What you watch is strictly your business.'
            },
            {
              icon: Zap,
              title: 'Instant Streaming',
              desc: 'Adaptive HLS streaming ensures smooth playback on any device, anywhere.'
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="bg-white/5 backdrop-blur-lg p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-apple-blue">
                <feature.icon size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
