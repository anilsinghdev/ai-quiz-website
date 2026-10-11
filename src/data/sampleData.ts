import {
  Code, Brain, Globe, FlaskConical, Calculator, Palette, BookOpen, Music,
  type LucideIcon,
} from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  quizCount: number;
  totalQuestions: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionCount: number;
  estimatedTime: number;
}

export const categories: Category[] = [
  { id: 'programming', name: 'Programming', description: 'Master coding concepts, languages, and best practices', icon: Code, color: 'from-blue-500 to-cyan-500', quizCount: 24, totalQuestions: 480 },
  { id: 'science', name: 'Science', description: 'Explore physics, chemistry, biology, and more', icon: FlaskConical, color: 'from-green-500 to-emerald-500', quizCount: 18, totalQuestions: 360 },
  { id: 'math', name: 'Mathematics', description: 'From basic arithmetic to advanced calculus', icon: Calculator, color: 'from-orange-500 to-red-500', quizCount: 15, totalQuestions: 300 },
  { id: 'history', name: 'History', description: 'Journey through time and historical events', icon: Globe, color: 'from-amber-500 to-yellow-500', quizCount: 12, totalQuestions: 240 },
  { id: 'languages', name: 'Languages', description: 'Learn vocabulary, grammar, and culture', icon: BookOpen, color: 'from-purple-500 to-pink-500', quizCount: 20, totalQuestions: 400 },
  { id: 'arts', name: 'Arts & Design', description: 'Discover art history, design principles, and creativity', icon: Palette, color: 'from-rose-500 to-pink-500', quizCount: 10, totalQuestions: 200 },
  { id: 'psychology', name: 'Psychology', description: 'Understand the mind and human behavior', icon: Brain, color: 'from-teal-500 to-cyan-500', quizCount: 14, totalQuestions: 280 },
  { id: 'music', name: 'Music', description: 'Theory, instruments, and musical history', icon: Music, color: 'from-indigo-500 to-blue-500', quizCount: 8, totalQuestions: 160 },
];

export const featuredQuizzes: Quiz[] = [
  { id: 'q1', categoryId: 'programming', title: 'JavaScript Fundamentals', description: 'Test your knowledge of core JavaScript concepts', difficulty: 'Medium', questionCount: 20, estimatedTime: 15 },
  { id: 'q2', categoryId: 'science', title: 'Human Anatomy Basics', description: 'Explore the structure of the human body', difficulty: 'Easy', questionCount: 15, estimatedTime: 12 },
  { id: 'q3', categoryId: 'math', title: 'Algebra Challenges', description: 'Solve equations and master algebraic concepts', difficulty: 'Hard', questionCount: 25, estimatedTime: 20 },
  { id: 'q4', categoryId: 'history', title: 'World War II Overview', description: 'Key events and figures from WWII', difficulty: 'Medium', questionCount: 18, estimatedTime: 15 },
  { id: 'q5', categoryId: 'languages', title: 'Spanish Vocabulary', description: 'Build your Spanish word power', difficulty: 'Easy', questionCount: 12, estimatedTime: 10 },
  { id: 'q6', categoryId: 'psychology', title: 'Cognitive Biases', description: 'Learn about common thinking errors', difficulty: 'Medium', questionCount: 16, estimatedTime: 14 },
];

export const sampleQuestions: QuizQuestion[] = [
  {
    id: 'q-1',
    question: 'What is the time complexity of binary search?',
    options: ['O(n)', 'O(n log n)', 'O(log n)', 'O(1)'],
    correctAnswer: 2,
    explanation: 'Binary search halves the search space at each step, resulting in O(log n) time complexity.',
  },
  {
    id: 'q-2',
    question: 'Which keyword is used to declare a constant in JavaScript?',
    options: ['var', 'let', 'const', 'static'],
    correctAnswer: 2,
    explanation: 'The `const` keyword declares a block-scoped, read-only variable in JavaScript.',
  },
  {
    id: 'q-3',
    question: 'What does CSS stand for?',
    options: ['Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style Sheets', 'Colorful Style Sheets'],
    correctAnswer: 1,
    explanation: 'CSS stands for Cascading Style Sheets, used for styling HTML documents.',
  },
  {
    id: 'q-4',
    question: 'Which data structure uses FIFO ordering?',
    options: ['Stack', 'Queue', 'Tree', 'Graph'],
    correctAnswer: 1,
    explanation: 'A Queue follows First-In-First-Out (FIFO) ordering, where the first element added is the first removed.',
  },
  {
    id: 'q-5',
    question: 'What is the default port for HTTPS?',
    options: ['80', '443', '8080', '3000'],
    correctAnswer: 1,
    explanation: 'HTTPS uses port 443 by default, while HTTP uses port 80.',
  },
];

export interface QuizResult {
  id: string;
  quizTitle: string;
  category: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  date: string;
  difficulty: string;
}

export const quizHistory: QuizResult[] = [
  { id: 'r1', quizTitle: 'JavaScript Fundamentals', category: 'Programming', score: 85, totalQuestions: 20, correctAnswers: 17, timeSpent: 12, date: '2026-10-04', difficulty: 'Medium' },
  { id: 'r2', quizTitle: 'Human Anatomy Basics', category: 'Science', score: 92, totalQuestions: 15, correctAnswers: 14, timeSpent: 10, date: '2026-10-03', difficulty: 'Easy' },
  { id: 'r3', quizTitle: 'Algebra Challenges', category: 'Mathematics', score: 70, totalQuestions: 25, correctAnswers: 18, timeSpent: 22, date: '2026-10-02', difficulty: 'Hard' },
  { id: 'r4', quizTitle: 'World War II Overview', category: 'History', score: 88, totalQuestions: 18, correctAnswers: 16, timeSpent: 14, date: '2026-10-01', difficulty: 'Medium' },
  { id: 'r5', quizTitle: 'Spanish Vocabulary', category: 'Languages', score: 95, totalQuestions: 12, correctAnswers: 11, timeSpent: 8, date: '2026-09-30', difficulty: 'Easy' },
  { id: 'r6', quizTitle: 'Cognitive Biases', category: 'Psychology', score: 75, totalQuestions: 16, correctAnswers: 12, timeSpent: 13, date: '2026-09-29', difficulty: 'Medium' },
];

export const userStats = {
  totalQuizzes: 47,
  averageScore: 82,
  totalQuestions: 940,
  correctAnswers: 770,
  studyTime: 8.5,
  streak: 12,
  bestCategory: 'Programming',
  rank: 'Expert',
};

export const weeklyProgress = [
  { day: 'Mon', score: 75 },
  { day: 'Tue', score: 88 },
  { day: 'Wed', score: 65 },
  { day: 'Thu', score: 92 },
  { day: 'Fri', score: 80 },
  { day: 'Sat', score: 95 },
  { day: 'Sun', score: 85 },
];
