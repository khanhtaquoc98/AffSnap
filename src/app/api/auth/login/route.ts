import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Vui lòng nhập định dạng Email hợp lệ!' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Admin Account Credentials Check
    if (cleanEmail === 'khanhtaquoc98@gmail.com' && password === '28041998') {
      const adminSession = {
        email: cleanEmail,
        name: 'Quản Trị Viên Admin',
        role: 'ADMIN' as const,
        balance: 150000,
        permissions: ['convert_links', 'view_all_orders', 'manage_tokens', 'reconcile_orders', 'system_config', 'approve_payouts'],
      };

      return NextResponse.json({
        success: true,
        message: 'Đăng nhập Quản trị viên (ADMIN) thành công!',
        user: adminSession,
      });
    }

    // Regular User Account
    let userName = cleanEmail.split('@')[0];
    let balance = 0;

    if (cleanEmail === 'user@gmail.com') {
      userName = 'Nguyễn Văn A';
      balance = 70000;
    }

    const userSession = {
      email: cleanEmail,
      name: userName,
      role: 'USER' as const,
      balance,
      permissions: ['convert_links', 'view_my_orders', 'view_my_balance', 'request_payout'],
    };

    return NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công!',
      user: userSession,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi đăng nhập Email';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
