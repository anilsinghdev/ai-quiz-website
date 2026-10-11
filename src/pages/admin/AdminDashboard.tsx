import { useState, useEffect } from 'react';
import { Users, ListChecks, FileQuestion, TrendingUp, Target, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import { fetchAdminStats, type AdminStats } from '@/lib/adminApi';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchAdminStats();
        if (!cancelled) setStats(data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading size="lg" text="Loading admin dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-12 text-center">
        <p className="text-slate-600 dark:text-slate-400 mb-4">Could not load admin statistics.</p>
      </Card>
    );
  }

  const statCards = [
    { icon: Users, label: 'Total Users', value: stats?.total_users ?? 0, bg: 'bg-primary-100 dark:bg-primary-950/40', color: 'text-primary-600 dark:text-primary-400', link: '/admin/users' },
    { icon: ListChecks, label: 'Total Quizzes', value: stats?.total_quizzes ?? 0, bg: 'bg-secondary-100 dark:bg-secondary-950/40', color: 'text-secondary-600 dark:text-secondary-400', link: '/admin/quizzes' },
    { icon: FileQuestion, label: 'Total Questions', value: stats?.total_questions ?? 0, bg: 'bg-accent-100 dark:bg-accent-950/40', color: 'text-accent-600 dark:text-accent-400', link: '/admin/questions' },
    { icon: TrendingUp, label: 'Total Attempts', value: stats?.total_attempts ?? 0, bg: 'bg-success-100 dark:bg-success-950/40', color: 'text-success-600 dark:text-success-400', link: null },
    { icon: Target, label: 'Average Score', value: `${stats?.avg_score ?? 0}%`, bg: 'bg-rose-100 dark:bg-rose-950/40', color: 'text-rose-600 dark:text-rose-400', link: null },
  ];

  const quickLinks = [
    { label: 'Manage Users', desc: 'View, search, and manage user roles', to: '/admin/users', icon: Users },
    { label: 'Manage Categories', desc: 'Create and organize quiz categories', to: '/admin/categories', icon: Target },
    { label: 'Manage Quizzes', desc: 'Add, edit, and delete quizzes', to: '/admin/quizzes', icon: ListChecks },
    { label: 'Manage Questions', desc: 'Create and edit quiz questions', to: '/admin/questions', icon: FileQuestion },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Overview of your platform's activity and content</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const content = (
            <Card className={`p-5 ${stat.link ? 'card-hover cursor-pointer' : ''}`}>
              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${stat.bg} mb-3`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {stat.value}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
            </Card>
          );
          return stat.link ? (
            <Link key={stat.label} to={stat.link}>{content}</Link>
          ) : (
            <div key={stat.label}>{content}</div>
          );
        })}
      </div>

      <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.to} to={link.to}>
              <Card className="p-5 card-hover">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                    <Icon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{link.label}</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{link.desc}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
