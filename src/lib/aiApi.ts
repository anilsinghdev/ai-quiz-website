import { supabase } from '@/lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not authenticated');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  difficulty: string;
}

export async function generateQuestions(params: {
  subject: string;
  topic: string;
  difficulty: string;
  numQuestions: number;
}): Promise<GeneratedQuestion[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-generate-questions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  const data = await res.json();
  if (!data.questions || !Array.isArray(data.questions)) {
    throw new Error('AI returned an unexpected response.');
  }
  return data.questions as GeneratedQuestion[];
}

export async function explainAnswer(params: {
  question: string;
  options: string[];
  correctAnswer: number;
  userAnswer: number | null;
}): Promise<string> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-explain`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  const data = await res.json();
  if (!data.explanation) throw new Error('AI returned no explanation.');
  return data.explanation as string;
}

export async function analyzePerformance(attempts: Array<{
  quiz_title: string;
  category_name: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  difficulty: string;
  completed_at: string;
}>): Promise<string> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-analyze`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ attempts }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  const data = await res.json();
  if (!data.analysis) throw new Error('AI returned no analysis.');
  return data.analysis as string;
}
