import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { Search, Plus, Edit2, Trash2, AlertCircle, Inbox, Save, ListChecks } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import {
  fetchAllQuizzesAdmin, createQuiz, updateQuiz, deleteQuiz,
  fetchAllCategoriesAdmin,
  type QuizWithCategory,
} from '@/lib/adminApi';
import type { CategoryRow } from '@/lib/types';

const DIFFICULTY_OPTIONS: Array<'Easy' | 'Medium' | 'Hard'> = ['Easy', 'Medium', 'Hard'];
const DIFFICULTY_STYLES: Record<string, string> = {
  Easy: 'bg-success-100 text-success-700 dark:bg-success-950/40 dark:text-success-400',
  Medium: 'bg-warning-100 text-warning-700 dark:bg-warning-950/40 dark:text-warning-400',
  Hard: 'bg-error-100 text-error-700 dark:bg-error-950/40 dark:text-error-400',
};

interface FormState {
  category_id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export default function AdminQuizzes() {
  const { showToast } = useToast();
  const [quizzes, setQuizzes] = useState<QuizWithCategory[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<QuizWithCategory | null>(null);
  const [form, setForm] = useState<FormState>({
    category_id: '', title: '', description: '', difficulty: 'Medium',
  });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<QuizWithCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const [quizData, catData] = await Promise.all([
        fetchAllQuizzesAdmin(),
        fetchAllCategoriesAdmin(),
      ]);
      setQuizzes(quizData);
      setCategories(catData);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let result = quizzes;
    if (categoryFilter !== 'all') {
      result = result.filter((q) => q.category_id === categoryFilter);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter((q) =>
        q.title.toLowerCase().includes(s) ||
        q.description.toLowerCase().includes(s) ||
        q.category_name.toLowerCase().includes(s)
      );
    }
    return result;
  }, [quizzes, search, categoryFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      category_id: categories[0]?.id ?? '',
      title: '', description: '', difficulty: 'Medium',
    });
    setModalOpen(true);
  };

  const openEdit = (quiz: QuizWithCategory) => {
    setEditing(quiz);
    setForm({
      category_id: quiz.category_id,
      title: quiz.title,
      description: quiz.description,
      difficulty: quiz.difficulty,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.category_id) {
      showToast('Please select a category.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateQuiz(editing.id, form);
        showToast('Quiz updated successfully.', 'success');
      } else {
        await createQuiz(form);
        showToast('Quiz created successfully.', 'success');
      }
      setModalOpen(false);
      await load();
    } catch {
      showToast('Could not save quiz. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteQuiz(deleteTarget.id);
      showToast('Quiz deleted successfully.', 'success');
      setDeleteTarget(null);
      await load();
    } catch {
      showToast('Could not delete quiz.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Quiz Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Create, edit, and delete quizzes</p>
        </div>
        <Button variant="primary" size="md" onClick={openCreate} disabled={categories.length === 0}>
          <Plus className="h-4 w-4" />
          Add Quiz
        </Button>
      </div>

      {categories.length === 0 && !loading && (
        <Card className="p-4 mb-6 bg-warning-50 dark:bg-warning-950/20 border-warning-200 dark:border-warning-800">
          <p className="text-sm text-warning-700 dark:text-warning-400">
            You need to create at least one category before adding quizzes.
          </p>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search quizzes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-11 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loading size="lg" text="Loading quizzes..." />
        </div>
      )}

      {error && !loading && (
        <Card className="p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error-100 dark:bg-error-950/40 mx-auto mb-5">
            <AlertCircle className="h-8 w-8 text-error-600 dark:text-error-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Could not load quizzes.</p>
          <Button variant="outline" size="md" onClick={load}>Retry</Button>
        </Card>
      )}

      {!loading && !error && filtered.length === 0 && (
        <Card className="p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto mb-5">
            <Inbox className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {search || categoryFilter !== 'all' ? 'No quizzes match your filters.' : 'No quizzes yet. Create your first one!'}
          </p>
          {!search && categoryFilter === 'all' && categories.length > 0 && (
            <Button variant="primary" size="md" onClick={openCreate}>Add Quiz</Button>
          )}
        </Card>
      )}

      {!loading && !error && filtered.length > 0 && (
        <Card className="overflow-hidden">
          <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            <div className="col-span-4">Title</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Difficulty</div>
            <div className="col-span-2 text-center">Questions</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((quiz) => (
              <div
                key={quiz.id}
                className="grid sm:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="col-span-4 min-w-0">
                  <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{quiz.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{quiz.description}</p>
                </div>

                <div className="col-span-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{quiz.category_name}</span>
                </div>

                <div className="col-span-2">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${DIFFICULTY_STYLES[quiz.difficulty]}`}>
                    {quiz.difficulty}
                  </span>
                </div>

                <div className="col-span-2 text-center">
                  <span className="font-display font-bold text-slate-900 dark:text-white">{quiz.question_count}</span>
                </div>

                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEdit(quiz)}
                    className="rounded-lg p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(quiz)}
                    className="rounded-lg p-2 text-slate-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-950/30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
            {filtered.length} {filtered.length === 1 ? 'quiz' : 'quizzes'}
          </div>
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Quiz' : 'Add Quiz'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" loading={saving} onClick={handleSave} type="submit" form="quiz-form">
              <Save className="h-4 w-4" />
              {editing ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form id="quiz-form" onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</label>
            <textarea
              required
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Category</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Difficulty</label>
              <div className="flex gap-2">
                {DIFFICULTY_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, difficulty: d }))}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                      form.difficulty === d
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Quiz"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{deleteTarget?.title}</strong>?
          All questions in this quiz will also be deleted.
        </p>
      </Modal>
    </div>
  );
}
