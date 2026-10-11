import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Clock, Target, Flame, Award, ArrowRight, BarChart3, Zap, Trophy, BookOpen, CheckCircle2, AlertTriangle, Star, TrendingDown } from 'lucide-react';
import PageContainer from '@/components/ui/PageContainer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import { useAuth } from '@/context/AuthContext';
import { useCategories } from '@/lib/useCategories';
import { getIconByName } from '@/lib/iconMap';
import { fetchUserAttemptsDetailed, type AttemptWithDetails } from '@/lib/quizApi';

interface CategoryStat {
  categoryId: string;
  categoryName: string;
  attempts: number;
  avgScore: number;
  totalCorrect: number;
  totalQuestions: number;
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const { categories } = useCategories();
  const [attempts, setAttempts] = useState<AttemptWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchUserAttemptsDetailed(profile.id);
        if (!cancelled) setAttempts(data);
      } catch {
        // empty state will show
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [profile]);

  const stats = useMemo(() => {
    const totalQuizzes = attempts.length;
    const avgScore = totalQuizzes > 0 ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / totalQuizzes) : 0;
    const bestScore = totalQuizzes > 0 ? Math.max(...attempts.map((a) => a.score)) : 0;
    const totalQuestionsAnswered = attempts.reduce((s, a) => s + a.total_questions, 0);
    const totalCorrect = attempts.reduce((s, a) => s + a.correct_answers, 0);
    const totalSeconds = attempts.reduce((s, a) => s + a.time_spent_seconds, 0);
    const studyHours = (totalSeconds / 3600).toFixed(1);

    // streak: consecutive days with at least one attempt ending today or yesterday
    const daysWithQuiz = new Set<string>();
    attempts.forEach((a) => {
      const d = new Date(a.completed_at).toDateString();
      daysWithQuiz.add(d);
    });
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const check = new Date(today);
      check.setDate(check.getDate() - i);
      if (daysWithQuiz.has(check.toDateString())) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    const accuracy = totalQuestionsAnswered > 0 ? Math.round((totalCorrect / totalQuestionsAnswered) * 100) : 0;
    const rank = avgScore >= 90 ? 'Expert' : avgScore >= 75 ? 'Advanced' : avgScore >= 50 ? 'Intermediate' : 'Beginner';

    // Category performance breakdown
    const categoryMap = new Map<string, CategoryStat>();
    attempts.forEach((a) => {
      const existing = categoryMap.get(a.category_id);
      if (existing) {
        existing.attempts++;
        existing.avgScore += a.score;
        existing.totalCorrect += a.correct_answers;
        existing.totalQuestions += a.total_questions;
      } else {
        categoryMap.set(a.category_id, {
          categoryId: a.category_id,
          categoryName: a.category_name,
          attempts: 1,
          avgScore: a.score,
          totalCorrect: a.correct_answers,
          totalQuestions: a.total_questions,
        });
      }
    });

    const categoryStats = Array.from(categoryMap.values()).map((c) => ({
      ...c,
      avgScore: Math.round(c.avgScore / c.attempts),
      accuracy: c.totalQuestions > 0 ? Math.round((c.totalCorrect / c.totalQuestions) * 100) : 0,
    }));

    // Strong subjects: top 3 by avg score (min 1 attempt)
    const strongSubjects = [...categoryStats].sort((a, b) => b.avgScore - a.avgScore).slice(0, 3);
    // Weak subjects: bottom 3 by avg score
    const weakSubjects = [...categoryStats].sort((a, b) => a.avgScore - b.avgScore).slice(0, 3);

    // weekly progress: last 7 days
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const todayIdx = (new Date().getDay() + 6) % 7;
    const weeklyData = weekDays.map((day, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (todayIdx - i));
      const dayAttempts = attempts.filter(
        (a) => new Date(a.completed_at).toDateString() === date.toDateString()
      );
      const dayScore = dayAttempts.length > 0
        ? Math.round(dayAttempts.reduce((s, a) => s + a.score, 0) / dayAttempts.length)
        : 0;
      return { day, score: dayScore };
    });

    return {
      totalQuizzes, avgScore, bestScore, totalQuestionsAnswered, studyHours, streak,
      accuracy, rank, weeklyData, strongSubjects, weakSubjects, categoryStats,
    };
  }, [attempts]);

  const maxWeeklyScore = Math.max(...stats.weeklyData.map((d) => d.score), 1);

  const statCards = [
    { icon: BookOpen, label: 'Total Quizzes', value: stats.totalQuizzes, bg: 'bg-primary-100 dark:bg-primary-950/40' },
    { icon: Target, label: 'Average Score', value: `${stats.avgScore}%`, bg: 'bg-secondary-100 dark:bg-secondary-950/40' },
    { icon: Award, label: 'Best Score', value: `${stats.bestScore}%`, bg: 'bg-accent-100 dark:bg-accent-950/40' },
    { icon: CheckCircle2, label: 'Questions Answered', value: stats.totalQuestionsAnswered, bg: 'bg-success-100 dark:bg-success-950/40' },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12">
      <PageContainer maxWidth="xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Learner'}!
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Here's an overview of your learning progress
            </p>
          </div>
          <div className="flex gap-3">
            <Button to="/analytics" variant="outline" size="md">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
            <Button to="/quiz-setup" variant="primary" size="md">
              <Zap className="h-4 w-4" />
              New Quiz
            </Button>
          </div>
        </div>

        {loading ? (
          <Loading fullPage text="Loading your dashboard..." />
        ) : stats.totalQuizzes === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-950/40 mx-auto mb-5">
              <BookOpen className="h-8 w-8 text-primary-500" />
            </div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-2">Start your journey</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Take your first quiz to see your stats here.</p>
            <Button to="/quiz-setup" variant="primary" size="md">Take Your First Quiz</Button>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label} className="p-5 card-hover">
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${stat.bg} mb-3`}>
                      <Icon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                    </div>
                    <p className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card className="lg:col-span-2 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">Weekly Progress</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your average score over the past week</p>
                  </div>
                  <BarChart3 className="h-5 w-5 text-primary-500" />
                </div>
                <div className="flex items-end justify-between gap-2 sm:gap-4 h-48">
                  {stats.weeklyData.map((day) => (
                    <div key={day.day} className="flex flex-col items-center gap-2 flex-1">
                      <div className="w-full flex items-end justify-center flex-1">
                        <div
                          className="w-full max-w-[40px] rounded-t-lg gradient-bg transition-all duration-700 hover:opacity-80 relative group"
                          style={{ height: `${day.score > 0 ? Math.max((day.score / maxWeeklyScore) * 100, 5) : 2}%`, minHeight: '8px' }}
                        >
                          {day.score > 0 && (
                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-700 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {day.score}%
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{day.day}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-4">Performance</h2>
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Accuracy</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{stats.accuracy}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-cyan-500 transition-all duration-1000" style={{ width: `${stats.accuracy}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Consistency</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {Math.min(100, Math.round((stats.streak / 7) * 100))}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-secondary-500 to-emerald-500 transition-all duration-1000" style={{ width: `${Math.min(100, Math.round((stats.streak / 7) * 100))}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Study Time</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{stats.studyHours}h</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-accent-500 to-orange-500 transition-all duration-1000" style={{ width: `${Math.min(100, Math.round((parseFloat(stats.studyHours) / 10) * 100))}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 dark:bg-accent-950/40">
                      <Trophy className="h-5 w-5 text-accent-600 dark:text-accent-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Current Rank: {stats.rank}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Day streak: {stats.streak} days</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-100 dark:bg-success-950/40">
                    <Star className="h-5 w-5 text-success-600 dark:text-success-400" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">Strong Subjects</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Categories where you excel</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {stats.strongSubjects.map((cat, i) => (
                    <Link
                      key={cat.categoryId}
                      to={`/quiz-setup?category=${cat.categoryId}`}
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-success-300 dark:hover:border-success-700 transition-colors group"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-100 dark:bg-success-950/40 text-sm font-bold text-success-600 dark:text-success-400">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{cat.categoryName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{cat.attempts} {cat.attempts === 1 ? 'quiz' : 'quizzes'} · {cat.accuracy}% accuracy</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold text-lg text-success-600 dark:text-success-400">{cat.avgScore}%</p>
                        <TrendingUp className="h-3.5 w-3.5 text-success-400 ml-auto" />
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-100 dark:bg-warning-950/40">
                    <AlertTriangle className="h-5 w-5 text-warning-600 dark:text-warning-400" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">Weak Subjects</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Areas to focus on improving</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {stats.weakSubjects.map((cat) => (
                    <Link
                      key={cat.categoryId}
                      to={`/quiz-setup?category=${cat.categoryId}`}
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-warning-300 dark:hover:border-warning-700 transition-colors group"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-100 dark:bg-warning-950/40">
                        <TrendingDown className="h-4 w-4 text-warning-600 dark:text-warning-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{cat.categoryName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{cat.attempts} {cat.attempts === 1 ? 'quiz' : 'quizzes'} · {cat.accuracy}% accuracy</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold text-lg text-warning-600 dark:text-warning-400">{cat.avgScore}%</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">Recent Quizzes</h2>
                  {attempts.length > 0 && (
                    <Link to="/history" className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                      View all
                    </Link>
                  )}
                </div>
                <div className="space-y-3">
                  {attempts.slice(0, 5).map((result) => (
                    <Link
                      key={result.id}
                      to={`/result?attemptId=${result.id}`}
                      className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 ${
                        result.score >= 90 ? 'bg-success-100 dark:bg-success-950/40' :
                        result.score >= 70 ? 'bg-primary-100 dark:bg-primary-950/40' :
                        'bg-warning-100 dark:bg-warning-950/40'
                      }`}>
                        {result.score >= 90 ? <Award className="h-5 w-5 text-success-600 dark:text-success-400" /> :
                         result.score >= 70 ? <TrendingUp className="h-5 w-5 text-primary-600 dark:text-primary-400" /> :
                         <Target className="h-5 w-5 text-warning-600 dark:text-warning-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{result.quiz_title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{result.category_name} · {new Date(result.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-display font-bold text-lg ${
                          result.score >= 90 ? 'text-success-600 dark:text-success-400' :
                          result.score >= 70 ? 'text-primary-600 dark:text-primary-400' :
                          'text-warning-600 dark:text-warning-400'
                        }`}>
                          {result.score}%
                        </p>
                        <p className="text-xs text-slate-500">{result.correct_answers}/{result.total_questions}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-5">Recommended</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Categories you might enjoy</p>
                <div className="space-y-3">
                  {categories.slice(0, 3).map((cat) => {
                    const Icon = getIconByName(cat.icon_name);
                    return (
                      <Link
                        key={cat.id}
                        to={`/quiz-setup?category=${cat.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700 transition-colors group"
                      >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${cat.color} flex-shrink-0`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{cat.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{cat.quiz_count} {cat.quiz_count === 1 ? 'quiz' : 'quizzes'}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    );
                  })}
                </div>
                <Link to="/categories" className="mt-4 block">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Categories
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </Card>
            </div>
          </>
        )}
      </PageContainer>
    </div>
  );
}
