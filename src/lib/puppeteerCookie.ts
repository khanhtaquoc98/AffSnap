import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import store from '@/lib/store';

/**
 * Automates headless browser launch to extract live Shopee Affiliate session cookies & SPC_ST token.
 * Compatible with Vercel Serverless environment using @sparticuz/chromium.
 */
export async function refreshShopeeCookieWithBrowser(): Promise<{
  success: boolean;
  cookie?: string;
  headerToken?: string;
  error?: string;
}> {
  let browser = null;
  try {
    console.log('[Puppeteer] Launching headless browser for Shopee Cookie refresh...');

    // Determine executable path for local dev vs Vercel Serverless environment
    const isVercel = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
    let executablePath = '';

    if (isVercel) {
      executablePath = await chromium.executablePath();
    } else {
      // Local fallback executable paths for macOS / Linux / Windows
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

    console.log('[Puppeteer] Navigating to affiliate.shopee.vn...');
    await page.goto('https://affiliate.shopee.vn/offer/custom_link', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

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

      console.log('[Puppeteer] Cookie Shopee & SPC_ST Header Token updated successfully!');
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
