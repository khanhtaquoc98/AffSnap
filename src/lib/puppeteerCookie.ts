import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import store from '@/lib/store';

/**
 * Parses a raw cookie string (e.g. "key=value; key2=value2") into Puppeteer Cookie objects.
 */
function parseCookieStringForPuppeteer(cookieStr: string, domain: string = '.shopee.vn') {
  if (!cookieStr) return [];
  return cookieStr
    .split(';')
    .map((item) => {
      const parts = item.trim().split('=');
      if (parts.length < 2) return null;
      const name = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      if (!name || !value) return null;
      return {
        name,
        value,
        domain,
        path: '/',
      };
    })
    .filter(Boolean) as Array<{ name: string; value: string; domain: string; path: string }>;
}

/**
 * Automates headless browser launch to extract live Shopee Affiliate session cookies & SPC_ST token.
 * pre-loads existing session cookies and attempts automated login if credentials exist.
 */
export async function refreshShopeeCookieWithBrowser(): Promise<{
  success: boolean;
  cookie?: string;
  headerToken?: string;
  error?: string;
}> {
  let browser = null;
  try {
    const tokenConfig = store.getTokenConfig();
    console.log('[Puppeteer] Launching headless browser for Shopee Cookie refresh...');

    const isVercel = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
    let executablePath = '';

    if (isVercel) {
      executablePath = await chromium.executablePath();
    } else {
      executablePath =
        process.env.CHROME_PATH ||
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' ||
        '/usr/bin/google-chrome';
    }

    browser = await puppeteer.launch({
      args: isVercel ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 720 },
      executablePath: executablePath || (await chromium.executablePath()),
      headless: true,
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36'
    );

    // Pre-load existing stored cookies into browser context if available
    if (tokenConfig.cookie) {
      try {
        const parsedCookies = parseCookieStringForPuppeteer(tokenConfig.cookie);
        if (parsedCookies.length > 0) {
          console.log(`[Puppeteer] Pre-loading ${parsedCookies.length} stored cookies...`);
          await page.setCookie(...parsedCookies);
        }
      } catch (cErr) {
        console.warn('[Puppeteer Cookie Preload Warning]:', cErr);
      }
    }

    console.log('[Puppeteer] Navigating to affiliate.shopee.vn...');
    await page.goto('https://affiliate.shopee.vn/offer/custom_link', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    let currentUrl = page.url();
    console.log('[Puppeteer] Current URL after navigation:', currentUrl);

    // If redirected to login page and username/password exist in config, attempt auto-login
    if (
      (currentUrl.includes('login') || currentUrl.includes('buyer/login')) &&
      tokenConfig.username &&
      tokenConfig.password
    ) {
      console.log('[Puppeteer] Login page detected. Attempting automated login with configured credentials...');
      try {
        await page.waitForSelector('input[name="loginKey"], input[type="text"]', { timeout: 5000 });
        await page.type('input[name="loginKey"], input[type="text"]', tokenConfig.username, { delay: 50 });
        await page.type('input[name="password"], input[type="password"]', tokenConfig.password, { delay: 50 });

        const submitButton = await page.$('button[type="submit"], .btn-solid-primary');
        if (submitButton) {
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
            submitButton.click(),
          ]);
        }
      } catch (loginErr) {
        console.warn('[Puppeteer Auto-Login Form Filling Warning]:', loginErr);
      }
    }

    const cookies = await page.cookies();
    if (!cookies || cookies.length === 0) {
      return { success: false, error: 'Không thể trích xuất Cookie từ trình duyệt.' };
    }

    const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    const spcStCookie = cookies.find((c) => c.name === 'SPC_ST');
    const headerToken = spcStCookie ? spcStCookie.value : '';

    if (cookieString && headerToken) {
      store.updateTokenConfig({
        cookie: cookieString,
        headerToken: headerToken,
        status: 'ACTIVE',
        lastUpdated: new Date().toISOString(),
      });

      console.log('[Puppeteer] Cookie Shopee & SPC_ST Header Token auto-reloaded successfully!');
      return {
        success: true,
        cookie: cookieString,
        headerToken: headerToken,
      };
    }

    return { success: false, error: 'Không tìm thấy token SPC_ST hợp lệ trong Cookie.' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Lỗi khởi tạo Puppeteer';
    console.error('[Puppeteer Cookie Error]:', errorMsg);
    return { success: false, error: errorMsg };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
