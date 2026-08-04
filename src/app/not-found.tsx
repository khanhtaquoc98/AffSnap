import React from 'react';
import Link from 'next/link';
import { Home, Zap, UserCheck } from 'lucide-react';
import { Header } from '@/components/Header';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans relative overflow-hidden">
      {/* SOFT AMBIENT GLOW LIGHTS */}
      <div className="fixed top-10 left-1/4 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="fixed bottom-10 right-1/4 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <Header />

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 relative z-10 max-w-2xl mx-auto space-y-8">
        {/* 404 Glowing Badge */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100/80 border border-orange-200 text-orange-700 text-xs font-black shadow-xs">
            <Zap className="w-4 h-4" />
            LỖI 404 • NOT FOUND
          </div>

          <h1 className="text-8xl sm:text-9xl font-black tracking-tight text-slate-900 select-none">
            4<span className="gradient-text-shopee">0</span>4
          </h1>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Trang bạn tìm kiếm không tồn tại!
          </h2>
          <p className="text-sm text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
            Đường dẫn bạn vừa truy cập có thể đã bị thay đổi, xóa bỏ hoặc không khả dụng trên hệ thống AffSnap PRO.
          </p>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full pt-4">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm shadow-xl shadow-orange-500/25 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Về Trang Chủ AffSnap
          </Link>

          <Link
            href="/user"
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-sm shadow-md transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Trang Cá Nhân
          </Link>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="py-6 text-center text-xs text-slate-400 font-medium border-t border-slate-200/60 bg-white/50 backdrop-blur-md">
        © 2026 AffSnap PRO • Shopee Affiliate Link Generator & Commission Portal
      </footer>
    </div>
  );
}
