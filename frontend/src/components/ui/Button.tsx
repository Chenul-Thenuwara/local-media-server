import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full font-medium transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-apple-blue text-white hover:bg-blue-600 shadow-sm': variant === 'primary',
            'bg-apple-gray text-apple-dark hover:bg-gray-200': variant === 'secondary',
            'hover:bg-apple-gray text-apple-dark': variant === 'ghost',
            'bg-apple-glass backdrop-blur-md text-apple-dark hover:bg-white/90 shadow-sm': variant === 'glass',
            'h-8 px-4 text-sm': size === 'sm',
            'h-10 px-6 text-[15px]': size === 'md',
            'h-12 px-8 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, cn };
