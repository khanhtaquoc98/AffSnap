'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  DollarSign,
  Key,
  TrendingUp,
  LogOut,
  Zap,
  ArrowLeft,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout } from '@/store/slices/authSlice';

interface AdminSidebarProps {
  pendingPayoutsCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ pendingPayoutsCount = 0 }) => {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const navItems = [
    {
      label: 'Tổng Quan',
      href: '/admin-2804',
      icon: LayoutDashboard,
    },
    {
      label: 'Xét Duyệt Rút Tiền',
      href: '/admin-2804/payouts',
      icon: DollarSign,
      badge: pendingPayoutsCount > 0 ? pendingPayoutsCount : undefined,
    },
    {
      label: 'Cấu Hình Token',
      href: '/admin-2804/config',
      icon: Key,
    },
    {
      label: 'Đối Soát Đơn Hàng',
      href: '/admin-2804/orders',
      icon: TrendingUp,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 text-slate-900 flex flex-col justify-between p-5 min-h-screen shrink-0 sticky top-0 h-screen select-none shadow-xs">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-lg text-slate-900 tracking-tight">AffSnap</h1>
              <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-orange-500 text-white">
                ADMIN
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Control Center Portal</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/admin-2804'
                ? pathname === '/admin-2804'
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse shadow-xs">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về trang chủ</span>
        </Link>

        {user && (
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 font-mono truncate">{user.email}</p>
            </div>
            <button
              onClick={() => dispatch(logout())}
              title="Đăng xuất"
              className="p-2 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition border border-slate-200 shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
