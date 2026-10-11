import { useState, type FormEvent } from 'react';
import { Sparkles, Wand2, Save, RefreshCw, Check, AlertCircle, ArrowRight, Trash2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import { useToast } from '@/context/ToastContext';
import { generateQuestions, type GeneratedQuestion } from '@/lib/aiApi';
import { fetchAllCategoriesAdmin, fetchAllQuizzesAdmin, createQuiz, createQuestion } from '@/lib/adminApi';
import type { CategoryRow } from '@/lib/types';
import type { QuizWithCategory } from '@/lib/adminApi';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;

export default function AIQuestionGenerator() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [quizzes, setQuizzes] = useState<QuizWithCategory[]>([]);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<string>('Medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Save flow state
  const [saveMode, setSaveMode] = useState<'new' | 'existing'>('existing');
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizCategoryId, setNewQuizCategoryId] = useState('');
  const [saving, setSaving] = useState(false);

  const loadMeta = async () => {
    try {
      const [cats, qs] = await Promise.all([fetchAllCategoriesAdmin(), fetchAllQuizzesAdmin()]);
      setCategories(cats);
      setQuizzes(qs);
      if (cats.length > 0 && !newQuizCategoryId) setNewQuizCategoryId(cats[0].id);
    } catch {
      showToast('Could not load categories and quizzes.', 'error');
    }
  };

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !topic.trim()) {
      showToast('Please enter both subject and topic.', 'error');
      return;
    }
    setGenerating(true);
    setError(null);
    setGenerated(null);
    try {
      const questions = await generateQuestions({
        subject: subject.trim(),
        topic: topic.trim(),
        difficulty,
        numQuestions,
      });
      setGenerated(questions);
      await loadMeta();
      if (quizzes.length > 0 && !selectedQuizId) setSelectedQuizId(quizzes[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generated || generated.length === 0) return;

    if (saveMode === 'existing' && !selectedQuizId) {
      showToast('Please select a quiz to save questions to.', 'error');
      return;
    }
    if (saveMode === 'new') {
      if (!newQuizTitle.trim()) {
        showToast('Please enter a quiz title.', 'error');
        return;
      }
      if (!newQuizCategoryId) {
        showToast('Please select a category.', 'error');
        return;
      }
    }

    setSaving(true);
    try {
      let quizId = selectedQuizId;

      if (saveMode === 'new') {
        const newQuiz = await createQuiz({
          category_id: newQuizCategoryId,
          title: newQuizTitle.trim(),
          description: `AI-generated quiz about ${topic}`,
          difficulty: difficulty as 'Easy' | 'Medium' | 'Hard',
        });
        quizId = newQuiz.id;
      }

      for (const q of generated) {
        await createQuestion({
          quiz_id: quizId,
          question_text: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
        });
      }

      showToast(`${generated.length} questions saved successfully!`, 'success');
      setGenerated(null);
      setTopic('');
    } catch {
      showToast('Could not save questions. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeQuestion = (idx: number) => {
    if (!generated) return;
    setGenerated(generated.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary-500" />
            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">AI Powered</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">AI Question Generator</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Generate quiz questions with AI in seconds</p>
        </div>
      </div>

      {/* Generation form */}
      <Card className="p-6 mb-6">
        <form onSubmit={handleGenerate} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Subject
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Mathematics, History, Biology"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Topic
              </label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. World War II, Cell Division, Fractions"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Difficulty
              </label>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                      difficulty === d
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Number of Questions: {numQuestions}
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full accent-primary-500 mt-3"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>1</span>
                <span>10</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="md" disabled={generating} loading={generating}>
              <Wand2 className="h-4 w-4" />
              Generate Questions
            </Button>
          </div>
        </form>
      </Card>

      {/* Generating state */}
      {generating && (
        <Card className="p-12 text-center">
          <Loading size="lg" text="AI is crafting your questions..." />
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
            This usually takes a few seconds.
          </p>
        </Card>
      )}

      {/* Error state */}
      {error && !generating && (
        <Card className="p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-error-100 dark:bg-error-950/40 mx-auto mb-4">
            <AlertCircle className="h-7 w-7 text-error-600 dark:text-error-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <Button variant="outline" size="md" onClick={() => setError(null)}>
            Try Again
          </Button>
        </Card>
      )}

      {/* Generated questions review */}
      {generated && !generating && (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                Generated Questions
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {generated.length} question{generated.length !== 1 ? 's' : ''} ready to review and save
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setGenerated(null)}>
                <RefreshCw className="h-4 w-4" />
                Discard
              </Button>
              <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
                <Wand2 className="h-4 w-4" />
                Regenerate
              </Button>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {generated.map((q, i) => (
              <Card key={i} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        {q.difficulty}
                      </span>
                    </div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white mb-3">
                      {q.question}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                            optIdx === q.correct_answer
                              ? 'bg-success-50 dark:bg-success-950/30 text-success-700 dark:text-success-400 font-semibold'
                              : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {optIdx === q.correct_answer && <Check className="h-3 w-3 flex-shrink-0" />}
                          <span className="truncate">{opt}</span>
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeQuestion(i)}
                    className="rounded-lg p-2 text-slate-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-950/30 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {/* Save panel */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Save className="h-5 w-5 text-primary-500" />
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Save to Database
              </h3>
            </div>

            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setSaveMode('existing')}
                className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                  saveMode === 'existing'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                Add to Existing Quiz
              </button>
              <button
                onClick={() => setSaveMode('new')}
                className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                  saveMode === 'new'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                Create New Quiz
              </button>
            </div>

            {saveMode === 'existing' ? (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Select Quiz
                </label>
                {quizzes.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No quizzes available. Switch to "Create New Quiz" to make one.
                  </p>
                ) : (
                  <select
                    value={selectedQuizId}
                    onChange={(e) => setSelectedQuizId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  >
                    {quizzes.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title} ({q.category_name}) — {q.question_count} questions
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Quiz Title
                  </label>
                  <input
                    type="text"
                    value={newQuizTitle}
                    onChange={(e) => setNewQuizTitle(e.target.value)}
                    placeholder="e.g. World War II Basics"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    value={newQuizCategoryId}
                    onChange={(e) => setNewQuizCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <Button
                variant="primary"
                size="md"
                onClick={handleSave}
                loading={saving}
                disabled={generated.length === 0 || (saveMode === 'existing' && quizzes.length === 0)}
              >
                <ArrowRight className="h-4 w-4" />
                Save {generated.length} Question{generated.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
