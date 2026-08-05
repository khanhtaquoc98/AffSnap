import { supabase } from './supabase';
import { encryptText } from './encryption';

export interface ShopeeTokenConfig {
  headerToken: string;
  cookie: string;
  appId: string;
  username?: string;
  password?: string;
  autoLoginEnabled?: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'UNCONFIGURED';
  lastUpdated: string;
  autoRetryCount: number;
  refreshCycle: string; // "1 năm (365 ngày)"
}

export interface SystemConfig {
  userCommissionRate: number;
  adminCommissionRate: number;
  minPayoutAmount: number;
}

export interface LinkRecord {
  id: string;
  originalUrl: string;
  affiliateUrl: string;
  shortCode: string;
  userId: string | null;
  clicks: number;
  createdAt: string;
  subId: string;
}

export interface OrderRecord {
  id: string;
  orderSn: string;
  linkId: string;
  userId: string;
  productName: string;
  productPrice: number;
  totalCommission: number;
  userCommission: number;
  adminCommission: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  purchaseDate: string;
  reconciled: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  balance: number;
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
}

export interface PayoutRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason?: string;
  createdAt: string;
  updatedAt?: string;
}

class Store {
  private tokenConfig: ShopeeTokenConfig = {
    headerToken: 'GCs8pGw5-E-UQ-JjqnhtpIIE_oDJyMHrWF64',
    cookie: '_fbp=fb.1.1751537165102.240215611885047899; SPC_F=UQc5werZBQ3T3GpW2WKDaeVP1mN2wSbv; REC_T_ID=5526965d-57f5-11f0-ba73-2620ac0b93fc; SPC_CLIENTID=VVFjNXdlclpCUTNUmvfcxtzgrkficvmn; _hjSessionUser_868286=eyJpZCI6IjhmZGVlODU3LTlhMzItNTA1OS1iNThmLTI4Y2EwZTdlMzI4MSIsImNyZWF0ZWQiOjE3NTYzNjQ5NjQ1MjgsImV4aXN0aW5nIjp0cnVlfQ==; language=vi; _ga=GA1.1.470346646.1756364964; _ga_FV78QC1144=GS2.1.s1776674737$o2$g1$t1776674752$j45$l0$h0; _gcl_au=1.1.137008071.1783912566; _gcl_gs=2.1.k1$i1783930706$u185156075; _gcl_aw=GCL.1783930710.EAIaIQobChMIpKLB35vPlQMVfIhmAh0NEiDIEAQYASABEgK0yfD_BwE; _med=affiliates; csrftoken=EtOGA6cZ72VcnodxuIZbHSr7ZifSQ3vl; _fbc=fb.1.1785488476018.IwY2xjawTZQ6lwZG9mBWV4dG4DYWVtAjEwAGJyaWQRMTlkUWxzSTl5UDQ3WXZscFFzcnRjBmFwcF9pZBAyMjIwMzkxNzg4MjAwODkyAAEe9O2TZhqG74fGLGXKIDf_XEcrP6LA3Ms1xc5jPemwWvTf1cm8_SnUGP3o35M_aem_U007RnNYSiCmlPYOYGxhwA; SPC_SI=anYnagAAAAB1Z1FDbHRoQ1bULAQAAAAAVk1ad1VhaGc=; SPC_CDS_CHAT=e3dba274-9ead-4b90-8d9b-3ba7d64cd3aa; SPC_ST=Vk9KYVpqckZ5SUtMNDRXTDYjFOZThRuF0ydJkyrsJL3zO/a+w+giBC26x+Wp5/tkBt0IUSQyRp9Znf/9pfWJuXkDIm0Z0Xavg3FMFg8COmO1KXVvWlWKID8x3Cl01cOPJHl2y6fE6o7q8XJv4b9bEa0DU9UPgJquVUoiIGIYDIK71YSsxaV9/fBZQayXLIyX2zsA3CaaHd//FLNDZkihxw==.AJAToFHe7r5jy0iHFLb/tH/KEXoHQgu0JrUqC69FszfC; SPC_U=20504406; SPC_T_IV=azJmTkRqYU9oY0ZFVkU1aw==; SPC_R_T_ID=3xzuaznzp2Biuh9VT+h/C+Muw8aBrAvfUKLFvTymx2UrFn20u+5myga9TWWvfu13/RrL56jmrc0DpU5jNeE0EDBGZF2qQJ/0fobwXl4gWFQJDLVcYmpvqY8fUS48NQlcEvYhVCffGiKWrRmPioj8Fz2R5f2AnfeVGFdVCPfrKS4=; SPC_R_T_IV=azJmTkRqYU9oY0ZFVkU1aw==; SPC_T_ID=3xzuaznzp2Biuh9VT+h/C+Muw8aBrAvfUKLFvTymx2UrFn20u+5myga9TWWvfu13/RrL56jmrc0DpU5jNeE0EDBGZF2qQJ/0fobwXl4gWFQJDLVcYmpvqY8fUS48NQlcEvYhVCffGiKWrRmPioj8Fz2R5f2AnfeVGFdVCPfrKS4=; _hjSession_868286=eyJpZCI6IjMwMTExYzAyLWIwOTktNGNlZS04NTg5LTY3ZmY0YTdkN2MwZiIsImMiOjE3ODU4MjQwMDI2OTQsInMiOjAsInIiOjAsInNiIjowLCJzciI6MCwic2UiOjAsImZzIjowLCJzcCI6MX0=; _med=refer; language=vi; _QPWSDCXHZQA=dd3df6ce-1244-4dd4-d7d2-ad6207c5f214; REC7iLP4Q=b26cd5ad-f85b-4438-8e78-5e3dba63b385; _sapid=4757e5e72b8a7b8e420a29e56cfe4976d425a3b4d9dfdfa4a0585fa5; shopee_webUnique_ccd=kJpL1H%2FcKXxZyfA1CPfrRg%3D%3D%7CD%2BhqdbGr7uDplrmDunCwDuK1%2FeeBNSWU66QmPc2fMDv%2BEaVeIt0hFHQr2z79aqg9CvJAbelyrBiuCuVcTjU%3D%7CiRH0qFo0cQrhkpRg%7C08%7C3; ds=e4067699b26af704332005e4a1a35399; sense_sa_r=s; _ga_4GPP1ZXG63=GS2.1.s1785824002$o91$g1$t1785824039$j23$l1$h1465170452',
    appId: '20504406',
    username: 'khanhtaquoc98@gmail.com',
    password: '',
    autoLoginEnabled: true,
    status: 'ACTIVE',
    lastUpdated: new Date().toISOString(),
    autoRetryCount: 0,
    refreshCycle: '1 năm (365 ngày)',
  };

