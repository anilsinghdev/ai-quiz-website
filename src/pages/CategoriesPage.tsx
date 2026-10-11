import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, AlertCircle } from 'lucide-react';
import PageContainer from '@/components/ui/PageContainer';
import Loading from '@/components/ui/Loading';
import { fetchCategories } from '@/lib/quizApi';
import { getIconByName } from '@/lib/iconMap';
import type { CategoryWithStats } from '@/lib/types';

export default function CategoriesPage() {
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchCategories();
        if (!cancelled) {
          setCategories(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Could not load categories. Please try again later.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!search) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, categories]);

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12">
      <PageContainer>
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">
            Explore Categories
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Choose from {categories.length} subjects and start your learning journey
          </p>
        </div>

        <div className="relative max-w-xl mx-auto mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-12 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
          />
        </div>

        {loading && <Loading fullPage text="Loading categories..." />}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-error-100 dark:bg-error-950/40">
              <AlertCircle className="h-7 w-7 text-error-600 dark:text-error-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-400">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((cat) => {
              const Icon = getIconByName(cat.icon_name);
              return (
                <Link
                  key={cat.id}
                  to={`/quiz-setup?category=${cat.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 card-hover"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${cat.color} shadow-lg`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <span className="text-xs font-semibold rounded-full px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {cat.quiz_count} {cat.quiz_count === 1 ? 'quiz' : 'quizzes'}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                    {cat.description}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-500">
                      {cat.total_questions} questions
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 dark:text-primary-400 group-hover:gap-2 transition-all">
                      Start
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && !loading && !error && (
          <div className="text-center py-20">
            <p className="text-slate-500 dark:text-slate-400">No categories found matching "{search}"</p>
          </div>
        )}
      </PageContainer>
    </div>
  );
}
