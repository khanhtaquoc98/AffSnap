import { NextRequest, NextResponse } from 'next/server';
import store from '@/lib/store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const links = store.getLinks();
    const linkRecord = links.find((l) => l.shortCode === code);

    if (linkRecord) {
      linkRecord.clicks += 1;
      return NextResponse.redirect(linkRecord.affiliateUrl);
    }

    // Default fallback to homepage if shortcode not found
    return NextResponse.redirect(new URL('/', req.url));
  } catch (err) {
    console.error('Error redirecting shortcode:', err);
    return NextResponse.redirect(new URL('/', req.url));
  }
}
