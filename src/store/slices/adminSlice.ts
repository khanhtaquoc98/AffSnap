import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TokenConfig {
  headerToken: string;
  cookie: string;
  appId: string;
  username?: string;
  password?: string;
  autoLoginEnabled?: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'UNCONFIGURED';
  lastUpdated: string;
  autoRetryCount: number;
}

export interface SystemConfig {
  userCommissionRate: number;
  adminCommissionRate: number;
  minPayoutAmount: number;
}

interface AdminState {
  tokenConfig: TokenConfig;
  systemConfig: SystemConfig;
  isSyncing: boolean;
  reconciliationLogs: string[];
}

const initialState: AdminState = {
  tokenConfig: {
    headerToken: '',
    cookie: '',
    appId: '',
    status: 'ACTIVE',
    lastUpdated: '',
    autoRetryCount: 0,
  },
  systemConfig: {
    userCommissionRate: 70,
    adminCommissionRate: 30,
    minPayoutAmount: 50000,
  },
  isSyncing: false,
  reconciliationLogs: [],
};

export const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setTokenConfig: (state, action: PayloadAction<Partial<TokenConfig>>) => {
      state.tokenConfig = { ...state.tokenConfig, ...action.payload };
    },
    setSystemConfig: (state, action: PayloadAction<Partial<SystemConfig>>) => {
      state.systemConfig = { ...state.systemConfig, ...action.payload };
    },
    setIsSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    addReconciliationLog: (state, action: PayloadAction<string>) => {
      state.reconciliationLogs.unshift(action.payload);
    },
  },
});

export const { setTokenConfig, setSystemConfig, setIsSyncing, addReconciliationLog } = adminSlice.actions;
export default adminSlice.reducer;
