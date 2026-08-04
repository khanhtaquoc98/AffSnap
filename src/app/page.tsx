'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};
import {
  Link2,
  Copy,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Sparkles,
  ClipboardPaste,
  Crown,
  Star,
  HelpCircle,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  Zap,
  Mail,
  Send,
  TrendingUp,
  Users,
  Lock,
  Headphones,
  PhoneCall,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setInputUrl,
  setIsConverting,
  setConvertedResult,
  setCopied,
  setErrorMessage,
  setHistoryLinks,
  addHistoryLink,
} from '@/store/slices/convertSlice';

export default function HomePage() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const user = useAppSelector((state) => state.auth.user);
  const { inputUrl, isConverting, convertedResult, copied, errorMessage, historyLinks } =
    useAppSelector((state) => state.convert);

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const isLockedRef = useRef(false);
  const touchStartYRef = useRef(0);

  const totalSlides = 5;

  const sectionTitles = [
    'Tạo Link Affiliate',
    'Top 3 Publisher',
    'Đánh Giá Khách Hàng',
    'Hỏi Đáp Q&A',
    'Liên Hệ & CSKH',
  ];

  useEffect(() => {
    let active = true;
    const fetchHistory = async () => {
      try {
        const uId = currentUser === 'USER' ? 'user-1' : currentUser === 'ADMIN' ? 'admin-1' : undefined;
        const res = await fetch(`/api/orders${uId ? `?userId=${uId}` : ''}`);
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (!active) return;
        if (data.links) {
          dispatch(setHistoryLinks(data.links));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchHistory();
    return () => {
      active = false;
    };
  }, [currentUser, dispatch]);

  // Full-Page Navigation Logic
  const goToSlide = (index: number) => {
    if (index < 0 || index >= totalSlides || isLockedRef.current) return;
    isLockedRef.current = true;
    setActiveSlide(index);
    setTimeout(() => {
      isLockedRef.current = false;
    }, 750);
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (window.innerWidth < 1024) return;
      if (isLockedRef.current) return;

      if (e.deltaY > 25) {
        if (activeSlide < totalSlides - 1) goToSlide(activeSlide + 1);
      } else if (e.deltaY < -25) {
        if (activeSlide > 0) goToSlide(activeSlide - 1);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLockedRef.current) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        if (activeSlide < totalSlides - 1) goToSlide(activeSlide + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        if (activeSlide > 0) goToSlide(activeSlide - 1);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (window.innerWidth >= 1024) return;
      if (isLockedRef.current) return;
      const touchEndY = e.changedTouches[0].clientY;
      const diffY = touchStartYRef.current - touchEndY;

      if (diffY > 60) {
        if (activeSlide < totalSlides - 1) goToSlide(activeSlide + 1);
      } else if (diffY < -60) {
        if (activeSlide > 0) goToSlide(activeSlide - 1);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [activeSlide]);

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    dispatch(setIsConverting(true));
    dispatch(setErrorMessage(''));
    dispatch(setConvertedResult(null));

    try {
      const uId = currentUser === 'USER' ? 'user-1' : currentUser === 'ADMIN' ? 'admin-1' : null;
      const res = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl, userId: uId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Chuyển đổi thất bại');
      }

      dispatch(setConvertedResult(data.data));
      dispatch(addHistoryLink(data.data));

      if (data.data?.affiliateUrl) {
        window.open(data.data.affiliateUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đã có lỗi xảy ra';
      dispatch(setErrorMessage(message));
    } finally {
      dispatch(setIsConverting(false));
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    dispatch(setCopied(true));
    setTimeout(() => dispatch(setCopied(false)), 2000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        dispatch(setInputUrl(text.trim()));
      }
    } catch (err) {
      console.error('Không thể đọc từ clipboard:', err);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Top 3 Publishers Data
  const topPublishers = [
    {
      rank: 1,
      name: 'Nguyễn Minh Anh',
      role: 'KOC Fashion Reviewer • 450k Followers',
      revenue: '148.500.000 đ',
      linksCount: '1,420',
      badge: '🥇 TOP 1 PUBLISHER',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      tagColor: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
      cardStyle: 'border-2 border-amber-400/80 bg-gradient-to-b from-amber-50/60 via-white to-amber-50/20 shadow-amber-500/10',
    },
    {
      rank: 2,
      name: 'Trần Quốc Bảo',
      role: 'Admin Group Săn Sale 200k Member',
      revenue: '98.200.000 đ',
      linksCount: '980',
      badge: '🥈 TOP 2 PUBLISHER',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      tagColor: 'bg-slate-100 text-slate-800 border-slate-300 font-bold',
      cardStyle: 'border border-slate-200 bg-white shadow-xl shadow-slate-200/50',
    },
    {
      rank: 3,
      name: 'Lê Thị Hoàng Yến',
      role: 'Beauty Content Creator & Reviewer',
      revenue: '74.800.000 đ',
      linksCount: '650',
      badge: '🥉 TOP 3 PUBLISHER',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      tagColor: 'bg-orange-100 text-orange-800 border-orange-300 font-bold',
      cardStyle: 'border border-slate-200 bg-white shadow-xl shadow-slate-200/50',
    },
  ];

  // Customer Reviews Data
  const customerReviews = [
    {
      id: 1,
      name: 'Phạm Thu Trang',
      role: 'TikToker KOC Fashion (180k Follows)',
      content:
        'AffSnap thực sự tuyệt vời! Link rút gọn cực kỳ mượt mà, dán vào là ra link affiliate ngay lập tức và tự động nhảy tab mới. Tỷ lệ hoa hồng ghi nhận chính xác 100%.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 2,
      name: 'Vũ Đức Mạnh',
      role: 'Chủ Channel Telegram Deal Ngon 85k Sub',
      content:
        'Dùng nhiều tool rút gọn link rồi nhưng thích AffSnap nhất vì giao diện siêu sạch, nút Dán từ clipboard tiện lợi. Doanh thu của team mình tăng 35% từ khi chuyển qua.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 3,
      name: 'Đặng Ngọc Thảo',
      role: 'Publisher Shopee Affiliate 3 Năm',
      content:
        'Hệ thống tự động đính kèm SubID hoa hồng siêu tiện lợi để đối soát. Hỗ trợ khách hàng qua Fanpage nhanh chóng và chuyên nghiệp. 10/10 điểm!',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    },
  ];

  // Q&A FAQ Data
  const faqs = [
    {
      question: 'AffSnap có hoàn toàn miễn phí khi sử dụng không?',
      answer:
        'Có! AffSnap là công cụ hỗ trợ Publisher & KOC rút gọn liên kết Shopee Affiliate hoàn toàn miễn phí. Bạn chỉ cần dán link sản phẩm Shopee là có thể nhận liên kết tích hợp SubID hoa hồng ngay lập tức mà không mất bất kỳ chi phí duy trì nào.',
    },
    {
      question: 'Tính năng tự động mở Tab mới hoạt động như thế nào?',
      answer:
        'Ngay sau khi bạn nhấn nút "Lấy link", hệ thống sẽ xử lý chuyển đổi và tự động gọi lệnh mở liên kết hoa hồng vừa tạo trong một tab trình duyệt mới, giúp bạn xem ngay kết quả và tiết kiệm thao tác sao chép thủ công.',
    },
    {
      question: 'Hoa hồng được tính và đối soát ra sao?',
      answer:
        'Hoa hồng phát sinh từ lượt mua hàng qua link rút gọn sẽ được tự động đính kèm SubID cá nhân của bạn trên Shopee Affiliate System. Bạn có thể đăng nhập tài khoản bằng Email trên AffSnap để đối soát chi tiết.',
    },
    {
      question: 'Hệ thống có bảo mật thông tin SubID và lịch sử link không?',
      answer:
        'Tuyệt đối an toàn! Tất cả SubID và đường dẫn đã chuyển đổi đều được mã hóa SSL 256-bit tiêu chuẩn ngân hàng và lưu trữ riêng cho tài khoản của bạn, cam kết không can thiệp hay thay đổi SubID hoa hồng.',
    },
    {
      question: 'Nếu gặp sự cố hoặc cần hỗ trợ CSKH thì liên hệ qua đâu?',
      answer:
        'Đội ngũ chăm sóc khách hàng (CSKH) của AffSnap làm việc 24/7. Bạn có thể nhấn trực tiếp vào liên kết Facebook Messenger ở góc màn hình hoặc nhắn qua Telegram @affsnap_support để được tư vấn nhanh chóng.',
    },
  ];

  return (
    <div className="min-h-screen lg:h-screen w-screen overflow-x-hidden lg:overflow-hidden text-slate-900 selection:bg-orange-500 selection:text-white relative font-sans">
      {/* SOFT AMBIENT GLOW SPHERES */}
      <div className="fixed top-10 left-10 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="fixed bottom-10 right-10 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* FIXED HEADER AT TOP */}
      <Header />

      {/* FLOATING SIDE DOTS NAVIGATION (DESKTOP) */}
      <div className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-50 flex-col gap-3.5 bg-white/90 backdrop-blur-xl p-3 rounded-full border border-slate-200 shadow-xl shadow-slate-200/80">
        {sectionTitles.map((title, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            title={title}
            className="group relative flex items-center justify-center p-1 focus:outline-none"
          >
            <span
              className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                activeSlide === idx
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 scale-125 ring-4 ring-orange-500/20 shadow-md'
                  : 'bg-slate-300 hover:bg-slate-400'
              }`}
            />
            {/* Tooltip */}
            <span className="absolute right-10 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none shadow-xl">
              {title}
            </span>
          </button>
        ))}
      </div>

      {/* SLIDES CONTAINER WITH SMOOTH SLIDE TRANSITION */}
      <div
        suppressHydrationWarning
        className="w-full transition-transform duration-700 ease-in-out lg:h-screen"
        style={{
          transform: isMounted && typeof window !== 'undefined' && window.innerWidth >= 1024 ? `translateY(-${activeSlide * 100}vh)` : 'none',
        }}
      >
        {/* ========================================== */}
        {/* SLIDE 0: HERO BANNER & INPUT CONVERTER */}
        {/* ========================================== */}
        <section className="min-h-screen lg:h-screen w-full relative flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center pt-24 pb-12 lg:py-0 overflow-hidden">
          <div className="max-w-4xl mx-auto space-y-6 lg:space-y-7 relative z-10 my-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100/90 border border-orange-200 text-orange-700 text-xs sm:text-sm font-bold shadow-xs">
              <Sparkles className="w-4 h-4 text-orange-600 animate-pulse" />
              <span>AffSnap PRO • Chuyển Đổi Link Shopee Tự Động & Mở Tab Mới Tức Thì</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.15]">
              Nhập Link Shopee - Nhận Ngay{' '}
              <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                Link Affiliate
              </span>
            </h1>

            <p className="text-slate-600 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
              Hệ thống tự động chuyển URL sản phẩm Shopee thành liên kết chia sẻ hoa hồng chuyên nghiệp. Tích hợp nút dán chớp mắt và tự động mở tab mới.
            </p>

            {/* CONVERTER CARD */}
            <div className="w-full max-w-2xl mx-auto p-5 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-2xl shadow-slate-200/80 space-y-5 text-left transition hover:border-orange-300">
              <form onSubmit={handleConvert} className="space-y-4">
                <div className="relative flex flex-col sm:flex-row items-stretch gap-2.5">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={inputUrl}
                      onChange={(e) => dispatch(setInputUrl(e.target.value))}
                      placeholder="Dán link Shopee (VD: https://shopee.vn/product/...)"
                      className="w-full pl-11 pr-20 py-3.5 sm:py-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition font-medium"
                      required
                    />
                    <Link2 className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      onClick={handlePaste}
                      title="Dán từ Clipboard"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-700 text-xs font-bold transition flex items-center gap-1.5 border border-orange-200 shadow-xs"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5 text-orange-600" />
                      Dán
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isConverting}
                    className="py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm sm:text-base shadow-lg shadow-orange-500/25 disabled:opacity-50 transition flex items-center justify-center gap-2 tracking-wide shrink-0 active:scale-98"
                  >
                    {isConverting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin text-white" />
                        <span>Đang tạo...</span>
                      </>
                    ) : (
                      <>
                        <span>Lấy link</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* Result Box */}
              {convertedResult && (
                <div className="p-4 sm:p-5 rounded-2xl bg-orange-50/70 border border-orange-200 space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-orange-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Tạo Link Affiliate Thành Công! (Đã tự động mở tab mới)
                    </span>
                    <span className="text-[10px] font-mono bg-white text-slate-800 px-2.5 py-1 rounded-full border border-orange-200 font-bold">
                      SubID: {convertedResult.subId}
                    </span>
                  </div>

                  {/* 1. DOMAIN SHORTLINK */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-600">🔗 Link Rút Gọn Chia Sẻ (Đếm Lượt Click):</span>
                    <div className="p-3 rounded-xl bg-white border border-orange-200 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                      <span className="text-xs sm:text-sm font-mono font-bold text-orange-600 break-all truncate">
                        {typeof window !== 'undefined' ? `${window.location.origin}/s/${convertedResult.shortCode}` : `/s/${convertedResult.shortCode}`}
                      </span>
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <button
                          onClick={() => handleCopy(typeof window !== 'undefined' ? `${window.location.origin}/s/${convertedResult.shortCode}` : `/s/${convertedResult.shortCode}`)}
                          className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-orange-500/20"
                        >
                          {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? 'Đã chép' : 'Chép Link Ngắn'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2. DIRECT SHOPEE PRODUCT URL WITH SUB_ID */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-600">🛒 Link Sản Phẩm Shopee Trực Tiếp (Kèm SubID):</span>
                    <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                      <span className="text-xs font-mono font-semibold text-slate-700 break-all truncate">
                        {convertedResult.affiliateUrl}
                      </span>
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <a
                          href={convertedResult.affiliateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
                          Mở Shopee
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* History Link Pills (Logged-in User) */}
            {user && historyLinks.length > 0 && (
              <div className="w-full max-w-2xl mx-auto pt-2 text-left space-y-2">
                <h3 className="text-xs font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wider">
                  <Link2 className="w-4 h-4 text-orange-600" />
                  Các Link Bạn Đã Tạo Gần Đây
                </h3>
                <div className="divide-y divide-slate-200 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                  {historyLinks.slice(0, 2).map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition">
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-mono font-bold text-orange-600 truncate">
                          {item.affiliateUrl}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{item.originalUrl}</p>
                      </div>
                      <button
                        onClick={() => handleCopy(item.affiliateUrl)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition shrink-0 border border-slate-200"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ========================================== */}
        {/* SLIDE 1: TOP 3 PUBLISHERS */}
        {/* ========================================== */}
        <section className="min-h-screen lg:h-screen w-full relative flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center py-16 lg:py-0">
          <div className="w-full space-y-6 lg:space-y-8 my-auto">
            {/* Header section */}
            <div className="space-y-2 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold shadow-xs">
                <Crown className="w-4 h-4 text-amber-600" />
                <span>Bảng Vàng Vinh Danh Publisher</span>
              </div>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                Top 3 Publisher Xuất Sắc Nhất Tháng
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm font-medium">
                Vinh danh các Publisher & KOC dẫn đầu doanh số hoa hồng với AffSnap PRO.
              </p>
            </div>

            {/* TOP METRICS SUMMARY STRIP */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl mx-auto">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block uppercase">Hoa hồng đã trao</span>
                  <span className="text-base font-black text-emerald-600 font-mono">1.850.000.000 đ</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 border border-orange-200">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block uppercase">Link đã chuyển đổi</span>
                  <span className="text-base font-black text-orange-600 font-mono">245,000+ Link</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block uppercase">Publisher hoạt động</span>
                  <span className="text-base font-black text-amber-600 font-mono">12,500+ KOC</span>
                </div>
              </div>
            </div>

            {/* TOP 3 CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-2 max-w-5xl mx-auto">
              {topPublishers.map((pub) => (
                <div
                  key={pub.rank}
                  className={`p-6 sm:p-7 rounded-3xl flex flex-col justify-between space-y-6 hover:-translate-y-1.5 transition duration-300 text-left ${pub.cardStyle}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs border ${pub.tagColor}`}>
                      {pub.badge}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 font-mono">
                      {pub.linksCount} links
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <img
                      src={pub.avatar}
                      alt={pub.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md"
                    />
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{pub.name}</h3>
                      <p className="text-xs text-slate-500 font-medium leading-snug">{pub.role}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Hoa Hồng Thực Nhận:
                    </span>
                    <p className="text-xl font-black text-emerald-600 font-mono">{pub.revenue}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* SLIDE 2: CUSTOMER REVIEWS */}
        {/* ========================================== */}
        <section className="min-h-screen lg:h-screen w-full relative flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center py-16 lg:py-0">
          <div className="w-full space-y-6 lg:space-y-8 my-auto">
            <div className="space-y-2 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 border border-orange-200 text-orange-800 text-xs font-bold shadow-xs">
                <Star className="w-4 h-4 text-orange-600 fill-orange-500" />
                <span>Đánh Giá Hài Lòng 99.8%</span>
              </div>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                Cảm Nhận Thực Tế Từ Khách Hàng
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm font-medium">
                Hàng ngàn KOC, TikToker và Admin cộng đồng săn sale tin dùng mỗi ngày.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto">
              {customerReviews.slice(0, 3).map((rev) => (
                <div
                  key={rev.id}
                  className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md shadow-slate-200/50 flex flex-col justify-between space-y-5 hover:border-orange-300 hover:shadow-xl transition duration-300 text-left"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed italic">
                      &quot;{rev.content}&quot;
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <img
                      src={rev.avatar}
                      alt={rev.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        {rev.name}
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">{rev.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* SLIDE 3: Q&A FAQ */}
        {/* ========================================== */}
        <section className="min-h-screen lg:h-screen w-full relative flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center py-16 lg:py-0">
          <div className="w-full space-y-6 lg:space-y-8 my-auto">
            <div className="space-y-2 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-bold shadow-xs">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span>Trung Tâm Trợ Giúp</span>
              </div>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                Câu Hỏi Thường Gặp (Q&A)
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm font-medium">
                Giải đáp nhanh mọi thắc mắc về cơ chế rút gọn link và đối soát hoa hồng.
              </p>
            </div>

            <div className="space-y-3.5 w-full text-left max-w-3xl mx-auto">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden transition-all duration-300"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full p-4 sm:p-5 text-left font-bold text-xs sm:text-sm text-slate-900 flex items-center justify-between gap-4 hover:bg-slate-50 transition"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                          isOpen ? 'rotate-180 text-orange-600' : ''
                        }`}
                      />
                    </button>
                    <div
                      className={`grid transition-all duration-300 ease-in-out ${
                        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="p-4 sm:p-5 pt-0 text-xs text-slate-600 font-medium leading-relaxed border-t border-slate-100">
                          {faq.answer}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* SLIDE 4: CONTACT & FOOTER */}
        {/* ========================================== */}
        {/* ========================================== */}
        {/* SLIDE 4: CONTACT & FOOTER */}
        {/* ========================================== */}
        <section className="w-full min-h-screen relative flex flex-col justify-between items-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-left pt-20 pb-8 lg:py-12 gap-8">
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start my-auto p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50">
            {/* BRAND COL */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-2xl text-slate-900 tracking-tight">AffSnap</span>
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs">
                    PRO
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                Công cụ hỗ trợ rút gọn link sản phẩm Shopee Affiliate chuyên nghiệp, tự động mở tab và đính kèm SubID đối soát hoa hồng chính xác.
              </p>

              <div className="space-y-2 pt-2 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Đối tác chính thức Shopee Affiliate Program</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Mã hóa bảo mật SSL 256-bit tiêu chuẩn</span>
                </div>
              </div>
            </div>

            {/* CSKH DIRECT CHANNELS */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase text-slate-900 tracking-wider flex items-center gap-2">
                <Headphones className="w-4 h-4 text-orange-600" />
                Hỗ Trợ CSKH Trực Tiếp 24/7
              </h4>

              <div className="space-y-3">
                <a
                  href="https://facebook.com/affsnap"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition shadow-md shadow-blue-600/20 active:scale-[0.98]"
                >
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Chat Qua Facebook Messenger
                  <ExternalLink className="w-4 h-4 opacity-80" />
                </a>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600 font-medium">
                  <p className="flex items-center gap-2 break-all">
                    <Mail className="w-4 h-4 text-orange-600 shrink-0" />
                    Email: <strong className="text-slate-900 font-mono">support@affsnap.vn</strong>
                  </p>
                  <p className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-blue-600 shrink-0" />
                    Telegram: <strong className="text-slate-900 font-mono">@affsnap_support</strong>
                  </p>
                  <p className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-emerald-600 shrink-0" />
                    Hotline: <strong className="text-slate-900 font-mono">1900 6868 (8:00 - 22:00)</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* COPYRIGHT SUBFOOTER */}
          <div className="w-full pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left text-xs text-slate-500 font-medium pb-4">
            <p>© 2026 AffSnap PRO. All rights reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] text-slate-500">
              <a href="#" className="hover:text-orange-600 transition">Điều khoản sử dụng</a>
              <span className="text-slate-300">•</span>
              <a href="#" className="hover:text-orange-600 transition">Chính sách bảo mật</a>
              <span className="text-slate-300">•</span>
              <span className="text-orange-600 font-mono font-bold">v2.5 PRO</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
