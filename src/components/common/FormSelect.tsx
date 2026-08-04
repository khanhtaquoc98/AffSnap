'use client';

import React from 'react';
import { useFormContext, Controller, RegisterOptions } from 'react-hook-form';

export interface SelectOption {
  label: string;
  value: string | number;
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  name: string;
  label?: string;
  options: SelectOption[];
  helperText?: string;
  rules?: RegisterOptions;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  name,
  label,
  options,
  helperText,
  rules,
  className = '',
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
          <select
            {...field}
            {...props}
            id={name}
            value={field.value ?? ''}
            className={`w-full rounded-lg border bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white transition duration-150 focus:outline-none focus:ring-2 ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20'
            } ${className}`}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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
