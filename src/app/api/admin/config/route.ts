import { NextRequest, NextResponse } from 'next/server';
import store from '@/lib/store';
import { parseCurlCommand } from '@/lib/curlParser';

export async function GET() {
  return NextResponse.json({
    tokenConfig: store.getTokenConfig(),
    systemConfig: store.getSystemConfig(),
    users: store.getUsers(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tokenConfig, systemConfig, action } = body;

    if (action === 'RETRY_TOKEN') {
      const updated = store.updateTokenConfig({
        status: 'ACTIVE',
        autoRetryCount: store.getTokenConfig().autoRetryCount + 1,
      });
      return NextResponse.json({
        success: true,
        message: 'Đã phát tín hiệu Retry & Làm mới Session Token thành công!',
        tokenConfig: updated,
      });
    }

    if (action === 'EXPIRE_TOKEN') {
      const updated = store.updateTokenConfig({ status: 'EXPIRED' });
      return NextResponse.json({
        success: true,
        message: 'Đã mô phỏng Token hết hạn!',
        tokenConfig: updated,
      });
    }

    if (action === 'AUTO_LOGIN') {
      const { exec } = require('child_process');
      console.log('🚀 Triggering Shopee Chrome Login Service from Admin UI...');
      
      // Launch login_shopee script asynchronously
      exec('npm run login:shopee', { cwd: process.cwd() });

      return NextResponse.json({
        success: true,
        message: 'Đã tự động mở cửa sổ Chrome trên màn hình! Vui lòng hoàn tất Đăng nhập Shopee trên cửa sổ Chrome vừa bật ra, hệ thống sẽ tự động bóc tách Token & Cookie mới nạp vào CSDL.',
      });
    }

    if (tokenConfig) {
      if (tokenConfig.rawCurl && tokenConfig.rawCurl.trim()) {
        const parsed = parseCurlCommand(tokenConfig.rawCurl);
        if (parsed.cookie) {
          tokenConfig.cookie = parsed.cookie;
        }
        tokenConfig.rawHeaders = parsed.headers;
      }
      store.updateTokenConfig(tokenConfig);
    }

    if (systemConfig) {
      store.updateSystemConfig(systemConfig);
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật cấu hình cURL và Token thành công!',
      tokenConfig: store.getTokenConfig(),
      systemConfig: store.getSystemConfig(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi server';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
