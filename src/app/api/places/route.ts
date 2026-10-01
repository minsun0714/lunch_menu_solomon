import { NextRequest, NextResponse } from 'next/server';
import { PlaceSearchResult } from '@/types/place';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim() || '';
  const page = Number(request.nextUrl.searchParams.get('page') || '1');
  if (!query || query.length > 200 || !Number.isInteger(page) || page < 1 || page > 45) {
    return NextResponse.json({ success: false, error: '검색어와 페이지 번호를 확인해주세요.' }, { status: 400 });
  }
  const key = process.env.KAKAO_REST_API_KEY?.trim();
  if (!key) {
    return NextResponse.json({ success: false, error: '장소 검색이 아직 연결되지 않았습니다.' }, { status: 503 });
  }
  const url = new URL('https://dapi.kakao.com/v2/local/search/keyword.json');
  url.search = new URLSearchParams({ query, page: String(page), size: '15', sort: 'accuracy' }).toString();
  try {
    const response = await fetch(url, {
      method: 'GET', headers: { Authorization: `KakaoAK ${key}` },
      cache: 'no-store', signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      const limited = response.status === 429;
      return NextResponse.json({ success: false, error: limited ? '검색 요청이 많습니다. 잠시 후 다시 시도해주세요.' : '카카오 장소 검색에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.' }, { status: limited ? 429 : 502 });
    }
    const body = await response.json();
    if (!Array.isArray(body.documents) || typeof body.meta?.is_end !== 'boolean') throw new Error('Invalid search response');
    const places: PlaceSearchResult[] = body.documents.flatMap((document: Record<string, unknown>) => {
      const address = document.road_address_name || document.address_name;
      if (typeof document.id !== 'string' || typeof document.place_name !== 'string'
        || typeof address !== 'string' || !address.trim()
        || typeof document.x !== 'string' || !document.x.trim() || typeof document.y !== 'string' || !document.y.trim()) return [];
      const lat = Number(document.y);
      const lng = Number(document.x);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return [];
      return [{
        id: document.id, name: document.place_name, address, lat, lng,
        category: typeof document.category_name === 'string' ? document.category_name : '',
        phone: typeof document.phone === 'string' ? document.phone : '',
      }];
    });
    return NextResponse.json({ success: true, data: { places, page, hasMore: !body.meta.is_end && page < 45 } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: '장소 검색에 실패했습니다. 잠시 후 다시 시도해주세요.' }, { status: 502 });
  }
}
