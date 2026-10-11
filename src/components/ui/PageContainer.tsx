import { type ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const maxWidthMap = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  '2xl': 'max-w-[90rem]',
  full: 'max-w-full',
};

export default function PageContainer({
  children,
  className = '',
  maxWidth = 'xl',
}: PageContainerProps) {
  return (
    <div className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${maxWidthMap[maxWidth]} ${className}`}>
      {children}
    </div>
  );
}
