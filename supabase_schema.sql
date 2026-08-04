-- ========================================================
-- AFFSNAP - SUPABASE DATABASE SCHEMA SQL
-- Sao chép toàn bộ script này và dán vào SQL Editor trên Supabase
-- ========================================================

-- 1. Bảng lưu vết các Link Affiliate đã rút gọn (links)
CREATE TABLE IF NOT EXISTS public.links (
    id TEXT PRIMARY KEY,
    original_url TEXT NOT NULL,
    affiliate_url TEXT NOT NULL,
    short_code TEXT NOT NULL,
    user_id TEXT,
    sub_id TEXT DEFAULT 'guest',
    clicks INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bảng quản lý đơn hàng & đối soát hoa hồng (orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_sn TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_price NUMERIC NOT NULL,
    total_commission NUMERIC NOT NULL,
    user_commission NUMERIC NOT NULL,
    admin_commission NUMERIC NOT NULL,
    status TEXT DEFAULT 'PENDING',
    reconciled BOOLEAN DEFAULT FALSE,
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bảng quản lý thông tin người dùng, tài khoản ngân hàng & số dư (users)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'USER',
    balance NUMERIC DEFAULT 0,
    bank_name TEXT,
    bank_code TEXT,
    account_number TEXT,
    account_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bảng quản lý các yêu cầu rút tiền (payout_requests)
CREATE TABLE IF NOT EXISTS public.payout_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    bank_name TEXT NOT NULL,
    bank_code TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    reject_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Bảng lưu cấu hình Token & Hệ thống Admin (admin_config)
CREATE TABLE IF NOT EXISTS public.admin_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    token_config JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- THÊM DATA MẪU BAN ĐẦU (SEED DATA)
-- ========================================================

INSERT INTO public.users (id, email, name, role, balance, bank_name, bank_code, account_number, account_name)
VALUES 
    ('user-1', 'user@gmail.com', 'Nguyễn Văn A', 'USER', 70000, 'Vietcombank', 'VCB', '1018899889', 'NGUYEN VAN A'),
    ('admin-1', 'khanhtaquoc98@gmail.com', 'Quản Trị Viên Admin', 'ADMIN', 150000, NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.links (id, original_url, affiliate_url, short_code, user_id, sub_id)
VALUES 
    ('link-demo-1', 'https://shopee.vn/Ao-Thun-Nam-Nu-Unisex', 'https://shope.ee/8A9bCcDd1?sub_id1=user-1', '8A9bCcDd1', 'user-1', 'user-1')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.orders (id, order_sn, user_id, product_name, product_price, total_commission, user_commission, admin_commission, status, reconciled)
VALUES 
    ('ord-101', '2408049928192A', 'user-1', 'Áo Thun Oversize Unisex Shopee Mall', 199000, 100000, 70000, 30000, 'COMPLETED', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.admin_config (id, token_config, updated_at)
VALUES (
    'default',
    '{
      "headerToken": "GCs8pGw5-E-UQ-JjqnhtpIIE_oDJyMHrWF64",
      "cookie": "_fbp=fb.1.1751537165102.240215611885047899; SPC_F=UQc5werZBQ3T3GpW2WKDaeVP1mN2wSbv; REC_T_ID=5526965d-57f5-11f0-ba73-2620ac0b93fc; SPC_CLIENTID=VVFjNXdlclpCUTNUmvfcxtzgrkficvmn; _hjSessionUser_868286=eyJpZCI6IjhmZGVlODU3LTlhMzItNTA1OS1iNThmLTI4Y2EwZTdlMzI4MSIsImNyZWF0ZWQiOjE3NTYzNjQ5NjQ1MjgsImV4aXN0aW5nIjp0cnVlfQ==; language=vi; _ga=GA1.1.470346646.1756364964; _ga_FV78QC1144=GS2.1.s1776674737$o2$g1$t1776674752$j45$l0$h0; _gcl_au=1.1.137008071.1783912566; _gcl_gs=2.1.k1$i1783930706$u185156075; _gcl_aw=GCL.1783930710.EAIaIQobChMIpKLB35vPlQMVfIhmAh0NEiDIEAQYASABEgK0yfD_BwE; _med=affiliates; csrftoken=EtOGA6cZ72VcnodxuIZbHSr7ZifSQ3vl; _fbc=fb.1.1785488476018.IwY2xjawTZQ6lwZG9mBWV4dG4DYWVtAjEwAGJyaWQRMTlkUWxzSTl5UDQ3WXZscFFzcnRjBmFwcF9pZBAyMjIwMzkxNzg4MjAwODkyAAEe9O2TZhqG74fGLGXKIDf_XEcrP6LA3Ms1xc5jPemwWvTf1cm8_SnUGP3o35M_aem_U007RnNYSiCmlPYOYGxhwA; SPC_SI=anYnagAAAAB1Z1FDbHRoQ1bULAQAAAAAVk1ad1VhaGc=; SPC_CDS_CHAT=e3dba274-9ead-4b90-8d9b-3ba7d64cd3aa; SPC_ST=Vk9KYVpqckZ5SUtMNDRXTDYjFOZThRuF0ydJkyrsJL3zO/a+w+giBC26x+Wp5/tkBt0IUSQyRp9Zenf/9pfWJuXkDIm0Z0Xavg3FMFg8COmO1KXVvWlWKID8x3Cl01cOPJHl2y6fE6o7q8XJv4b9bEa0DU9UPgJquVUoiIGIYDIK71YSsxaV9/fBZQayXLIyX2zsA3CaaHd//FLNDZkihxw==.AJAToFHe7r5jy0iHFLb/tH/KEXoHQgu0JrUqC69FszfC; SPC_U=20504406; SPC_T_IV=azJmTkRqYU9oY0ZFVkU1aw==; SPC_R_T_ID=3xzuaznzp2Biuh9VT+h/C+Muw8aBrAvfUKLFvTymx2UrFn20u+5myga9TWWvfu13/RrL56jmrc0DpU5jNeE0EDBGZF2qQJ/0fobwXl4gWFQJDLVcYmpvqY8fUS48NQlcEvYhVCffGiKWrRmPioj8Fz2R5f2AnfeVGFdVCPfrKS4=; SPC_R_T_IV=azJmTkRqYU9oY0ZFVkU1aw==; SPC_T_ID=3xzuaznzp2Biuh9VT+h/C+Muw8aBrAvfUKLFvTymx2UrFn20u+5myga9TWWvfu13/RrL56jmrc0DpU5jNeE0EDBGZF2qQJ/0fobwXl4gWFQJDLVcYmpvqY8fUS48NQlcEvYhVCffGiKWrRmPioj8Fz2R5f2AnfeVGFdVCPfrKS4=; _hjSession_868286=eyJpZCI6IjMwMTExYzAyLWIwOTktNGNlZS04NTg5LTY3ZmY0YTdkN2MwZiIsImMiOjE3ODU4MjQwMDI2OTQsInMiOjAsInIiOjAsInNiIjowLCJzciI6MCwic2UiOjAsImZzIjowLCJzcCI6MX0=; _med=refer; language=vi; _QPWSDCXHZQA=dd3df6ce-1244-4dd4-d7d2-ad6207c5f214; REC7iLP4Q=b26cd5ad-f85b-4438-8e78-5e3dba63b385; _sapid=4757e5e72b8a7b8e420a29e56cfe4976d425a3b4d9dfdfa4a0585fa5; shopee_webUnique_ccd=kJpL1H%2FcKXxZyfA1CPfrRg%3D%3D%7CD%2BhqdbGr7uDplrmDunCwDuK1%2FeeBNSWU66QmPc2fMDv%2BEaVeIt0hFHQr2z79aqg9CvJAbelyrBiuCuVcTjU%3D%7CiRH0qFo0cQrhkpRg%7C08%7C3; ds=e4067699b26af704332005e4a1a35399; sense_sa_r=s; _ga_4GPP1ZXG63=GS2.1.s1785824002$o91$g1$t1785824039$j23$l1$h1465170452",
      "appId": "20504406",
      "username": "khanhtaquoc98@gmail.com",
      "password": "",
      "autoLoginEnabled": true,
      "status": "ACTIVE",
      "refreshCycle": "1 năm (365 ngày)"
    }'::jsonb,
    NOW()
)
ON CONFLICT (id) DO UPDATE SET token_config = EXCLUDED.token_config;

-- BẬT QUYỀN TRUY CẬP ROW LEVEL SECURITY (RLS) HOẶC CHO PHÉP ANONYMOUS
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cho phép tất cả thao tác links" ON public.links FOR ALL USING (true);
CREATE POLICY "Cho phép tất cả thao tác orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Cho phép tất cả thao tác users" ON public.users FOR ALL USING (true);
CREATE POLICY "Cho phép tất cả thao tác payout_requests" ON public.payout_requests FOR ALL USING (true);
CREATE POLICY "Cho phép tất cả thao tác admin_config" ON public.admin_config FOR ALL USING (true);
