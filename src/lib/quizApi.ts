import { supabase } from '@/lib/supabase';
import type {
  CategoryRow, CategoryWithStats, QuizRow, QuestionRow, QuizAttemptRow, AnswerRow,
} from '@/lib/types';

export async function fetchCategories(): Promise<CategoryWithStats[]> {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  if (!categories) return [];

  const { data: quizzes, error: quizError } = await supabase
    .from('quizzes')
    .select('id, category_id');

  if (quizError) throw quizError;

  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select('id, quiz_id');

  if (qError) throw qError;

  const quizCountByCategory = new Map<string, number>();
  const questionCountByQuiz = new Map<string, number>();

  (quizzes ?? []).forEach((q) => {
    quizCountByCategory.set(q.category_id, (quizCountByCategory.get(q.category_id) ?? 0) + 1);
  });
  (questions ?? []).forEach((q) => {
    questionCountByQuiz.set(q.quiz_id, (questionCountByQuiz.get(q.quiz_id) ?? 0) + 1);
  });

  const quizIdToCategoryId = new Map<string, string>();
  (quizzes ?? []).forEach((q) => quizIdToCategoryId.set(q.id, q.category_id));

  return (categories as CategoryRow[]).map((cat) => {
    let totalQuestions = 0;
    (quizzes ?? []).forEach((q) => {
      if (q.category_id === cat.id) {
        totalQuestions += questionCountByQuiz.get(q.id) ?? 0;
      }
    });

    return {
      ...cat,
      quiz_count: quizCountByCategory.get(cat.id) ?? 0,
      total_questions: totalQuestions,
    };
  });
}

export async function fetchCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data as CategoryRow | null;
}

export async function fetchCategoryById(id: string): Promise<CategoryRow | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as CategoryRow | null;
}

export async function fetchQuizzesByCategory(categoryId: string): Promise<QuizRow[]> {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as QuizRow[];
}

export async function fetchQuestionsByQuiz(quizId: string): Promise<QuestionRow[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as QuestionRow[];
}

export async function fetchQuestionsByCategory(categoryId: string, limit: number): Promise<QuestionRow[]> {
  const { data: quizzes, error: quizError } = await supabase
    .from('quizzes')
    .select('id')
    .eq('category_id', categoryId);

  if (quizError) throw quizError;
  if (!quizzes || quizzes.length === 0) return [];

  const quizIds = quizzes.map((q) => q.id);
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .in('quiz_id', quizIds)
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as QuestionRow[];
}

export async function fetchQuizForCategory(categoryId: string): Promise<QuizRow | null> {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as QuizRow | null;
}

export async function createQuizAttempt(params: {
  quizId: string;
  categoryId: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  timeSpentSeconds: number;
  difficulty: string;
}): Promise<QuizAttemptRow | null> {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert({
      quiz_id: params.quizId,
      category_id: params.categoryId,
      total_questions: params.totalQuestions,
      correct_answers: params.correctAnswers,
      score: params.score,
      time_spent_seconds: params.timeSpentSeconds,
      difficulty: params.difficulty,
    })
    .select()
    .single();

  if (error) throw error;
  return data as QuizAttemptRow;
}

export async function saveAnswers(attemptId: string, answers: Omit<AnswerRow, 'id' | 'attempt_id' | 'created_at'>[]): Promise<void> {
  if (answers.length === 0) return;
  const rows = answers.map((a) => ({
    attempt_id: attemptId,
    question_id: a.question_id,
    selected_answer: a.selected_answer,
    is_correct: a.is_correct,
  }));
  const { error } = await supabase.from('answers').insert(rows);
  if (error) throw error;
}

export async function fetchUserAttempts(userId: string): Promise<QuizAttemptRow[]> {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as QuizAttemptRow[];
}

export interface AttemptWithDetails extends QuizAttemptRow {
  category_name: string;
  quiz_title: string;
}

export async function fetchUserAttemptsDetailed(userId: string): Promise<AttemptWithDetails[]> {
  const { data: attempts, error } = await supabase
    .from('quiz_attempts')
    .select(`
      *,
      categories!inner(name),
      quizzes!inner(title)
    `)
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (error) throw error;
  if (!attempts) return [];

  return attempts.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    user_id: row.user_id as string,
    quiz_id: row.quiz_id as string,
    category_id: row.category_id as string,
    score: row.score as number,
    total_questions: row.total_questions as number,
    correct_answers: row.correct_answers as number,
    time_spent_seconds: row.time_spent_seconds as number,
    difficulty: row.difficulty as string,
    started_at: row.started_at as string,
    completed_at: row.completed_at as string,
    category_name: (row.categories as { name: string }).name,
    quiz_title: (row.quizzes as { title: string }).title,
  }));
}

export async function fetchAttemptWithDetails(attemptId: string) {
  const { data: attempt, error: attemptError } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('id', attemptId)
    .maybeSingle();

  if (attemptError) throw attemptError;
  if (!attempt) return null;

  const { data: answers, error: answersError } = await supabase
    .from('answers')
    .select('*')
    .eq('attempt_id', attemptId);

  if (answersError) throw answersError;

  return {
    attempt: attempt as QuizAttemptRow,
    answers: (answers ?? []) as AnswerRow[],
  };
}

export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  total_quizzes: number;
  avg_score: number;
  best_score: number;
}

export async function fetchLeaderboard(period: 'weekly' | 'monthly' | 'all'): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .rpc('get_leaderboard', { period });

  if (error) throw error;
  if (!data) return [];

  return (data as LeaderboardEntry[]).map((row) => ({
    user_id: row.user_id,
    full_name: row.full_name,
    username: row.username,
    avatar_url: row.avatar_url,
    total_quizzes: Number(row.total_quizzes),
    avg_score: Number(row.avg_score),
    best_score: Number(row.best_score),
  }));
}

export interface UserQuizStats {
  totalQuizzes: number;
  avgScore: number;
  bestScore: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  totalIncorrect: number;
}

export async function fetchUserQuizStats(userId: string): Promise<UserQuizStats> {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('score, total_questions, correct_answers')
    .eq('user_id', userId);

  if (error) throw error;
  if (!data || data.length === 0) {
    return {
      totalQuizzes: 0,
      avgScore: 0,
      bestScore: 0,
      totalQuestionsAnswered: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
    };
  }

  const totalQuizzes = data.length;
  const avgScore = Math.round(data.reduce((s, a) => s + a.score, 0) / totalQuizzes);
  const bestScore = Math.max(...data.map((a) => a.score));
  const totalQuestionsAnswered = data.reduce((s, a) => s + a.total_questions, 0);
  const totalCorrect = data.reduce((s, a) => s + a.correct_answers, 0);
  const totalIncorrect = totalQuestionsAnswered - totalCorrect;

  return { totalQuizzes, avgScore, bestScore, totalQuestionsAnswered, totalCorrect, totalIncorrect };
}
