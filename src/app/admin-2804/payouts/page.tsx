'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Check,
  RefreshCw,
} from 'lucide-react';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AccessGuard } from '@/components/AccessGuard';
import { PayoutRequest } from '@/lib/store';

export default function AdminPayoutsPage() {
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const fetchPayouts = async () => {
    try {
      const res = await fetch('/api/payouts');
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (data.payoutRequests) {
        setPayoutRequests(data.payoutRequests);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const res = await fetch('/api/payouts');
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (!active) return;
        if (data.payoutRequests) setPayoutRequests(data.payoutRequests);
      } catch (err) {
        console.error(err);
      }
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  const handleApprovePayout = async (requestId: string) => {
    if (!confirm('Bạn có chắc chắn muốn PHÊ DUYỆT yêu cầu rút tiền này và trừ số dư của User?')) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE', requestId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Duyệt thất bại');

      setStatusMsg(`✅ ${data.message}`);
      if (data.payoutRequests) setPayoutRequests(data.payoutRequests);
      setTimeout(() => setStatusMsg(''), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi xử lý';
      alert(`⚠️ ${msg}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalId) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REJECT',
          requestId: rejectModalId,
          rejectReason: rejectReasonInput.trim() || 'Thông tin ngân hàng không hợp lệ',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Từ chối thất bại');

      setStatusMsg(`❌ ${data.message}`);
      if (data.payoutRequests) setPayoutRequests(data.payoutRequests);
      setRejectModalId(null);
      setRejectReasonInput('');
      setTimeout(() => setStatusMsg(''), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi xử lý';
      alert(`⚠️ ${msg}`);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = payoutRequests.filter((p) => p.status === 'PENDING').length;

  return (
    <AccessGuard allowedRoles={['ADMIN']} pageName="Xét Duyệt Rút Tiền" requiredRoleName="Admin">
      <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
        {/* LEFT SIDEBAR */}
        <AdminSidebar pendingPayoutsCount={pendingCount} />

        {/* MAIN CONTENT */}
        <main className="flex-1 p-8 space-y-8 overflow-y-auto max-w-7xl mx-auto">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">Xét Duyệt Yêu Cầu Rút Tiền</h1>
                {pendingCount > 0 && (
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                    {pendingCount} Chờ duyệt
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Duyệt hoặc từ chối các yêu cầu rút hoa hồng (ngưỡng 50k) từ tài khoản VietQR của Publisher.
              </p>
            </div>

            <button
              onClick={fetchPayouts}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Làm Mới Danh Sách
            </button>
          </div>

          {statusMsg && (
            <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold shadow-xs">
              {statusMsg}
            </div>
          )}

          {/* Payout Requests Table */}
          <div className="rounded-3xl bg-white border border-slate-200 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-mono border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Số Tiền Rút</th>
                    <th className="px-6 py-4">Thông Tin VietQR STK</th>
                    <th className="px-6 py-4">Trạng Thái</th>
                    <th className="px-6 py-4">Thời Gian</th>
                    <th className="px-6 py-4">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {payoutRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-medium">
                        Chưa có yêu cầu rút tiền nào.
                      </td>
                    </tr>
                  ) : (
                    payoutRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-orange-600" />
                            {req.userName}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">{req.userEmail}</p>
                        </td>
                        <td className="px-6 py-4 font-mono font-black text-emerald-600 text-sm">
                          {req.amount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{req.bankName}</p>
                          <p className="font-mono text-slate-600 font-bold">{req.accountNumber}</p>
                          <p className="text-[11px] font-bold text-emerald-700 uppercase">{req.accountName}</p>
                        </td>
                        <td className="px-6 py-4">
                          {req.status === 'APPROVED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ĐÃ PHÊ DUYỆT
                            </span>
                          ) : req.status === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              CHỜ ADMIN DUYỆT
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                TỪ CHỐI
                              </span>
                              {req.rejectReason && (
                                <p className="text-[10px] text-rose-600 font-medium">{req.rejectReason}</p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">
                          {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4">
                          {req.status === 'PENDING' ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApprovePayout(req.id)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Duyệt
                              </button>
                              <button
                                onClick={() => setRejectModalId(req.id)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 transition"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Từ chối
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono">Đã xử lý</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* REJECT MODAL REASON INPUT */}
        {rejectModalId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-md p-6 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-4 animate-modal-pop">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-600" />
                  Từ Chối Yêu Cầu Rút Tiền
                </h3>
                <button onClick={() => setRejectModalId(null)} className="text-slate-400 hover:text-slate-700">
                  ✕
                </button>
              </div>

              <form onSubmit={handleRejectPayoutSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Nhập Lý Do Từ Chối (Gửi tới User)</label>
                  <textarea
                    rows={3}
                    value={rejectReasonInput}
                    onChange={(e) => setRejectReasonInput(e.target.value)}
                    placeholder="VD: Sai tên chủ tài khoản hoặc số tài khoản không hợp lệ..."
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-rose-500 resize-none font-medium"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRejectModalId(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20"
                  >
                    Xác Nhận Từ Chối
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AccessGuard>
  );
}
