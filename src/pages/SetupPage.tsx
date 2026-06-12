import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '../lib/api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { PageLoader } from '../components/ui/LoadingSpinner';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  setupKey: z.string().optional(),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });
type FormData = z.infer<typeof schema>;

export default function SetupPage() {
  const navigate = useNavigate();
  const [isAlreadySetup, setIsAlreadySetup] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.auth.checkSetup().then(r => setIsAlreadySetup(r.isSetup)).catch(() => setIsAlreadySetup(false));
  }, []);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async (data) => {
    setError('');
    try {
      await api.auth.setup({ email: data.email, username: data.username, password: data.password, setupKey: data.setupKey });
      setSuccess('Account created! Redirecting to login…');
      setTimeout(() => navigate('/login'), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Setup failed');
    }
  });

  if (isAlreadySetup === null) return <PageLoader />;

  if (isAlreadySetup) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Account already exists</h2>
          <p className="text-slate-500 mb-4">This application is already set up.</p>
          <Link to="/login" className="text-primary-600 hover:underline">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">₱</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Account</h1>
          <p className="text-slate-500 text-sm mt-1">Set up your Cashflow Tracker</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          {error && <Alert variant="error" className="mb-4">{error}</Alert>}
          {success && <Alert variant="success" className="mb-4">{success}</Alert>}

          <form onSubmit={onSubmit} className="space-y-4">
            <Input label="Email" type="email" placeholder="you@example.com" required error={errors.email?.message} {...register('email')} />
            <Input label="Username" placeholder="your_username" required error={errors.username?.message} {...register('username')} />
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              required
              error={errors.password?.message}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(v => !v)} className="pointer-events-auto text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              {...register('password')}
            />
            <Input label="Confirm Password" type="password" placeholder="Repeat password" required error={errors.confirmPassword?.message} {...register('confirmPassword')} />
            <Input label="Setup Key (if required)" type="password" placeholder="Optional setup key" error={errors.setupKey?.message} {...register('setupKey')} />
            <Button type="submit" className="w-full" loading={isSubmitting}>Create Account</Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
