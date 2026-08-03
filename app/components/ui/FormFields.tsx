import { forwardRef } from "react";

interface FieldWrapperProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

export function FieldWrapper({ label, htmlFor, hint, error, children }: FieldWrapperProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

const inputClasses =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none disabled:opacity-50";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, InputProps>(({ error, className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`${inputClasses} ${error ? "border-red-400 focus:border-red-500" : ""} ${className ?? ""}`}
      {...props}
    />
  );
});
TextInput.displayName = "TextInput";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({ error, className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={`${inputClasses} ${error ? "border-red-400 focus:border-red-500" : ""} ${className ?? ""}`}
      {...props}
    />
  );
});
TextArea.displayName = "TextArea";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ error, className, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={`${inputClasses} ${error ? "border-red-400 focus:border-red-500" : ""} ${className ?? ""}`}
      {...props}
    />
  );
});
Select.displayName = "Select";