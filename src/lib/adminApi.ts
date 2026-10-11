import { supabase } from '@/lib/supabase';
import type { CategoryRow, QuizRow, QuestionRow } from '@/lib/types';

// ============================================================
// Types
// ============================================================

export interface AdminUserRow {
  id: string;
  email: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  role: 'user' | 'admin';
  created_at: string;
  quiz_count: number;
}

export interface AdminStats {
  total_users: number;
  total_quizzes: number;
  total_questions: number;
  total_attempts: number;
  avg_score: number;
}

export interface QuizWithCategory extends QuizRow {
  category_name: string;
  question_count: number;
}

export interface QuestionWithQuiz extends QuestionRow {
  quiz_title: string;
  category_name: string;
}

// ============================================================
// Stats
// ============================================================

export async function fetchAdminStats(): Promise<AdminStats> {
  const { data, error } = await supabase.rpc('admin_get_stats');
  if (error) throw error;
  if (!data) {
    return { total_users: 0, total_quizzes: 0, total_questions: 0, total_attempts: 0, avg_score: 0 };
  }
  const row = data as Record<string, unknown>;
  return {
    total_users: Number(row.total_users),
    total_quizzes: Number(row.total_quizzes),
    total_questions: Number(row.total_questions),
    total_attempts: Number(row.total_attempts),
    avg_score: Number(row.avg_score),
  };
}

// ============================================================
// Users
// ============================================================

export async function fetchAllUsers(): Promise<AdminUserRow[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id, email, full_name, username, avatar_url, bio, role, created_at,
      quiz_attempts(count)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return (data as unknown as Array<Record<string, unknown>>).map((row) => ({
    id: row.id as string,
    email: row.email as string,
    full_name: row.full_name as string,
    username: row.username as string,
    avatar_url: row.avatar_url as string | null,
    bio: row.bio as string | null,
    role: row.role as 'user' | 'admin',
    created_at: row.created_at as string,
    quiz_count: ((row.quiz_attempts as unknown as Array<{ count: number }>)?.[0]?.count) ?? 0,
  }));
}

export async function adminSetUserRole(userId: string, role: 'user' | 'admin'): Promise<void> {
  const { error } = await supabase.rpc('admin_set_user_role', {
    p_user_id: userId,
    p_role: role,
  });
  if (error) throw error;
}

export async function adminDeleteUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_user', {
    p_user_id: userId,
  });
  if (error) throw error;
}

// ============================================================
// Categories
// ============================================================

export async function fetchAllCategoriesAdmin(): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as CategoryRow[];
}

export async function createCategory(params: {
  slug: string;
  name: string;
  description: string;
  icon_name: string;
  color: string;
  sort_order: number;
}): Promise<CategoryRow> {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      slug: params.slug,
      name: params.name,
      description: params.description,
      icon_name: params.icon_name,
      color: params.color,
      sort_order: params.sort_order,
    })
    .select()
    .single();
  if (error) throw error;
  return data as CategoryRow;
}

export async function updateCategory(id: string, params: {
  slug?: string;
  name?: string;
  description?: string;
  icon_name?: string;
  color?: string;
  sort_order?: number;
}): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update(params)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============================================================
// Quizzes
// ============================================================

export async function fetchAllQuizzesAdmin(): Promise<QuizWithCategory[]> {
  const { data, error } = await supabase
    .from('quizzes')
    .select(`
      *,
      categories!inner(name),
      questions(count)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return (data as unknown as Array<Record<string, unknown>>).map((row) => ({
    id: row.id as string,
    category_id: row.category_id as string,
    title: row.title as string,
    description: row.description as string,
    difficulty: row.difficulty as 'Easy' | 'Medium' | 'Hard',
    created_at: row.created_at as string,
    category_name: (row.categories as { name: string }).name,
    question_count: ((row.questions as unknown as Array<{ count: number }>)?.[0]?.count) ?? 0,
  }));
}

export async function createQuiz(params: {
  category_id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}): Promise<QuizRow> {
  const { data, error } = await supabase
    .from('quizzes')
    .insert({
      category_id: params.category_id,
      title: params.title,
      description: params.description,
      difficulty: params.difficulty,
    })
    .select()
    .single();
  if (error) throw error;
  return data as QuizRow;
}

export async function updateQuiz(id: string, params: {
  category_id?: string;
  title?: string;
  description?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}): Promise<void> {
  const { error } = await supabase
    .from('quizzes')
    .update(params)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteQuiz(id: string): Promise<void> {
  const { error } = await supabase
    .from('quizzes')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============================================================
// Questions
// ============================================================

export async function fetchAllQuestionsAdmin(): Promise<QuestionWithQuiz[]> {
  const { data, error } = await supabase
    .from('questions')
    .select(`
      *,
      quizzes!inner(
        title,
        categories!inner(name)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return (data as unknown as Array<Record<string, unknown>>).map((row) => {
    const quiz = row.quizzes as { title: string; categories: { name: string } };
    return {
      id: row.id as string,
      quiz_id: row.quiz_id as string,
      question_text: row.question_text as string,
      options: row.options as string[],
      correct_answer: row.correct_answer as number,
      explanation: row.explanation as string,
      created_at: row.created_at as string,
      quiz_title: quiz.title,
      category_name: quiz.categories.name,
    };
  });
}

export async function createQuestion(params: {
  quiz_id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}): Promise<QuestionRow> {
  const { data, error } = await supabase
    .from('questions')
    .insert({
      quiz_id: params.quiz_id,
      question_text: params.question_text,
      options: params.options,
      correct_answer: params.correct_answer,
      explanation: params.explanation,
    })
    .select()
    .single();
  if (error) throw error;
  return data as QuestionRow;
}

export async function updateQuestion(id: string, params: {
  quiz_id?: string;
  question_text?: string;
  options?: string[];
  correct_answer?: number;
  explanation?: string;
}): Promise<void> {
  const { error } = await supabase
    .from('questions')
    .update(params)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
