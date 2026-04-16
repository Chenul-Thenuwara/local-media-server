import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';

interface AuthError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user || res.data));
      
      if (res.data.tunnelUrl) {
        localStorage.setItem('tunnelUrl', res.data.tunnelUrl);
      }
      
      navigate('/home');
    } catch (err) {
      console.error(err);
      const authErr = err as AuthError;
      setError(
        authErr.response?.data?.message ||
        `Error: ${authErr.message || 'Failed to create account'} (Code: ${authErr.response?.status || 'Network'})`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Start your personal streaming server"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
            {error}
          </div>
        )}
        <Input
          type="text"
          name="name"
          placeholder="Full Name"
          required
        />
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
        <Input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          required
        />

        <Button type="submit" className="w-full mt-2" size="lg" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="text-apple-blue font-medium hover:text-blue-400 transition-colors">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
