import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight, AlertCircle, Flag, Check, Timer } from 'lucide-react';
import PageContainer from '@/components/ui/PageContainer';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { fetchQuestionsByCategory, fetchQuizForCategory, createQuizAttempt, saveAnswers } from '@/lib/quizApi';
import type { QuestionRow } from '@/lib/types';

const SECONDS_PER_QUESTION = 45;

export default function QuizPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const categoryId = searchParams.get('category') || '';
  const difficulty = searchParams.get('difficulty') || 'Medium';
  const questionCount = parseInt(searchParams.get('count') || '10', 10);

  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const submittedRef = useRef(false);

  const totalQuestions = questionCount;
  const totalTime = totalQuestions * SECONDS_PER_QUESTION;

  useEffect(() => {
    if (!categoryId) {
      setError('No category selected. Please go back and choose a category.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await fetchQuestionsByCategory(categoryId, questionCount);
        if (cancelled) return;
        if (data.length === 0) {
          setError('No questions are available for this category yet.');
          setLoading(false);
          return;
        }
        setQuestions(data);
        setAnswers(new Array(data.length).fill(null));
        startTimeRef.current = Date.now();
        setTimeLeft(data.length * SECONDS_PER_QUESTION);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError('Could not load questions. Please try again.');
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [categoryId, questionCount]);

  const total = questions.length;
  const currentIndexClamped = Math.min(currentIndex, total - 1);
  const question = questions[currentIndexClamped];
  const progress = total > 0 ? ((currentIndexClamped + 1) / total) * 100 : 0;
  const answeredCount = answers.filter((a) => a !== null).length;

  const handleSelect = (optionIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndexClamped] = optionIndex;
      return next;
    });
  };

  const handleNext = useCallback(() => {
    if (currentIndexClamped < total - 1) {
      setCurrentIndex(currentIndexClamped + 1);
    }
  }, [currentIndexClamped, total]);

  const handlePrev = () => {
    if (currentIndexClamped > 0) {
      setCurrentIndex(currentIndexClamped - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const doSubmit = useCallback(async (isAutoSubmit: boolean) => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    if (!user) {
      showToast('You must be signed in to submit a quiz.', 'error');
      submittedRef.current = false;
      return;
    }

    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    let correct = 0;
    const answerRows: { question_id: string; selected_answer: number | null; is_correct: boolean }[] = [];

    questions.forEach((q, i) => {
      const selected = answers[i];
      if (selected === null) {
        answerRows.push({ question_id: q.id, selected_answer: null, is_correct: false });
      } else {
        const isCorrect = selected === q.correct_answer;
        if (isCorrect) correct++;
        answerRows.push({ question_id: q.id, selected_answer: selected, is_correct: isCorrect });
      }
    });

    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);

    try {
      const quiz = await fetchQuizForCategory(categoryId);
      if (!quiz) {
        showToast('Could not find the quiz for this category.', 'error');
        setSubmitting(false);
        submittedRef.current = false;
        return;
      }

      const attempt = await createQuizAttempt({
        quizId: quiz.id,
        categoryId,
        totalQuestions: total,
        correctAnswers: correct,
        score,
        timeSpentSeconds: timeSpent,
        difficulty,
      });

      if (!attempt) {
        showToast('Could not save your quiz attempt.', 'error');
        setSubmitting(false);
        submittedRef.current = false;
        return;
      }

      await saveAnswers(attempt.id, answerRows);

      if (isAutoSubmit) {
        showToast("Time's up! Your quiz has been submitted automatically.", 'info');
      }

      navigate(`/result?attemptId=${attempt.id}`, { replace: true });
    } catch {
      showToast('Could not save your quiz results. Please try again.', 'error');
      setSubmitting(false);
      submittedRef.current = false;
    }
  }, [user, questions, answers, total, categoryId, difficulty, navigate, showToast]);

  // Countdown timer effect
  useEffect(() => {
    if (loading || total === 0 || submittedRef.current) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          doSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, total, doSubmit]);

  const isLowTime = timeLeft <= 30 && timeLeft > 0;
  const isCriticalTime = timeLeft <= 10 && timeLeft > 0;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loading size="lg" text="Loading your quiz questions..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12">
        <PageContainer maxWidth="sm" className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error-100 dark:bg-error-950/40 mx-auto mb-5">
            <AlertCircle className="h-8 w-8 text-error-600 dark:text-error-400" />
          </div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-2">Something went wrong</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <Button to="/quiz-setup" variant="primary" size="md">
            <ChevronLeft className="h-4 w-4" />
            Back to Quiz Setup
          </Button>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 sm:py-12">
      <PageContainer maxWidth="md">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setShowExitModal(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Exit Quiz
          </button>
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 text-sm font-bold rounded-lg px-3 py-1.5 transition-all ${
                isCriticalTime
                  ? 'bg-error-100 dark:bg-error-950/50 text-error-600 dark:text-error-400 animate-pulse'
                  : isLowTime
                    ? 'bg-warning-100 dark:bg-warning-950/50 text-warning-600 dark:text-warning-400'
                    : 'bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400'
              }`}
            >
              {isCriticalTime ? <Timer className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              <span className="tabular-nums">{formatTime(timeLeft)}</span>
            </div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {answeredCount}/{total} answered
            </div>
          </div>
        </div>

        {isCriticalTime && (
          <div className="mb-4 rounded-xl bg-error-50 dark:bg-error-950/30 border border-error-200 dark:border-error-800 px-4 py-2.5 animate-fade-in">
            <p className="text-sm font-semibold text-error-600 dark:text-error-400 text-center">
              Less than 10 seconds remaining! Answer quickly or your quiz will be submitted automatically.
            </p>
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Question {currentIndexClamped + 1} of {total}
            </span>
            <span className="text-slate-500 dark:text-slate-500">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCriticalTime ? 'bg-gradient-to-r from-error-500 to-rose-500' : 'gradient-bg'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 animate-fade-in-up" key={question.id}>
          <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide mb-3">
            Question {currentIndexClamped + 1}
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-6">
            {question.question_text}
          </h2>

          <div className="space-y-3">
            {question.options.map((opt, i) => {
              const isSelected = answers[currentIndexClamped] === i;
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left text-sm font-medium transition-all ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300'
                      : 'border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isSelected ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {isSelected ? <Check className="h-4 w-4" /> : String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">{opt}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              size="md"
              onClick={handlePrev}
              disabled={currentIndexClamped === 0}
              className={currentIndexClamped === 0 ? 'opacity-40' : ''}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {currentIndexClamped === total - 1 ? (
              <Button variant="primary" size="md" onClick={() => setShowSubmitModal(true)}>
                <Flag className="h-4 w-4" />
                Submit Quiz
              </Button>
            ) : (
              <Button variant="primary" size="md" onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {questions.map((_, i) => {
            const isAnswered = answers[i] !== null;
            const isCurrent = i === currentIndexClamped;
            return (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2.5 rounded-full transition-all ${
                  isCurrent
                    ? 'w-8 bg-primary-500'
                    : isAnswered
                      ? 'w-2.5 bg-success-400'
                      : 'w-2.5 bg-slate-200 dark:bg-slate-700'
                }`}
                aria-label={`Go to question ${i + 1}`}
              />
            );
          })}
        </div>

        {currentIndexClamped === total - 1 && (
          <div className="mt-6 text-center">
            <Button
              variant={answeredCount === total ? 'primary' : 'outline'}
              size="md"
              onClick={() => setShowSubmitModal(true)}
              className="w-full sm:w-auto"
            >
              <Flag className="h-4 w-4" />
              {answeredCount === total ? 'Submit Quiz' : `Submit Quiz (${answeredCount}/${total} answered)`}
            </Button>
          </div>
        )}
      </PageContainer>

      {showExitModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowExitModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl animate-scale-in p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-100 dark:bg-warning-950/40">
                <AlertCircle className="h-6 w-6 text-warning-600 dark:text-warning-400" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Exit quiz?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Your progress will be lost. Are you sure you want to leave?
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowExitModal(false)}>
                Keep Going
              </Button>
              <Button variant="danger" size="sm" onClick={() => navigate('/categories')}>
                Exit
              </Button>
            </div>
          </div>
        </div>
      )}

      {showSubmitModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => !submitting && setShowSubmitModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl animate-scale-in p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-950/40">
                <Flag className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Submit your quiz?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {answeredCount === total
                    ? `You've answered all ${total} questions. Your results will be calculated and saved.`
                    : `You've answered ${answeredCount} of ${total} questions. Unanswered questions will be marked as incorrect.`}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Time remaining: {formatTime(timeLeft)}</span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowSubmitModal(false)} disabled={submitting}>
                Review Answers
              </Button>
              <Button variant="primary" size="sm" onClick={() => doSubmit(false)} loading={submitting}>
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
