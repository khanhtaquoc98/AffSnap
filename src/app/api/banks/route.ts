import { NextResponse } from 'next/server';

export interface VietQRBank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
}

const FALLBACK_BANKS: VietQRBank[] = [
  { id: 1, name: 'Ngân hàng TMCP Ngoại thương Việt Nam', code: 'VCB', bin: '970436', shortName: 'Vietcombank', logo: 'https://api.vietqr.io/img/VCB.png' },
  { id: 2, name: 'Ngân hàng TMCP Kỹ thương Việt Nam', code: 'TCB', bin: '970407', shortName: 'Techcombank', logo: 'https://api.vietqr.io/img/TCB.png' },
  { id: 3, name: 'Ngân hàng TMCP Quân đội', code: 'MB', bin: '970422', shortName: 'MBBank', logo: 'https://api.vietqr.io/img/MB.png' },
  { id: 4, name: 'Ngân hàng Đầu tư và Phát triển Việt Nam', code: 'BIDV', bin: '970418', shortName: 'BIDV', logo: 'https://api.vietqr.io/img/BIDV.png' },
  { id: 5, name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng', code: 'VPB', bin: '970432', shortName: 'VPBank', logo: 'https://api.vietqr.io/img/VPB.png' },
  { id: 6, name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam', code: 'VBA', bin: '970405', shortName: 'Agribank', logo: 'https://api.vietqr.io/img/VBA.png' },
  { id: 7, name: 'Ngân hàng TMCP Á Châu', code: 'ACB', bin: '970416', shortName: 'ACB', logo: 'https://api.vietqr.io/img/ACB.png' },
  { id: 8, name: 'Ngân hàng TMCP Tiên Phong', code: 'TPB', bin: '970423', shortName: 'TPBank', logo: 'https://api.vietqr.io/img/TPB.png' },
  { id: 9, name: 'Ngân hàng TMCP Sài Gòn Thương Tín', code: 'STB', bin: '970403', shortName: 'Sacombank', logo: 'https://api.vietqr.io/img/STB.png' },
  { id: 10, name: 'Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh', code: 'HDB', bin: '970437', shortName: 'HDBank', logo: 'https://api.vietqr.io/img/HDB.png' },
  { id: 11, name: 'Ngân hàng TMCP Quốc tế Việt Nam', code: 'VIB', bin: '970441', shortName: 'VIB', logo: 'https://api.vietqr.io/img/VIB.png' },
];

export async function GET() {
  try {
    const res = await fetch('https://api.vietqr.io/v2/banks', {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        return NextResponse.json({ success: true, banks: data.data });
      }
    }
  } catch (err) {
    console.error('Lỗi khi fetch VietQR Banks API:', err);
  }

  // Return fallback banks if external API is slow or unreachable
  return NextResponse.json({ success: true, banks: FALLBACK_BANKS });
}
