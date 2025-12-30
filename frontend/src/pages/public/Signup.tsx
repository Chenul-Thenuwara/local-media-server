import { Link } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function Signup() {
  return (
    <AuthLayout
      title="Create Account"
      subtitle="Start your personal streaming server"
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Input
          type="text"
          placeholder="Full Name"
          required
        />
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
        <Input
          type="password"
          placeholder="Confirm Password"
          required
        />

        <Button type="submit" className="w-full mt-2" size="lg">
          Create Account
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="text-apple-blue font-medium hover:underline">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
