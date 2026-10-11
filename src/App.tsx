import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import CategoriesPage from '@/pages/CategoriesPage';
import QuizSetupPage from '@/pages/QuizSetupPage';
import QuizPage from '@/pages/QuizPage';
import ResultPage from '@/pages/ResultPage';
import ReviewPage from '@/pages/ReviewPage';
import DashboardPage from '@/pages/DashboardPage';
import ProfilePage from '@/pages/ProfilePage';
import HistoryPage from '@/pages/HistoryPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import AdminRoute from '@/components/auth/AdminRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminCategories from '@/pages/admin/AdminCategories';
import AdminQuizzes from '@/pages/admin/AdminQuizzes';
import AdminQuestions from '@/pages/admin/AdminQuestions';
import AIQuestionGenerator from '@/pages/admin/AIQuestionGenerator';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout><HomePage /></Layout>} />
              <Route path="/login" element={<Layout showFooter={false}><LoginPage /></Layout>} />
              <Route path="/register" element={<Layout showFooter={false}><RegisterPage /></Layout>} />
              <Route path="/categories" element={<Layout><CategoriesPage /></Layout>} />
              <Route
                path="/quiz-setup"
                element={
                  <ProtectedRoute>
                    <Layout><QuizSetupPage /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quiz"
                element={
                  <ProtectedRoute>
                    <Layout showFooter={false}><QuizPage /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/result"
                element={
                  <ProtectedRoute>
                    <Layout><ResultPage /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/review"
                element={
                  <ProtectedRoute>
                    <Layout><ReviewPage /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout><DashboardPage /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Layout><ProfilePage /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <Layout><AnalyticsPage /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <Layout><LeaderboardPage /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <Layout><HistoryPage /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout><AdminDashboard /></AdminLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <AdminLayout><AdminUsers /></AdminLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/categories"
                element={
                  <AdminRoute>
                    <AdminLayout><AdminCategories /></AdminLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/quizzes"
                element={
                  <AdminRoute>
                    <AdminLayout><AdminQuizzes /></AdminLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/questions"
                element={
                  <AdminRoute>
                    <AdminLayout><AdminQuestions /></AdminLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/ai-generator"
                element={
                  <AdminRoute>
                    <AdminLayout><AIQuestionGenerator /></AdminLayout>
                  </AdminRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
