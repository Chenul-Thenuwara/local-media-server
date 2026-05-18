import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, HardDrive, ShieldCheck, Zap, Music, Film, Image, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import TrendingBackground from '../../components/ui/TrendingBackground';
import { useRef } from 'react';

const MARQUEE_ITEMS = ['MOVIES', 'TV SHOWS', 'MUSIC', 'PHOTOS', 'AI POWERED', 'SELF HOSTED', 'PRIVATE', 'UNLIMITED'];

const features = [
  {
    num: '01',
    icon: HardDrive,
    title: 'Self-Hosted',
    desc: 'Your files stay on your hardware. Complete ownership with zero cloud dependency. Your server, your rules.',
  },
  {
    num: '02',
    icon: ShieldCheck,
    title: 'Private & Secure',
    desc: 'No data tracking or analytics. What you watch is strictly your business. End-to-end privacy guaranteed.',
  },
  {
    num: '03',
    icon: Zap,
    title: 'Instant Streaming',
    desc: 'Adaptive HLS streaming ensures smooth playback on any device, anywhere on your network.',
  },
  {
    num: '04',
    icon: Bot,
    title: 'AI Powered',
    desc: 'Ask your AI assistant for personalized recommendations based on your taste and viewing history.',
  },
];

const mediaTypes = [
  { icon: Film, label: 'Movies' },
  { icon: Film, label: 'TV Shows' },
  { icon: Music, label: 'Music' },
  { icon: Image, label: 'Photos' },
];

