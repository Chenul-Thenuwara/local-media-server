import { Link } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function ForgotPassword() {
  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email to receive recovery instructions"
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Input
          type="email"
          placeholder="Email address"
          required
        />

        <Button type="submit" className="w-full" size="lg">
          Send Instructions
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
        <Link to="/login" className="text-apple-blue font-medium hover:underline">
          Back to Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
