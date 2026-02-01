
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, FileVideo, User } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';

interface PersonCredit {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type: 'movie' | 'tv';
  character?: string;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
}

interface PersonDetail {
  id: number;
  name: string;
  biography: string;
  profile_path: string | null;
  birthday: string | null;
  place_of_birth: string | null;
  known_for_department: string;
  credits?: {
    cast: PersonCredit[];
  };
}

export default function PersonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [credits, setCredits] = useState<PersonCredit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerson = async () => {
      try {
        setLoading(true);
        // Fetch Details
        const detailsRes = await api.get(`/tmdb/person/${id}`);
        setPerson(detailsRes.data);

        // Fetch Credits
        const creditsRes = await api.get(`/tmdb/person/${id}/combined_credits`);
        if (creditsRes.data.cast) {
          // Sort by popularity (descending)
          const sorted = creditsRes.data.cast
            .filter((c: any) => c.poster_path) // Only show items with posters for better UI
            .sort((a: any, b: any) => b.popularity - a.popularity);
          setCredits(sorted);
        }
      } catch (err) {
        console.error('Failed to fetch person', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPerson();
  }, [id]);

  if (loading) return <div className="h-full flex items-center justify-center text-gray-400">Loading...</div>;
  if (!person) return <div className="h-full flex items-center justify-center text-gray-400">Person not found</div>;

  return (
    <div className="relative min-h-screen text-white w-full lg:-ml-64 lg:w-[calc(100%+16rem)] bg-black">

      {/* Background Blur Effect */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        {person.profile_path && (
          <img
            src={`https://image.tmdb.org/t/p/original${person.profile_path}`}
            className="w-full h-full object-cover blur-3xl scale-125"
            alt=""
          />
        )}
        <div className="absolute inset-0 bg-black/80" />
      </div>

      <div className="relative z-10 px-4 pt-24 lg:px-12 lg:pt-8 lg:pl-[calc(16rem+3rem)]">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-300 hover:text-white mb-8">
          <ArrowLeft className="mr-2" size={20} /> Back
        </Button>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mt-4">
          {/* Profile Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-[240px] md:w-[300px] shrink-0 mx-auto lg:mx-0"
          >
            <div className="rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-gray-900 aspect-[2/3]">
              {person.profile_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/h632${person.profile_path}`}
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <User size={64} />
                </div>
              )}
            </div>

            {/* Personal Info */}
            <div className="mt-6 space-y-4 text-center lg:text-left bg-white/5 p-6 rounded-xl border border-white/10 backdrop-blur-sm">
              <div>
                <h3 className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Known For</h3>
                <p className="font-medium text-gray-200">{person.known_for_department}</p>
              </div>
              {person.birthday && (
                <div>
                  <h3 className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Born</h3>
                  <p className="font-medium text-gray-200 flex items-center justify-center lg:justify-start gap-2">
                    <Calendar size={14} />
                    {person.birthday}
                  </p>
                </div>
              )}
              {person.place_of_birth && (
                <div>
                  <h3 className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Place of Birth</h3>
                  <p className="font-medium text-gray-200 text-sm">{person.place_of_birth}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Bio & Credits */}
          <div className="flex-1 max-w-4xl pt-4 lg:pt-8 text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400"
            >
              {person.name}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-semibold mb-3 text-gray-200 border-l-4 border-apple-blue pl-4">Biography</h3>
              <p className="text-lg text-gray-400 leading-relaxed mb-12 text-justify md:text-left whitespace-pre-wrap">
                {person.biography || "No biography available."}
              </p>
            </motion.div>

            {/* Known For Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-2xl font-bold mb-6 text-white border-b border-white/10 pb-4">Known For</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {credits.slice(0, 15).map((credit) => (
                  <Link
                    to={`/media/tmdb/${credit.media_type}/${credit.id}`}
                    key={`${credit.id}-${credit.media_type}`}
                    className="group relative aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden border border-white/5 hover:border-apple-blue transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    {credit.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w342${credit.poster_path}`}
                        className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                        alt={credit.title || credit.name}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-gray-500">
                        <FileVideo size={32} className="mb-2" />
                        <span className="text-xs">{credit.title || credit.name}</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-xs font-semibold text-white line-clamp-1 group-hover:text-apple-blue transition-colors">
                        {credit.title || credit.name}
                      </p>
                      {credit.character && (
                        <p className="text-[10px] text-gray-300 line-clamp-1 mt-0.5">
                          as {credit.character}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
