'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/store';
import { setUserSession } from '@/store/slices/authSlice';
import { getSessionCookie } from '@/lib/cookies';

export const SessionRestorer: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const savedSession = getSessionCookie();
    if (savedSession && savedSession.role) {
      dispatch(setUserSession(savedSession));
    }
  }, [dispatch]);

  return null;
};
