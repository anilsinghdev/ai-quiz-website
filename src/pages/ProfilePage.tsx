import { useState, useEffect, type FormEvent, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, AtSign, User, Calendar, Save, LogOut, Brain, Award, Flame, Target,
  Camera, Upload, type LucideIcon,
} from 'lucide-react';
import PageContainer from '@/components/ui/PageContainer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { fetchUserQuizStats, type UserQuizStats } from '@/lib/quizApi';

interface FormState {
  fullName: string;
  username: string;
  bio: string;
}

export default function ProfilePage() {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({ fullName: '', username: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<UserQuizStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.full_name,
        username: profile.username,
        bio: profile.bio ?? '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!user) {
      setStatsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchUserQuizStats(user.id);
        if (!cancelled) setStats(data);
      } catch {
        // empty state will show
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: form.fullName, username: form.username, bio: form.bio })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      if (error.code === '23505') {
        showToast('That username is already taken.', 'error');
      } else {
        showToast('Could not save your profile. Please try again.', 'error');
      }
      return;
    }
    await refreshProfile();
    showToast('Profile updated successfully!', 'success');
  };

  const handleSignOut = async () => {
    await signOut();
    showToast('You have been signed out.', 'info');
    navigate('/', { replace: true });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be smaller than 2MB.', 'error');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      showToast('Please upload a JPG, PNG, WebP, or GIF image.', 'error');
      return;
    }

    setAvatarUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      showToast('Avatar updated!', 'success');
    } catch {
      showToast('Could not upload avatar. Please try again.', 'error');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const statCards: { icon: LucideIcon; label: string; value: string | number; color: string }[] = [
    { icon: Brain, label: 'Total Quizzes', value: stats?.totalQuizzes ?? 0, color: 'text-primary-500' },
    { icon: Target, label: 'Average Score', value: stats ? `${stats.avgScore}%` : '0%', color: 'text-secondary-500' },
    { icon: Award, label: 'Best Score', value: stats ? `${stats.bestScore}%` : '0%', color: 'text-accent-500' },
    { icon: Flame, label: 'Questions Answered', value: stats?.totalQuestionsAnswered ?? 0, color: 'text-rose-500' },
  ];

  if (!profile) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400">Loading profile...</p>
      </div>
    );
  }

  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12">
      <PageContainer maxWidth="lg">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">My Profile</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your account information and preferences</p>
        </div>

        <Card className="p-6 sm:p-8 mb-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary-400/10 blur-3xl" />
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative group flex-shrink-0">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl gradient-bg text-white font-display text-3xl font-bold shadow-lg shadow-primary-500/30 overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
                ) : (
                  initials || <User className="h-10 w-10" />
                )}
              </div>
              <button
                onClick={handleAvatarClick}
                disabled={avatarUploading}
                className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-colors disabled:opacity-50"
                aria-label="Change avatar"
              >
                {avatarUploading ? (
                  <div className="h-4 w-4 border-2 border-slate-300 border-t-primary-500 rounded-full animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{profile.full_name}</h2>
              <p className="text-slate-500 dark:text-slate-400">@{profile.username}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{profile.email}</p>
              {profile.bio && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-md">{profile.bio}</p>
              )}
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-3 text-xs text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
                <span>Joined {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-5 text-center">
                <Icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                <p className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  {statsLoading ? '—' : stat.value}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
              </Card>
            );
          })}
        </div>

        <Card className="p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-6">Edit Profile</h2>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Username</label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email (read-only)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 pl-11 pr-4 py-3 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                rows={3}
                placeholder="Tell us a bit about yourself..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link to="/dashboard">
                <Button type="button" variant="ghost" size="md">Cancel</Button>
              </Link>
              <Button type="submit" size="md" loading={saving}>
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </Card>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button to="/leaderboard" variant="outline" size="md">
            <Award className="h-4 w-4" />
            View Leaderboard
          </Button>
          <Button to="/analytics" variant="ghost" size="md">
            View Analytics
          </Button>
        </div>
      </PageContainer>
    </div>
  );
}
