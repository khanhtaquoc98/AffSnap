'use client';

import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Mail, Key, User, Sparkles } from 'lucide-react';
import { FormInput } from '@/components/common';
import { useAppDispatch, useAppSelector } from '@/store';
import { setUserSession, setIsLoginModalOpen } from '@/store/slices/authSlice';

const loginSchema = z.object({
  email: z.string().email('Email không đúng định dạng. VD: yourname@domain.com'),
  password: z.string().optional(),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Họ và tên phải ít nhất 2 ký tự'),
  email: z.string().email('Email không đúng định dạng. VD: yourname@domain.com'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export const LoginModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.auth.isLoginModalOpen);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loginMethods = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerMethods = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  if (!isOpen) return null;

  const handleLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Đăng nhập thất bại');
      }

      dispatch(setUserSession(result.user));
      dispatch(setIsLoginModalOpen(false));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const registeredUser = {
        email: data.email.trim().toLowerCase(),
        name: data.name.trim(),
        role: 'USER' as const,
        balance: 0,
        permissions: ['convert_links', 'view_my_orders', 'view_my_balance'],
      };

      dispatch(setUserSession(registeredUser));
      dispatch(setIsLoginModalOpen(false));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đăng ký thất bại';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      
      // If Google Client ID is configured, load GIS script if not present and prompt
      if (clientId && typeof window !== 'undefined') {
        if (!(window as unknown as { google?: any }).google) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Không thể tải Google Identity Services SDK'));
            document.head.appendChild(script);
          });
        }

        const googleObj = (window as unknown as { google?: any }).google;
        if (googleObj?.accounts?.oauth2) {
          const tokenClient = googleObj.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'email profile openid',
            callback: async (tokenResponse: { access_token?: string; error?: string }) => {
              if (tokenResponse.error || !tokenResponse.access_token) {
                setErrorMessage('Đăng nhập Google bị hủy hoặc gặp lỗi');
                setIsLoading(false);
                return;
              }
              try {
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await userInfoRes.json();
                if (!userInfoRes.ok || !userInfo.email) {
                  throw new Error(userInfo.error_description || 'Không thể lấy email từ Google');
                }

                const googleUser = {
                  email: userInfo.email,
                  name: userInfo.name || userInfo.email.split('@')[0],
                  role: 'USER' as const,
                  balance: 50000,
                  permissions: ['convert_links', 'view_my_orders', 'view_my_balance', 'request_payout'],
                };

                dispatch(setUserSession(googleUser));
                dispatch(setIsLoginModalOpen(false));
              } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Lỗi lấy thông tin Google';
                setErrorMessage(msg);
              } finally {
                setIsLoading(false);
              }
            },
          });
          tokenClient.requestAccessToken();
          return;
        }
      }

      // Fallback Demo Google Login
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user.google@gmail.com' }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Đăng nhập Google thất bại');
      }

      const googleUser = {
        ...result.user,
        name: 'Tài Khoản Google',
        email: 'user.google@gmail.com',
      };

      dispatch(setUserSession(googleUser));
      dispatch(setIsLoginModalOpen(false));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md transition-opacity duration-300">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-2xl shadow-slate-900/20 space-y-6 animate-modal-pop">
        {/* Close Button */}
        <button
          onClick={() => dispatch(setIsLoginModalOpen(false))}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition duration-150 active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title & Icon */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto shadow-lg shadow-orange-500/20 text-white transform hover:rotate-6 transition duration-300">
            <Sparkles className="w-7 h-7" />
          </div>

          {/* Mode Switcher Tabs with Animated Indicator */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200/80 w-full max-w-xs mx-auto">
            <button
              onClick={() => {
                setMode('login');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-white text-orange-600 shadow-sm border border-slate-200/80 scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              onClick={() => {
                setMode('register');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all duration-200 ${
                mode === 'register'
                  ? 'bg-white text-orange-600 shadow-sm border border-slate-200/80 scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Đăng Ký
            </button>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center animate-tab-fade">
            {errorMessage}
          </div>
        )}

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-3.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold shadow-xs hover:border-slate-300 transition duration-150 flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {mode === 'login' ? 'Đăng nhập bằng Google' : 'Đăng ký bằng Google'}
        </button>

        {/* OR Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-slate-200" />
          <span className="absolute bg-white px-3 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
            HOẶC DÙNG EMAIL
          </span>
        </div>

        {/* Form Body with Smooth Fade Animation */}
        <div key={mode} className="animate-tab-fade">
          {mode === 'login' ? (
            <FormProvider {...loginMethods}>
              <form onSubmit={loginMethods.handleSubmit(handleLoginSubmit)} className="space-y-4">
                <FormInput
                  name="email"
                  label="Địa chỉ Email"
                  placeholder="nhap-email@domain.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                />

                <FormInput
                  name="password"
                  type="password"
                  label="Mật khẩu"
                  placeholder="••••••••"
                  leftIcon={<Key className="w-4 h-4" />}
                />

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm shadow-lg shadow-orange-500/20 transition duration-150 active:scale-[0.98] flex items-center justify-center"
                >
                  {isLoading ? 'Đang xử lý...' : 'Xác Nhận Đăng Nhập'}
                </button>
              </form>
            </FormProvider>
          ) : (
            <FormProvider {...registerMethods}>
              <form onSubmit={registerMethods.handleSubmit(handleRegisterSubmit)} className="space-y-4">
                <FormInput
                  name="name"
                  label="Họ và Tên"
                  placeholder="Nguyễn Văn A"
                  leftIcon={<User className="w-4 h-4" />}
                />

                <FormInput
                  name="email"
                  label="Địa chỉ Email"
                  placeholder="nhap-email@domain.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                />

                <FormInput
                  name="password"
                  type="password"
                  label="Mật khẩu"
                  placeholder="Tối thiểu 6 ký tự"
                  leftIcon={<Key className="w-4 h-4" />}
                />

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm shadow-lg shadow-orange-500/20 transition duration-150 active:scale-[0.98] flex items-center justify-center"
                >
                  {isLoading ? 'Đang xử lý...' : 'Tạo Tài Khoản Mới'}
                </button>
              </form>
            </FormProvider>
          )}
        </div>

        {/* Footer Toggle Link */}
        <div className="text-center pt-2 border-t border-slate-100">
          {mode === 'login' ? (
            <p className="text-xs text-slate-500 font-medium">
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage('');
                }}
                className="font-bold text-orange-600 hover:underline"
              >
                Đăng ký ngay
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-500 font-medium">
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                }}
                className="font-bold text-orange-600 hover:underline"
              >
                Đăng nhập ngay
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
