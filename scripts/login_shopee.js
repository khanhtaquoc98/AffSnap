const path = require('path');
const fs = require('fs');
const http = require('http');

async function launchShopeeLoginWindow() {
  console.log('----------------------------------------------------');
  console.log('🚀 ĐANG MỞ CHROME SERVICE (PORT 9222) ĐỂ TẠO CUSTOM LINK CHO USER...');
  console.log('----------------------------------------------------');

  const { default: puppeteer } = await import('puppeteer-core');

  const executablePath =
    process.env.CHROME_PATH ||
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' ||
    '/usr/bin/google-chrome';

  const userDataDir = path.join(process.cwd(), '.puppeteer_session');
  fs.mkdirSync(userDataDir, { recursive: true });

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath,
      headless: false,
      defaultViewport: null,
      userDataDir,
      ignoreDefaultArgs: ['--enable-automation'],
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--no-default-browser-check',
        `--user-data-dir=${userDataDir}`,
        '--remote-debugging-port=9222',
        '--start-maximized',
      ],
    });
  } catch (err) {
    const { execSync } = require('child_process');
    console.log('⚡ Sử dụng macOS Chrome runner...');
    try {
      execSync(`open -n -a "Google Chrome" --args --remote-debugging-port=9222 --user-data-dir="${userDataDir}" "https://affiliate.shopee.vn/offer/custom_link"`);
    } catch (e) {}

    await new Promise((r) => setTimeout(r, 2000));

    try {
      browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    } catch (connErr) {
      console.error('Không thể kết nối Chrome:', connErr.message);
      process.exit(1);
    }
  }

  let page;
  try {
    const pages = await browser.pages();
    page = pages.find((p) => !p.isClosed());
    if (!page) page = await browser.newPage();
  } catch (e) {
    page = await browser.newPage();
  }

  console.log('📍 Đang mở trang: https://affiliate.shopee.vn/offer/custom_link');
  await page.goto('https://affiliate.shopee.vn/offer/custom_link', {
    waitUntil: 'domcontentloaded',
  });

  console.log('\n👉 Vui lòng ĐĂNG NHẬP tài khoản Shopee Affiliate của bạn (Admin Token)!');
  console.log('👉 Trình duyệt này sẽ chạy ngầm trên Port 9222 để tự động tạo s.shopee.vn cho tất cả User!\n');

  let isHandled = false;

  const checkInterval = setInterval(async () => {
    if (isHandled) return;
    try {
      const currentUrl = page.url();
      const cookies = await page.cookies();
      const spcSt = cookies.find((c) => c.name === 'SPC_ST');

      const isCustomLinkPage = currentUrl.includes('/offer/') || currentUrl.includes('/dashboard') || currentUrl.includes('/account_setting');
      const isErrorPage = currentUrl.includes('verify') || currentUrl.includes('login');

      if (isCustomLinkPage && !isErrorPage && spcSt) {
        isHandled = true;
        clearInterval(checkInterval);

        const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
        const csrfObj = cookies.find((c) => c.name === 'csrftoken');
        const csrfTokenVal = csrfObj ? csrfObj.value : spcSt.value.substring(0, 32);

        console.log('====================================================');
        console.log('✅ THÀNH CÔNG: TÀI KHOẢN SHOPEE AFFILIATE ADMIN ĐÃ ĐĂNG NHẬP!');
        console.log('✅ SPC_ST Token:', spcSt.value.substring(0, 30) + '...');
        console.log('⚡ TRÌNH DUYỆT ĐANG CHẠY TRÊN PORT 9222 SẴN SÀNG PHỤC VỤ MỌI MÁY CHỦ!');
        console.log('====================================================');

        // Save locally to live_cookie.json
        const jsonPath = path.join(process.cwd(), 'src', 'data', 'live_cookie.json');
        try {
          fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
          fs.writeFileSync(
            jsonPath,
            JSON.stringify(
              {
                cookie: cookieStr,
                headerToken: spcSt.value,
                csrfToken: csrfTokenVal,
                updatedAt: new Date().toISOString(),
              },
              null,
              2
            )
          );
        } catch {}

        // Sync to running Next.js dev server on port 3333 via HTTP POST
        const payload = JSON.stringify({
          tokenConfig: {
            cookie: cookieStr,
            headerToken: spcSt.value,
            status: 'ACTIVE',
          },
        });

        const req = http.request(
          {
            hostname: 'localhost',
            port: 3333,
            path: '/api/admin/config',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload),
            },
          },
          () => {}
        );
        req.on('error', () => {});
        req.write(payload);
        req.end();
      }
    } catch {}
  }, 2000);
}

launchShopeeLoginWindow().catch((err) => {
  console.error('Lỗi mở trình duyệt:', err);
  process.exit(1);
});
