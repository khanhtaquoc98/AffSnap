'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';

interface FormSwitchProps {
  name: string;
  label?: string;
  description?: string;
}

export const FormSwitch: React.FC<FormSwitchProps> = ({ name, label, description }) => {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="flex items-center justify-between py-2">
          <div>
            {label && <span className="text-sm font-medium text-slate-900 dark:text-white">{label}</span>}
            {description && <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={field.value}
            onClick={() => field.onChange(!field.value)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
              field.value ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                field.value ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      )}
    />
  );
};
