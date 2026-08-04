import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.ENCRYPTION_SECRET
  ? crypto.createHash('sha256').update(process.env.ENCRYPTION_SECRET).digest()
  : crypto.createHash('sha256').update('affsnap_secure_key_2026_shopee_secret').digest();

/**
 * Mã hóa dữ liệu nhạy cảm (HeaderToken, Cookie, Password) bằng mã hóa AES-256-CBC
 */
export function encryptText(text: string): string {
  if (!text) return '';
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('Lỗi mã hóa data:', err);
    return text;
  }
}

/**
 * Giải mã dữ liệu nhạy cảm
 */
export function decryptText(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText || '';
  try {
    const [ivHex, encryptedData] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return encryptedText;
  }
}

/**
 * Che giấu dữ liệu (Masking) hiển thị an toàn trên màn hình UI
 */
export function maskSensitiveValue(value: string, visibleChars = 6): string {
  if (!value) return '';
  if (value.length <= visibleChars) return '••••••••';
  return `${value.slice(0, visibleChars)}••••••••${value.slice(-4)}`;
}
