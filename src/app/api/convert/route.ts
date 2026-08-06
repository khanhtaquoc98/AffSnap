import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import store from '@/lib/store';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => ({}));
    const originUrl = (body.originUrl || body.originalUrl || body.url || '').trim();
    const subId = (body.subId || body.userId || 'guest').trim();

    if (!originUrl) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp link sản phẩm Shopee (originUrl)' },
        { status: 400 }
      );
    }

    // Lấy thông tin Cookie và Affiliate ID từ Store / ENV
    await store.syncFromDatabase();
    const tokenConfig = store.getTokenConfig();
    const cookie = tokenConfig.cookie || process.env.SHOPEE_COOKIE || process.env.SHOPEE_AFFILIATE_COOKIE || '';
    const affiliateId = tokenConfig.appId || process.env.SHOPEE_AFFILIATE_ID || process.env.SHOPEE_APP_ID || '20504406';

    // Link rút gọn mặc định chuẩn Shopee Affiliate Universal Redirect
    const encodedOrigin = encodeURIComponent(originUrl);
    const defaultAnRedirLink = `https://s.shopee.vn/an_redir?origin_link=${encodedOrigin}&affiliate_id=${affiliateId}&sub_id=${subId}`;

    let shortLink: string | undefined = undefined;

    // Nếu có Cookie -> Thử gọi Shopee GraphQL API mutation generateShortLink
    if (cookie) {
      const csrfMatch = cookie.match(/csrftoken=([^;]+)/);
      const csrfToken = csrfMatch ? csrfMatch[1].trim() : '';

      try {
        const response = await axios.post(
          'https://affiliate.shopee.vn/api/v3/gql',
          {
            query: `
              mutation generateShortLink($originUrl: String!) {
                generateShortLink(originUrl: $originUrl) {
                  shortLink
                }
              }
            `,
            variables: { originUrl },
          },
          {
            headers: {
              'content-type': 'application/json',
              'cookie': cookie,
              'x-csrftoken': csrfToken,
              'csrf-token': csrfToken,
              'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'referer': 'https://affiliate.shopee.vn/offer/custom_link',
              'origin': 'https://affiliate.shopee.vn',
              'accept': 'application/json, text/plain, */*',
            },
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 300,
          }
        );

        shortLink = response.data?.data?.generateShortLink?.shortLink;
      } catch (error: any) {
        console.warn('[Shopee GQL generateShortLink Warning]:', error.response?.data || error.message);
      }
    }

    // Trả về GraphQL ShortLink nếu có, ngược lại dùng Universal Redirect Link an_redir
    const finalShortLink = shortLink || defaultAnRedirLink;
    const shortCode = finalShortLink.split('/').pop() || '';

    return NextResponse.json({
      success: true,
      shortLink: finalShortLink,
      data: {
        id: `link-${Date.now()}`,
        originalUrl: originUrl,
        resolvedUrl: originUrl,
        affiliateUrl: finalShortLink,
        shortLink: finalShortLink,
        longLink: originUrl,
        shortCode,
        subId,
        createdAt: new Date().toISOString(),
      },
      message: 'Tạo link Shopee Affiliate thành công!',
    });
  } catch (error: any) {
    console.error('[Convert Route Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Lỗi máy chủ khi tạo link Shopee Affiliate',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

