'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { store } from './index';
import { SessionRestorer } from '@/components/SessionRestorer';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <SessionRestorer />
      {children}
    </Provider>
  );
}
