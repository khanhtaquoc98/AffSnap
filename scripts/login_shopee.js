const path = require('path');

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
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
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
        console.log('🔄 Đang đồng bộ Cookie mới vào Database Supabase cho Vercel...');

        // Sync token to local dev server / Supabase DB via Admin config API
        try {
          const fetchModule = await import('node-fetch');
          const fetch = fetchModule.default || fetchModule;
          const res = await fetch('http://localhost:3333/api/admin/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tokenConfig: {
                cookie: cookieStr,
                headerToken: spcSt.value,
                status: 'ACTIVE',
              },
            }),
          });
          const resData = await res.json();
          if (resData.success) {
            console.log('⚡ [Đồng Bộ Thành Công]: Cookie đã lưu vào Database Supabase!');
            console.log('🌐 Vercel & Local từ bây giờ sẽ sử dụng Cookie này để tạo link 24/7!');
          }
        } catch (syncErr) {
          console.warn('⚠️ [Đồng bộ local warning]: Server 3333 chưa bật hoặc không phản hồi. Cookie vẫn đã được lưu trong ./.puppeteer_session');
        }

        console.log('====================================================');

        setTimeout(async () => {
          console.log('🔒 Đóng cửa sổ thiết lập. Hoàn tất!');
          await browser.close();
          process.exit(0);
        }, 4000);
      }
    } catch {}
  }, 2000);
}

launchShopeeLoginWindow().catch((err) => {
  console.error('Lỗi mở trình duyệt:', err);
  process.exit(1);
});
