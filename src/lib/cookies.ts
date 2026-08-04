import { UserSession } from '@/store/slices/authSlice';

const COOKIE_NAME = 'affsnap_user_session';
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60; // 31,536,000s (1 Năm)

export const setSessionCookie = (session: UserSession) => {
  if (typeof window === 'undefined') return;
  try {
    const jsonStr = JSON.stringify(session);
    const encoded = encodeURIComponent(jsonStr);
    document.cookie = `${COOKIE_NAME}=${encoded}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
    localStorage.setItem(COOKIE_NAME, jsonStr);
  } catch (err) {
    console.error('Lỗi khi lưu Cookie phiên làm việc:', err);
  }
};

export const getSessionCookie = (): UserSession | null => {
  if (typeof window === 'undefined') return null;

  // 1. Try reading from Cookie
  try {
    const cookies = document.cookie.split(';');
    for (let c of cookies) {
      c = c.trim();
      if (c.startsWith(`${COOKIE_NAME}=`)) {
        const val = c.substring(`${COOKIE_NAME}=`.length);
        const decoded = decodeURIComponent(val);
        return JSON.parse(decoded) as UserSession;
      }
    }
  } catch (err) {
    console.error('Lỗi khi đọc Cookie:', err);
  }

  // 2. Fallback to localStorage
  try {
    const local = localStorage.getItem(COOKIE_NAME);
    if (local) return JSON.parse(local) as UserSession;
  } catch (err) {
    console.error('Lỗi khi đọc localStorage:', err);
  }

  return null;
};

export const removeSessionCookie = () => {
  if (typeof window === 'undefined') return;
  try {
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    localStorage.removeItem(COOKIE_NAME);
  } catch (err) {
    console.error('Lỗi khi xóa Cookie:', err);
  }
};
