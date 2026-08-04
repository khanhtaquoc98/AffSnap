'use client';

import React from 'react';
import { useFormContext, Controller, RegisterOptions } from 'react-hook-form';

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
  label?: string;
  helperText?: string;
  rules?: RegisterOptions;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  name,
  label,
  helperText,
  rules,
  className = '',
  rows = 4,
  ...props
}) => {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <div className="w-full flex flex-col gap-1.5">
          {label && (
            <label htmlFor={name} className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {label}
            </label>
          )}
          <textarea
            {...field}
            {...props}
            id={name}
            rows={rows}
            value={field.value ?? ''}
            className={`w-full rounded-lg border bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 transition duration-150 focus:outline-none focus:ring-2 ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20'
            } ${className}`}
          />
          {error ? (
            <span className="text-xs text-red-500 font-medium">{error.message}</span>
          ) : helperText ? (
            <span className="text-xs text-slate-500 dark:text-slate-400">{helperText}</span>
          ) : null}
        </div>
      )}
    />
  );
};