  private systemConfig: SystemConfig = {
    userCommissionRate: 70,
    adminCommissionRate: 30,
    minPayoutAmount: 50000,
  };

  private links: LinkRecord[] = [
    {
      id: 'link-demo-1',
      originalUrl: 'https://shopee.vn/Ao-Thun-Nam-Nu-Unisex',
      affiliateUrl: 'https://shope.ee/8A9bCcDd1?sub_id1=user-1',
      shortCode: '8A9bCcDd1',
      userId: 'user-1',
      clicks: 12,
      createdAt: new Date().toISOString(),
      subId: 'user-1',
    },
  ];

  private orders: OrderRecord[] = [
    {
      id: 'ord-101',
      orderSn: '2408049928192A',
      linkId: 'link-demo-1',
      userId: 'user-1',
      productName: 'Áo Thun Oversize Unisex Shopee Mall',
      productPrice: 199000,
      totalCommission: 100000,
      userCommission: 70000,
      adminCommission: 30000,
      status: 'COMPLETED',
      purchaseDate: new Date().toISOString(),
      reconciled: true,
    },
  ];

  private users: User[] = [
    {
      id: 'user-1',
      email: 'user@gmail.com',
      name: 'Nguyễn Văn A',
      role: 'USER',
      balance: 70000,
      bankName: 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)',
      bankCode: 'VCB',
      accountNumber: '1018899889',
      accountName: 'NGUYEN VAN A',
    },
    {
      id: 'admin-1',
      email: 'khanhtaquoc98@gmail.com',
      name: 'Quản Trị Viên Admin',
      role: 'ADMIN',
      balance: 150000,
    },
  ];

  private payoutRequests: PayoutRequest[] = [
    {
      id: 'payout-101',
      userId: 'user-1',
      userName: 'Nguyễn Văn A',
      userEmail: 'user@gmail.com',
      amount: 50000,
      bankName: 'Vietcombank',
      bankCode: 'VCB',
      accountNumber: '1018899889',
      accountName: 'NGUYEN VAN A',
      status: 'APPROVED',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  async syncFromDatabase(): Promise<void> {
    try {
      // 1. Sync admin_config & system_config
      const { data: configData } = await supabase.from('admin_config').select('*').limit(1);
      if (configData && configData.length > 0) {
        if (configData[0].token_config) {
          const remoteToken = configData[0].token_config;
          this.tokenConfig = {
            ...this.tokenConfig,
            ...remoteToken,
          };
        }
        if (configData[0].system_config) {
          const remoteSystem = configData[0].system_config;
          this.systemConfig = {
            ...this.systemConfig,
            ...remoteSystem,
          };
        }
      }

      // 2. Sync users
      const { data: usersData } = await supabase.from('users').select('*');
      if (usersData && usersData.length > 0) {
        this.users = usersData.map((u: Record<string, unknown>) => ({
          id: String(u.id || ''),
          email: String(u.email || ''),
          name: String(u.name || ''),
          role: (u.role === 'ADMIN' ? 'ADMIN' : 'USER') as 'ADMIN' | 'USER',
          balance: Number(u.balance) || 0,
          bankName: u.bank_name ? String(u.bank_name) : undefined,
          bankCode: u.bank_code ? String(u.bank_code) : undefined,
          accountNumber: u.account_number ? String(u.account_number) : undefined,
          accountName: u.account_name ? String(u.account_name) : undefined,
        }));
      }

      // 3. Sync payout_requests
      const { data: payoutData } = await supabase.from('payout_requests').select('*').order('created_at', { ascending: false });
      if (payoutData && payoutData.length > 0) {
        this.payoutRequests = payoutData.map((p: Record<string, unknown>) => ({
          id: String(p.id || ''),
          userId: String(p.user_id || ''),
          userName: String(p.user_name || ''),
          userEmail: String(p.user_email || ''),
          amount: Number(p.amount) || 0,
          bankName: String(p.bank_name || ''),
          bankCode: String(p.bank_code || 'VCB'),
          accountNumber: String(p.account_number || ''),
          accountName: String(p.account_name || ''),
          status: (p.status || 'PENDING') as 'PENDING' | 'APPROVED' | 'REJECTED',
          rejectReason: p.reject_reason ? String(p.reject_reason) : undefined,
          createdAt: String(p.created_at || new Date().toISOString()),
          updatedAt: p.updated_at ? String(p.updated_at) : undefined,
        }));
      }

      // 4. Sync links
      const { data: linksData } = await supabase.from('links').select('*').order('created_at', { ascending: false });
      if (linksData && linksData.length > 0) {
        this.links = linksData.map((l: Record<string, unknown>) => ({
          id: String(l.id || ''),
          originalUrl: String(l.original_url || ''),
          affiliateUrl: String(l.affiliate_url || ''),
          shortCode: String(l.short_code || ''),
          userId: l.user_id ? String(l.user_id) : null,
          clicks: Number(l.clicks) || 0,
          createdAt: String(l.created_at || new Date().toISOString()),
          subId: String(l.sub_id || 'guest'),
        }));
      }

      // 5. Sync orders
      const { data: ordersData } = await supabase.from('orders').select('*').order('purchase_date', { ascending: false });
      if (ordersData && ordersData.length > 0) {
        this.orders = ordersData.map((o: Record<string, unknown>) => ({
          id: String(o.id || ''),
          orderSn: String(o.order_sn || ''),
          linkId: String(o.link_id || ''),
          userId: String(o.user_id || ''),
          productName: String(o.product_name || ''),
          productPrice: Number(o.product_price) || 0,
          totalCommission: Number(o.total_commission) || 0,
          userCommission: Number(o.user_commission) || 0,
          adminCommission: Number(o.admin_commission) || 0,
          status: (o.status || 'PENDING') as 'PENDING' | 'COMPLETED' | 'CANCELLED',
          purchaseDate: String(o.purchase_date || new Date().toISOString()),
          reconciled: Boolean(o.reconciled),
        }));
      }
    } catch (err) {
      console.log('[Supabase Full Sync Notice]: DB fetch fallback', err);
    }
  }

  getTokenConfig(): ShopeeTokenConfig {
    return { ...this.tokenConfig };
  }

  updateTokenConfig(update: Partial<ShopeeTokenConfig>): ShopeeTokenConfig {
    let headerToken = update.headerToken || this.tokenConfig.headerToken;
    if (update.cookie) {
      const match = update.cookie.match(/SPC_ST=([^;]+)/);
      if (match && match[1] && match[1].trim()) {
        headerToken = match[1].trim();
      }
    }

    this.tokenConfig = {
      ...this.tokenConfig,
      ...update,
      headerToken,
      status: 'ACTIVE',
      lastUpdated: new Date().toISOString(),
    };

    const encryptedTokenConfig = {
      ...this.tokenConfig,
      headerToken: encryptText(this.tokenConfig.headerToken),
      cookie: encryptText(this.tokenConfig.cookie),
      password: encryptText(this.tokenConfig.password || ''),
    };

    (async () => {
      try {
        await supabase.from('admin_config').upsert([
          {
            id: 'default',
            token_config: encryptedTokenConfig,
            updated_at: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        console.log('[Supabase Sync Notice]:', err);
      }
    })();

    return this.getTokenConfig();
  }

  getSystemConfig(): SystemConfig {
    return { ...this.systemConfig };
  }

  updateSystemConfig(update: Partial<SystemConfig>): SystemConfig {
    this.systemConfig = { ...this.systemConfig, ...update };
    if (update.userCommissionRate !== undefined) {
      this.systemConfig.userCommissionRate = Math.max(0, Math.min(100, update.userCommissionRate));
      this.systemConfig.adminCommissionRate = 100 - this.systemConfig.userCommissionRate;
    }

    (async () => {
      try {
        await supabase.from('admin_config').upsert([
          {
            id: 'default',
            system_config: this.systemConfig,
            updated_at: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        console.log('[Supabase System Config Sync Error]:', err);
      }
    })();

    return this.getSystemConfig();
  }

  addOrUpdateOrder(data: {
    orderSn: string;
    userId: string;
    productName: string;
    productPrice: number;
    totalCommission: number;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  }): OrderRecord {
    const existingIndex = this.orders.findIndex((o) => o.orderSn === data.orderSn);
    const userRate = (this.systemConfig.userCommissionRate || 0) / 100;
    const adminRate = (this.systemConfig.adminCommissionRate || 100) / 100;

    const userCommission = Math.round(data.totalCommission * userRate);
    const adminCommission = Math.round(data.totalCommission * adminRate);

    if (existingIndex >= 0) {
      this.orders[existingIndex] = {
        ...this.orders[existingIndex],
        ...data,
        userCommission,
        adminCommission,
      };
      return this.orders[existingIndex];
    }

    const newOrder: OrderRecord = {
      id: `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orderSn: data.orderSn,
      linkId: `link-${Date.now()}`,
      userId: data.userId,
      productName: data.productName,
      productPrice: data.productPrice,
      totalCommission: data.totalCommission,
      userCommission,
      adminCommission,
      status: data.status,
      purchaseDate: new Date().toISOString(),
      reconciled: data.status === 'COMPLETED',
    };
    this.orders.unshift(newOrder);
    return newOrder;
  }

  getLinks(userId?: string): LinkRecord[] {
    if (!userId) return [...this.links];
    return this.links.filter((l) => l.userId === userId);
  }

  addLink(originalUrl: string, userId: string | null): LinkRecord {
    const shortCode = Math.random().toString(36).substring(2, 9);
    const subId = userId || 'guest';
    const trimmedUrl = originalUrl.trim();
    const hasQuery = trimmedUrl.includes('?');
    const affiliateUrl = hasQuery
      ? `${trimmedUrl}&sub_id1=${subId}`
      : `${trimmedUrl}?sub_id1=${subId}`;

    const newLink: LinkRecord = {
      id: `link-${Date.now()}`,
      originalUrl: trimmedUrl,
      affiliateUrl,
      shortCode,
      userId,
      clicks: 0,
      createdAt: new Date().toISOString(),
      subId,
    };
    this.links.unshift(newLink);

    (async () => {
      try {
        await supabase.from('links').insert([
          {
            id: newLink.id,
            original_url: originalUrl,
            affiliate_url: affiliateUrl,
            short_code: shortCode,
            user_id: userId,
            sub_id: subId,
            created_at: newLink.createdAt,
          },
        ]);
      } catch (err) {
        console.log('[Supabase Link Insert Notice]:', err);
      }
    })();

    return newLink;
  }

  getOrders(userId?: string): OrderRecord[] {
    if (userId) {
      return this.orders.filter((o) => o.userId === userId);
    }
    return [...this.orders];
  }

  addOrder(order: Omit<OrderRecord, 'id' | 'reconciled'>): OrderRecord {
    const newOrder: OrderRecord = {
      ...order,
      id: `ord-${Date.now()}`,
      reconciled: false,
    };
    this.orders.unshift(newOrder);

    (async () => {
      try {
        await supabase.from('orders').insert([
          {
            id: newOrder.id,
            order_sn: newOrder.orderSn,
            user_id: newOrder.userId,
            product_name: newOrder.productName,
            product_price: newOrder.productPrice,
            total_commission: newOrder.totalCommission,
            user_commission: newOrder.userCommission,
            admin_commission: newOrder.adminCommission,
            status: newOrder.status,
            reconciled: false,
            purchase_date: newOrder.purchaseDate,
          },
        ]);
      } catch (err) {
        console.log('[Supabase Order Insert Notice]:', err);
      }
    })();

    return newOrder;
  }

  reconcileOrder(orderId: string, status: 'COMPLETED' | 'CANCELLED'): OrderRecord | null {
    const ord = this.orders.find((o) => o.id === orderId);
    if (!ord) return null;
    ord.status = status;
    ord.reconciled = true;
    if (status === 'COMPLETED') {
      const u = this.users.find((user) => user.id === ord.userId);
      if (u) u.balance += ord.userCommission;
    }

    (async () => {
      try {
        await supabase.from('orders').update({ status, reconciled: true }).eq('id', orderId);
      } catch (err) {
        console.log('[Supabase Reconcile Notice]:', err);
      }
    })();

    return { ...ord };
  }

  getUsers(): User[] {
    return [...this.users];
  }

  getUser(userId: string): User | null {
    return this.users.find((u) => u.id === userId) || null;
  }

  updateUserBank(
    userId: string,
    bankInfo: { bankName: string; bankCode: string; accountNumber: string; accountName: string }
  ): User | null {
    const u = this.users.find((user) => user.id === userId);
    if (!u) return null;
    u.bankName = bankInfo.bankName;
    u.bankCode = bankInfo.bankCode;
    u.accountNumber = bankInfo.accountNumber;
    u.accountName = bankInfo.accountName.toUpperCase();
    return { ...u };
  }

  getPayoutRequests(userId?: string): PayoutRequest[] {
    if (userId) {
      return this.payoutRequests.filter((p) => p.userId === userId);
    }
    return [...this.payoutRequests];
  }

  createPayoutRequest(data: {
    userId: string;
    amount: number;
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
  }): { success: boolean; message: string; request?: PayoutRequest } {
    const user = this.getUser(data.userId);
    if (!user) {
      return { success: false, message: 'Người dùng không tồn tại!' };
    }

    const minAmount = this.systemConfig.minPayoutAmount || 50000;
    if (data.amount < minAmount) {
      return {
        success: false,
        message: `Số tiền rút tối thiểu là ${minAmount.toLocaleString('vi-VN')} đ!`,
      };
    }

    if (user.balance < data.amount) {
      return {
        success: false,
        message: `Số dư tài khoản không đủ (${user.balance.toLocaleString('vi-VN')} đ)!`,
      };
    }

    const newReq: PayoutRequest = {
      id: `payout-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      amount: data.amount,
      bankName: data.bankName,
      bankCode: data.bankCode,
      accountNumber: data.accountNumber,
      accountName: data.accountName.toUpperCase(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    this.payoutRequests.unshift(newReq);

    // Sync to Supabase
    (async () => {
      try {
        await supabase.from('payout_requests').insert([
          {
            id: newReq.id,
            user_id: newReq.userId,
            user_name: newReq.userName,
            user_email: newReq.userEmail,
            amount: newReq.amount,
            bank_name: newReq.bankName,
            bank_code: newReq.bankCode,
            account_number: newReq.accountNumber,
            account_name: newReq.accountName,
            status: newReq.status,
            created_at: newReq.createdAt,
          },
        ]);
      } catch (err) {
        console.log('[Supabase Payout Insert Notice]:', err);
      }
    })();

    return {
      success: true,
      message: 'Yêu cầu rút tiền đã được gửi! Vui lòng chờ Admin xét duyệt.',
      request: newReq,
    };
  }

  approvePayoutRequest(requestId: string): { success: boolean; message: string; request?: PayoutRequest } {
    const req = this.payoutRequests.find((p) => p.id === requestId);
    if (!req) {
      return { success: false, message: 'Không tìm thấy yêu cầu rút tiền!' };
    }

    if (req.status !== 'PENDING') {
      return { success: false, message: 'Yêu cầu đã được xử lý trước đó!' };
    }

    const user = this.getUser(req.userId);
    if (!user) {
      return { success: false, message: 'Không tìm thấy thông tin người dùng!' };
    }

    if (user.balance < req.amount) {
      return { success: false, message: 'Số dư người dùng không đủ để hoàn tất rút tiền!' };
    }

    // Deduct user balance and approve request
    user.balance -= req.amount;
    req.status = 'APPROVED';
    req.updatedAt = new Date().toISOString();

    // Sync to Supabase
    (async () => {
      try {
        await supabase.from('payout_requests').update({ status: 'APPROVED' }).eq('id', requestId);
        await supabase.from('users').update({ balance: user.balance }).eq('id', user.id);
      } catch (err) {
        console.log('[Supabase Payout Approve Notice]:', err);
      }
    })();

    return {
      success: true,
      message: `Đã chấp nhận duyệt rút ${req.amount.toLocaleString('vi-VN')} đ cho ${req.userName}!`,
      request: { ...req },
    };
  }

  rejectPayoutRequest(
    requestId: string,
    reason: string
  ): { success: boolean; message: string; request?: PayoutRequest } {
    const req = this.payoutRequests.find((p) => p.id === requestId);
    if (!req) {
      return { success: false, message: 'Không tìm thấy yêu cầu rút tiền!' };
    }

    if (req.status !== 'PENDING') {
      return { success: false, message: 'Yêu cầu đã được xử lý trước đó!' };
    }

    req.status = 'REJECTED';
    req.rejectReason = reason || 'Thông tin ngân hàng không hợp lệ';
    req.updatedAt = new Date().toISOString();

    // Sync to Supabase
    (async () => {
      try {
        await supabase
          .from('payout_requests')
          .update({ status: 'REJECTED', reject_reason: req.rejectReason })
          .eq('id', requestId);
      } catch (err) {
        console.log('[Supabase Payout Reject Notice]:', err);
      }
    })();

    return {
      success: true,
      message: `Đã từ chối yêu cầu rút tiền của ${req.userName}. Lý do: ${req.rejectReason}`,
      request: { ...req },
    };
  }
}

// Global store singleton
const globalStore = (globalThis as unknown as { __SHOPEE_STORE__?: Store }).__SHOPEE_STORE__ || new Store();
if (process.env.NODE_ENV !== 'production') {
  (globalThis as unknown as { __SHOPEE_STORE__?: Store }).__SHOPEE_STORE__ = globalStore;
}

export default globalStore;
