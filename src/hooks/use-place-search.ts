'use client';

import { useEffect, useRef, useState } from 'react';
import { searchPlaces } from '@/services/place-api';
import { PlaceSearchResult } from '@/types/place';

export type PlaceSearchPurpose = 'office' | 'restaurant';

export function usePlaceSearch(value: string, purpose: PlaceSearchPurpose, onChange: (query: string) => void) {
  const isRestaurant = purpose === 'restaurant';
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const requestId = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);

  // Ignore callbacks from a previous query or an unmounted parent.
  useEffect(() => () => {
    requestId.current++;
    controller.current?.abort();
  }, []);

  function changeQuery(query: string) {
    requestId.current++;
    controller.current?.abort();
    setSearching(false);
    setResults([]);
    setMessage('');
    setError('');
    setPage(1);
    setHasMore(false);
    onChange(query);
  }

  async function search(nextPage = 1) {
    const currentRequest = ++requestId.current;
    controller.current?.abort();
    const abortController = new AbortController();
    controller.current = abortController;
    setError('');
    setMessage('');
    if (!value.trim()) {
      setSearching(false);
      setError('검색할 장소의 이름이나 키워드를 입력해주세요.');
      input.current?.focus();
      return;
    }
    setSearching(true);
    try {
      const data = await searchPlaces(value, nextPage, abortController.signal);
      if (requestId.current !== currentRequest) return;
      setResults(data.places);
      setPage(data.page);
      setHasMore(data.hasMore);
      setMessage(data.places.length
        ? `${isRestaurant ? '등록할 식당을' : '사무실로 사용할 장소를'} 선택해주세요. 검색 결과는 정확도순입니다.`
        : '검색 결과가 없습니다. 지역명과 장소명을 함께 입력해보세요.');
    } catch (error) {
      if (requestId.current === currentRequest) setError((error as Error).message);
    } finally {
      if (requestId.current === currentRequest) setSearching(false);
    }
  }

  return { isRestaurant, input, results, searching, message, error, page, hasMore, changeQuery, search };
}
