'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { useAppDispatch } from '@/store';
import { setUserSession } from '@/store/slices/authSlice';

export const AdminLoginForm: React.FC = () => {
  const dispatch = useAppDispatch();

  const [emailInput, setEmailInput] = useState('khanhtaquoc98@gmail.com');
  const [passwordInput, setPasswordInput] = useState('2804998');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput,
          password: passwordInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đăng nhập Admin thất bại');
      }

      if (data.user.role !== 'ADMIN') {
        throw new Error('Tài khoản không có quyền Admin!');
      }

      dispatch(setUserSession(data.user));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 text-slate-900 font-sans relative overflow-hidden select-none">
      {/* GLOWING AMBIENT LIGHTS */}
      <div className="fixed top-1/4 left-1/3 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="fixed bottom-1/4 right-1/3 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="relative w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-6 animate-modal-pop">
        {/* Header Icon */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto text-white shadow-lg shadow-orange-500/25">
            <ShieldCheck className="w-9 h-9" />
          </div>

          <div>
            <span className="inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200 mb-2">
              XÁC THỰC BẢO MẬT ADMIN
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Cổng Đăng Nhập Quản Trị</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Đăng nhập riêng cho Admin quản lý AffSnap PRO
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center animate-tab-fade">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAdminSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-orange-600" />
              Email Admin
            </label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="khanhtaquoc98@gmail.com"
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500 transition"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              Mật Khẩu Admin
            </label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm shadow-xl shadow-orange-500/20 transition duration-200 active:scale-98 flex items-center justify-center gap-2"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            Xác Nhận Đăng Nhập Admin
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Trở về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};