export default function Welcome() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  return (
    <div ref={containerRef} className="relative bg-black text-white font-sans overflow-x-hidden selection:bg-blue-500/40">

      {/* Dynamic Background */}
      <TrendingBackground />

      {/* ─── NAV ─── */}
      <nav className="fixed top-0 z-50 w-full">
        <div className="mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2.5"
          >
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
              <img src="/favicon.png" alt="Cineora Logo" className="w-full h-full object-cover scale-[1.15]" />
            </div>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 font-bold text-lg md:text-xl tracking-widest uppercase">
              Cineora
            </span>
          </motion.div>

          {/* Nav Links */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-4 md:gap-8"
          >
            <Link to="/login" className="hidden sm:block text-white/60 hover:text-white text-sm tracking-widest uppercase transition-colors duration-200">
              Sign In
            </Link>
            <Link to="/signup">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 bg-white text-black text-xs md:text-sm font-bold px-4 md:px-5 py-2 md:py-2.5 rounded-full hover:bg-white/90 transition-all tracking-widest uppercase"
              >
                Get Started
                <ArrowUpRight size={15} />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <motion.section
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-6"
      >
        {/* Eye-brow label */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="inline-flex items-center gap-3 mb-8"
        >
          <span className="w-8 h-px bg-white/40" />
          <span className="text-white/50 text-xs tracking-[0.35em] uppercase font-medium">
            Your Personal Media Universe
          </span>
          <span className="w-8 h-px bg-white/40" />
        </motion.div>

        {/* Main Headline */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-[clamp(3rem,12vw,10rem)] font-black leading-[0.9] tracking-[-0.04em] mb-0 mt-4 md:mt-0">
            <span className="block text-white mix-blend-difference">Your Media</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-purple-400 to-blue-600">
              Unleashed
            </span>
          </h1>
        </motion.div>

        {/* Sub headline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 md:mt-8 text-white/50 text-base md:text-lg max-w-lg leading-relaxed tracking-wide px-4"
        >
          Stream your entire collection  movies, shows, music and photos  from your own server.
          No subscriptions. No tracking.
        </motion.p>

        {/* Media type badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="flex items-center gap-2 md:gap-3 mt-8 flex-wrap justify-center px-2"
        >
          {mediaTypes.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-[10px] md:text-xs tracking-widest uppercase backdrop-blur-md"
            >
              <Icon size={11} />
              {label}
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.75 }}
          className="flex flex-col sm:flex-row items-center gap-4 mt-10 md:mt-12 w-full sm:w-auto px-4"
        >
          <Link to="/signup" className="w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="group flex justify-center w-full sm:w-auto items-center gap-3 bg-white text-black font-bold px-8 py-4 rounded-full text-xs md:text-sm tracking-widest uppercase hover:bg-white/90 transition-all shadow-[0_0_60px_rgba(255,255,255,0.15)]"
            >
              Start Watching
              <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </motion.button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex justify-center w-full sm:w-auto text-white/60 hover:text-white text-xs md:text-sm tracking-widest uppercase border border-white/15 px-8 py-4 rounded-full backdrop-blur-md hover:border-white/30 transition-all"
            >
              Sign In
            </motion.button>
          </Link>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-white/30 text-[10px] tracking-[0.3em] uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent"
          />
        </motion.div>
      </motion.section>

      {/* ─── MARQUEE ─── */}
      <div className="relative z-10 border-y border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden py-5">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="flex gap-10 whitespace-nowrap w-max"
        >
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="text-[11px] tracking-[0.4em] uppercase text-white/30 font-semibold flex items-center gap-10">
              {item}
              <span className="text-blue-500/50 text-xl">·</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* ─── FEATURES ─── */}
      <section className="relative z-10 bg-black py-20 md:py-32 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-16 md:mb-24"
          >
            <p className="text-white/30 text-[10px] md:text-xs tracking-[0.35em] uppercase mb-4">Why Cineora</p>
            <h2 className="text-4xl md:text-7xl font-black tracking-[-0.03em] leading-tight text-white">
              Built for<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                privacy first.
              </span>
            </h2>
          </motion.div>

          {/* Feature list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5 rounded-2xl md:rounded-3xl overflow-hidden border border-white/5">
            {features.map((f, i) => (
              <motion.div
                key={f.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                className="group p-6 md:p-10 bg-black transition-colors duration-300 cursor-default"
              >
                <div className="flex items-start justify-between mb-6 md:mb-8">
                  <span className="text-white/15 text-xs tracking-[0.3em] font-bold">{f.num}</span>
                  <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 group-hover:border-blue-500/30 group-hover:bg-blue-500/10 transition-all duration-300">
                    <f.icon size={18} />
                  </div>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3 tracking-tight">{f.title}</h3>
                <p className="text-white/40 text-xs md:text-sm leading-relaxed">{f.desc}</p>
                <div className="mt-6 md:mt-8 w-8 h-px bg-white/10 group-hover:w-16 group-hover:bg-blue-500/50 transition-all duration-500" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS STRIP ─── */}
      <section className="relative z-10 bg-white/[0.02] border-y border-white/5 py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {[
            { val: '4K', label: 'Quality Support' },
            { val: 'HLS', label: 'Adaptive Streaming' },
            { val: '100%', label: 'Private & Local' },
            { val: 'AI', label: 'Smart Recommendations' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="text-center"
            >
              <p className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 tracking-tight mb-1 md:mb-2">{stat.val}</p>
              <p className="text-white/30 text-[9px] md:text-xs tracking-[0.2em] md:tracking-[0.25em] uppercase">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative z-10 bg-black py-24 md:py-40 px-4 md:px-8 text-center overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <p className="text-white/30 text-[10px] md:text-xs tracking-[0.35em] uppercase mb-4 md:mb-6">Ready to begin?</p>
          <h2 className="text-5xl md:text-9xl font-black tracking-[-0.04em] text-white leading-none mb-8 md:mb-10">
            Your screen.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Your rules.
            </span>
          </h2>
          <Link to="/signup" className="block w-full sm:w-auto px-4">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 80px rgba(96,165,250,0.3)' }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex justify-center items-center w-full sm:w-auto gap-3 bg-white text-black font-bold px-8 md:px-10 py-4 md:py-5 rounded-full text-xs md:text-base tracking-widest uppercase hover:bg-white/90 transition-all"
            >
              Create Your Server
              <ArrowUpRight size={18} />
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 border-t border-white/5 bg-black py-6 md:py-8 px-4 md:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-white/20 text-xs tracking-[0.3em] uppercase font-bold">Cineora</span>
          <span className="text-white/15 text-[10px] md:text-xs tracking-widest text-center">Your Personal Media Universe</span>
        </div>
      </footer>

    </div>
  );
}
