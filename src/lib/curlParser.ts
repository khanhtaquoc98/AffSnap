export interface ParsedCurl {
  cookie: string;
  headers: Record<string, string>;
  url: string;
}

/**
 * Trích xuất Cookie và Headers từ câu lệnh cURL copy từ F12 DevTools của trình duyệt
 */
export function parseCurlCommand(curlStr: string): ParsedCurl {
  const headers: Record<string, string> = {};
  let cookie = '';
  let url = 'https://affiliate.shopee.vn/api/v3/gql?q=batchCustomLink';

  if (!curlStr || typeof curlStr !== 'string') {
    return { cookie, headers, url };
  }

  // 1. Trích xuất Endpoint URL
  const urlMatch = curlStr.match(/curl\s+['"]?([^'"]\S+)['"]?/i);
  if (urlMatch && urlMatch[1]) {
    url = urlMatch[1].trim();
  }

  // 2. Trích xuất Cookie từ cờ -b hoặc --cookie
  const cookieMatch = curlStr.match(/(?:-b|--cookie)\s+['"]([\s\S]*?)['"](?=\s+-(?:H|-header|b|-cookie|-data|$))/i);
  if (cookieMatch && cookieMatch[1]) {
    cookie = cookieMatch[1].trim();
  }

  // 3. Trích xuất từng Header từ các cờ -H hoặc --header
  const matches = curlStr.matchAll(/(?:-H|--header)\s+['"]([^:]+):\s*([\s\S]*?)['"](?=\s+-(?:H|-header|b|-cookie|-data|$))/gi);
  for (const match of matches) {
    const key = match[1].trim().toLowerCase();
    const value = match[2].trim();
    if (key === 'cookie') {
      if (!cookie) cookie = value;
    } else if (
      key !== 'content-length' &&
      key !== 'host' &&
      key !== 'connection' &&
      key !== 'accept-encoding'
    ) {
      headers[key] = value;
    }
  }

  return { cookie, headers, url };
}
