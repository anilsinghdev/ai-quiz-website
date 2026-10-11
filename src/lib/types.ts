export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon_name: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface QuizRow {
  id: string;
  category_id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  created_at: string;
}

export interface QuestionRow {
  id: string;
  quiz_id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  created_at: string;
}

export interface QuizAttemptRow {
  id: string;
  user_id: string;
  quiz_id: string;
  category_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_spent_seconds: number;
  difficulty: string;
  started_at: string;
  completed_at: string;
}

export interface AnswerRow {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_answer: number | null;
  is_correct: boolean;
  created_at: string;
}

export interface CategoryWithStats extends CategoryRow {
  quiz_count: number;
  total_questions: number;
}
