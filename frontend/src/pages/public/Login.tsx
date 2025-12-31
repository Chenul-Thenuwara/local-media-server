import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data));
      navigate('/home');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue to your library"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
            {error}
          </div>
        )}
        <Input
          type="email"
          name="email"
          placeholder="Email address"
          required
        />
        <Input
          type="password"
          name="password"
          placeholder="Password"
          required
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-gray-300 cursor-pointer select-none">
            <input type="checkbox" className="rounded border-gray-600 bg-white/10 text-apple-blue focus:ring-apple-blue" />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-apple-blue font-medium hover:text-blue-400 transition-colors">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm text-gray-400">
        Don't have an account?{' '}
        <Link to="/signup" className="text-apple-blue font-medium hover:text-blue-400 transition-colors">
          Create one now
        </Link>
      </div>
    </AuthLayout>
  );
}
