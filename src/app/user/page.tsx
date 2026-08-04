'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  DollarSign,
  Clock,
  Building2,
  CreditCard,
  UserCheck,
  Send,
  CheckCircle2,
  XCircle,
  Edit3,
  Check,
  RefreshCw,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { AccessGuard } from '@/components/AccessGuard';
import { useAppDispatch, useAppSelector } from '@/store';
import { setOrders } from '@/store/slices/ordersSlice';
import { setHistoryLinks } from '@/store/slices/convertSlice';
import { VietQRBank } from '@/app/api/banks/route';
import { PayoutRequest } from '@/lib/store';
import { BankAutocomplete } from '@/components/BankAutocomplete';

export default function UserPage() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const orders = useAppSelector((state) => state.orders.orders);

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [banksList, setBanksList] = useState<VietQRBank[]>([]);

  // User Bank & Balance State
  const [userBalance, setUserBalance] = useState<number>(70000);
  const [bankInfo, setBankInfo] = useState({
    bankName: 'Vietcombank',
    bankCode: 'VCB',
    accountNumber: '1018899889',
    accountName: 'NGUYEN VAN A',
  });
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankSaving, setBankSaving] = useState(false);
  const [bankSaveMsg, setBankSaveMsg] = useState('');

  // Payout Request Modal & History State
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<number>(50000);
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentUserId = currentUser === 'USER' ? 'user-1' : 'admin-1';

  // Fetch VietQR Bank List
  useEffect(() => {
    fetch('/api/banks')
      .then((res) => res.json())
      .then((data) => {
        if (data.banks) setBanksList(data.banks);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const uId = currentUser === 'USER' ? 'user-1' : 'admin-1';
        const res = await fetch(`/api/orders?userId=${uId}`);
        const data = await res.json();
        if (!active) return;
        if (data.orders) dispatch(setOrders(data.orders));
        if (data.links) dispatch(setHistoryLinks(data.links));

        const payoutRes = await fetch(`/api/payouts?userId=${uId}`);
        const payoutData = await payoutRes.json();
        if (!active) return;
        if (payoutData.user) {
          setUserBalance(payoutData.user.balance || 0);
          if (payoutData.user.bankName) {
            setBankInfo({
              bankName: payoutData.user.bankName,
              bankCode: payoutData.user.bankCode || 'VCB',
              accountNumber: payoutData.user.accountNumber || '',
              accountName: payoutData.user.accountName || '',
            });
          }
        }
        if (payoutData.payoutRequests) {
          setPayoutRequests(payoutData.payoutRequests);
        }
      } catch (err) {
        console.error(err);
      }
    };
    init();
    return () => {
      active = false;
    };
  }, [currentUser, dispatch]);

  // Handle Save Bank Info
  const handleSaveBankInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankSaving(true);
    setBankSaveMsg('');

    try {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_BANK',
          userId: currentUserId,
          bankInfo,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cập nhật tài khoản thất bại');

      setBankSaveMsg('Đã cập nhật thông tin ngân hàng thành công!');
      setIsEditingBank(false);
      setTimeout(() => setBankSaveMsg(''), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      setBankSaveMsg(`⚠️ ${msg}`);
    } finally {
      setBankSaving(false);
    }
  };

  // Handle Submit Payout Request
  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutSubmitting(true);
    setPayoutMsg(null);

    try {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REQUEST_PAYOUT',
          userId: currentUserId,
          amount: payoutAmount,
          bankInfo,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tạo yêu cầu rút tiền thất bại');

      setPayoutMsg({ type: 'success', text: data.message });
      if (data.request) {
        setPayoutRequests([data.request, ...payoutRequests]);
      }
      if (data.user) {
        setUserBalance(data.user.balance);
      }

      setTimeout(() => {
        setIsPayoutModalOpen(false);
        setPayoutMsg(null);
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi xử lý';
      setPayoutMsg({ type: 'error', text: msg });
    } finally {
      setPayoutSubmitting(false);
    }
  };

  const filteredOrders = orders.filter(
    (o) => filterStatus === 'ALL' || o.status === filterStatus
  );

  const pendingUserCommission = orders
    .filter((o) => o.status === 'PENDING')
    .reduce((sum, o) => sum + o.userCommission, 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 lg:px-8 py-8 space-y-8">
        <AccessGuard
          allowedRoles={['USER', 'ADMIN']}
          pageName="Trang Cá Nhân & Rút Tiền Hoa Hồng"
          requiredRoleName="User"
        >
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">Bảng Điều Khiển & Ví Hoa Hồng</h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                  SubID: {currentUserId}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Quản lý thông tin tài khoản ngân hàng VietQR, số dư hoa hồng và tạo yêu cầu rút tiền.
              </p>
            </div>

            {/* Payout Trigger Button */}
            <button
              onClick={() => {
                setPayoutAmount(userBalance >= 50000 ? userBalance : 50000);
                setIsPayoutModalOpen(true);
              }}
              disabled={userBalance < 50000}
              className={`px-5 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md ${
                userBalance >= 50000
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/20 active:scale-98'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Rút Tiền Hoa Hồng {userBalance < 50000 ? '(Tối thiểu 50k)' : ''}
            </button>
          </div>

          {/* Stats Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md shadow-slate-200/50 space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Số Dư Khả Dụng
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-emerald-600 font-mono">
                {userBalance.toLocaleString('vi-VN')} đ
              </p>
              <div className="text-[11px] font-medium pt-0.5">
                {userBalance >= 50000 ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Đã đủ điều kiện tạo yêu cầu rút tiền
                  </span>
                ) : (
                  <span className="text-amber-600 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    Cần tối thiểu 50.000 đ để rút tiền
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md shadow-slate-200/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Hoa Hồng Chờ Đơn
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-amber-600 font-mono">
                {pendingUserCommission.toLocaleString('vi-VN')} đ
              </p>
              <p className="text-[11px] text-slate-400 font-medium">Chờ Shopee hoàn tất giao hàng</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md shadow-slate-200/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Tổng Đơn Ghi Nhận
                </span>
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 font-mono">{orders.length} đơn</p>
              <p className="text-[11px] text-slate-400 font-medium">Tính trên các link affiliate của bạn</p>
            </div>
          </div>

          {/* SECTION 1: BANK INFORMATION EDITABLE CARD */}
          <section className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-lg space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center border border-orange-200">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Tài Khoản Ngân Hàng Nhận Hoa Hồng</h2>
                  <p className="text-xs text-slate-500 font-medium">Danh sách ngân hàng liên kết VietQR chính thức</p>
                </div>
              </div>

              {!isEditingBank ? (
                <button
                  onClick={() => setIsEditingBank(true)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Chỉnh Sửa STK
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingBank(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition"
                >
                  Hủy
                </button>
              )}
            </div>

            {bankSaveMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                {bankSaveMsg}
              </div>
            )}

            {!isEditingBank ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Ngân hàng:</span>
                  <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-orange-600 shrink-0" />
                    {bankInfo.bankName || 'Chưa thiết lập'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Số tài khoản:</span>
                  <p className="text-sm font-mono font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                    {bankInfo.accountNumber || 'Chưa thiết lập'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Tên chủ tài khoản:</span>
                  <p className="text-sm font-bold text-emerald-700 uppercase flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    {bankInfo.accountName || 'Chưa thiết lập'}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveBankInfo} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Select VietQR Bank Autocomplete */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Ngân hàng (VietQR Logined Logo)</label>
                    <BankAutocomplete
                      banks={banksList}
                      selectedBankCode={bankInfo.bankCode}
                      onSelectBank={(selected) => {
                        setBankInfo({
                          ...bankInfo,
                          bankCode: selected.code,
                          bankName: selected.shortName,
                        });
                      }}
                    />
                  </div>

                  {/* Account Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Số tài khoản ngân hàng</label>
                    <input
                      type="text"
                      value={bankInfo.accountNumber}
                      onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                      placeholder="VD: 1018899889"
                      className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500"
                      required
                    />
                  </div>

                  {/* Account Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Tên chủ tài khoản (Viết hoa không dấu)</label>
                    <input
                      type="text"
                      value={bankInfo.accountName}
                      onChange={(e) => setBankInfo({ ...bankInfo, accountName: e.target.value.toUpperCase() })}
                      placeholder="VD: NGUYEN VAN A"
                      className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 uppercase focus:outline-none focus:bg-white focus:border-orange-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={bankSaving}
                    className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition flex items-center gap-1.5"
                  >
                    {bankSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Lưu Tài Khoản Ngân Hàng
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* SECTION 2: PAYOUT HISTORY */}
          {payoutRequests.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Lịch Sử Yêu Cầu Rút Tiền
              </h2>

              <div className="rounded-3xl bg-white border border-slate-200 shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-mono border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4">Mã Yêu Cầu</th>
                        <th className="px-6 py-4">Số Tiền Rút</th>
                        <th className="px-6 py-4">Tài Khoản Nhận</th>
                        <th className="px-6 py-4">Trạng Thái</th>
                        <th className="px-6 py-4">Thời Gian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {payoutRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4 font-mono font-bold text-slate-700">{req.id}</td>
                          <td className="px-6 py-4 font-mono font-bold text-emerald-600 text-sm">
                            {req.amount.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900">{req.bankName}</p>
                            <p className="font-mono text-slate-500">{req.accountNumber} • {req.accountName}</p>
                          </td>
                          <td className="px-6 py-4">
                            {req.status === 'APPROVED' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                ĐÃ DUYỆT & CHUYỂN TIỀN
                              </span>
                            ) : req.status === 'PENDING' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                ĐANG CHỜ ADMIN XÉT DUYỆT
                              </span>
                            ) : (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  TỪ CHỐI
                                </span>
                                {req.rejectReason && (
                                  <p className="text-[10px] text-rose-600 font-medium">Lý do: {req.rejectReason}</p>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-medium">
                            {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 3: ORDERS LIST */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-600" />
                Danh Sách Đơn Hàng Shopee Ghi Nhận
              </h2>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                {(['ALL', 'PENDING', 'COMPLETED', 'CANCELLED'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      filterStatus === status
                        ? 'bg-white text-orange-600 font-bold border border-slate-200 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {status === 'ALL'
                      ? 'Tất cả'
                      : status === 'PENDING'
                      ? 'Chờ xử lý'
                      : status === 'COMPLETED'
                      ? 'Hoàn tất'
                      : 'Đã hủy'}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-slate-200 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-mono border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Mã Đơn Shopee</th>
                      <th className="px-6 py-4">Sản Phẩm</th>
                      <th className="px-6 py-4">Giá Bán</th>
                      <th className="px-6 py-4">Hoa Hồng Bạn Nhận</th>
                      <th className="px-6 py-4">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-medium">
                          Chưa có đơn hàng nào phù hợp với bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4 font-mono font-bold text-orange-600">
                            {ord.orderSn}
                          </td>
                          <td className="px-6 py-4 max-w-xs truncate text-slate-800 font-semibold">
                            {ord.productName}
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium">
                            {ord.productPrice.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="px-6 py-4 font-bold text-emerald-600">
                            +{ord.userCommission.toLocaleString('vi-VN')} đ
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
                              {ord.status === 'COMPLETED'
                                ? 'ĐÃ ĐỐI SOÁT'
                                : ord.status === 'PENDING'
                                ? 'CHỜ XÁC NHẬN'
                                : 'ĐÃ HỦY'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </AccessGuard>
      </main>

      {/* MODAL PAYOUT REQUEST */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-6 animate-modal-pop">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Yêu Cầu Rút Tiền Hoa Hồng</h3>
              </div>
              <button
                onClick={() => setIsPayoutModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            {payoutMsg && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold text-center ${
                  payoutMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {payoutMsg.text}
              </div>
            )}

            <form onSubmit={handleSubmitPayout} className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>Số dư hiện tại:</span>
                  <strong className="text-emerald-600 font-mono font-black">{userBalance.toLocaleString('vi-VN')} đ</strong>
                </div>
                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>Mức rút tối thiểu:</span>
                  <strong className="text-slate-800 font-mono font-bold">50.000 đ</strong>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Số tiền muốn rút (VNĐ)</label>
                <input
                  type="number"
                  min={50000}
                  max={userBalance}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono font-black text-emerald-600 focus:outline-none focus:bg-white focus:border-emerald-500"
                  required
                />
              </div>

              {/* Bank Confirmation Box */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2 text-xs">
                <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Tiền sẽ được chuyển về tài khoản đã điền:
                </span>
                <div className="text-slate-700 font-medium space-y-0.5 pl-5">
                  <p>• Ngân hàng: <strong className="text-slate-900">{bankInfo.bankName}</strong></p>
                  <p>• Số tài khoản: <strong className="text-slate-900 font-mono">{bankInfo.accountNumber}</strong></p>
                  <p>• Chủ tài khoản: <strong className="text-emerald-700 uppercase">{bankInfo.accountName}</strong></p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={payoutSubmitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                >
                  {payoutSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Gửi Yêu Cầu Rút Tiền Cho Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
