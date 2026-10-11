import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Check, X, MinusCircle, ChevronLeft, AlertCircle, BookOpen, Sparkles } from 'lucide-react';
import PageContainer from '@/components/ui/PageContainer';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import { fetchAttemptWithDetails } from '@/lib/quizApi';
import { supabase } from '@/lib/supabase';
import { explainAnswer } from '@/lib/aiApi';
import type { QuizAttemptRow, AnswerRow, QuestionRow } from '@/lib/types';

export default function ReviewPage() {
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attemptId') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<QuizAttemptRow | null>(null);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [aiError, setAiError] = useState<Record<string, string>>({});

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

        const questionIds = result.answers.map((a) => a.question_id);
        if (questionIds.length > 0) {
          const { data: qs, error: qError } = await supabase
            .from('questions')
            .select('*')
            .in('id', questionIds);

          if (qError) throw qError;
          if (!cancelled) setQuestions((qs ?? []) as QuestionRow[]);
        }

        if (!cancelled) setLoading(false);
      } catch {
        if (!cancelled) {
          setError('Could not load your quiz review.');
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loading size="lg" text="Loading answer review..." />
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
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-2">No review available</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error || 'We could not find the quiz to review.'}</p>
          <Button to="/dashboard" variant="primary" size="md">
            Go to Dashboard
          </Button>
        </PageContainer>
      </div>
    );
  }

  const answerMap = new Map<string, AnswerRow>();
  answers.forEach((a) => answerMap.set(a.question_id, a));

  const orderedQuestions = questions.sort((a, b) => {
    const aIdx = answers.findIndex((ans) => ans.question_id === a.id);
    const bIdx = answers.findIndex((ans) => ans.question_id === b.id);
    return aIdx - bIdx;
  });

  const correctCount = answers.filter((a) => a.is_correct).length;
  const wrongCount = answers.filter((a) => !a.is_correct && a.selected_answer !== null).length;
  const unansweredCount = answers.filter((a) => a.selected_answer === null).length;

  const handleAiExplain = async (q: QuestionRow, userAnswer: AnswerRow | undefined) => {
    setAiLoading((p) => ({ ...p, [q.id]: true }));
    setAiError((p) => {
      const next = { ...p };
      delete next[q.id];
      return next;
    });
    try {
      const explanation = await explainAnswer({
        question: q.question_text,
        options: q.options,
        correctAnswer: q.correct_answer,
        userAnswer: userAnswer?.selected_answer ?? null,
      });
      setAiExplanations((p) => ({ ...p, [q.id]: explanation }));
    } catch (err) {
      setAiError((p) => ({ ...p, [q.id]: err instanceof Error ? err.message : 'AI explanation failed.' }));
    } finally {
      setAiLoading((p) => ({ ...p, [q.id]: false }));
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12">
      <PageContainer maxWidth="lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-5 w-5 text-primary-500" />
              <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">Answer Review</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
              Review Your Answers
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              See where you excelled and where you can improve
            </p>
          </div>
          <Link to={`/result?attemptId=${attemptId}`}>
            <Button variant="outline" size="md">
              <ChevronLeft className="h-4 w-4" />
              Back to Results
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-4 text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-success-100 dark:bg-success-950/40 mb-2">
              <Check className="h-5 w-5 text-success-600 dark:text-success-400" />
            </div>
            <p className="font-display text-2xl font-bold text-slate-900 dark:text-white">{correctCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Correct</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-error-100 dark:bg-error-950/40 mb-2">
              <X className="h-5 w-5 text-error-600 dark:text-error-400" />
            </div>
            <p className="font-display text-2xl font-bold text-slate-900 dark:text-white">{wrongCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Wrong</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 mb-2">
              <MinusCircle className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            </div>
            <p className="font-display text-2xl font-bold text-slate-900 dark:text-white">{unansweredCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Unanswered</p>
          </Card>
        </div>

        <div className="space-y-4">
          {orderedQuestions.map((q, i) => {
            const userAnswer = answerMap.get(q.id);
            const selected = userAnswer?.selected_answer ?? null;
            const isCorrect = userAnswer?.is_correct ?? false;
            const isUnanswered = selected === null;

            return (
              <Card key={q.id} className="p-6">
                <div className="flex items-start gap-4">
                  <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    isCorrect ? 'bg-success-500 text-white' :
                    isUnanswered ? 'bg-slate-300 dark:bg-slate-600 text-white' :
                    'bg-error-500 text-white'
                  }`}>
                    {isCorrect ? <Check className="h-4 w-4" /> : isUnanswered ? <MinusCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Question {i + 1}</span>
                      <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
                        isCorrect ? 'bg-success-100 text-success-700 dark:bg-success-950/40 dark:text-success-400' :
                        isUnanswered ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' :
                        'bg-error-100 text-error-700 dark:bg-error-950/40 dark:text-error-400'
                      }`}>
                        {isCorrect ? 'Correct' : isUnanswered ? 'Not Answered' : 'Incorrect'}
                      </span>
                    </div>

                    <p className="font-display text-lg font-bold text-slate-900 dark:text-white mb-4">
                      {q.question_text}
                    </p>

                    <div className="space-y-2 mb-4">
                      {q.options.map((opt, optIdx) => {
                        const isCorrectOption = optIdx === q.correct_answer;
                        const isUserChoice = optIdx === selected;

                        let stateClass = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';
                        let badgeClass = 'bg-slate-100 dark:bg-slate-800 text-slate-500';
                        let icon: React.ReactNode = null;

                        if (isCorrectOption) {
                          stateClass = 'border-success-500 bg-success-50 dark:bg-success-950/30';
                          badgeClass = 'bg-success-500 text-white';
                          icon = <Check className="h-4 w-4" />;
                        } else if (isUserChoice && !isCorrectOption) {
                          stateClass = 'border-error-500 bg-error-50 dark:bg-error-950/30';
                          badgeClass = 'bg-error-500 text-white';
                          icon = <X className="h-4 w-4" />;
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm ${stateClass}`}
                          >
                            <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${badgeClass}`}>
                              {icon ?? String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className={`flex-1 ${
                              isCorrectOption ? 'text-success-700 dark:text-success-400 font-medium' :
                              isUserChoice && !isCorrectOption ? 'text-error-700 dark:text-error-400 font-medium' :
                              'text-slate-600 dark:text-slate-400'
                            }`}>
                              {opt}
                            </span>
                            {isCorrectOption && (
                              <span className="text-xs font-bold text-success-600 dark:text-success-400">Correct Answer</span>
                            )}
                            {isUserChoice && !isCorrectOption && (
                              <span className="text-xs font-bold text-error-600 dark:text-error-400">Your Answer</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {isUnanswered && (
                      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 py-3 mb-3">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          <span className="font-semibold">Your answer:</span> <span className="italic">Not answered</span>
                        </p>
                      </div>
                    )}

                    <div className="rounded-xl bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800 px-4 py-3">
                      <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide mb-1">
                        Explanation
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {q.explanation}
                      </p>
                    </div>

                    {!isCorrect && (
                      <div className="mt-3">
                        {!aiExplanations[q.id] && !aiLoading[q.id] && (
                          <button
                            onClick={() => handleAiExplain(q, userAnswer)}
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950/20 px-4 py-2.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:border-primary-400 dark:hover:border-primary-600 transition-all"
                          >
                            <Sparkles className="h-4 w-4" />
                            Get AI Explanation
                          </button>
                        )}

                        {aiLoading[q.id] && (
                          <div className="inline-flex items-center gap-2 rounded-xl border-2 border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950/20 px-4 py-2.5 text-sm font-semibold text-primary-600 dark:text-primary-400">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-400 border-t-transparent" />
                            AI is explaining...
                          </div>
                        )}

                        {aiError[q.id] && !aiLoading[q.id] && (
                          <div className="space-y-2">
                            <p className="text-sm text-error-600 dark:text-error-400">{aiError[q.id]}</p>
                            <button
                              onClick={() => handleAiExplain(q, userAnswer)}
                              className="inline-flex items-center gap-2 rounded-xl border-2 border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950/20 px-4 py-2.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:border-primary-400 dark:hover:border-primary-600 transition-all"
                            >
                              <Sparkles className="h-4 w-4" />
                              Try Again
                            </button>
                          </div>
                        )}

                        {aiExplanations[q.id] && (
                          <div className="rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-950/30 dark:to-secondary-950/30 border border-primary-300 dark:border-primary-700 px-4 py-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-500 text-white">
                                <Sparkles className="h-3.5 w-3.5" />
                              </div>
                              <p className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wide">
                                AI Tutor Explanation
                              </p>
                            </div>
                            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {aiExplanations[q.id]}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button to={`/result?attemptId=${attemptId}`} variant="primary" size="lg">
            <ChevronLeft className="h-5 w-5" />
            Back to Results
          </Button>
          <Button to="/quiz-setup" variant="outline" size="lg">
            Try Again
          </Button>
          <Button to="/dashboard" variant="ghost" size="lg">
            Dashboard
          </Button>
        </div>
      </PageContainer>
    </div>
  );
}
