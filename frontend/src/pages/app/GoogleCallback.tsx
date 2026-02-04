
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import api from '../../lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  token: string;
}

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const code = searchParams.get('code');
    const userStr = localStorage.getItem('user');

    if (!code) {
      setError('No authorization code found');
      return;
    }

    if (!userStr) {
      setError('User not logged in');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    try {
      const userData = JSON.parse(userStr) as User;
      const userId = userData._id;

      api.post('/google-photos/auth/callback', { code, userId })
        .then(() => {
          // Redirect back to photos library with google tab active
          navigate('/libraries/photos?tab=google');
        })
        .catch(err => {
          console.error('Google Auth Failed:', err);
          setError(err.response?.data?.error || err.message || 'Failed to authenticate with Google');
        });
    } catch (e) {
      console.error('Error parsing user data', e);
      setError('Invalid user session');
    }
  }, []);

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-white bg-black">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => navigate('/libraries/photos')} className="text-gray-400 hover:text-white underline">
          Return to Library
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center text-white bg-black">
      <Loader2 className="animate-spin text-apple-blue mb-4" size={40} />
      <p className="text-gray-400">Connecting Google Photos...</p>
    </div>
  );
};

export default GoogleCallback;
