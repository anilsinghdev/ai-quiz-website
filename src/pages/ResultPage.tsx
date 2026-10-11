import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Trophy, Clock, Target, TrendingUp, Check, X, RotateCcw, Home, Award, AlertCircle, MinusCircle, BookOpen } from 'lucide-react';
import PageContainer from '@/components/ui/PageContainer';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import { fetchAttemptWithDetails, fetchUserAttempts } from '@/lib/quizApi';
import type { QuizAttemptRow, AnswerRow } from '@/lib/types';

export default function ResultPage() {
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attemptId') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<QuizAttemptRow | null>(null);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [previousScore, setPreviousScore] = useState<number | null>(null);

  useEffect(() => {
    if (!attemptId) {
      setError('No quiz result found.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const result = await fetchAttemptWithDetails(attemptId);
        if (cancelled || !result) {
          if (!cancelled) {
            setError('Could not find your quiz results.');
            setLoading(false);
          }
          return;
        }

        setAttempt(result.attempt);
        setAnswers(result.answers);

        if (result.attempt.user_id) {
          const allAttempts = await fetchUserAttempts(result.attempt.user_id);
          const sorted = allAttempts.sort(
            (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
          );
          const currentIdx = sorted.findIndex((a) => a.id === attemptId);
          if (currentIdx >= 0 && currentIdx < sorted.length - 1) {
            if (!cancelled) setPreviousScore(sorted[currentIdx + 1].score);
          }
        }

        if (!cancelled) setLoading(false);
      } catch {
        if (!cancelled) {
          setError('Could not load your quiz results.');
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loading size="lg" text="Loading your results..." />
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12">
        <PageContainer maxWidth="sm" className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error-100 dark:bg-error-950/40 mx-auto mb-5">
            <AlertCircle className="h-8 w-8 text-error-600 dark:text-error-400" />
          </div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-2">No results found</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error || 'We could not find the quiz result you are looking for.'}</p>
          <Button to="/dashboard" variant="primary" size="md">
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </PageContainer>
      </div>
    );
  }

  const total = attempt.total_questions;
  const correct = attempt.correct_answers;
  const incorrect = answers.filter((a) => !a.is_correct && a.selected_answer !== null).length;
  const unanswered = answers.filter((a) => a.selected_answer === null).length;
  const score = attempt.score;
  const timeMinutes = Math.floor(attempt.time_spent_seconds / 60);
  const timeSeconds = attempt.time_spent_seconds % 60;
  const timeStr = timeMinutes > 0 ? `${timeMinutes}m ${timeSeconds}s` : `${timeSeconds}s`;

  const scoreMessage =
    score >= 90 ? 'Outstanding!' : score >= 75 ? 'Great job!' : score >= 50 ? 'Good effort!' : 'Keep practicing!';

  const scoreChange = previousScore !== null ? score - previousScore : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12">
      <PageContainer maxWidth="lg">
        <div className="text-center mb-10">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl gradient-bg shadow-xl shadow-primary-500/30 mb-5 animate-scale-in">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            {scoreMessage}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">You've completed the quiz. Here's how you did.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-success-100 dark:bg-success-950/40 mb-3">
              <Check className="h-6 w-6 text-success-600 dark:text-success-400" />
            </div>
            <p className="font-display text-3xl font-bold text-slate-900 dark:text-white">{correct}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Correct</p>
          </Card>
          <Card className="p-6 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-error-100 dark:bg-error-950/40 mb-3">
              <X className="h-6 w-6 text-error-600 dark:text-error-400" />
            </div>
            <p className="font-display text-3xl font-bold text-slate-900 dark:text-white">{incorrect}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Wrong</p>
          </Card>
          <Card className="p-6 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 mb-3">
              <MinusCircle className="h-6 w-6 text-slate-500 dark:text-slate-400" />
            </div>
            <p className="font-display text-3xl font-bold text-slate-900 dark:text-white">{unanswered}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Unanswered</p>
          </Card>
          <Card className="p-6 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-950/40 mb-3">
              <Clock className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <p className="font-display text-2xl font-bold text-slate-900 dark:text-white">{timeStr}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Time Taken</p>
          </Card>
        </div>

        <Card className="p-8 mb-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary-400/10 blur-3xl" />
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative flex h-24 w-24 items-center justify-center">
                <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" strokeWidth="8" className="stroke-slate-200 dark:stroke-slate-800" />
                  <circle
                    cx="50" cy="50" r="44" fill="none" strokeWidth="8"
                    strokeLinecap="round"
                    className="stroke-primary-500 transition-all duration-1000"
                    strokeDasharray={`${(score / 100) * 276.46} 276.46`}
                  />
                </svg>
                <span className="absolute font-display text-2xl font-bold text-slate-900 dark:text-white">{score}%</span>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Your Score</p>
                <p className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  {correct}/{total}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Award className="h-4 w-4 text-accent-500" />
                  <span className="text-sm font-semibold text-accent-600 dark:text-accent-400">
                    {score >= 90 ? 'Expert' : score >= 70 ? 'Proficient' : score >= 50 ? 'Intermediate' : 'Beginner'}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full sm:w-auto">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 text-center min-w-[120px]">
                <Target className="h-5 w-5 text-primary-500 mx-auto mb-1" />
                <p className="font-display text-xl font-bold text-slate-900 dark:text-white">{score}%</p>
                <p className="text-xs text-slate-500">Accuracy</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 text-center min-w-[120px]">
                <TrendingUp className={`h-5 w-5 mx-auto mb-1 ${scoreChange !== null && scoreChange >= 0 ? 'text-secondary-500' : 'text-error-500'}`} />
                <p className={`font-display text-xl font-bold ${scoreChange !== null && scoreChange >= 0 ? 'text-secondary-600 dark:text-secondary-400' : 'text-error-600 dark:text-error-400'}`}>
                  {scoreChange === null ? '—' : scoreChange >= 0 ? `+${scoreChange}%` : `${scoreChange}%`}
                </p>
                <p className="text-xs text-slate-500">vs. Last Quiz</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button to={`/review?attemptId=${attemptId}`} variant="primary" size="lg">
            <BookOpen className="h-5 w-5" />
            Review Answers
          </Button>
          <Button to="/quiz-setup" variant="outline" size="lg">
            <RotateCcw className="h-5 w-5" />
            Try Again
          </Button>
          <Button to="/dashboard" variant="ghost" size="lg">
            <Home className="h-5 w-5" />
            Dashboard
          </Button>
        </div>
      </PageContainer>
    </div>
  );
}
