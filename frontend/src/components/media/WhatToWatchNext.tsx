import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, RefreshCw, ChevronDown, ChevronUp, ExternalLink, Music } from 'lucide-react';
import type { MediaItem } from './MediaCard';

const GEMINI_API_KEY = 'AIzaSyBmtvjkwNgOEw7m_ze95oUDx8wpkh8Jz9c';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

interface Suggestion {
  title: string;
  year: string;
  genre: string;
  reason: string;
  rating: string;
}

interface WhatToWatchNextProps {
  items: any[]; // Can be MediaItem or LocalTrack
  type: 'movie' | 'tv' | 'music';
}

async function fetchSuggestions(items: any[], type: 'movie' | 'tv' | 'music'): Promise<Suggestion[]> {
  const libraryList = items
    .slice(0, 30)
    .map((m) => m.title || m.name || m.filename)
    .join(', ');

  const labels: Record<string, string> = { movie: 'movie', tv: 'TV show', music: 'music album/artist' };
  const pluralLabels: Record<string, string> = { movie: 'movies', tv: 'TV shows', music: 'albums' };

  const prompt = `You are a professional entertainment curator AI. Based on this user's ${labels[type]} library: [${libraryList}], suggest exactly 6 ${pluralLabels[type]} they haven't experienced yet that they would love.

Return ONLY a valid JSON array with this exact structure, no extra text:
[
  {
    "title": "Title",
    "year": "2023",
    "genre": "Genre",
    "reason": "One compelling sentence about why they'll love it based on their library.",
    "rating": "8.5/10"
  }
]`;

  const res = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 1200 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON array in Gemini response');
  return JSON.parse(jsonMatch[0]) as Suggestion[];
}

const genreColors: Record<string, string> = {
  Action: 'bg-red-500/20 text-red-300',
  Drama: 'bg-blue-500/20 text-blue-300',
  Comedy: 'bg-yellow-500/20 text-yellow-300',
  Thriller: 'bg-orange-500/20 text-orange-300',
  Horror: 'bg-purple-500/20 text-purple-300',
  Sci: 'bg-cyan-500/20 text-cyan-300',
  Romance: 'bg-pink-500/20 text-pink-300',
  Crime: 'bg-amber-500/20 text-amber-300',
  Animation: 'bg-green-500/20 text-green-300',
  Fantasy: 'bg-violet-500/20 text-violet-300',
  Pop: 'bg-pink-500/20 text-pink-300',
  Rock: 'bg-red-500/20 text-red-300',
  Jazz: 'bg-amber-500/20 text-amber-300',
  Classical: 'bg-blue-500/20 text-blue-300',
  Electronic: 'bg-cyan-500/20 text-cyan-300',
  Hip: 'bg-emerald-500/20 text-emerald-300',
};

function getGenreColor(genre: string): string {
  const first = genre.split(/[\s\/]/)[0];
  return genreColors[first] || 'bg-white/10 text-gray-300';
}

export function WhatToWatchNext({ items, type }: WhatToWatchNextProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const load = async () => {
    if (items.length === 0) {
      setError(`Add some content to your library first!`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const results = await fetchSuggestions(items, type);
      setSuggestions(results);
      setHasLoaded(true);
      setIsOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to get suggestions.');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    setSuggestions([]);
    setHasLoaded(false);
    load();
  };

  const titleText = type === 'music' ? 'What to Listen to Next' : 'What to Watch Next';
  const subText = type === 'music' ? 'album' : type === 'movie' ? 'movie' : 'TV show';

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-apple-blue/5 via-purple-500/5 to-transparent overflow-hidden">
      <button
        onClick={() => (!hasLoaded ? load() : setIsOpen((o) => !o))}
        disabled={loading}
        className="w-full flex items-center justify-between px-5 sm:px-7 py-5 hover:bg-white/5 transition-colors group"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-apple-blue to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            {type === 'music' ? <Music size={20} className="text-white" /> : <Sparkles size={20} className="text-white" />}
          </div>
          <div className="text-left">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">{titleText}</h2>
            <p className="text-xs sm:text-sm text-gray-400">
              {hasLoaded ? `${suggestions.length} AI-curated picks` : `Powered by Gemini AI · Based on your library`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {loading && <Loader2 size={20} className="animate-spin text-apple-blue" />}
          {hasLoaded && !loading && (
            <button onClick={(e) => { e.stopPropagation(); refresh(); }} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <RefreshCw size={16} />
            </button>
          )}
          {!loading && <div className="p-2 text-gray-400 group-hover:text-white transition-colors">{isOpen && hasLoaded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>}
        </div>
      </button>

      {error && <p className="px-7 pb-5 text-sm text-red-400">{error}</p>}

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 sm:px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {suggestions.map((s, i) => (
                <motion.div key={`${s.title}-${i}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 flex flex-col gap-3 group/card">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-white text-sm leading-snug">{s.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{s.year}</p>
                    </div>
                    <a href={`https://www.google.com/search?q=${encodeURIComponent(s.title + ' ' + s.year + ' ' + subText)}`} target="_blank" rel="noreferrer" className="mt-0.5 text-gray-600 hover:text-apple-blue transition-colors shrink-0">
                      <ExternalLink size={14} />
                    </a>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getGenreColor(s.genre)}`}>{s.genre}</span>
                    {s.rating && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300">⭐ {s.rating}</span>}
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed border-t border-white/5 pt-3">{s.reason}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!hasLoaded && !loading && !error && (
        <div className="px-6 pb-6">
          <button onClick={load} className="w-full py-3 rounded-xl bg-gradient-to-r from-apple-blue/30 to-purple-500/30 border border-apple-blue/30 text-white text-sm font-semibold hover:from-apple-blue/50 hover:to-purple-500/50 transition-all flex items-center justify-center gap-2">
            <Sparkles size={16} />
            Generate AI Suggestions
          </button>
        </div>
      )}
    </div>
  );
}
