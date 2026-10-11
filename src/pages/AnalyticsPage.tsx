import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieIcon, Target, AlertCircle, Home, Sparkles } from 'lucide-react';
import PageContainer from '@/components/ui/PageContainer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import { useAuth } from '@/context/AuthContext';
import { fetchUserAttemptsDetailed, type AttemptWithDetails } from '@/lib/quizApi';
import { analyzePerformance } from '@/lib/aiApi';

const CHART_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

interface ScoreOverTimePoint {
  label: string;
  score: number;
  date: string;
}

interface CategoryPerformancePoint {
  category: string;
  avgScore: number;
  attempts: number;
}

interface CorrectVsIncorrectPoint {
  name: string;
  value: number;
}

export default function AnalyticsPage() {
  const { profile } = useAuth();
  const [attempts, setAttempts] = useState<AttemptWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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
        // empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [profile]);

  const chartData = useMemo(() => {
    // Score over time: chronological order
    const chronological = [...attempts].sort(
      (a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
    );
    const scoreOverTime: ScoreOverTimePoint[] = chronological.map((a, i) => ({
      label: `Q${i + 1}`,
      score: a.score,
      date: new Date(a.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));

    // Category performance
    const categoryMap = new Map<string, { totalScore: number; attempts: number }>();
    attempts.forEach((a) => {
      const existing = categoryMap.get(a.category_name);
      if (existing) {
        existing.totalScore += a.score;
        existing.attempts++;
      } else {
        categoryMap.set(a.category_name, { totalScore: a.score, attempts: 1 });
      }
    });
    const categoryPerformance: CategoryPerformancePoint[] = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        avgScore: Math.round(data.totalScore / data.attempts),
        attempts: data.attempts,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    // Correct vs incorrect
    const totalCorrect = attempts.reduce((s, a) => s + a.correct_answers, 0);
    const totalQuestions = attempts.reduce((s, a) => s + a.total_questions, 0);
    const totalIncorrect = totalQuestions - totalCorrect;
    const correctVsIncorrect: CorrectVsIncorrectPoint[] = [
      { name: 'Correct', value: totalCorrect },
      { name: 'Incorrect', value: totalIncorrect },
    ];

    return { scoreOverTime, categoryPerformance, correctVsIncorrect, totalCorrect, totalIncorrect, totalQuestions };
  }, [attempts]);

  const tooltipStyle = {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '12px',
    padding: '8px 12px',
  };

  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const analysis = await analyzePerformance(
        attempts.map((a) => ({
          quiz_title: a.quiz_title,
          category_name: a.category_name,
          score: a.score,
          total_questions: a.total_questions,
          correct_answers: a.correct_answers,
          difficulty: a.difficulty,
          completed_at: a.completed_at,
        }))
      );
      setAiAnalysis(analysis);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI analysis failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loading size="lg" text="Loading your analytics..." />
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12">
        <PageContainer maxWidth="sm" className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto mb-5">
            <BarChart3 className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-2">No data to analyze yet</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Take a few quizzes to see your performance analytics here.</p>
          <Button to="/quiz-setup" variant="primary" size="md">Take a Quiz</Button>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12">
      <PageContainer maxWidth="xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-primary-500" />
              <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">Performance Analytics</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Your Learning Insights</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Track your progress with detailed visual analytics</p>
          </div>
          <Button to="/dashboard" variant="outline" size="md">
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-5 text-center">
            <p className="font-display text-3xl font-bold text-slate-900 dark:text-white">{attempts.length}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Total Quizzes</p>
          </Card>
          <Card className="p-5 text-center">
            <p className="font-display text-3xl font-bold text-success-600 dark:text-success-400">{chartData.totalCorrect}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Correct Answers</p>
          </Card>
          <Card className="p-5 text-center">
            <p className="font-display text-3xl font-bold text-error-600 dark:text-error-400">{chartData.totalIncorrect}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Incorrect Answers</p>
          </Card>
          <Card className="p-5 text-center">
            <p className="font-display text-3xl font-bold text-primary-600 dark:text-primary-400">
              {chartData.totalQuestions > 0 ? Math.round((chartData.totalCorrect / chartData.totalQuestions) * 100) : 0}%
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Overall Accuracy</p>
          </Card>
        </div>

        {/* Score Over Time */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-950/40">
              <TrendingUp className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">Score Over Time</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Your quiz scores in chronological order</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.scoreOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: unknown) => [`${value}%`, 'Score']}
                labelFormatter={(_label: unknown, payload: ReadonlyArray<{ payload?: ScoreOverTimePoint }>) => {
                  const point = payload?.[0]?.payload;
                  return point ? point.date : '';
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#0ea5e9"
                strokeWidth={3}
                dot={{ fill: '#0ea5e9', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Category Performance */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-100 dark:bg-secondary-950/40">
                <Target className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">Category Performance</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Average score per category</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.categoryPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#94a3b8' }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: unknown) => [`${value}%`, 'Avg Score']}
                />
                <Bar dataKey="avgScore" radius={[8, 8, 0, 0]}>
                  {chartData.categoryPerformance.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Correct vs Incorrect */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 dark:bg-accent-950/40">
                <PieIcon className="h-5 w-5 text-accent-600 dark:text-accent-400" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">Correct vs Incorrect</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">All-time answer breakdown</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.correctVsIncorrect}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }: { name?: string; value?: number; percent?: number }) =>
                    `${name}: ${value} (${((percent ?? 0) * 100).toFixed(0)}%)`
                  }
                  outerRadius={100}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  formatter={(value: string) => <span className="text-slate-600 dark:text-slate-400">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Category breakdown table */}
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-4">Category Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Category</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Quizzes</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Avg Score</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {chartData.categoryPerformance.map((cat, i) => (
                  <tr key={cat.category} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="font-medium text-slate-900 dark:text-white">{cat.category}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4 text-slate-600 dark:text-slate-400">{cat.attempts}</td>
                    <td className="text-center py-3 px-4">
                      <span className={`font-bold ${cat.avgScore >= 75 ? 'text-success-600 dark:text-success-400' : cat.avgScore >= 50 ? 'text-warning-600 dark:text-warning-400' : 'text-error-600 dark:text-error-400'}`}>
                        {cat.avgScore}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="h-2 w-24 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${cat.avgScore}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* AI Performance Analysis */}
        <Card className="p-6 mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">AI Performance Analysis</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Get personalized insights powered by AI</p>
            </div>
          </div>

          {!aiAnalysis && !aiLoading && !aiError && (
            <div className="text-center py-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 max-w-md mx-auto">
                Let AI analyze your quiz history to identify your strengths, weak topics, and personalized recommendations for what to study next.
              </p>
              <Button variant="primary" size="md" onClick={handleAiAnalysis}>
                <Sparkles className="h-4 w-4" />
                Analyze My Performance
              </Button>
            </div>
          )}

          {aiLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loading size="md" text="AI is analyzing your performance..." />
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
                Reviewing {attempts.length} quiz attempts to find patterns and insights.
              </p>
            </div>
          )}

          {aiError && !aiLoading && (
            <div className="text-center py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-error-100 dark:bg-error-950/40 mx-auto mb-3">
                <AlertCircle className="h-6 w-6 text-error-600 dark:text-error-400" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{aiError}</p>
              <Button variant="outline" size="sm" onClick={handleAiAnalysis}>
                Try Again
              </Button>
            </div>
          )}

          {aiAnalysis && !aiLoading && (
            <div className="space-y-4">
              <div className="rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-950/30 dark:to-secondary-950/30 border border-primary-200 dark:border-primary-800 px-5 py-4">
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {aiAnalysis}
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setAiAnalysis(null)}>
                  Clear Analysis
                </Button>
              </div>
            </div>
          )}
        </Card>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button to="/history" variant="primary" size="md">
            View Quiz History
          </Button>
          <Button to="/dashboard" variant="outline" size="md">
            Back to Dashboard
          </Button>
        </div>
      </PageContainer>
    </div>
  );
}
