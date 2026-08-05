'use client';

import React, { useState, useEffect } from 'react';
import {
  Key,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AccessGuard } from '@/components/AccessGuard';
import { useAppDispatch, useAppSelector } from '@/store';
import { setTokenConfig, setSystemConfig } from '@/store/slices/adminSlice';
import { PayoutRequest } from '@/lib/store';

export default function AdminConfigPage() {
  const dispatch = useAppDispatch();
  const tokenConfig = useAppSelector((state) => state.admin.tokenConfig);

  const [headerInput, setHeaderInput] = useState('');
  const [cookieInput, setCookieInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [userRateInput, setUserRateInput] = useState<number>(70);
  const [adminMsg, setAdminMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const res = await fetch('/api/admin/config');
        const data = await res.json();
        if (!active) return;
        if (data.tokenConfig) {
          dispatch(setTokenConfig(data.tokenConfig));
          setHeaderInput(data.tokenConfig.headerToken || '');
          setCookieInput(data.tokenConfig.cookie || '');
          setUsernameInput(data.tokenConfig.username || '');
          setPasswordInput(data.tokenConfig.password || '');
        }
        if (data.systemConfig) {
          dispatch(setSystemConfig(data.systemConfig));
          setUserRateInput(data.systemConfig.userCommissionRate || 70);
        }
        const resPayouts = await fetch('/api/payouts');
        const textPayouts = await resPayouts.text();
        const dataPayouts = textPayouts ? JSON.parse(textPayouts) : {};
        if (!active) return;
        if (dataPayouts.payoutRequests) {
          const pending = (dataPayouts.payoutRequests as PayoutRequest[]).filter((p) => p.status === 'PENDING').length;
          setPendingCount(pending);
        }
      } catch (err) {
        console.error(err);
      }
    };
    init();
    return () => {
      active = false;
    };
  }, [dispatch]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAdminMsg('');
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenConfig: {
            headerToken: headerInput,
            cookie: cookieInput,
            username: usernameInput,
            password: passwordInput,
          },
          systemConfig: {
            userCommissionRate: userRateInput,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAdminMsg('Đã lưu cấu hình token và tỷ lệ hoa hồng thành công!');
        dispatch(setTokenConfig(data.tokenConfig));
        dispatch(setSystemConfig(data.systemConfig));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
      setAdminMsg('Lưu cấu hình thất bại: ' + msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoLogin = async () => {
    setIsLoading(true);
    setAdminMsg('');
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'AUTO_LOGIN',
          tokenConfig: {
            username: usernameInput,
            password: passwordInput,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAdminMsg(data.message);
        dispatch(setTokenConfig(data.tokenConfig));
        setHeaderInput(data.tokenConfig.headerToken);
        setCookieInput(data.tokenConfig.cookie);
      } else {
        setAdminMsg(data.error || 'Auto-login thất bại');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
      setAdminMsg('Lỗi tự động đăng nhập: ' + msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryToken = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RETRY_TOKEN' }),
      });
      const data = await res.json();
      if (data.success) {
        dispatch(setTokenConfig(data.tokenConfig));
        setAdminMsg(data.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AccessGuard allowedRoles={['ADMIN']} pageName="Cấu Hình Token Admin" requiredRoleName="Admin">
      <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
        {/* LEFT SIDEBAR */}
        <AdminSidebar pendingPayoutsCount={pendingCount} />

        {/* MAIN CONTENT */}
        <main className="flex-1 p-8 space-y-8 overflow-y-auto max-w-7xl mx-auto">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">Cấu Hình Shopee Token & Mã Hóa</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold text-xs flex items-center gap-1 border ${
                    tokenConfig.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {tokenConfig.status === 'ACTIVE' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Chu Kỳ Token 1 Năm
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Token Hết Hạn
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Mã hóa AES-256-CBC bảo mật HeaderToken, Cookie chuỗi phiên và điều chỉnh tỷ lệ chia hoa hồng.
              </p>
            </div>

            <button
              onClick={handleRetryToken}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Kiểm Tra Token
            </button>
          </div>

          {adminMsg && (
            <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold shadow-xs">
              {adminMsg}
            </div>
          )}

          {/* Config Form Card */}
          <section className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-lg space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center border border-orange-200">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Thông Tin Cấu Hình Mã Hóa</h2>
                  <p className="text-xs text-slate-500 font-medium">Tự động hóa lấy Token chu kỳ 1 năm</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAutoLogin}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                Tự Động Đăng Nhập & Đổi Token 1 Năm
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Username Shopee Affiliate</label>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="user_shopee_aff hoặc email"
                    className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Password Shopee</label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500"
                    required
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Tỷ lệ chia hoa hồng User (%) <span className="text-[11px] font-normal text-slate-400">(Nhập 0% = Không chia, Admin giữ 100%)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={userRateInput}
                    onChange={(e) => setUserRateInput(Number(e.target.value))}
                    className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-emerald-600 focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Database className="w-4 h-4 text-orange-400" />
                  Lưu Cấu Hình Tài Khoản Auto-Login
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>
    </AccessGuard>
  );
}
