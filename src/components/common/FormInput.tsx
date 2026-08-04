'use client';

import React from 'react';
import { useFormContext, Controller, RegisterOptions } from 'react-hook-form';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
  helperText?: string;
  rules?: RegisterOptions;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const FormInput: React.FC<FormInputProps> = ({
  name,
  label,
  helperText,
  rules,
  leftIcon,
  rightIcon,
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
            <label htmlFor={name} className="text-xs font-bold text-slate-700">
              {label}
            </label>
          )}
          <div className="relative flex items-center">
            {leftIcon && (
              <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                {leftIcon}
              </div>
            )}
            <input
              {...field}
              {...props}
              id={name}
              value={field.value ?? ''}
              className={`w-full rounded-xl border bg-slate-50 px-3.5 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition duration-150 focus:outline-none focus:bg-white ${
                leftIcon ? 'pl-10' : ''
              } ${rightIcon ? 'pr-10' : ''} ${
                error
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                  : 'border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10'
              } ${className}`}
            />
            {rightIcon && (
              <div className="absolute right-3.5 text-slate-400">
                {rightIcon}
              </div>
            )}
          </div>
          {error ? (
            <span className="text-xs text-rose-500 font-semibold">{error.message}</span>
          ) : helperText ? (
            <span className="text-xs text-slate-500">{helperText}</span>
          ) : null}
        </div>
      )}
    />
  );
};
