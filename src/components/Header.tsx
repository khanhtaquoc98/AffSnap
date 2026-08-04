'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Zap, LogIn, LogOut } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setIsLoginModalOpen, logout } from '@/store/slices/authSlice';
import { setTokenConfig } from '@/store/slices/adminSlice';
import { LoginModal } from '@/components/LoginModal';

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    fetch('/api/admin/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.tokenConfig) {
          dispatch(setTokenConfig(data.tokenConfig));
        }
      })
      .catch(() => {});
  }, [dispatch]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-xs">
        {/* Logo & Brand: AffSnap */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition duration-200">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-xl text-slate-900 tracking-tight">AffSnap</h1>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Shopee Affiliate Link Generator</p>
          </div>
        </Link>

        {/* User Session & Login Button */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2.5 bg-slate-100 border border-slate-200 p-1.5 pl-3 rounded-2xl">
              <div className="text-left space-y-0.5">
                <span className="text-xs font-bold text-slate-900 block">{user.name}</span>
                <p className="text-[10px] font-mono text-slate-500">{user.email}</p>
              </div>

              <button
                onClick={() => dispatch(logout())}
                title="Đăng xuất"
                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition shadow-xs"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => dispatch(setIsLoginModalOpen(true))}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold transition shadow-md shadow-orange-500/20 flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                Đăng Nhập
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Render Login Modal */}
      <LoginModal />
    </>
  );
};
