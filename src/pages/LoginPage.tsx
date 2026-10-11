import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Brain, AlertCircle, LogIn } from 'lucide-react';
import Button from '@/components/ui/Button';
import PageContainer from '@/components/ui/PageContainer';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string })?.from || '/dashboard';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    setLoading(false);
    if (signInError) {
      setError(signInError);
      return;
    }
    showToast('Welcome back!', 'success');
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      <div className="hidden lg:flex relative gradient-bg items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute top-1/4 right-1/4 h-72 w-72 rounded-full bg-white/10 blur-3xl animate-pulse-slow" />
        <div className="relative max-w-md text-white">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="font-display text-2xl font-bold">QuizAI</span>
          </Link>
          <h2 className="font-display text-3xl font-bold mb-4">Welcome back, learner!</h2>
          <p className="text-white/80 leading-relaxed mb-8">
            Pick up right where you left off. Your progress, streaks, and achievements are waiting for you.
          </p>
          <div className="space-y-3">
            {['Personalized quiz recommendations', 'Track your learning progress', 'Compete with friends'].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  <span className="text-xs">✓</span>
                </div>
                <span className="text-white/90">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-slate-950">
        <PageContainer maxWidth="sm" className="w-full">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-bg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              Quiz<span className="gradient-text">AI</span>
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Sign in to your account
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
              Create one
            </Link>
          </p>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-950/30 px-4 py-3 animate-fade-in">
              <AlertCircle className="h-5 w-5 text-error-600 dark:text-error-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-error-700 dark:text-error-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 pl-11 pr-11 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" loading={loading} className="w-full">
              <LogIn className="h-5 w-5" />
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-500">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </PageContainer>
      </div>
    </div>
  );
}
