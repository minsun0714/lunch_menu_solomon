import { NextRequest } from 'next/server';
import { handleRoute, ok } from '@/server/http';
import { parsePlaceSearchParams, searchPlaces } from '@/server/services/place-search-service';

export async function GET(request: NextRequest) {
  return handleRoute({ status: 502, error: '장소 검색에 실패했습니다. 잠시 후 다시 시도해주세요.' }, async () => {
    const { query, page } = parsePlaceSearchParams(request.nextUrl.searchParams);
    return ok(await searchPlaces(query, page), { headers: { 'Cache-Control': 'no-store' } });
  });
}
