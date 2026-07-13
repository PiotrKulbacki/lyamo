import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@web/lib/utils';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      'flex min-h-[80px] w-full rounded-lg border border-[var(--border)] bg-elevated/50 px-3 py-2 font-display text-sm text-[var(--text)] placeholder:text-muted focus-visible:border-warm/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warm/20 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    ref={ref}
    {...props}
  />
));

Textarea.displayName = 'Textarea';
