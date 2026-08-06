import { supabase } from './supabase';
import { parseCurlCommand } from './curlParser';

export interface ShopeeTokenConfig {
  headerToken: string;
  cookie: string;
  rawCurl?: string;
  rawHeaders?: Record<string, string>;
  appId: string;
  username?: string;
  password?: string;
  autoLoginEnabled?: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'UNCONFIGURED';
  lastUpdated: string;
  autoRetryCount: number;
  refreshCycle: string; // "1 năm (365 ngày)"
  csrfToken?: string;
  afAcEncSzToken?: string;
  afAcEncDat?: string;
  xSapSec?: string;
  xSapRi?: string;
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
    cookie: '',
    headerToken: '',
    appId: '20504406',
    username: 'khanhtaquoc98@gmail.com',
    password: '',
    autoLoginEnabled: false,
    status: 'UNCONFIGURED',
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
          if (remoteToken.rawCurl && !remoteToken.cookie) {
            const parsed = parseCurlCommand(remoteToken.rawCurl);
            remoteToken.cookie = parsed.cookie || remoteToken.cookie;
            remoteToken.rawHeaders = parsed.headers || remoteToken.rawHeaders;
          }
          this.tokenConfig = {
            ...this.tokenConfig,
            ...remoteToken,
            cookie: remoteToken.cookie || '',
            headerToken: remoteToken.headerToken || '',
            password: remoteToken.password || '',
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

    (async () => {
      try {
        await supabase.from('admin_config').upsert([
          {
            id: 'default',
            token_config: this.tokenConfig,
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
