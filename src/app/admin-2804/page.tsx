'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  Key,
  Users,
  ShoppingBag,
  ArrowRight,
  Zap,
  Copy,
  Check,
  ExternalLink,
  Link2,
} from 'lucide-react';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AccessGuard } from '@/components/AccessGuard';
import { PayoutRequest, LinkRecord } from '@/lib/store';

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Array<{ id: string; totalCommission: number; userCommission: number; adminCommission: number }>>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [userRate, setUserRate] = useState(70);
  const [adminRate, setAdminRate] = useState(30);

  // Admin Quick Link Converter State
  const [adminInputUrl, setAdminInputUrl] = useState('');
  const [selectedSubId, setSelectedSubId] = useState('admin-1');
  const [customSubId, setCustomSubId] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [convertedLink, setConvertedLink] = useState<LinkRecord | null>(null);
  const [convertError, setConvertError] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const resConfig = await fetch('/api/admin/config');
        const textConfig = await resConfig.text();
        const dataConfig = textConfig ? JSON.parse(textConfig) : {};
        if (!active) return;
        if (dataConfig.systemConfig) {
          setUserRate(dataConfig.systemConfig.userCommissionRate || 70);
          setAdminRate(dataConfig.systemConfig.adminCommissionRate || 30);
        }

        const resOrders = await fetch('/api/orders');
        const textOrders = await resOrders.text();
        const dataOrders = textOrders ? JSON.parse(textOrders) : {};
        if (!active) return;
        if (dataOrders.orders) setOrders(dataOrders.orders);

        const resPayouts = await fetch('/api/payouts');
        const textPayouts = await resPayouts.text();
        const dataPayouts = textPayouts ? JSON.parse(textPayouts) : {};
        if (!active) return;
        if (dataPayouts.payoutRequests) setPayoutRequests(dataPayouts.payoutRequests);
      } catch (err) {
        console.error(err);
      }
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  // Handle Admin Link Conversion
  const handleAdminConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminInputUrl.trim()) return;

    setIsConverting(true);
    setConvertError('');
    setConvertedLink(null);

    const targetSubId = selectedSubId === 'CUSTOM' ? customSubId.trim() || 'admin-custom' : selectedSubId;

    try {
      const res = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: adminInputUrl.trim(),
          userId: targetSubId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Chuyển đổi link thất bại');
      }

      setConvertedLink(data.data);
      if (data.data?.affiliateUrl) {
        window.open(data.data.affiliateUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đã có lỗi xảy ra';
      setConvertError(msg);
    } finally {
      setIsConverting(false);
    }
  };

  const handleCopyLink = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const totalSystemCommission = orders.reduce((sum, o) => sum + o.totalCommission, 0);
  const totalUserCommission = orders.reduce((sum, o) => sum + o.userCommission, 0);
  const totalAdminCommission = orders.reduce((sum, o) => sum + o.adminCommission, 0);
  const pendingPayoutsCount = payoutRequests.filter((p) => p.status === 'PENDING').length;

  return (
    <AccessGuard allowedRoles={['ADMIN']} pageName="Dashboard Admin" requiredRoleName="Admin">
      <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
        {/* LEFT SIDEBAR */}
        <AdminSidebar pendingPayoutsCount={pendingPayoutsCount} />

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 p-8 space-y-8 overflow-y-auto max-w-7xl mx-auto">
          {/* Header Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">Tổng Quan Hệ Thống</h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                  v2.5 PRO
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Theo dõi tổng quan tài chính, rút gọn link nhanh cho Admin và xét duyệt rút tiền.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin-2804/payouts"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
              >
                <DollarSign className="w-4 h-4" />
                Duyệt Rút Tiền ({pendingPayoutsCount})
              </Link>
            </div>
          </div>

          {/* SECTION 1: ADMIN QUICK LINK GENERATOR CARD */}
          <section className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-lg space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center border border-orange-200">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Tạo Link Rút Gọn Nhanh Cho Admin / User</h2>
                <p className="text-xs text-slate-500 font-medium">Chuyển đổi URL sản phẩm Shopee thành Link Affiliate tức thì</p>
              </div>
            </div>

            {convertError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                ⚠️ {convertError}
              </div>
            )}

            <form onSubmit={handleAdminConvert} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Input URL */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Dán URL sản phẩm Shopee</label>
                  <div className="relative">
                    <input
                      type="url"
                      value={adminInputUrl}
                      onChange={(e) => setAdminInputUrl(e.target.value)}
                      placeholder="VD: https://shopee.vn/product/123/456..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500"
                      required
                    />
                    <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* SubID Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Gán SubID / User ID</label>
                  <select
                    value={selectedSubId}
                    onChange={(e) => setSelectedSubId(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500"
                  >
                    <option value="admin-1">👑 Admin (Trực tiếp: admin-1)</option>
                    <option value="user-1">👤 User Test (user-1)</option>
                    <option value="CUSTOM">✏️ Nhập SubID tùy chỉnh...</option>
                  </select>
                </div>
              </div>

              {selectedSubId === 'CUSTOM' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Nhập SubID tùy chỉnh (VD: campaign_fb_01)</label>
                  <input
                    type="text"
                    value={customSubId}
                    onChange={(e) => setCustomSubId(e.target.value)}
                    placeholder="VD: campaign_fb_01"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isConverting}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs shadow-md shadow-orange-500/20 transition flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  {isConverting ? 'Đang Chuyển Đổi...' : 'Lấy Link Affiliate Admin & Mở Tab Mới'}
                </button>
              </div>
            </form>

            {/* CONVERTED LINK RESULT DISPLAY */}
            {convertedLink && (
              <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200 space-y-3 animate-tab-fade">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-800 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Đã chuyển đổi thành công (SubID: {convertedLink.subId})
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Mã Rút Gọn: {convertedLink.shortCode}</span>
                </div>

                {/* 1. SHORTLINK ROUTE */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600">🔗 Link Rút Gọn Rút Ghi Nhận Click:</span>
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                    <span className="font-mono text-xs font-bold text-orange-600 break-all truncate">
                      {typeof window !== 'undefined' ? `${window.location.origin}/s/${convertedLink.shortCode}` : `/s/${convertedLink.shortCode}`}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCopyLink(typeof window !== 'undefined' ? `${window.location.origin}/s/${convertedLink.shortCode}` : `/s/${convertedLink.shortCode}`)}
                        className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1 transition shadow-xs"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {isCopied ? 'Đã chép!' : 'Chép Link Ngắn'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. DIRECT SHOPEE PRODUCT URL WITH SUB_ID */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600">🛒 Link Sản Phẩm Shopee Trực Tiếp (Kèm SubID):</span>
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                    <span className="font-mono text-xs font-semibold text-slate-700 break-all truncate">
                      {convertedLink.affiliateUrl}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={convertedLink.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 transition shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Mở Shopee
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Financial Overview Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Tổng Hoa Hồng Shopee
                </span>
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 font-mono">
                {totalSystemCommission.toLocaleString('vi-VN')} đ
              </p>
              <p className="text-[11px] text-slate-400 font-medium">Toàn bộ doanh thu ghi nhận</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Hoa Hồng Chia User ({userRate}%)
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-emerald-600 font-mono">
                {totalUserCommission.toLocaleString('vi-VN')} đ
              </p>
              <p className="text-[11px] text-slate-400 font-medium">Chi trả cho Publisher & KOC</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Lợi Nhuận Admin ({adminRate}%)
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-orange-600 font-mono">
                {totalAdminCommission.toLocaleString('vi-VN')} đ
              </p>
              <p className="text-[11px] text-slate-400 font-medium">Lợi nhuận giữ lại cho sàn</p>
            </div>
          </div>

          {/* Quick Management Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/admin-2804/payouts"
              className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md hover:shadow-xl hover:border-emerald-300 transition space-y-4 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition flex items-center justify-between">
                  Xét Duyệt Rút Tiền
                  <ArrowRight className="w-4 h-4" />
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Xem và phê duyệt các yêu cầu rút hoa hồng 50k từ Publisher.
                </p>
              </div>
            </Link>

            <Link
              href="/admin-2804/config"
              className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md hover:shadow-xl hover:border-orange-300 transition space-y-4 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-105 transition">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition flex items-center justify-between">
                  Cấu Hình Token 1 Năm
                  <ArrowRight className="w-4 h-4" />
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Mã hóa AES-256 Header Token, Cookie và điều chỉnh tỷ lệ chia.
                </p>
              </div>
            </Link>

            <Link
              href="/admin-2804/orders"
              className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md hover:shadow-xl hover:border-blue-300 transition space-y-4 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition flex items-center justify-between">
                  Đối Soát Đơn Hàng
                  <ArrowRight className="w-4 h-4" />
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Quản lý danh sách đơn hàng Shopee và phê duyệt đơn hoàn tất.
                </p>
              </div>
            </Link>
          </div>
        </main>
      </div>
    </AccessGuard>
  );
}
