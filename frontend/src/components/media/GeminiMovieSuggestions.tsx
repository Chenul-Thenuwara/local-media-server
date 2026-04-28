import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Film, Loader2, ChevronRight, RefreshCw, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

const GEMINI_API_KEY = 'AIzaSyBmtvjkwNgOEw7m_ze95oUDx8wpkh8Jz9c';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

interface SuggestedMovie {
  title: string;
  year: string;
  reason: string;
  genre: string;
  tmdbId?: number;
  posterPath?: string;
}

interface Props {
  movieTitle: string;
  genre?: string;
  overview?: string;
  mediaType?: 'movie' | 'tv';
}

export function GeminiMovieSuggestions({ movieTitle, genre, overview, mediaType = 'movie' }: Props) {
  const [suggestions, setSuggestions] = useState<SuggestedMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enriched, setEnriched] = useState(false);

  const mediaLabel = mediaType === 'tv' ? 'TV show' : 'movie';

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuggestions([]);
    setEnriched(false);

    const prompt = `You are a film expert. Based on the ${mediaLabel} "${movieTitle}"${overview ? ` (${overview.slice(0, 150)}...)` : ''}, suggest 6 similar ${mediaLabel}s the user might enjoy.

Return ONLY a valid JSON array with exactly this structure, no markdown, no extra text:
[
  {
    "title": "Movie Title",
    "year": "2023",
    "reason": "One sentence why it's similar",
    "genre": "Genre"
  }
]

Requirements:
- Mix of well-known and hidden gems
- Different enough to feel fresh but similar in tone/theme
- Be specific about WHY each is recommended
- Return exactly 6 items`;

    try {
      const res = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
        }),
      });

      if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Parse JSON (strip markdown fences if present)
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed: SuggestedMovie[] = JSON.parse(cleaned);
      setSuggestions(parsed);

      // Enrich with TMDB data
      const enriched = await Promise.all(
        parsed.map(async (s) => {
          try {
            const tmdbType = mediaType === 'tv' ? 'tv' : 'movie';
            const r = await api.get(`/tmdb/search?query=${encodeURIComponent(s.title)}&type=${tmdbType}`);
            const results = r.data?.results || [];
            if (results.length > 0) {
              return { ...s, tmdbId: results[0].id, posterPath: results[0].poster_path };
            }
          } catch {
            // silently skip TMDB enrichment failures
          }
          return s;
        })
      );
      setSuggestions(enriched);
      setEnriched(true);
    } catch (e: any) {
      console.error('Gemini suggestions failed', e);
      setError('Could not load suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [movieTitle, overview, mediaType, mediaLabel]);

  useEffect(() => {
    if (movieTitle) fetchSuggestions();
  }, [movieTitle, fetchSuggestions]);

  return (
    <div className="mt-16 mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-purple-500/20 flex items-center justify-center">
            <Sparkles size={20} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">AI Suggestions</h3>
            <p className="text-xs text-gray-500">Powered by Gemini · Based on <span className="text-gray-400 font-medium">{movieTitle}</span></p>
          </div>
        </div>
        {!loading && suggestions.length > 0 && (
          <button
            onClick={fetchSuggestions}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-sm transition-all"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        )}
      </div>

      {/* Loading State */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 gap-4"
          >
            <div className="relative">
              <Loader2 size={32} className="animate-spin text-purple-500" />
              <Sparkles size={14} className="absolute -top-1 -right-1 text-yellow-400 animate-pulse" />
            </div>
            <p className="text-gray-400 text-sm">Gemini is finding perfect recommendations…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={fetchSuggestions} className="text-purple-400 hover:text-purple-300 underline text-sm">Try again</button>
        </div>
      )}

      {/* Suggestions Grid */}
      <AnimatePresence>
        {!loading && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
          >
            {suggestions.map((movie, i) => (
              <motion.div
                key={`${movie.title}-${i}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                {movie.tmdbId ? (
                  <Link
                    to={`/media/${movie.tmdbId}/${mediaType}`}
                    className="group block"
                  >
                    <SuggestionCard movie={movie} enriched={enriched} />
                  </Link>
                ) : (
                  <div className="group">
                    <SuggestionCard movie={movie} enriched={enriched} />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gemini branding */}
      {!loading && suggestions.length > 0 && (
        <p className="text-center text-xs text-gray-700 mt-6">
          ✦ Suggestions generated by Google Gemini AI
        </p>
      )}
    </div>
  );
}

function SuggestionCard({ movie, enriched }: { movie: SuggestedMovie; enriched: boolean }) {
  return (
    <div className="flex flex-col gap-2 group">
      {/* Poster */}
      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-800/60 border border-white/5 group-hover:border-purple-500/40 transition-all shadow-lg group-hover:shadow-purple-500/10 relative">
        {movie.posterPath ? (
          <img
            src={`https://image.tmdb.org/t/p/w300${movie.posterPath}`}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-600 px-2">
            <Film size={28} />
            <span className="text-center text-xs leading-tight">{movie.title}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
          {movie.tmdbId && (
            <span className="text-white text-xs font-medium flex items-center gap-1">
              View <ChevronRight size={12} />
            </span>
          )}
        </div>

        {/* AI badge */}
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500/80 backdrop-blur-sm flex items-center justify-center">
          <Star size={10} className="text-white fill-white" />
        </div>

        {/* Loading shimmer for enrichment */}
        {!enriched && !movie.posterPath && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
        )}
      </div>

      {/* Info */}
      <div>
        <p className="text-white text-xs font-semibold leading-tight truncate group-hover:text-purple-300 transition-colors">{movie.title}</p>
        <p className="text-gray-500 text-[10px] mt-0.5">{movie.year} · {movie.genre}</p>
        <p className="text-gray-400 text-[10px] mt-1 leading-snug line-clamp-2">{movie.reason}</p>
      </div>
    </div>
  );
}
