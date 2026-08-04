import { NextRequest, NextResponse } from 'next/server';
import store from '@/lib/store';

export async function GET(req: NextRequest) {
  try {
    await store.syncFromDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const links = store.getLinks(userId || undefined);
    const orders = store.getOrders(userId || undefined);

    return NextResponse.json({
      success: true,
      links,
      orders,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi lấy dữ liệu đơn hàng';
    return NextResponse.json({ success: true, links: [], orders: store.getOrders(), error: msg });
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: { action?: string; orderId?: string; status?: 'COMPLETED' | 'CANCELLED' } = {};
    try {
      const text = await req.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      body = {};
    }

    const { action, orderId, status } = body;

    // Action 1: SYNC_SHOPEE_ORDERS - Call official Shopee GraphQL Conversion API
    if (action === 'SYNC_SHOPEE_ORDERS') {
      const tokenConfig = store.getTokenConfig();
      if (!tokenConfig.cookie && !tokenConfig.headerToken) {
        return NextResponse.json({
          error: 'Chưa cấu hình Cookie/HeaderToken Shopee Affiliate trong Cấu Hình Admin.',
        }, { status: 400 });
      }

      try {
        const shopeeCookie = tokenConfig.cookie || `SPC_ST=${tokenConfig.headerToken}`;
        const shopeeGqlEndpoint = 'https://affiliate.shopee.vn/api/v3/gql?q=conversionList';

        const gqlPayload = {
          operationName: 'conversionList',
          query: `
            query conversionList($page: Int, $limit: Int) {
              conversionList(page: $page, limit: $limit) {
                list {
                  orderSn
                  purchaseTime
                  totalCommission
                  subId1
                  nodes {
                    itemName
                    itemPrice
                  }
                }
              }
            }
          `,
          variables: { page: 1, limit: 50 },
        };

        const resShopee = await fetch(shopeeGqlEndpoint, {
          method: 'POST',
          headers: {
            'accept': 'application/json, text/plain, */*',
            'content-type': 'application/json; charset=UTF-8',
            'cookie': shopeeCookie,
            'origin': 'https://affiliate.shopee.vn',
            'referer': 'https://affiliate.shopee.vn/report/conversion',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
          },
          body: JSON.stringify(gqlPayload),
        });

        const resText = await resShopee.text();
        console.log(`[Shopee Orders Sync Status ${resShopee.status}]:`, resText);

        let syncedCount = 0;
        if (resShopee.ok && resText) {
          try {
            const gqlData = JSON.parse(resText);
            const conversionList = gqlData?.data?.conversionList?.list || [];

            for (const item of conversionList) {
              if (item.orderSn) {
                const subId = item.subId1 || 'user-1';
                const totalCommission = Number(item.totalCommission) || 50000;
                const itemName = item.nodes?.[0]?.itemName || 'Sản phẩm Shopee';
                const itemPrice = Number(item.nodes?.[0]?.itemPrice) || 199000;

                store.addOrUpdateOrder({
                  orderSn: item.orderSn,
                  userId: subId,
                  productName: itemName,
                  productPrice: itemPrice,
                  totalCommission,
                  status: 'COMPLETED',
                });
                syncedCount++;
              }
            }
          } catch (pErr) {
            console.error('Lỗi parse đơn hàng Shopee API:', pErr);
          }
        }

        return NextResponse.json({
          success: true,
          message: syncedCount > 0
            ? `Đã tự động đồng bộ ${syncedCount} đơn hàng mới từ Shopee Affiliate API!`
            : 'Đã hoàn tất kiểm tra. Không có đơn hàng mới từ Shopee.',
          orders: store.getOrders(),
        });
      } catch (gqlErr) {
        console.error('Lỗi gọi Shopee Conversion API:', gqlErr);
        return NextResponse.json({ error: 'Lỗi gọi Shopee Affiliate API' }, { status: 500 });
      }
    }

    // Action 2: RECONCILE SINGLE ORDER
    if (!orderId || !status) {
      return NextResponse.json({ error: 'Thiếu thông tin đối soát' }, { status: 400 });
    }
    const updatedOrder = store.reconcileOrder(orderId, status);
    if (!updatedOrder) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      message: `Đã đối soát đơn hàng ${updatedOrder.orderSn} -> Trạng thái: ${status}`,
      order: updatedOrder,
      orders: store.getOrders(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi server';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
