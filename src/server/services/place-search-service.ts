import { ApiError } from '@/server/errors';
import { PlaceSearchResult } from '@/types/place';

const MAX_PAGE = 45;
const PAGE_SIZE = 15;

export interface PlaceSearchPage {
  places: PlaceSearchResult[];
  page: number;
  hasMore: boolean;
}

export function parsePlaceSearchParams(params: URLSearchParams): { query: string; page: number } {
  const query = params.get('query')?.trim() || '';
  const page = Number(params.get('page') || '1');
  if (!query || query.length > 200 || !Number.isInteger(page) || page < 1 || page > MAX_PAGE) {
    throw new ApiError(400, '검색어와 페이지 번호를 확인해주세요.');
  }
  return { query, page };
}

function toPlace(document: Record<string, unknown>): PlaceSearchResult[] {
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
}

export async function searchPlaces(query: string, page: number): Promise<PlaceSearchPage> {
  const key = process.env.KAKAO_REST_API_KEY?.trim();
  if (!key) throw new ApiError(503, '장소 검색이 아직 연결되지 않았습니다.');
  const url = new URL('https://dapi.kakao.com/v2/local/search/keyword.json');
  url.search = new URLSearchParams({ query, page: String(page), size: String(PAGE_SIZE), sort: 'accuracy' }).toString();
  try {
    const response = await fetch(url, {
      method: 'GET', headers: { Authorization: `KakaoAK ${key}` },
      cache: 'no-store', signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      throw response.status === 429
        ? new ApiError(429, '검색 요청이 많습니다. 잠시 후 다시 시도해주세요.')
        : new ApiError(502, '카카오 장소 검색에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
    const body = await response.json();
    if (!Array.isArray(body.documents) || typeof body.meta?.is_end !== 'boolean') throw new Error('Invalid search response');
    return {
      places: body.documents.flatMap(toPlace),
      page,
      hasMore: !body.meta.is_end && page < MAX_PAGE,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, '장소 검색에 실패했습니다. 잠시 후 다시 시도해주세요.');
  }
}
