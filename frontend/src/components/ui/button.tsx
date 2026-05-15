import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-body-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]',
  {
    variants: {
      variant: {
        default: 'bg-clay text-white rounded-editorial-sm px-5 py-2.5 hover:bg-clay-dark',
        destructive: 'bg-destructive text-white rounded-editorial-sm px-5 py-2.5 hover:bg-clay-dark',
        outline: 'border border-border bg-transparent text-ink rounded-editorial-sm px-5 py-2.5 hover:bg-cream-200',
        secondary: 'bg-teal text-white rounded-editorial-sm px-5 py-2.5 hover:bg-teal-light',
        ghost: 'text-ink rounded-editorial-sm px-4 py-2 hover:bg-cream-200',
        link: 'text-clay underline-offset-4 hover:underline underline-decoration-clay',
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
