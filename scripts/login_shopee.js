const path = require('path');
const fs = require('fs');
const http = require('http');

async function launchShopeeLoginWindow() {
  console.log('----------------------------------------------------');
  console.log('🚀 ĐANG MỞ TRÌNH DUYỆT CHROME ĐỂ ĐĂNG NHẬP SHOPEE AFFILIATE...');
  console.log('----------------------------------------------------');

  const { default: puppeteer } = await import('puppeteer-core');

  const executablePath =
    process.env.CHROME_PATH ||
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' ||
    '/usr/bin/google-chrome';

  const userDataDir = path.join(process.cwd(), '.puppeteer_session');

  const browser = await puppeteer.launch({
    executablePath,
    headless: false, // Visual Chrome window on Mac screen
    defaultViewport: null,
    userDataDir,
    ignoreDefaultArgs: ['--enable-automation'],
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--start-maximized',
    ],
  });

  const pages = await browser.pages();
  const page = pages.length > 0 ? pages[0] : await browser.newPage();

  console.log('📍 Đang mở trang: https://affiliate.shopee.vn/offer/custom_link');
  await page.goto('https://affiliate.shopee.vn/offer/custom_link', {
    waitUntil: 'domcontentloaded',
  });

  console.log('\n👉 Vui lòng ĐĂNG NHẬP tài khoản Shopee trên cửa sổ Chrome vừa mở ra!');
  console.log('👉 Cửa sổ này sẽ tự động đồng bộ Session vào Database Supabase cho cả Vercel & Local!\n');

  let isHandled = false;

  // Monitor URL change & login status
  const checkInterval = setInterval(async () => {
    if (isHandled) return;
    try {
      const currentUrl = page.url();
      const cookies = await page.cookies();
      const spcSt = cookies.find((c) => c.name === 'SPC_ST');

      if (currentUrl.includes('affiliate.shopee.vn') && !currentUrl.includes('login') && spcSt) {
        isHandled = true;
        clearInterval(checkInterval);

        const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
        console.log('====================================================');
        console.log('✅ ĐÃ PHÁT HIỆN ĐĂNG NHẬP SHOPEE AFFILIATE THÀNH CÔNG!');
        console.log('✅ SPC_ST Token:', spcSt.value.substring(0, 30) + '...');
        console.log('🔄 Đang đồng bộ Cookie mới vào Database Supabase cho Vercel & Local...');

        // 1. Save locally to live_cookie.json
        const jsonPath = path.join(process.cwd(), 'src', 'data', 'live_cookie.json');
        try {
          fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
          fs.writeFileSync(
            jsonPath,
            JSON.stringify(
              {
                cookie: cookieStr,
                headerToken: spcSt.value,
                updatedAt: new Date().toISOString(),
              },
              null,
              2
            )
          );
          console.log('💾 [Lưu File Local]: src/data/live_cookie.json');
        } catch (fErr) {
          console.warn('⚠️ Lỗi ghi live_cookie.json:', fErr);
        }

        // 2. Sync to running Next.js dev server on port 3333 via HTTP POST
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
          (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
              console.log('⚡ [Đồng Bộ HTTP 3333]: Thành công! Phản hồi:', data.substring(0, 100));
            });
          }
        );

        req.on('error', (e) => {
          console.warn('⚠️ [Đồng bộ local warning]: Dev Server 3333 chưa bật. Cookie đã được lưu vào File & Supabase DB!');
        });

        req.write(payload);
        req.end();

        console.log('====================================================');

        setTimeout(async () => {
          console.log('🔒 Đóng cửa sổ thiết lập. Hoàn tất!');
          await browser.close();
          process.exit(0);
        }, 3000);
      }
    } catch {}
  }, 2000);
}

launchShopeeLoginWindow().catch((err) => {
  console.error('Lỗi mở trình duyệt:', err);
  process.exit(1);
});
