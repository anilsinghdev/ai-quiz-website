import { useState, useEffect, type FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Clock, ListChecks, BarChart3, ChevronRight, Check } from 'lucide-react';
import PageContainer from '@/components/ui/PageContainer';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { fetchCategories } from '@/lib/quizApi';
import { getIconByName } from '@/lib/iconMap';
import type { CategoryWithStats } from '@/lib/types';

const difficultyOptions = [
  { value: 'Easy', label: 'Easy', description: 'Great for beginners', selected: 'border-success-500 bg-success-50 dark:bg-success-950/30', badge: 'bg-success-500' },
  { value: 'Medium', label: 'Medium', description: 'Some challenge', selected: 'border-warning-500 bg-warning-50 dark:bg-warning-950/30', badge: 'bg-warning-500' },
  { value: 'Hard', label: 'Hard', description: 'Test your limits', selected: 'border-error-500 bg-error-50 dark:bg-error-950/30', badge: 'bg-error-500' },
] as const;

const questionCounts = [5, 10, 20];

export default function QuizSetupPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedCategory = searchParams.get('category') || '';

  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(preselectedCategory);
  const [difficulty, setDifficulty] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchCategories();
        if (!cancelled) setCategories(data);
      } catch {
        // categories will be empty, UI shows fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (preselectedCategory) setSelectedCategory(preselectedCategory);
  }, [preselectedCategory]);

  const canStart = selectedCategory && difficulty && questionCount;

  const handleStart = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/quiz?category=${selectedCategory}&difficulty=${difficulty}&count=${questionCount}`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12">
      <PageContainer maxWidth="lg">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">
            Set Up Your Quiz
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Customize your quiz experience and start testing your knowledge
          </p>
        </div>

        <form onSubmit={handleStart} className="space-y-8 max-w-3xl mx-auto">
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg gradient-bg text-white text-sm font-bold">1</span>
              Choose a Category
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {loading
                ? [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 animate-pulse">
                      <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-800" />
                      <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-800" />
                    </div>
                  ))
                : categories.map((cat) => {
                    const Icon = getIconByName(cat.icon_name);
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-white">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${cat.color}`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-center">{cat.name}</span>
                      </button>
                    );
                  })}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg gradient-bg text-white text-sm font-bold">2</span>
              Select Difficulty
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {difficultyOptions.map((opt) => {
                const isSelected = difficulty === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDifficulty(opt.value)}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? opt.selected
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-900 dark:text-white">{opt.label}</span>
                      {isSelected && (
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full ${opt.badge} text-white`}>
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{opt.description}</p>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg gradient-bg text-white text-sm font-bold">3</span>
              Number of Questions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {questionCounts.map((count) => {
                const isSelected = questionCount === count;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <ListChecks className={`h-5 w-5 mx-auto mb-1.5 ${isSelected ? 'text-primary-500' : 'text-slate-400'}`} />
                    <span className="block font-display text-lg font-bold text-slate-900 dark:text-white">{count}</span>
                    <span className="text-xs text-slate-500">questions</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {canStart && (
            <Card className="p-6 animate-fade-in-up bg-primary-50 dark:bg-primary-950/20 border-primary-200 dark:border-primary-800">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Clock className="h-4 w-4 text-primary-500" />
                    <span>~{Math.ceil((questionCount || 0) * 0.75)} min</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <ListChecks className="h-4 w-4 text-primary-500" />
                    <span>{questionCount} questions</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <BarChart3 className="h-4 w-4 text-primary-500" />
                    <span>{difficulty}</span>
                  </div>
                </div>
                <Button type="submit" size="lg" variant="primary">
                  Start Quiz
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </Card>
          )}

          {!canStart && (
            <div className="text-center">
              <Button size="lg" disabled className="opacity-50 cursor-not-allowed">
                Select all options to continue
              </Button>
            </div>
          )}
        </form>
      </PageContainer>
    </div>
  );
}
