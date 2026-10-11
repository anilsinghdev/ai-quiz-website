import HeroSection from '@/components/home/HeroSection';
import PopularCategories from '@/components/home/PopularCategories';
import Features from '@/components/home/Features';
import HowItWorks from '@/components/home/HowItWorks';
import CTASection from '@/components/home/CTASection';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PopularCategories />
      <Features />
      <HowItWorks />
      <CTASection />
    </>
  );
}
