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

    // Call Shopee Affiliate Official GraphQL API (batchCustomLink) if Cookie / Token is configured
    if (tokenConfig.cookie || tokenConfig.headerToken) {
      try {
        const shopeeCookie = tokenConfig.cookie || `SPC_ST=${tokenConfig.headerToken}`;
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

        const resShopee = await fetch(shopeeGqlEndpoint, {
          method: 'POST',
          headers: {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-US,en;q=0.9',
            'af-ac-enc-dat': 'c2e173467d7a80c9',
            'af-ac-enc-sz-token': 'cmF9gIKzHslMZQAAkBvplw==|CuhqdbGr7uDplrmDunCwDuK1/eeBNSWU66QmPXNuyGT9EaVeIt0hFHQr2z79aqg9CvJAbelyrBiuig==|iRH0qFo0cQrhkpRg|08|3',
            'affiliate-program-type': '1',
            'cache-control': 'no-cache',
            'content-type': 'application/json; charset=UTF-8',
            'cookie': shopeeCookie,
            'csrf-token': tokenConfig.headerToken || 'GCs8pGw5-E-UQ-JjqnhtpIIE_oDJyMHrWF64',
            'origin': 'https://affiliate.shopee.vn',
            'pragma': 'no-cache',
            'priority': 'u=1, i',
            'referer': 'https://affiliate.shopee.vn/offer/custom_link',
            'sec-ch-ua': '"Not;A=Brand";v="8", "Chromium";v="150", "Google Chrome";v="150"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
            'x-sap-ri': '4683716ab3b807235c072d3c050111fe47acc6a4509fd080459b',
            'x-sap-sec': 'mGH5TWkntjkrFlywDj4wDl7wsjIiDiYw9j52DwTwyrIzDGTwvj5DDlawyN5eDyTwnN5GDydwGr4PDjqwAj5zDz9wPr4VDYywVj4ODmywtj5SDw1w1jIxDY7wIj46Dy4wCrIcDjdwmj5MDwYwwrILDiowujIbDYTwej4LDlTwGjIuDmdwEX5eDj4wNjSwDj4wDjrf7FOBDj4w6kW5N4U2DN4wDj4wq8JAQORzDN4wujowDZEDSM0wDwR4fjSwDj4wFQkwDb5wDjJLO5TGDj4wmwRiZj4wDadGDj4ADr4wLGZrPj4wDzuzDX4wujowDj4wHeqIO1x0Dj4wM4FjzvyNDX4wDjJyqWdYDj5CMr4aaT2uIFl2DamNDN4wDjJ9RkdCDjJzDX4wDGNVs7zDWFNseY2IDjIZO3qwDj5sNfMR5PqQe7KC4zMWyVW1xxmPB35ZP561fTAtOJOmFL8tfKQCLPyuMV74sz2KOeuskExDc42uT4mtT4g8hR7/nQMlNyXbDPfC7LdYBc8fNP/RA+pQAQNKmKjHMQRr4SvL1Y9ApsgjmDOcwK+iJwnf0u+vCz/dVT0GuErt7durheLjDyLiA4VoZsMLz+2ZASQbmlCF2dWp1gtAAdL59XeNct87YHlZ5PaZsEN99D1BKBdNAUWIQETefeMxmwfn1eQpzlIOFCISRI87hLHKwz7rTn/HWWjNmJfVKDRV0QL9k9d9mYaps148EnLADjTwDjIXM0i9ilpYYrdwDjIdGLKkHr4wDiDVcsyBwG2FzLGQ9BekKPwqtVP48mrm/TC60sx32R/mSyy4JtBJ+mZUcLTLfROe6yoIe2yW92FWnpPlfb4HJIRxQc/mTTyOYCA6xrYCx4wr1skPUlmCrmyvozww7ZOfv+xWKBdiuTDML9hEIYg+VAUXu0K2MhNq5hjQDE7SigLfPZyzXJi8PwjTp11HxoQpygfVCbttEjS2tX0Rr8F+sS/ztX4WiEiloxJpobhldf7wFj4wDgUZhB7mDj4w0ClVT2eo2pZrop9UJx+wDj4wDj4wDj4wmN4wDwtG/mFS/Ue0o/mflqm04exyQZSb2tQJQt/RLAPFetGtHExTFxOoo6lQHZ1UOYOrRe/RKRUCstGCEeUml1c0rbBr2HbfN3TwDj4wDj4wDj4wWr4wDGtMQAgASGtVHheVzaCoHHM6069wUj4wDxFcc+gqE/sq3sBVWpeR203Ipp1TMv8h5v8dOkL1L/UZSZfn8N4wDj4rDj4w2KntWSMHHoLr60waJhhhcvxJP5BG0GC12ZGYlucr2q/coY+qBvENPGxSQ5eVehnVSsltXwB/So+wDj4wTj4wDfwZReYQQbv2Dj4wDj4wDj4LDj4w0Lek11BYl7uiipfcXPBwcQELAmdhpqMmFiyunE3j0XJ9Cr4wTj4wDbvzePQpQVv2Tj4wDf0StfTSnWA7Dj4wDC==',
            'x-sz-sdk-version': '1.12.21',
          },
          body: JSON.stringify(gqlPayload),
        });

        const resText = await resShopee.text();
        console.log(`[Shopee GQL Debug - Status ${resShopee.status}]:`, resText);

        if (resShopee.ok && resText) {
          try {
            const gqlData = JSON.parse(resText);
            const customLinkResult = gqlData?.data?.batchCustomLink?.[0];

            if (customLinkResult && customLinkResult.shortLink && customLinkResult.failCode === 0) {
              officialShortLink = customLinkResult.shortLink;
              officialLongLink = customLinkResult.longLink;
              isOfficialApiUsed = true;
            }
          } catch (pErr) {
            console.error('[Shopee JSON Parse Error]:', pErr);
          }
        }
      } catch (gqlErr) {
        console.error('[Shopee Official GQL API Error]:', gqlErr);
      }
    }

    // Save link record to Store & Supabase DB
    const linkRecord = store.addLink(trimmedUrl, userId || null);

    // Override affiliateUrl with official shortLink if generated by Shopee API
    if (officialShortLink) {
      linkRecord.affiliateUrl = officialShortLink;
    }

    return NextResponse.json({
      success: true,
      data: linkRecord,
      officialLongLink,
      isOfficialApiUsed,
      tokenStatus: store.getTokenConfig().status,
      message: isOfficialApiUsed
        ? 'Đã tạo link Shopee Affiliate chính thức từ Shopee GraphQL API!'
        : 'Chuyển đổi link Shopee Affiliate thành công!',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi xử lý API';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
