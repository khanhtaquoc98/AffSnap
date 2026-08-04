'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, ArrowRight, LogIn } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setIsLoginModalOpen, UserRole } from '@/store/slices/authSlice';

import { AdminLoginForm } from './AdminLoginForm';

interface AccessGuardProps {
  allowedRoles: UserRole[];
  pageName: string;
  requiredRoleName?: string;
  children: React.ReactNode;
}

export const AccessGuard: React.FC<AccessGuardProps> = ({
  allowedRoles,
  pageName,
  children,
}) => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const isAllowed = allowedRoles.includes(currentUser);

  if (isAllowed) {
    return <>{children}</>;
  }

  // Dedicated Admin Login for Admin Portal
  if (allowedRoles.length === 1 && allowedRoles[0] === 'ADMIN') {
    return <AdminLoginForm />;
  }

  return (
    <div className="max-w-xl mx-auto my-16 p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 text-center shadow-xl shadow-slate-200/60 space-y-8">
      {/* Icon */}
      <div className="w-20 h-20 rounded-3xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600 shadow-xs">
        <Lock className="w-9 h-9" />
      </div>

      {/* Title & Description */}
      <div className="space-y-4">
        <div>
          <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shadow-xs mb-3">
            Quyền Truy Cập Hạn Chế
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">{pageName}</h2>
        </div>
        <p className="text-sm text-slate-600 font-medium max-w-md mx-auto">
          Vui lòng đăng nhập để xem thông tin chi tiết và quản lý đơn hàng hoa hồng cá nhân.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <button
          onClick={() => dispatch(setIsLoginModalOpen(true))}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-bold transition shadow-md shadow-orange-500/20 flex items-center justify-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          Đăng Nhập Ngay
        </button>
        <Link
          href="/"
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition border border-slate-200 flex items-center justify-center gap-2"
        >
          Quay lại Trang Chủ
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
