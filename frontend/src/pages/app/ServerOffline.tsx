import { useState } from 'react';
import { motion } from 'framer-motion';
import { Monitor, RefreshCw, Download, Wifi, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

export default function ServerOffline() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<'idle' | 'found' | 'not_found'>('idle');

  const checkForServer = async () => {
    setChecking(true);
    setStatus('idle');
    try {
      // Re-fetch profile to see if a device registered since last login
      const token = localStorage.getItem('token');
      const email = JSON.parse(localStorage.getItem('user') || '{}')?.email;
      const password = localStorage.getItem('_pw'); // not stored, just illustrative

      // Simpler: Just call the profiles endpoint which will work if server is up via tunnel
      const res = await api.get('/libraries');
      if (res.data) {
        setStatus('found');
        setTimeout(() => navigate('/home'), 1500);
      }
    } catch {
      // Try re-logging in to get a fresh tunnelUrl from MongoDB
      try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;

        if (user?.email) {
          // Ping the discovery endpoint without password (won't work)
          // Instead just signal "not found" and show setup instructions
        }
        setStatus('not_found');
      } catch {
        setStatus('not_found');
      }
    } finally {
      setChecking(false);
    }
  };

  const handleRelogin = () => {
    localStorage.removeItem('tunnelUrl');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      {/* Ambient Background */}
      <div className="fixed inset-0 bg-gradient-radial from-blue-900/10 via-black to-black pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="relative z-10 max-w-lg w-full text-center"
      >
        {/* Icon */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center shadow-2xl"
        >
          <WifiOff size={40} className="text-gray-400" />
        </motion.div>

        <h1 className="text-4xl font-bold text-white mb-3">Media Server Offline</h1>
        <p className="text-gray-400 text-lg mb-10 leading-relaxed">
          Your personal media server isn't running right now. Start the desktop app on your PC to stream your library from anywhere.
        </p>

        {/* Status message */}
        {status === 'found' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center gap-2"
          >
            <Wifi size={18} />
            Server found! Redirecting...
          </motion.div>
        )}
        {status === 'not_found' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400"
          >
            Still offline. Make sure the app is running on your PC.
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={checkForServer}
            disabled={checking}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-colors shadow-lg shadow-blue-500/20"
          >
            <RefreshCw size={18} className={checking ? 'animate-spin' : ''} />
            {checking ? 'Checking...' : 'Check Again'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRelogin}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-2xl transition-colors"
          >
            Sign in Again
          </motion.button>
        </div>

        {/* Setup Steps */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-left space-y-4">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">How to get started</p>

          {[
            {
              icon: <Download size={20} />,
              title: 'Download the Desktop App',
              desc: 'Install the LMS desktop app on your Windows PC or Mac.',
            },
            {
              icon: <Monitor size={20} />,
              title: 'Launch the App',
              desc: 'Open the app. It automatically connects and registers your media server.',
            },
            {
              icon: <RefreshCw size={20} />,
              title: 'Come Back & Sign In',
              desc: 'Return here and sign in. Your full library will appear instantly!',
            },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                {step.icon}
              </div>
              <div>
                <p className="text-white font-semibold">{step.title}</p>
                <p className="text-gray-400 text-sm mt-0.5">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
