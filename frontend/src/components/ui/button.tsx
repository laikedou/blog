import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-body-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]',
  {
    variants: {
      variant: {
        default: 'bg-primary-container text-on-primary-container rounded-lg px-5 py-2.5 hover:bg-primary/20',
        destructive: 'bg-destructive text-destructive-foreground rounded-lg px-5 py-2.5 hover:bg-destructive/90',
        outline: 'border border-outline bg-transparent text-on-surface rounded-lg px-5 py-2.5 hover:bg-surface-container-high',
        secondary: 'bg-tertiary text-on-tertiary rounded-lg px-5 py-2.5 hover:bg-tertiary/90',
        ghost: 'text-on-surface rounded-lg px-4 py-2 hover:bg-surface-container-high',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-auto',
        sm: 'px-4 py-2 text-caption',
        lg: 'px-7 py-3.5 text-body-lg',
        icon: 'h-10 w-10 rounded-editorial-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
