import { ArrowRight, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import PageContainer from '@/components/ui/PageContainer';

export default function CTASection() {
  return (
    <section className="py-20">
      <PageContainer>
        <div className="relative overflow-hidden rounded-3xl gradient-bg p-8 sm:p-12 lg:p-16 text-center">
          <div className="absolute inset-0 grid-pattern opacity-20" />
          <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-secondary-400/20 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 mb-6">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-sm font-semibold text-white">Join 50,000+ learners today</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white text-balance">
              Ready to Test Your Knowledge?
            </h2>
            <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
              Start your first quiz in under a minute. No credit card required. Just sign up and begin learning.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button to="/register" size="lg" className="bg-white text-primary-700 hover:bg-white/90 shadow-xl">
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button to="/categories" size="lg" variant="ghost" className="text-white hover:bg-white/10">
                Browse Categories
              </Button>
            </div>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
