import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { setSessionCookie, removeSessionCookie } from '@/lib/cookies';

export type UserRole = 'GUEST' | 'USER' | 'ADMIN';
export type TabType = 'CONVERT' | 'USER_ORDERS' | 'ADMIN';

export interface UserSession {
  email: string;
  name: string;
  role: UserRole;
  balance: number;
  permissions: string[];
}

interface AuthState {
  currentUser: UserRole;
  activeTab: TabType;
  user: UserSession | null;
  isLoginModalOpen: boolean;
}

const initialState: AuthState = {
  currentUser: 'GUEST',
  activeTab: 'CONVERT',
  user: null,
  isLoginModalOpen: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<UserRole>) => {
      state.currentUser = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<TabType>) => {
      state.activeTab = action.payload;
    },
    setUserSession: (state, action: PayloadAction<UserSession | null>) => {
      state.user = action.payload;
      if (action.payload) {
        state.currentUser = action.payload.role;
        setSessionCookie(action.payload);
      } else {
        state.currentUser = 'GUEST';
        removeSessionCookie();
      }
    },
    setIsLoginModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isLoginModalOpen = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.currentUser = 'GUEST';
      removeSessionCookie();
    },
  },
});

export const {
  setCurrentUser,
  setActiveTab,
  setUserSession,
  setIsLoginModalOpen,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
