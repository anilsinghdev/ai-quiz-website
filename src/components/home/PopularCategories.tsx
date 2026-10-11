import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertCircle } from 'lucide-react';
import PageContainer from '@/components/ui/PageContainer';
import { fetchCategories } from '@/lib/quizApi';
import { getIconByName } from '@/lib/iconMap';
import type { CategoryWithStats } from '@/lib/types';

export default function PopularCategories() {
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchCategories();
        if (!cancelled) {
          setCategories(data.slice(0, 4));
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const popular = categories.slice(0, 4);

  return (
    <section className="py-20">
      <PageContainer>
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              Popular Categories
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Explore our most-loved subjects and start learning today
            </p>
          </div>
          <Link
            to="/categories"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:gap-2.5 transition-all"
          >
            View all categories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 animate-pulse">
                <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-slate-800 mb-4" />
                <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-800 mb-2" />
                <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800 mb-2" />
                <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center justify-center gap-3 py-12 rounded-2xl border border-slate-200 dark:border-slate-800">
            <AlertCircle className="h-5 w-5 text-slate-400" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Could not load categories.</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popular.map((cat) => {
              const Icon = getIconByName(cat.icon_name);
              return (
                <Link
                  key={cat.id}
                  to={`/quiz-setup?category=${cat.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 card-hover"
                >
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${cat.color} shadow-lg mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-1">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                    {cat.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-500">
                      {cat.quiz_count} {cat.quiz_count === 1 ? 'quiz' : 'quizzes'}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </PageContainer>
    </section>
  );
}
