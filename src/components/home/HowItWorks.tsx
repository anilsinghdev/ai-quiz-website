import { MousePointerClick, Brain, ClipboardCheck, TrendingUp } from 'lucide-react';
import PageContainer from '@/components/ui/PageContainer';

const steps = [
  { icon: MousePointerClick, title: 'Choose a Category', description: 'Browse from dozens of subjects or let AI suggest one based on your interests and goals.' },
  { icon: Brain, title: 'Take the Quiz', description: 'Answer AI-generated questions that adapt in real-time to your responses and knowledge level.' },
  { icon: ClipboardCheck, title: 'Get Instant Feedback', description: 'Review detailed explanations for each question and understand what you got right or wrong.' },
  { icon: TrendingUp, title: 'Track Your Growth', description: 'Monitor your progress over time with analytics that highlight improvements and areas to focus on.' },
];

export default function HowItWorks() {
  return (
    <section className="py-20">
      <PageContainer>
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
            How It Works
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            Four simple steps to start your learning journey
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="hidden lg:block absolute top-7 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200 dark:from-primary-800 dark:via-primary-600 dark:to-primary-800" />
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative text-center">
                <div className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg shadow-lg shadow-primary-500/30 mb-4">
                  <Icon className="h-7 w-7 text-white" />
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent-500 text-white text-xs font-bold border-2 border-white dark:border-slate-950">
                    {idx + 1}
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </PageContainer>
    </section>
  );
}
