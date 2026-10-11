import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AtSign, Eye, EyeOff, Brain, Check, AlertCircle, UserPlus } from 'lucide-react';
import Button from '@/components/ui/Button';
import PageContainer from '@/components/ui/PageContainer';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

interface FormErrors {
  fullName?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { showToast } = useToast();
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const passwordChecks = [
    { test: password.length >= 8, label: 'At least 8 characters' },
    { test: /[A-Z]/.test(password), label: 'One uppercase letter' },
    { test: /[0-9]/.test(password), label: 'One number' },
  ];

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (fullName.trim().length < 2) newErrors.fullName = 'Please enter your full name.';
    if (username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters.';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Please enter a valid email address.';
    if (password.length < 8) newErrors.password = 'Password must be at least 8 characters.';
    if (confirmPassword !== password) newErrors.confirmPassword = 'Passwords do not match.';
    if (!agreed) newErrors.confirmPassword = newErrors.confirmPassword || undefined;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!agreed) {
      setSubmitError('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    if (!validate()) return;

    setLoading(true);
    const { error } = await signUp({ fullName, username, email, password });
    setLoading(false);

    if (error) {
      setSubmitError(error);
      return;
    }

    showToast('Account created! Welcome to QuizAI.', 'success');
    navigate('/dashboard', { replace: true });
  };

  const inputClass = (field: keyof FormErrors) =>
    `w-full rounded-xl border bg-slate-50 dark:bg-slate-900 pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none transition-all ${
      errors[field]
        ? 'border-error-400 dark:border-error-600 focus:border-error-500 focus:ring-2 focus:ring-error-500/20'
        : 'border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
    }`;

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-slate-950 order-2 lg:order-1">
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
            Create your account
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
              Sign in
            </Link>
          </p>

          {submitError && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-950/30 px-4 py-3 animate-fade-in">
              <AlertCircle className="h-5 w-5 text-error-600 dark:text-error-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-error-700 dark:text-error-400">{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setErrors((p) => ({ ...p, fullName: undefined })); }}
                  placeholder="John Doe"
                  className={inputClass('fullName')}
                />
              </div>
              {errors.fullName && <p className="mt-1.5 text-xs text-error-600 dark:text-error-400">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Username
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setErrors((p) => ({ ...p, username: undefined })); }}
                  placeholder="johndoe"
                  className={inputClass('username')}
                />
              </div>
              {errors.username && <p className="mt-1.5 text-xs text-error-600 dark:text-error-400">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                  placeholder="you@example.com"
                  className={inputClass('email')}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-error-600 dark:text-error-400">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                  placeholder="••••••••"
                  className={`${inputClass('password')} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {password && (
                <div className="mt-2.5 space-y-1.5">
                  {passwordChecks.map((check) => (
                    <div key={check.label} className="flex items-center gap-2 text-xs">
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full ${check.test ? 'bg-success-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                        {check.test && <Check className="h-3 w-3" />}
                      </span>
                      <span className={check.test ? 'text-success-600 dark:text-success-400' : 'text-slate-500'}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {errors.password && <p className="mt-1.5 text-xs text-error-600 dark:text-error-400">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: undefined })); }}
                  placeholder="••••••••"
                  className={`${inputClass('confirmPassword')} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1.5 text-xs text-error-600 dark:text-error-400">{errors.confirmPassword}</p>}
            </div>

            <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-primary-600 focus:ring-primary-500"
              />
              <span>
                I agree to the{' '}
                <a href="#" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">Privacy Policy</a>
              </span>
            </label>

            <Button type="submit" size="lg" loading={loading} className="w-full">
              <UserPlus className="h-5 w-5" />
              Create Account
            </Button>
          </form>
        </PageContainer>
      </div>

      <div className="hidden lg:flex relative gradient-bg items-center justify-center p-12 overflow-hidden order-1 lg:order-2">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-white/10 blur-3xl animate-pulse-slow" />
        <div className="relative max-w-md text-white">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="font-display text-2xl font-bold">QuizAI</span>
          </Link>
          <h2 className="font-display text-3xl font-bold mb-4">Start learning smarter today</h2>
          <p className="text-white/80 leading-relaxed mb-8">
            Join thousands of learners using AI-powered quizzes to master new skills and track their growth.
          </p>
          <div className="space-y-3">
            {['Free to start — no credit card needed', 'AI-generated questions that adapt to you', 'Detailed analytics and progress tracking', 'Learn at your own pace, anytime, anywhere'].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-white/90">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
