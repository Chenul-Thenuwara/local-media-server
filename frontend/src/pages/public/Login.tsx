import { Link } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function Login() {
  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue to your library"
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Input
          type="email"
          placeholder="Email address"
          required
        />
        <Input
          type="password"
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

        <Button type="submit" className="w-full" size="lg">
          Sign In
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
