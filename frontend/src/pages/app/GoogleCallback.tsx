
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

  const code = searchParams.get('code');
  const userStr = localStorage.getItem('user');

  useEffect(() => {
    if (processedRef.current) return;
    if (!code || !userStr) return;

    processedRef.current = true;

    try {
      const userData = JSON.parse(userStr) as User;
      const userId = userData._id;

      api.post('/google-photos/auth/callback', { code, userId })
        .then(() => {
          if (window.opener) {
            window.close();
          } else {
            navigate('/libraries/photos?tab=google');
          }
        })
        .catch(err => {
          console.error('Google Auth Failed:', err);
          setError(err.response?.data?.error || err.message || 'Failed to authenticate with Google');
        });
    } catch (e) {
      console.error('Error parsing user data', e);
      setTimeout(() => setError('Invalid user session'), 0);
    }
  }, [code, userStr, navigate]); // Use primitives in dependency array

  // Handle redirects for missing auth
  useEffect(() => {
    if (!code && userStr) {
      // Just show UI, no auto redirect? Or redirect back?
      // User provided UI says "Return to Library", so no auto redirect needed for !code.
    }
    if (!userStr) {
      const t = setTimeout(() => navigate('/login'), 2000);
      return () => clearTimeout(t);
    }
  }, [code, userStr, navigate]);

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


  if (!code) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-white bg-black">
        <p className="text-red-500 mb-4">No authorization code found</p>
        <button onClick={() => navigate('/libraries/photos')} className="text-gray-400 hover:text-white underline">
          Return to Library
        </button>
      </div>
    );
  }

  if (!localStorage.getItem('user')) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-white bg-black">
        <p className="text-red-500 mb-4">User not logged in</p>
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
