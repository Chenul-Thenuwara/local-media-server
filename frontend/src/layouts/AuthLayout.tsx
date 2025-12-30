import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import TrendingBackground from '../components/ui/TrendingBackground';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4 relative overflow-hidden">

      <TrendingBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 100 }}
        className="w-full max-w-[400px] z-10 relative"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-apple-blue rounded-xl text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Play size={20} fill="currentColor" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{title}</h1>
          <p className="text-gray-400">{subtitle}</p>
        </div>

        <div className="bg-black/60 backdrop-blur-xl rounded-[32px] p-8 shadow-2xl border border-white/10">
          {children}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <Link to="/" className="hover:text-apple-blue transition-colors">
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
