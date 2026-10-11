import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Award, TrendingUp, Target, Clock, Filter, Inbox, Eye,
} from 'lucide-react';
import PageContainer from '@/components/ui/PageContainer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import { useAuth } from '@/context/AuthContext';
import { fetchUserAttemptsDetailed, type AttemptWithDetails } from '@/lib/quizApi';

export default function HistoryPage() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<AttemptWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchUserAttemptsDetailed(user.id);
        if (!cancelled) {
          setAttempts(data);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const avgScore = attempts.length > 0 ? Math.round(attempts.reduce((sum, r) => sum + r.score, 0) / attempts.length) : 0;
  const bestScore = attempts.length > 0 ? Math.max(...attempts.map((r) => r.score)) : 0;
  const totalTime = attempts.reduce((sum, r) => sum + r.time_spent_seconds, 0);
  const totalTimeStr = totalTime >= 3600 ? `${Math.floor(totalTime / 3600)}h ${Math.floor((totalTime % 3600) / 60)}m` : `${Math.floor(totalTime / 60)}m`;

  const summary = [
    { icon: Target, label: 'Quizzes Taken', value: attempts.length, color: 'text-primary-500', bg: 'bg-primary-100 dark:bg-primary-950/40' },
    { icon: TrendingUp, label: 'Average Score', value: `${avgScore}%`, color: 'text-secondary-500', bg: 'bg-secondary-100 dark:bg-secondary-950/40' },
    { icon: Award, label: 'Best Score', value: `${bestScore}%`, color: 'text-accent-500', bg: 'bg-accent-100 dark:bg-accent-950/40' },
    { icon: Clock, label: 'Total Time', value: totalTimeStr, color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-950/40' },
  ];

  const difficultyBadge: Record<string, string> = {
    Easy: 'bg-success-100 text-success-700 dark:bg-success-950/40 dark:text-success-400',
    Medium: 'bg-warning-100 text-warning-700 dark:bg-warning-950/40 dark:text-warning-400',
    Hard: 'bg-error-100 text-error-700 dark:bg-error-950/40 dark:text-error-400',
  };

  const formatTime = (seconds: number) => {
    if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    if (seconds >= 60) return `${Math.floor(seconds / 60)}m`;
    return `${seconds}s`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12">
      <PageContainer maxWidth="xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Quiz History</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Review all your past quiz attempts and scores</p>
          </div>
          <Button to="/quiz-setup" variant="primary" size="md">
            Take New Quiz
          </Button>
        </div>

        {loading && <Loading fullPage text="Loading your quiz history..." />}

        {error && !loading && (
          <Card className="p-12 text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">Could not load your quiz history.</p>
            <Button to="/quiz-setup" variant="primary" size="md">Take a Quiz Instead</Button>
          </Card>
        )}

        {!loading && !error && attempts.length === 0 && (
          <Card className="p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto mb-5">
              <Inbox className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-2">No quizzes yet</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Take your first quiz to see your results here.</p>
            <Button to="/quiz-setup" variant="primary" size="md">Start a Quiz</Button>
          </Card>
        )}

        {!loading && !error && attempts.length > 0 && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {summary.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label} className="p-5">
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${stat.bg} mb-3`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <p className="font-display text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
                  </Card>
                );
              })}
            </div>

            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">All Attempts</h2>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Filter className="h-4 w-4" />
                  <span>{attempts.length} results</span>
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {attempts.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0 ${
                      result.score >= 90 ? 'bg-success-100 dark:bg-success-950/40' :
                      result.score >= 70 ? 'bg-primary-100 dark:bg-primary-950/40' :
                      'bg-warning-100 dark:bg-warning-950/40'
                    }`}>
                      {result.score >= 90 ? <Award className="h-6 w-6 text-success-600 dark:text-success-400" /> :
                       result.score >= 70 ? <TrendingUp className="h-6 w-6 text-primary-600 dark:text-primary-400" /> :
                       <Target className="h-6 w-6 text-warning-600 dark:text-warning-400" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{result.quiz_title}</p>
                        <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${difficultyBadge[result.difficulty] ?? difficultyBadge.Medium}`}>
                          {result.difficulty}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span>{result.category_name}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(result.time_spent_seconds)}</span>
                        <span>{new Date(result.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className={`font-display font-bold text-xl ${
                        result.score >= 90 ? 'text-success-600 dark:text-success-400' :
                        result.score >= 70 ? 'text-primary-600 dark:text-primary-400' :
                        'text-warning-600 dark:text-warning-400'
                      }`}>
                        {result.score}%
                      </p>
                      <p className="text-xs text-slate-500">{result.correct_answers}/{result.total_questions} correct</p>
                    </div>

                    <Link
                      to={`/result?attemptId=${result.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 dark:bg-primary-950/30 px-3 py-2 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-950/50 transition-colors flex-shrink-0"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Result
                    </Link>
                  </div>
                ))}
              </div>
            </Card>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button to="/analytics" variant="primary" size="md">
                View Analytics
              </Button>
              <Button to="/dashboard" variant="outline" size="md">
                Back to Dashboard
              </Button>
            </div>
          </>
        )}
      </PageContainer>
    </div>
  );
}
