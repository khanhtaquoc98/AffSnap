import { NextRequest, NextResponse } from 'next/server';
import store from '@/lib/store';

export async function GET(req: NextRequest) {
  try {
    await store.syncFromDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;

    const payoutRequests = store.getPayoutRequests(userId);
    const user = userId ? store.getUser(userId) : null;
    const allUsers = store.getUsers();

    return NextResponse.json({
      success: true,
      payoutRequests,
      user,
      allUsers,
    });
  } catch (err: unknown) {
    console.error('Lỗi khi GET /api/payouts:', err);
    return NextResponse.json({
      success: true,
      payoutRequests: store.getPayoutRequests(),
      user: null,
      allUsers: store.getUsers(),
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: {
      action?: string;
      userId?: string;
      bankInfo?: { bankName?: string; bankCode?: string; accountNumber?: string; accountName?: string };
      amount?: number;
    } = {};
    try {
      const text = await req.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      body = {};
    }

    const { action, userId, bankInfo, amount } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Thiếu thông tin người dùng!' }, { status: 400 });
    }

    if (action === 'UPDATE_BANK') {
      const { bankName, bankCode, accountNumber, accountName } = bankInfo || {};
      if (!bankName || !accountNumber || !accountName) {
        return NextResponse.json(
          { error: 'Vui lòng cung cấp đầy đủ Tên Ngân Hàng, Số Tài Khoản và Tên Chủ Tài Khoản!' },
          { status: 400 }
        );
      }

      const updatedUser = store.updateUserBank(userId, {
        bankName,
        bankCode: bankCode || 'OTHER',
        accountNumber,
        accountName,
      });

      return NextResponse.json({
        success: true,
        message: 'Đã cập nhật thông tin tài khoản ngân hàng thành công!',
        user: updatedUser,
      });
    }

    if (action === 'REQUEST_PAYOUT') {
      const user = store.getUser(userId);
      if (!user) {
        return NextResponse.json({ error: 'Người dùng không tồn tại!' }, { status: 404 });
      }

      const bankName = bankInfo?.bankName || user.bankName;
      const bankCode = bankInfo?.bankCode || user.bankCode || 'VCB';
      const accountNumber = bankInfo?.accountNumber || user.accountNumber;
      const accountName = bankInfo?.accountName || user.accountName;

      if (!bankName || !accountNumber || !accountName) {
        return NextResponse.json(
          { error: 'Vui lòng cập nhật đầy đủ Thông Tin Ngân Hàng nhận tiền trước khi tạo yêu cầu!' },
          { status: 400 }
        );
      }

      const result = store.createPayoutRequest({
        userId,
        amount: Number(amount) || user.balance,
        bankName,
        bankCode,
        accountNumber,
        accountName,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        request: result.request,
        user: store.getUser(userId),
      });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi xử lý server';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    let body: { action?: string; requestId?: string; rejectReason?: string } = {};
    try {
      const text = await req.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      body = {};
    }

    const { action, requestId, rejectReason } = body;

    if (!requestId) {
      return NextResponse.json({ error: 'Thiếu ID yêu cầu rút tiền!' }, { status: 400 });
    }

    if (action === 'APPROVE') {
      const result = store.approvePayoutRequest(requestId);
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        request: result.request,
        users: store.getUsers(),
        payoutRequests: store.getPayoutRequests(),
      });
    }

    if (action === 'REJECT') {
      const result = store.rejectPayoutRequest(requestId, rejectReason || '');
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        request: result.request,
        users: store.getUsers(),
        payoutRequests: store.getPayoutRequests(),
      });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi xử lý server';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
