/**
 * Helper giao tiếp giữa Web App Next.js và Chrome Extension (Shopee Affiliate Smart Link)
 */

export interface ConvertLinkResult {
  shortLink?: string;
  longLink?: string;
  failCode?: number;
  error?: boolean;
}

export interface ExtensionConvertResponse {
  ok: boolean;
  mapping?: Record<string, ConvertLinkResult>;
  error?: string;
}

/**
 * Thử tạo link Affiliate thông qua Chrome Extension đã cài trên trình duyệt người dùng
 */
export async function convertViaChromeExtension(
  url: string,
  subId: string = 'guest',
  extensionId?: string
): Promise<ConvertLinkResult | null> {
  if (typeof window === 'undefined') return null;

  const chromeRuntime = (window as { chrome?: { runtime?: any } }).chrome?.runtime;
  if (!chromeRuntime || !chromeRuntime.sendMessage) {
    return null;
  }

  return new Promise((resolve) => {
    try {
      const message = {
        type: 'CONVERT_LINKS',
        links: [url],
        subIds: [subId],
      };

      const callback = (response: ExtensionConvertResponse) => {
        if (chromeRuntime.lastError) {
          console.warn('[Extension Bridge Warn]:', chromeRuntime.lastError.message);
          resolve(null);
          return;
        }

        if (response && response.ok && response.mapping && response.mapping[url]) {
          const item = response.mapping[url];
          if (item && item.shortLink) {
            resolve(item);
            return;
          }
        }
        resolve(null);
      };

      if (extensionId) {
        chromeRuntime.sendMessage(extensionId, message, callback);
      } else {
        // Gửi thử cho tất cả extension nhận tin nhắn ngoài
        chromeRuntime.sendMessage(message, callback);
      }
    } catch (err) {
      console.warn('[Extension Bridge Error]:', err);
      resolve(null);
    }
  });
}
