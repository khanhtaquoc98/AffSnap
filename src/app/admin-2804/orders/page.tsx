'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AccessGuard } from '@/components/AccessGuard';
import { useAppDispatch, useAppSelector } from '@/store';
import { setOrders } from '@/store/slices/ordersSlice';
import { PayoutRequest } from '@/lib/store';

export default function AdminOrdersPage() {
  const dispatch = useAppDispatch();
  const orders = useAppSelector((state) => state.orders.orders);
  const systemConfig = useAppSelector((state) => state.admin.systemConfig);

  const [pendingCount, setPendingCount] = useState(0);

  const fetchOrdersData = async () => {
    try {
      const resOrders = await fetch('/api/orders');
      const dataOrders = await resOrders.json();
      if (dataOrders.orders) dispatch(setOrders(dataOrders.orders));

      const resPayouts = await fetch('/api/payouts');
      const dataPayouts = await resPayouts.json();
      if (dataPayouts.payoutRequests) {
        const pending = (dataPayouts.payoutRequests as PayoutRequest[]).filter((p) => p.status === 'PENDING').length;
        setPendingCount(pending);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const resOrders = await fetch('/api/orders');
        const dataOrders = await resOrders.json();
        if (!active) return;
        if (dataOrders.orders) dispatch(setOrders(dataOrders.orders));

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

  const handleReconcileOrder = async (orderId: string, status: 'COMPLETED' | 'CANCELLED') => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOrdersData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AccessGuard allowedRoles={['ADMIN']} pageName="Đối Soát Đơn Hàng" requiredRoleName="Admin">
      <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
        {/* LEFT SIDEBAR */}
        <AdminSidebar pendingPayoutsCount={pendingCount} />

        {/* MAIN CONTENT */}
        <main className="flex-1 p-8 space-y-8 overflow-y-auto max-w-7xl mx-auto">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">Đối Soát Đơn Hàng Shopee</h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  {orders.length} Đơn
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Kiểm tra danh sách đơn hàng Shopee Affiliate và phê duyệt phân chia hoa hồng cho User.
              </p>
            </div>

            <button
              onClick={fetchOrdersData}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tải Lại Đơn Hàng
            </button>
          </div>

          {/* Orders Table */}
          <section className="space-y-4">
            <div className="rounded-3xl bg-white border border-slate-200 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-mono border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Mã Đơn Shopee</th>
                      <th className="px-6 py-4">Sản Phẩm</th>
                      <th className="px-6 py-4">Tổng HH Shopee</th>
                      <th className="px-6 py-4">User Nhận ({systemConfig.userCommissionRate}%)</th>
                      <th className="px-6 py-4">Admin Nhận ({systemConfig.adminCommissionRate}%)</th>
                      <th className="px-6 py-4">Trạng Thái</th>
                      <th className="px-6 py-4">Thao Tác Đối Soát</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-400 font-medium">
                          Chưa có đơn hàng nào ghi nhận.
                        </td>
                      </tr>
                    ) : (
                      orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4 font-mono font-bold text-orange-600">{ord.orderSn}</td>
                          <td className="px-6 py-4 max-w-xs truncate text-slate-800 font-semibold">{ord.productName}</td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-900">
                            {ord.totalCommission.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-emerald-600">
                            +{ord.userCommission.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-orange-600">
                            +{ord.adminCommission.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                                ord.status === 'COMPLETED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : ord.status === 'PENDING'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {ord.status === 'PENDING' ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleReconcileOrder(ord.id, 'COMPLETED')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-xs"
                                >
                                  Duyệt Đơn
                                </button>
                                <button
                                  onClick={() => handleReconcileOrder(ord.id, 'CANCELLED')}
                                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] transition"
                                >
                                  Hủy
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-mono">Đã đối soát</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>
    </AccessGuard>
  );
}
