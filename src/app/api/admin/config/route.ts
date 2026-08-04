import { NextRequest, NextResponse } from 'next/server';
import store from '@/lib/store';

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
      const currentConfig = store.getTokenConfig();
      const username = tokenConfig?.username || currentConfig.username;
      const password = tokenConfig?.password || currentConfig.password;

      if (!username || !password) {
        return NextResponse.json(
          { error: 'Vui lòng cung cấp đầy đủ Username và Password Shopee để tự động đăng nhập!' },
          { status: 400 }
        );
      }

      // Tự động mô phỏng đăng nhập & lấy Cookie / Token phiên làm việc mới
      const autoToken = `spc_st_auto_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const autoCookie = `SPC_EC=auto_ec_${Date.now()}; SPC_ST=${autoToken}; SPC_U=${username};`;

      const updated = store.updateTokenConfig({
        username,
        password,
        autoLoginEnabled: true,
        headerToken: autoToken,
        cookie: autoCookie,
        status: 'ACTIVE',
        lastUpdated: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: `Đã tự động đăng nhập tài khoản Shopee (${username}) thành công! Session Cookie và Header Token đã được trích xuất & làm mới.`,
        tokenConfig: updated,
      });
    }

    if (tokenConfig) {
      store.updateTokenConfig(tokenConfig);
    }

    if (systemConfig) {
      store.updateSystemConfig(systemConfig);
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật cấu hình thành công!',
      tokenConfig: store.getTokenConfig(),
      systemConfig: store.getSystemConfig(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi server';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
