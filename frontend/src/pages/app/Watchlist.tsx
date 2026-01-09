import { motion } from 'framer-motion';
import { Film, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { MediaCard } from '../../components/media/MediaCard';

const MOCK_WATCHLIST = [
  { _id: '1', title: 'Dune: Part Two', filename: 'Dune.Part.Two.2024.2160p.mkv', posterPath: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', isTmdb: true, mediaType: 'movie' as const, tmdbId: 693134 },
  { _id: '2', title: 'Oppenheimer', filename: 'Oppenheimer.2023.2160p.mkv', posterPath: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', isTmdb: true, mediaType: 'movie' as const, tmdbId: 872585 },
  { _id: '3', title: 'The Creator', filename: 'The.Creator.2023.1080p.mkv', posterPath: '/vBZ0qvaRxqEhZwl6LWmruJqWE8Z.jpg', isTmdb: true, mediaType: 'movie' as const, tmdbId: 670292 },
  { _id: '4', title: 'Poor Things', filename: 'Poor.Things.2023.1080p.mkv', posterPath: '/kCGlIMHnOm8JPXq3rXM6c5wMxc8.jpg', isTmdb: true, mediaType: 'movie' as const, tmdbId: 792307 },
  { _id: '5', title: 'Civil War', filename: 'Civil.War.2024.1080p.mkv', posterPath: '/sh7Rg8Er3tFcN9BpKIPOMvALgZd.jpg', isTmdb: true, mediaType: 'movie' as const, tmdbId: 929590 },
];

const Watchlist = () => {
  return (
    <div className="p-8 min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Watchlist
          </h1>
          <p className="text-gray-400 mt-1">Your planned movies and TV shows</p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm font-medium">
            <SlidersHorizontal size={16} />
            <span>Filter</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm font-medium">
            <ArrowUpDown size={16} />
            <span>Sort</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {MOCK_WATCHLIST.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
        >
          {MOCK_WATCHLIST.map((item) => (
            <MediaCard key={item._id} item={item} />
          ))}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Film size={40} className="opacity-50" />
          </div>
          <p className="text-xl font-medium text-gray-400">Your watchlist is empty</p>
          <p className="text-sm mt-2">Add movies and shows to keep track of what to watch next.</p>
        </div>
      )}
    </div>
  );
};

export default Watchlist;
