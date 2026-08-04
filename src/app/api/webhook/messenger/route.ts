import { NextRequest, NextResponse } from 'next/server';
import store from '@/lib/store';

const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'shopee_aff_secret_123';
const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN || '';

/**
 * 1. GET Request: Verification endpoint called by Facebook when configuring Webhook
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[FB Messenger Webhook] Webhook verified successfully!');
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.warn('[FB Messenger Webhook] Verification failed. Invalid verify token.');
    return new NextResponse('Forbidden', { status: 403 });
  }
}

/**
 * 2. POST Request: Webhook event listener called when a user messages the Facebook Page
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[FB Webhook Received Payload]:', JSON.stringify(body, null, 2));

    if (body.object === 'page') {
      for (const entry of body.entry) {
        if (!entry.messaging || !Array.isArray(entry.messaging)) continue;

        for (const webhookEvent of entry.messaging) {
          const senderPsid = webhookEvent.sender?.id;

          if (senderPsid && webhookEvent.message && webhookEvent.message.text) {
            const messageText = webhookEvent.message.text.trim();
            console.log(`[FB Webhook] Message from PSID ${senderPsid}: "${messageText}"`);

            try {
              await handleIncomingMessage(senderPsid, messageText);
            } catch (err) {
              console.error('[FB Messenger Webhook] Error handling message:', err);
            }
          }
        }
      }

      return NextResponse.json({ status: 'EVENT_RECEIVED' }, { status: 200 });
    } else {
      return new NextResponse('Not Found', { status: 404 });
    }
  } catch (error) {
    console.error('[FB Messenger Webhook Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Parses incoming message, extracts Shopee link, converts to Affiliate custom link, and sends reply.
 */
async function handleIncomingMessage(senderPsid: string, messageText: string) {
  const lowerText = messageText.toLowerCase();

  // Check if message is a /getlink command or contains a valid Shopee URL
  const isGetLinkCmd = lowerText.startsWith('/getlink');
  const isShopeeUrl =
    lowerText.includes('shopee.vn') ||
    lowerText.includes('shope.ee') ||
    lowerText.includes('shp.ee') ||
    lowerText.includes('s.shopee.vn');

  if (!isGetLinkCmd && !isShopeeUrl) {
    // If user sends something else, send helpful instructions
    await sendMessengerText(
      senderPsid,
      '🤖 Xin chào! Vui lòng gửi theo cú pháp:\n\n/getlink <link_shopee>\nHoặc dán trực tiếp link Shopee vào đây để nhận Custom Link Affiliate nhé!'
    );
    return;
  }

  // Extract raw URL from command
  let rawUrl = messageText;
  if (isGetLinkCmd) {
    rawUrl = messageText.substring(8).trim();
  }

  // Extract actual URL if embedded inside other text
  const urlMatch = rawUrl.match(/(https?:\/\/[^\s]+)/g);
  const targetUrl = urlMatch ? urlMatch[0] : rawUrl;

  if (!targetUrl || (!targetUrl.includes('shopee') && !targetUrl.includes('shp.ee'))) {
    await sendMessengerText(
      senderPsid,
      '❌ Link Shopee không hợp lệ! Vui lòng kiểm tra lại link sản phẩm Shopee.'
    );
    return;
  }

  // Send status update message
  await sendMessengerText(senderPsid, '⏳ Đang chuyển đổi link Shopee Affiliate, vui lòng đợi giây lát...');

  try {
    // Convert Shopee Link
    const affLinkResult = await convertShopeeLink(targetUrl);

    if (affLinkResult.success && affLinkResult.affiliateUrl) {
      const replyMsg = `✨ CHUYỂN ĐỔI LINK THÀNH CÔNG!\n\n👉 Link Affiliate:\n${affLinkResult.affiliateUrl}\n\n🛒 Mua sắm qua link để ủng hộ kênh nhé!`;
      await sendMessengerText(senderPsid, replyMsg);
    } else {
      await sendMessengerText(
        senderPsid,
        `❌ Lỗi tạo link: ${affLinkResult.error || 'Không thể tạo link affiliate lúc này.'}`
      );
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    await sendMessengerText(senderPsid, `❌ Đã xảy ra lỗi khi tạo link: ${errMsg}`);
  }
}

/**
 * Converts a Shopee product URL to an Affiliate Link using Shopee GraphQL API or store fallback.
 */
async function convertShopeeLink(trimmedUrl: string): Promise<{ success: boolean; affiliateUrl?: string; error?: string }> {
  const tokenConfig = store.getTokenConfig();
  const subId = 'fb_messenger';

  let officialShortLink: string | null = null;

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
          accept: 'application/json, text/plain, */*',
          'accept-language': 'en-US,en;q=0.9',
          'af-ac-enc-dat': 'c2e173467d7a80c9',
          'af-ac-enc-sz-token':
            'cmF9gIKzHslMZQAAkBvplw==|CuhqdbGr7uDplrmDunCwDuK1/eeBNSWU66QmPXNuyGT9EaVeIt0hFHQr2z79aqg9CvJAbelyrBiuig==|iRH0qFo0cQrhkpRg|08|3',
          'affiliate-program-type': '1',
          'cache-control': 'no-cache',
          'content-type': 'application/json; charset=UTF-8',
          cookie: shopeeCookie,
          'csrf-token': tokenConfig.headerToken || 'GCs8pGw5-E-UQ-JjqnhtpIIE_oDJyMHrWF64',
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
        },
        body: JSON.stringify(gqlPayload),
      });

      const resText = await resShopee.text();

      if (resShopee.ok && resText) {
        try {
          const gqlData = JSON.parse(resText);
          const customLinkResult = gqlData?.data?.batchCustomLink?.[0];

          if (customLinkResult && customLinkResult.shortLink && customLinkResult.failCode === 0) {
            officialShortLink = customLinkResult.shortLink;
          }
        } catch (pErr) {
          console.error('[FB Messenger Webhook GQL Parse Error]:', pErr);
        }
      }
    } catch (gqlErr) {
      console.error('[FB Messenger Webhook Shopee API Error]:', gqlErr);
    }
  }

  // Save link record in store
  const linkRecord = store.addLink(trimmedUrl, 'fb_bot');

  if (officialShortLink) {
    linkRecord.affiliateUrl = officialShortLink;
  }

  const finalShortUrl = officialShortLink || `https://affsnap.vercel.app/s/${linkRecord.shortCode}`;

  return {
    success: true,
    affiliateUrl: finalShortUrl,
  };
}

/**
 * Sends a message back to Facebook Messenger via Facebook Graph Send API.
 */
async function sendMessengerText(recipientId: string, text: string) {
  if (!PAGE_ACCESS_TOKEN) {
    console.warn('[FB Messenger Webhook] FB_PAGE_ACCESS_TOKEN is not configured in .env');
    return;
  }

  const requestBody = {
    recipient: { id: recipientId },
    message: { text: text },
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[FB Messenger Send API Error]:', errText);
    }
  } catch (err) {
    console.error('[FB Messenger Send API Exception]:', err);
  }
}
