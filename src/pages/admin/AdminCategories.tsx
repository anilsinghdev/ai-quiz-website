import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { Search, Plus, Edit2, Trash2, AlertCircle, Inbox, Save, X } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import { getIconByName } from '@/lib/iconMap';
import {
  fetchAllCategoriesAdmin, createCategory, updateCategory, deleteCategory,
} from '@/lib/adminApi';
import type { CategoryRow } from '@/lib/types';

const ICON_OPTIONS = ['FileCode', 'Coffee', 'Code', 'Palette', 'Database', 'Network', 'Monitor', 'Workflow', 'Cpu', 'CircuitBoard', 'Globe'];

const COLOR_OPTIONS = [
  'from-blue-500 to-cyan-500',
  'from-green-500 to-emerald-500',
  'from-orange-500 to-red-500',
  'from-amber-500 to-yellow-500',
  'from-rose-500 to-pink-500',
  'from-teal-500 to-cyan-500',
  'from-indigo-500 to-blue-500',
  'from-purple-500 to-violet-500',
];

interface FormState {
  slug: string;
  name: string;
  description: string;
  icon_name: string;
  color: string;
  sort_order: number;
}

const emptyForm: FormState = {
  slug: '', name: '', description: '', icon_name: 'FileCode', color: 'from-blue-500 to-cyan-500', sort_order: 0,
};

export default function AdminCategories() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchAllCategoriesAdmin();
      setCategories(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter((c) =>
      c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );
  }, [categories, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, sort_order: categories.length });
    setModalOpen(true);
  };

  const openEdit = (cat: CategoryRow) => {
    setEditing(cat);
    setForm({
      slug: cat.slug, name: cat.name, description: cat.description,
      icon_name: cat.icon_name, color: cat.color, sort_order: cat.sort_order,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateCategory(editing.id, form);
        showToast('Category updated successfully.', 'success');
      } else {
        await createCategory(form);
        showToast('Category created successfully.', 'success');
      }
      setModalOpen(false);
      await load();
    } catch {
      showToast('Could not save category. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteTarget.id);
      showToast('Category deleted successfully.', 'success');
      setDeleteTarget(null);
      await load();
    } catch {
      showToast('Could not delete category. It may have quizzes attached.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Category Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Create, edit, and delete quiz categories</p>
        </div>
        <Button variant="primary" size="md" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-11 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loading size="lg" text="Loading categories..." />
        </div>
      )}

      {error && !loading && (
        <Card className="p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error-100 dark:bg-error-950/40 mx-auto mb-5">
            <AlertCircle className="h-8 w-8 text-error-600 dark:text-error-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Could not load categories.</p>
          <Button variant="outline" size="md" onClick={load}>Retry</Button>
        </Card>
      )}

      {!loading && !error && filtered.length === 0 && (
        <Card className="p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto mb-5">
            <Inbox className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {search ? 'No categories match your search.' : 'No categories yet. Create your first one!'}
          </p>
          {!search && <Button variant="primary" size="md" onClick={openCreate}>Add Category</Button>}
        </Card>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat) => {
            const Icon = getIconByName(cat.icon_name);
            return (
              <Card key={cat.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${cat.color} shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(cat)}
                      className="rounded-lg p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(cat)}
                      className="rounded-lg p-2 text-slate-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-950/30 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{cat.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{cat.description}</p>
                <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                  <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono">{cat.slug}</span>
                  <span>Order: {cat.sort_order}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Category' : 'Add Category'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" loading={saving} onClick={handleSave} type="submit" form="category-form">
              <Save className="h-4 w-4" />
              {editing ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Slug</label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                placeholder="e.g. programming"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all font-mono"
              />
            </div>
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
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Icon</label>
              <div className="grid grid-cols-6 gap-2">
                {ICON_OPTIONS.map((icon) => {
                  const Icon = getIconByName(icon);
                  return (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, icon_name: icon }))}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all ${
                        form.icon_name === icon
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Color</label>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, color }))}
                    className={`h-10 rounded-lg bg-gradient-to-br ${color} border-2 transition-all ${
                      form.color === color ? 'border-slate-900 dark:border-white ring-2 ring-offset-2 ring-primary-500' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Sort Order</label>
            <input
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(e) => setForm((p) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
              className="w-full sm:max-w-[120px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Category"
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
          Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{deleteTarget?.name}</strong>?
          All quizzes and questions in this category will also be deleted.
        </p>
      </Modal>
    </div>
  );
}
