import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const baseStyles =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed';

const variantStyles: Record<Variant, string> = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg hover:shadow-primary-500/25',
  secondary: 'bg-secondary-600 hover:bg-secondary-700 text-white shadow-md hover:shadow-lg hover:shadow-secondary-500/25',
  accent: 'bg-accent-500 hover:bg-accent-600 text-white shadow-md hover:shadow-lg hover:shadow-accent-500/25',
  outline: 'border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-primary-500 dark:hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 bg-transparent',
  ghost: 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 bg-transparent',
  danger: 'bg-error-500 hover:bg-error-600 text-white shadow-md hover:shadow-lg hover:shadow-error-500/25',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
  loading?: boolean;
}

type ButtonAsButton = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { to?: undefined };
type ButtonAsLink = CommonProps & { to: string } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'>;

type ButtonProps = (ButtonAsButton | ButtonAsLink) & { variant?: Variant; size?: Size };

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', children, className = '', loading, to, disabled, ...props }, ref) => {
    const classes = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    if (loading) {
      return (
        <button ref={ref} className={classes} disabled {...props}>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {children}
        </button>
      );
    }

    if (to) {
      return (
        <Link to={to} className={classes}>
          {children}
        </Link>
      );
    }

    return (
      <button ref={ref} className={classes} disabled={disabled} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
