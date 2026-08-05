import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import store from '@/lib/store';

/**
 * Parses a raw cookie string (e.g. "key=value; key2=value2") into Puppeteer Cookie objects
 * for both .shopee.vn and affiliate.shopee.vn.
 */
function parseCookieStringForPuppeteer(cookieStr: string) {
  if (!cookieStr) return [];
  const items = cookieStr.split(';');
  const result: Array<{ name: string; value: string; domain: string; path: string }> = [];

  for (const item of items) {
    const parts = item.trim().split('=');
    if (parts.length < 2) continue;
    const name = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    if (!name || !value) continue;

    result.push({ name, value, domain: '.shopee.vn', path: '/' });
    result.push({ name, value, domain: 'affiliate.shopee.vn', path: '/' });
  }

  return result;
}

/**
 * Executes link conversion via Puppeteer UI automation & in-browser page context.
 * Types into the Shopee Custom Link input box and clicks the Get Link button,
 * allowing Shopee's native JS to generate the short link.
 */
export async function convertLinkViaPuppeteerBrowser(
  originalLink: string,
  subId: string = 'guest'
): Promise<{
  success: boolean;
  shortLink?: string;
  longLink?: string;
  cookie?: string;
  headerToken?: string;
  error?: string;
}> {
  let browser = null;
  try {
    const tokenConfig = store.getTokenConfig();
    console.log('[Puppeteer UI Automation] Launching browser...');

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

    const userDataDir = isVercel ? undefined : './.puppeteer_session';

    browser = await puppeteer.launch({
      args: isVercel
        ? chromium.args
        : ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
      defaultViewport: { width: 1280, height: 720 },
      executablePath: executablePath || (await chromium.executablePath()),
      headless: true,
      userDataDir,
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36'
    );

    if (tokenConfig.cookie) {
      try {
        const parsedCookies = parseCookieStringForPuppeteer(tokenConfig.cookie);
        if (parsedCookies.length > 0) {
          await page.setCookie(...parsedCookies);
        }
      } catch (cErr) {
        console.warn('[Puppeteer Preload Cookie Warning]:', cErr);
      }
    }

    console.log('[Puppeteer UI] Navigating to affiliate.shopee.vn/offer/custom_link...');
    await page.goto('https://affiliate.shopee.vn/offer/custom_link', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    console.log('[Puppeteer UI] Current URL:', page.url());

    // Listen to network responses to capture batchCustomLink GQL response directly
    let capturedShortLink = '';
    let capturedLongLink = '';

    page.on('response', async (response) => {
      try {
        const url = response.url();
        if (url.includes('batchCustomLink')) {
          const json = await response.json();
          const linkObj = json?.data?.batchCustomLink?.[0];
          if (linkObj && linkObj.shortLink) {
            capturedShortLink = linkObj.shortLink;
            capturedLongLink = linkObj.longLink || originalLink;
            console.log('[Puppeteer Intercepted ShortLink]:', capturedShortLink);
          }
        }
      } catch {}
    });

    // Try UI interaction first: type into input/textarea & click Get Link button
    try {
      await page.waitForSelector('textarea, input[type="text"]', { timeout: 5000 });
      const inputEl = await page.$('textarea, input[type="text"]');
      if (inputEl) {
        console.log('[Puppeteer UI] Inputting link into Shopee UI box...');
        await inputEl.click();
        await inputEl.type(originalLink, { delay: 20 });

        // Look for SubID button/field if subId is specified
        if (subId && subId !== 'guest') {
          const subIdInput = await page.$('input[placeholder*="Sub"], input[placeholder*="sub"]');
          if (subIdInput) {
            await subIdInput.type(subId);
          }
        }

        // Find and click Get Link / Tạo link button
        const buttons = await page.$$('button');
        let clicked = false;
        for (const btn of buttons) {
          const text = await page.evaluate((el) => el.textContent || '', btn);
          if (text.includes('Lấy link') || text.includes('Tạo link') || text.includes('Get Link')) {
            console.log('[Puppeteer UI] Clicking button:', text.trim());
            await btn.click();
            clicked = true;
            break;
          }
        }

        if (clicked) {
          // Wait up to 5s for short link to be generated via UI network or DOM
          for (let i = 0; i < 20; i++) {
            if (capturedShortLink) break;
            await new Promise((r) => setTimeout(r, 250));
          }
        }
      }
    } catch (uiErr) {
      console.warn('[Puppeteer UI Interaction Fallback to evaluate]:', uiErr);
    }

    // Fallback: If UI click didn't capture shortlink, try page evaluate fetch
    if (!capturedShortLink) {
      console.log('[Puppeteer UI Fallback] Executing page fetch evaluate...');
      const evalRes = await page.evaluate(
        async (targetUrl: string, targetSubId: string) => {
          try {
            const matchCsrf = document.cookie.match(/csrftoken=([^;]+)/);
            const matchSpcSt = document.cookie.match(/SPC_ST=([^;]+)/);
            const csrfVal = matchCsrf ? matchCsrf[1].trim() : matchSpcSt ? matchSpcSt[1].trim() : '';

            const resp = await fetch('https://affiliate.shopee.vn/api/v3/gql?q=batchCustomLink', {
              method: 'POST',
              credentials: 'include',
              headers: {
                'content-type': 'application/json',
                'csrf-token': csrfVal,
                'x-csrftoken': csrfVal,
                'anti-csrftoken-a2': csrfVal,
                'affiliate-program-type': '1',
              },
              body: JSON.stringify({
                operationName: 'batchGetCustomLink',
                query: `
                  query batchGetCustomLink($linkParams: [CustomLinkParam!], $sourceCaller: SourceCaller){
                    batchCustomLink(linkParams: $linkParams, sourceCaller: $sourceCaller){
                      shortLink
                      longLink
                      failCode
                    }
                  }
                `,
                variables: {
                  linkParams: [
                    {
                      originalLink: targetUrl,
                      advancedLinkParams: {
                        subId1: targetSubId,
                      },
                    },
                  ],
                  sourceCaller: 'CUSTOM_LINK_CALLER',
                },
              }),
            });

            const json = await resp.json();
            const linkObj = json?.data?.batchCustomLink?.[0];
            if (linkObj && linkObj.shortLink && linkObj.failCode === 0) {
              return {
                success: true,
                shortLink: linkObj.shortLink,
                longLink: linkObj.longLink,
              };
            }
            return {
              success: false,
              error: json?.error ? `Shopee Error ${json.error}` : 'Không lấy được shortLink',
              raw: json,
            };
          } catch (e: unknown) {
            return {
              success: false,
              error: e instanceof Error ? e.message : 'Browser evaluation failed',
            };
          }
        },
        originalLink,
        subId
      );

      if (evalRes.success && evalRes.shortLink) {
        capturedShortLink = evalRes.shortLink;
        capturedLongLink = evalRes.longLink || originalLink;
      }
    }

    // Extract updated fresh cookies
    const freshCookies = await page.cookies();
    let updatedCookieStr = '';
    let updatedSpcSt = '';
    if (freshCookies && freshCookies.length > 0) {
      updatedCookieStr = freshCookies.map((c) => `${c.name}=${c.value}`).join('; ');
      const spcObj = freshCookies.find((c) => c.name === 'SPC_ST');
      if (spcObj) updatedSpcSt = spcObj.value;

      if (updatedCookieStr && updatedSpcSt) {
        store.updateTokenConfig({
          cookie: updatedCookieStr,
          headerToken: updatedSpcSt,
          status: 'ACTIVE',
          lastUpdated: new Date().toISOString(),
        });
      }
    }

    if (capturedShortLink) {
      console.log('[Puppeteer UI Automation Success] Generated shortLink:', capturedShortLink);
      return {
        success: true,
        shortLink: capturedShortLink,
        longLink: capturedLongLink,
        cookie: updatedCookieStr,
        headerToken: updatedSpcSt,
      };
    }

    return {
      success: false,
      error: 'Trình duyệt không tự động lấy được link ngắn từ Shopee UI',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Lỗi Puppeteer UI Browser';
    console.error('[Puppeteer UI Convert Link Error]:', errorMsg);
    return { success: false, error: errorMsg };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

/**
 * Automates headless browser launch to extract live Shopee Affiliate session cookies & SPC_ST token.
 */
export async function refreshShopeeCookieWithBrowser(): Promise<{
  success: boolean;
  cookie?: string;
  headerToken?: string;
  error?: string;
}> {
  const res = await convertLinkViaPuppeteerBrowser('https://shopee.vn', 'test');
  return {
    success: res.success,
    cookie: res.cookie,
    headerToken: res.headerToken,
    error: res.error,
  };
}
