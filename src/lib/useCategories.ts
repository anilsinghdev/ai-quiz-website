import { useState, useEffect } from 'react';
import { fetchCategories } from '@/lib/quizApi';
import type { CategoryWithStats } from '@/lib/types';

export function useCategories() {
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
      } catch {
        if (!cancelled) setError('Could not load categories.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { categories, loading, error };
}
