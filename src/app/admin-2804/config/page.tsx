'use client';

import React, { useState, useEffect } from 'react';
import { Key, Database, CheckCircle2 } from 'lucide-react';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AccessGuard } from '@/components/AccessGuard';
import { useAppDispatch, useAppSelector } from '@/store';
import { setTokenConfig, setSystemConfig } from '@/store/slices/adminSlice';
import { PayoutRequest } from '@/lib/store';

export default function AdminConfigPage() {
  const dispatch = useAppDispatch();
  const tokenConfig = useAppSelector((state) => state.admin.tokenConfig);

  const [affiliateIdInput, setAffiliateIdInput] = useState('20504406');
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
          setAffiliateIdInput(data.tokenConfig.appId || '20504406');
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
            ...tokenConfig,
            appId: affiliateIdInput.trim(),
            status: 'ACTIVE',
          },
          systemConfig: {
            userCommissionRate: userRateInput,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAdminMsg('Đã lưu cấu hình Affiliate ID và tỷ lệ hoa hồng thành công!');
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

  return (
    <AccessGuard allowedRoles={['ADMIN']} pageName="Cấu Hình Affiliate ID Admin" requiredRoleName="Admin">
      <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
        {/* LEFT SIDEBAR */}
        <AdminSidebar pendingPayoutsCount={pendingCount} />

        {/* MAIN CONTENT */}
        <main className="flex-1 p-8 space-y-8 overflow-y-auto max-w-7xl mx-auto">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">Cấu Hình Shopee Affiliate ID</h1>
                <span className="px-2.5 py-0.5 rounded-full font-bold text-xs flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đang Hoạt Động
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Cấu hình Affiliate ID dùng tạo link Universal Redirect (`s.shopee.vn/an_redir`) và tỷ lệ chia hoa hồng.
              </p>
            </div>
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
                  <h2 className="text-base font-bold text-slate-900">Cấu Hình Mã Affiliate</h2>
                  <p className="text-xs text-slate-500 font-medium">Mã Affiliate dùng để tạo link mua sắm hoa hồng</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-1.5 p-4 bg-orange-50/50 rounded-2xl border border-orange-200">
                  <label className="text-xs font-black text-orange-900 flex items-center justify-between">
                    <span>🔥 Shopee Affiliate ID của bạn</span>
                  </label>
                  <input
                    type="text"
                    value={affiliateIdInput}
                    onChange={(e) => setAffiliateIdInput(e.target.value)}
                    placeholder="VD: 20504406"
                    className="w-full px-3.5 py-3 rounded-xl bg-white border border-orange-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
                  />
                  <p className="text-[11px] text-slate-500 italic">
                    Mã Affiliate ID này sẽ tự động gắn vào đường dẫn `https://s.shopee.vn/an_redir?origin_link=...&affiliate_id={affiliateIdInput}` khi khách hàng chuyển đổi link.
                  </p>
                </div>

                <div className="space-y-1.5">
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
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <Database className="w-4 h-4 text-orange-400" />
                  Lưu Cấu Hình Affiliate ID
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>
    </AccessGuard>
  );
}

