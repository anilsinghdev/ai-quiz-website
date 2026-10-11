import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { Search, Plus, Edit2, Trash2, AlertCircle, Inbox, Save, Check, X } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import {
  fetchAllQuestionsAdmin, createQuestion, updateQuestion, deleteQuestion,
  fetchAllQuizzesAdmin,
  type QuestionWithQuiz,
  type QuizWithCategory,
} from '@/lib/adminApi';

interface FormState {
  quiz_id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

const emptyForm: FormState = {
  quiz_id: '', question_text: '', options: ['', '', '', ''], correct_answer: 0, explanation: '',
};

export default function AdminQuestions() {
  const { showToast } = useToast();
  const [questions, setQuestions] = useState<QuestionWithQuiz[]>([]);
  const [quizzes, setQuizzes] = useState<QuizWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [quizFilter, setQuizFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<QuestionWithQuiz | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<QuestionWithQuiz | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const [qData, quizData] = await Promise.all([
        fetchAllQuestionsAdmin(),
        fetchAllQuizzesAdmin(),
      ]);
      setQuestions(qData);
      setQuizzes(quizData);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let result = questions;
    if (quizFilter !== 'all') {
      result = result.filter((q) => q.quiz_id === quizFilter);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter((q) =>
        q.question_text.toLowerCase().includes(s) ||
        q.quiz_title.toLowerCase().includes(s) ||
        q.category_name.toLowerCase().includes(s)
      );
    }
    return result;
  }, [questions, search, quizFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, quiz_id: quizzes[0]?.id ?? '' });
    setModalOpen(true);
  };

  const openEdit = (q: QuestionWithQuiz) => {
    setEditing(q);
    setForm({
      quiz_id: q.quiz_id,
      question_text: q.question_text,
      options: [...q.options],
      correct_answer: q.correct_answer,
      explanation: q.explanation,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.quiz_id) {
      showToast('Please select a quiz.', 'error');
      return;
    }
    if (form.options.some((o) => !o.trim())) {
      showToast('All options must have text.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        quiz_id: form.quiz_id,
        question_text: form.question_text,
        options: form.options,
        correct_answer: form.correct_answer,
        explanation: form.explanation,
      };
      if (editing) {
        await updateQuestion(editing.id, payload);
        showToast('Question updated successfully.', 'success');
      } else {
        await createQuestion(payload);
        showToast('Question created successfully.', 'success');
      }
      setModalOpen(false);
      await load();
    } catch {
      showToast('Could not save question. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteQuestion(deleteTarget.id);
      showToast('Question deleted successfully.', 'success');
      setDeleteTarget(null);
      await load();
    } catch {
      showToast('Could not delete question.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const updateOption = (idx: number, value: string) => {
    setForm((p) => ({
      ...p,
      options: p.options.map((o, i) => (i === idx ? value : o)),
    }));
  };

  const addOption = () => {
    setForm((p) => ({ ...p, options: [...p.options, ''] }));
  };

  const removeOption = (idx: number) => {
    if (form.options.length <= 2) {
      showToast('A question needs at least 2 options.', 'error');
      return;
    }
    setForm((p) => ({
      ...p,
      options: p.options.filter((_, i) => i !== idx),
      correct_answer: p.correct_answer >= idx && p.correct_answer > 0 ? p.correct_answer - 1 : p.correct_answer,
    }));
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Question Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Create, edit, and delete quiz questions</p>
        </div>
        <Button variant="primary" size="md" onClick={openCreate} disabled={quizzes.length === 0}>
          <Plus className="h-4 w-4" />
          Add Question
        </Button>
      </div>

      {quizzes.length === 0 && !loading && (
        <Card className="p-4 mb-6 bg-warning-50 dark:bg-warning-950/20 border-warning-200 dark:border-warning-800">
          <p className="text-sm text-warning-700 dark:text-warning-400">
            You need to create at least one quiz before adding questions.
          </p>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-11 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
          />
        </div>
        <select
          value={quizFilter}
          onChange={(e) => setQuizFilter(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all max-w-[240px]"
        >
          <option value="all">All Quizzes</option>
          {quizzes.map((q) => (
            <option key={q.id} value={q.id}>{q.title}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loading size="lg" text="Loading questions..." />
        </div>
      )}

      {error && !loading && (
        <Card className="p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error-100 dark:bg-error-950/40 mx-auto mb-5">
            <AlertCircle className="h-8 w-8 text-error-600 dark:text-error-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Could not load questions.</p>
          <Button variant="outline" size="md" onClick={load}>Retry</Button>
        </Card>
      )}

      {!loading && !error && filtered.length === 0 && (
        <Card className="p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto mb-5">
            <Inbox className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {search || quizFilter !== 'all' ? 'No questions match your filters.' : 'No questions yet. Create your first one!'}
          </p>
          {!search && quizFilter === 'all' && quizzes.length > 0 && (
            <Button variant="primary" size="md" onClick={openCreate}>Add Question</Button>
          )}
        </Card>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((q) => (
            <Card key={q.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/30 px-2 py-0.5 rounded">
                      {q.category_name}
                    </span>
                    <span className="text-xs text-slate-400">{q.quiz_title}</span>
                  </div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white mb-2">{q.question_text}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {q.options.map((opt, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs ${
                          i === q.correct_answer
                            ? 'bg-success-50 dark:bg-success-950/30 text-success-700 dark:text-success-400 font-semibold'
                            : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {i === q.correct_answer && <Check className="h-3 w-3 flex-shrink-0" />}
                        <span className="truncate">{opt}</span>
                      </div>
                    ))}
                  </div>
                  {q.explanation && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">{q.explanation}</p>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(q)}
                    className="rounded-lg p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(q)}
                    className="rounded-lg p-2 text-slate-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-950/30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Question' : 'Add Question'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" loading={saving} onClick={handleSave} type="submit" form="question-form">
              <Save className="h-4 w-4" />
              {editing ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form id="question-form" onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Quiz</label>
            <select
              value={form.quiz_id}
              onChange={(e) => setForm((p) => ({ ...p, quiz_id: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            >
              <option value="">Select a quiz</option>
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>{q.title} ({q.category_name})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Question Text</label>
            <textarea
              required
              value={form.question_text}
              onChange={(e) => setForm((p) => ({ ...p, question_text: e.target.value }))}
              rows={2}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Options (click the circle to mark correct)</label>
              <button
                type="button"
                onClick={addOption}
                className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
              >
                + Add option
              </button>
            </div>
            <div className="space-y-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, correct_answer: i }))}
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all flex-shrink-0 ${
                      form.correct_answer === i
                        ? 'border-success-500 bg-success-500 text-white'
                        : 'border-slate-300 dark:border-slate-600 text-transparent hover:border-success-400'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  />
                  {form.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-950/30 transition-colors flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Explanation</label>
            <textarea
              value={form.explanation}
              onChange={(e) => setForm((p) => ({ ...p, explanation: e.target.value }))}
              rows={2}
              placeholder="Shown after the user answers..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none"
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Question"
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
          Are you sure you want to delete this question? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
