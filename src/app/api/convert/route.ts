import { NextRequest, NextResponse } from 'next/server';
import store from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    let body: { url?: string; userId?: string | null } = {};
    try {
      const text = await req.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      body = {};
    }

    const { url, userId } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL không hợp lệ' }, { status: 400 });
    }

    const trimmedUrl = url.trim();
    if (!trimmedUrl.includes('shopee.vn') && !trimmedUrl.includes('shope.ee') && !trimmedUrl.includes('shp.ee') && !trimmedUrl.includes('s.shopee.vn')) {
      return NextResponse.json({ error: 'Vui lòng nhập URL sản phẩm Shopee hợp lệ' }, { status: 400 });
    }

    const tokenConfig = store.getTokenConfig();
    const subId = userId || 'guest';

    let officialShortLink: string | null = null;
    let officialLongLink: string | null = null;
    let isOfficialApiUsed = false;

    // Call Shopee Affiliate Official GraphQL API with Auto-Refresh Token & Retry mechanism
    if (tokenConfig.cookie || tokenConfig.headerToken) {
      let currentCookie = tokenConfig.cookie || '';
      let currentHeaderToken = tokenConfig.headerToken || 'GCs8pGw5-E-UQ-JjqnhtpIIE_oDJyMHrWF64';

      const executeGqlFetch = async (cookieStr: string, spcStToken: string) => {
        const shopeeGqlEndpoint = 'https://affiliate.shopee.vn/api/v3/gql?q=batchCustomLink';
        const gqlPayload = {
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
                originalLink: trimmedUrl,
                advancedLinkParams: {
                  subId1: subId,
                },
              },
            ],
            sourceCaller: 'CUSTOM_LINK_CALLER',
          },
        };

        const matchCsrf = cookieStr.match(/csrftoken=([^;]+)/);
        const csrfFromCookie = matchCsrf && matchCsrf[1] ? matchCsrf[1].trim() : spcStToken;

        return await fetch(shopeeGqlEndpoint, {
          method: 'POST',
          headers: {
            accept: 'application/json, text/plain, */*',
            'accept-language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
            'affiliate-program-type': '1',
            'cache-control': 'no-cache',
            'content-type': 'application/json; charset=UTF-8',
            cookie: cookieStr,
            'csrf-token': csrfFromCookie,
            'x-csrftoken': csrfFromCookie,
            'anti-csrftoken-a2': csrfFromCookie,
            'spc-st': spcStToken,
            origin: 'https://affiliate.shopee.vn',
            pragma: 'no-cache',
            priority: 'u=1, i',
            referer: 'https://affiliate.shopee.vn/offer/custom_link',
            'sec-ch-ua': '"Not;A=Brand";v="8", "Chromium";v="150", "Google Chrome";v="150"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
            'x-shopee-language': 'vi',
          },
          body: JSON.stringify(gqlPayload),
        });
      };

      try {
        let resShopee = await executeGqlFetch(currentCookie, currentHeaderToken);
        let resText = await resShopee.text();
        console.log('[Shopee GQL First Attempt Response]:', resText);

        let isSuccess = false;
        if (resShopee.ok && resText) {
          try {
            const gqlData = JSON.parse(resText);
            const customLinkResult = gqlData?.data?.batchCustomLink?.[0];
            if (customLinkResult && customLinkResult.shortLink && customLinkResult.failCode === 0) {
              officialShortLink = customLinkResult.shortLink;
              officialLongLink = customLinkResult.longLink;
              isOfficialApiUsed = true;
              isSuccess = true;
            }
          } catch (pErr) {
            console.error('[Shopee JSON Parse Error]:', pErr);
          }
        }

        // Auto-convert via Puppeteer Browser inside window context if server-side fetch is challenged
        if (!isSuccess && tokenConfig.autoLoginEnabled) {
          console.warn('[Shopee API Challenge / Expiration] Triggering Headless Browser Execution...');
          const { convertLinkViaPuppeteerBrowser } = await import('@/lib/puppeteerCookie');
          const browserRes = await convertLinkViaPuppeteerBrowser(trimmedUrl, subId);

          if (browserRes.success && browserRes.shortLink) {
            officialShortLink = browserRes.shortLink;
            officialLongLink = browserRes.longLink || trimmedUrl;
            isOfficialApiUsed = true;
            isSuccess = true;
          }
        }
      } catch (gqlErr) {
        console.error('[Shopee Official GQL API Error]:', gqlErr);
      }
    }

    if (!isOfficialApiUsed || !officialShortLink) {
      return NextResponse.json(
        {
          error:
            'Hệ thống đang chờ cập nhật Cookie Shopee Affiliate hợp lệ trong Admin. Vui lòng cập nhật Cookie mới để tạo link s.shopee.vn!',
        },
        { status: 400 }
      );
    }

    // Save link record to Store & Supabase DB
    const linkRecord = store.addLink(trimmedUrl, userId || null);
    linkRecord.affiliateUrl = officialShortLink;

    return NextResponse.json({
      success: true,
      data: linkRecord,
      officialLongLink,
      isOfficialApiUsed: true,
      tokenStatus: store.getTokenConfig().status,
      message: 'Đã tạo link Shopee Affiliate chính thức từ Shopee GraphQL API!',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi xử lý API';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
