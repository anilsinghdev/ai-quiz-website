import { BrainCircuit, Target, TrendingUp, Zap } from 'lucide-react';
import PageContainer from '@/components/ui/PageContainer';

const features = [
  {
    icon: BrainCircuit,
    title: 'AI-Generated Questions',
    description: 'Our AI creates unique questions tailored to your skill level, ensuring you are always challenged at the right difficulty.',
    color: 'from-primary-500 to-cyan-500',
  },
  {
    icon: Target,
    title: 'Personalized Learning',
    description: 'Get recommendations based on your performance. The platform adapts to your strengths and focuses on areas for improvement.',
    color: 'from-secondary-500 to-emerald-500',
  },
  {
    icon: TrendingUp,
    title: 'Detailed Analytics',
    description: 'Track your progress with comprehensive dashboards. Visualize your growth and identify patterns in your learning journey.',
    color: 'from-accent-500 to-orange-500',
  },
  {
    icon: Zap,
    title: 'Instant Feedback',
    description: 'Receive immediate explanations for every answer. Learn from mistakes with detailed breakdowns and resource suggestions.',
    color: 'from-rose-500 to-pink-500',
  },
];

export default function Features() {
  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
      <PageContainer>
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
            Why Learners Choose QuizAI
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            Powerful features designed to make learning engaging, effective, and fun
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group flex gap-5 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 card-hover"
              >
                <div className={`flex-shrink-0 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </PageContainer>
    </section>
  );
}
