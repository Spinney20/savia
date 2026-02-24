import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
        <input
          ref={ref}
          type="date"
          className={cn(
            'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900',
            'transition-all duration-200 outline-none',
            'focus:border-primary focus:ring-2 focus:ring-primary-100',
            error ? 'border-danger' : 'border-gray-300',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  },
);
DatePicker.displayName = 'DatePicker';
