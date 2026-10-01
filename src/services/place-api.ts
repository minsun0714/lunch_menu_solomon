import { PlaceSearchResult } from '@/types/place';
import { apiRequest } from './api-client';

export interface PlaceSearchPage {
  places: PlaceSearchResult[];
  page: number;
  hasMore: boolean;
}

export function searchPlaces(query: string, page: number, signal?: AbortSignal): Promise<PlaceSearchPage> {
  const params = new URLSearchParams({ query: query.trim(), page: String(page) });
  return apiRequest<PlaceSearchPage>(`/api/places?${params}`, { signal, noStore: true, fallbackError: '장소 검색에 실패했습니다.' });
}
