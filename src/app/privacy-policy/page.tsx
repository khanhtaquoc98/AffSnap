import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, Eye, Server, UserCheck, Mail } from 'lucide-react';

export const metadata = {
  title: 'Chính sách bảo mật (Privacy Policy) - AffSnap',
  description: 'Chính sách bảo mật thông tin người dùng cho ứng dụng AffSnap và Facebook Messenger Bot.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Trang chủ AffSnap
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-orange-600" />
            <span className="font-bold text-lg bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              AffSnap
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-slate-200/80">
          <div className="border-b border-slate-100 pb-6 mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              Chính Sách Bảo Mật (Privacy Policy)
            </h1>
            <p className="text-slate-500 text-sm">
              Cập nhật lần cuối: <span className="font-medium text-slate-700">Ngày 04 tháng 08 năm 2026</span>
            </p>
          </div>

          <div className="space-y-8 leading-relaxed text-slate-700">
            {/* Section 1 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-slate-900 font-bold text-xl">
                <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                  <Eye className="w-5 h-5" />
                </div>
                <h2>1. Giới thiệu chung</h2>
              </div>
              <p>
                Chào mừng bạn đến với <strong>AffSnap</strong> (bao gồm website ứng dụng và Facebook Messenger Bot tích hợp). Chúng tôi cam kết bảo vệ quyền riêng tư và thông tin cá nhân của người dùng khi trải nghiệm các dịch vụ chuyển đổi link Shopee Affiliate tự động của chúng tôi.
              </p>
              <p>
                Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu cá nhân của bạn khi tương tác với nền tảng AffSnap cũng như Fanpage Messenger Bot của chúng tôi.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-slate-900 font-bold text-xl">
                <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                  <Server className="w-5 h-5" />
                </div>
                <h2>2. Thông tin chúng tôi thu thập</h2>
              </div>
              <p>Khi bạn sử dụng ứng dụng AffSnap hoặc chat với Facebook Messenger Bot, chúng tôi có thể thu thập các thông tin sau:</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600">
                <li>
                  <strong>Thông tin hồ sơ công khai từ Facebook Messenger:</strong> Bao gồm Page-Scoped User ID (PSID), tên hiển thị và ảnh đại diện công khai (do Facebook cung cấp qua API Messenger).
                </li>
                <li>
                  <strong>Nội dung tương tác & liên kết:</strong> Nội dung đường dẫn Shopee (Shopee URLs) mà bạn gửi qua câu lệnh <code className="bg-slate-100 px-2 py-0.5 rounded text-orange-600 text-sm font-mono">/getlink</code> hoặc dán trực tiếp vào cửa sổ chat để tạo link Affiliate.
                </li>
                <li>
                  <strong>Dữ liệu kỹ thuật cơ bản:</strong> Địa chỉ IP, loại trình duyệt, nhật ký truy cập (log files) nhằm mục đích đảm bảo an toàn hệ thống và phòng chống gian lận.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-slate-900 font-bold text-xl">
                <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                  <Lock className="w-5 h-5" />
                </div>
                <h2>3. Mục đích sử dụng thông tin</h2>
              </div>
              <p>Dữ liệu thu thập chỉ được sử dụng cho các mục đích chính đáng sau:</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600">
                <li>Phản hồi tin nhắn và gửi lại link Shopee Affiliate Custom rút gọn cho người dùng.</li>
                <li>Xử lý và tính toán thống kê lượng truy cập link Affiliate trong hệ thống.</li>
                <li>Duy trì, nâng cấp chất lượng dịch vụ và hỗ trợ kỹ thuật cho người dùng.</li>
                <li>Ngăn chặn các hành vi tấn công mạng, lạm dụng hệ thống hoặc vi phạm điều khoản dịch vụ của Shopee & Meta.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-slate-900 font-bold text-xl">
                <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h2>4. Cam kết bảo mật & Chia sẻ dữ liệu</h2>
              </div>
              <ul className="list-disc pl-6 space-y-2 text-slate-600">
                <li>
                  <strong>KHÔNG bán hoặc cho thuê dữ liệu:</strong> Chúng tôi tuyệt đối không bán, trao đổi hoặc mua bán dữ liệu cá nhân của người dùng cho bất kỳ bên thứ ba nào.
                </li>
                <li>
                  <strong>Chia sẻ với đối tác dịch vụ:</strong> Dữ liệu chỉ được xử lý qua hạ tầng bảo mật của Meta (Facebook Messenger API) và Shopee Affiliate API để phục vụ chính xác tính năng tạo link.
                </li>
                <li>
                  <strong>Tuân thủ pháp luật:</strong> Chúng tôi chỉ cung cấp thông tin trong trường hợp có yêu cầu bằng văn bản từ cơ quan pháp luật có thẩm quyền.
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 text-slate-900 font-bold text-xl">
                <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h2>5. Quyền của người dùng & Xóa dữ liệu (Data Deletion)</h2>
              </div>
              <p>
                Bạn có toàn quyền kiểm soát dữ liệu cá nhân của mình khi tương tác với ứng dụng:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600">
                <li>Dừng tương tác hoặc xóa đoạn chat với Fanpage Messenger Bot bất kỳ lúc nào.</li>
                <li>
                  Yêu cầu xóa toàn bộ lịch sử link và thông tin liên quan trong hệ thống bằng cách gửi email yêu cầu tới bộ phận hỗ trợ của chúng tôi.
                </li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3 text-slate-900 font-bold text-xl">
                <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                  <Mail className="w-5 h-5" />
                </div>
                <h2>6. Thông tin liên hệ</h2>
              </div>
              <p>Nếu bạn có bất kỳ câu hỏi hoặc thắc mắc nào liên quan đến Chính sách bảo mật này, xin vui lòng liên hệ:</p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-1 text-slate-700">
                <p><strong>Ứng dụng:</strong> AffSnap - Shopee Affiliate Converter & Messenger Bot</p>
                <p><strong>Email hỗ trợ:</strong> <a href="mailto:support@affsnap.com" className="text-orange-600 hover:underline">support@affsnap.com</a></p>
                <p><strong>Website:</strong> <a href="https://affsnap.vercel.app" className="text-orange-600 hover:underline">https://affsnap.vercel.app</a></p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4">
          <p>© {new Date().getFullYear()} AffSnap. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
