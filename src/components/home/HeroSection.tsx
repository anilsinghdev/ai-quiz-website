import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Play, BarChart3, Users, Award } from 'lucide-react';
import Button from '@/components/ui/Button';
import PageContainer from '@/components/ui/PageContainer';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden grid-pattern">
      <div className="absolute inset-0 bg-gradient-to-b from-primary-50/50 via-transparent to-transparent dark:from-primary-950/20" />
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-primary-400/20 blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-secondary-400/20 blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />

      <PageContainer className="relative">
        <div className="py-20 sm:py-28 lg:py-32 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950/50 px-4 py-1.5 mb-6">
              <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">AI-Powered Learning Platform</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white text-balance">
              Test. <span className="gradient-text">Learn.</span> Improve.
            </h1>

            <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Master any subject with AI-generated quizzes tailored to your skill level.
              Challenge yourself, track your progress, and achieve your learning goals.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button to="/quiz-setup" size="lg" variant="primary">
                <Play className="h-5 w-5" />
                Start Quiz
              </Button>
              <Button to="/categories" size="lg" variant="outline">
                Explore Categories
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0">
              {[
                { icon: Users, value: '50K+', label: 'Active Learners' },
                { icon: BarChart3, value: '500+', label: 'Quizzes Available' },
                { icon: Award, value: '92%', label: 'Improvement Rate' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="text-center lg:text-left">
                  <Icon className="h-5 w-5 text-primary-500 mx-auto lg:mx-0 mb-1.5" />
                  <div className="font-display text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="relative">
              <div className="absolute -inset-4 gradient-bg rounded-3xl blur-2xl opacity-20 animate-pulse-slow" />
              <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-error-400" />
                    <div className="h-3 w-3 rounded-full bg-warning-400" />
                    <div className="h-3 w-3 rounded-full bg-success-400" />
                  </div>
                  <span className="text-xs font-medium text-slate-400">Quiz Preview</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold mb-2">Question 3 of 20</p>
                    <p className="font-display font-semibold text-slate-900 dark:text-white">
                      What is the time complexity of binary search?
                    </p>
                  </div>
                  <div className="space-y-2">
                    {['O(n)', 'O(n log n)', 'O(log n)', 'O(1)'].map((opt, i) => (
                      <div
                        key={opt}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                          i === 2
                            ? 'border-success-500 bg-success-50 dark:bg-success-950/30 text-success-700 dark:text-success-400'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          i === 2
                            ? 'bg-success-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="flex h-2 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                        <span className="h-full w-[60%] rounded-full bg-primary-500" />
                      </span>
                      12s left
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 flex items-center gap-2 rounded-xl glass px-4 py-3 shadow-lg animate-float">
                <Award className="h-5 w-5 text-accent-500" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Score</p>
                  <p className="font-bold text-slate-900 dark:text-white">85%</p>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 flex items-center gap-2 rounded-xl glass px-4 py-3 shadow-lg animate-float" style={{ animationDelay: '1.5s' }}>
                <BarChart3 className="h-5 w-5 text-secondary-500" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Streak</p>
                  <p className="font-bold text-slate-900 dark:text-white">12 days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
