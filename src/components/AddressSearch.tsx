'use client';

import { useEffect, useRef, useState } from 'react';
import { PlaceSearchResult } from '@/types/place';

interface Props {
  id: string;
  value: string;
  selectedPlaceId?: string;
  onChange: (address: string) => void;
  onSelect: (place: PlaceSearchResult) => void;
  purpose?: 'office' | 'restaurant';
}

export default function AddressSearch({ id, value, selectedPlaceId, onChange, onSelect, purpose = 'office' }: Props) {
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

  // Ignore callbacks from a previous query or an unmounted settings page.
  useEffect(() => () => {
    requestId.current++;
    controller.current?.abort();
  }, []);

  function change(address: string) {
    requestId.current++;
    controller.current?.abort();
    setSearching(false);
    setResults([]);
    setMessage('');
    setError('');
    setPage(1);
    setHasMore(false);
    onChange(address);
  }

  async function search(nextPage = 1, query = value) {
    const currentRequest = ++requestId.current;
    controller.current?.abort();
    const abortController = new AbortController();
    controller.current = abortController;
    setError('');
    setMessage('');
    if (!query.trim()) {
      setSearching(false);
      setError('검색할 장소의 이름이나 키워드를 입력해주세요.');
      input.current?.focus();
      return;
    }
    setSearching(true);
    try {
      const params = new URLSearchParams({ query: query.trim(), page: String(nextPage) });
      const response = await fetch(`/api/places?${params}`, { signal: abortController.signal, cache: 'no-store' });
      const body = await response.json();
      if (requestId.current !== currentRequest) return;
      if (!response.ok || !body.success) throw new Error(body.error || '장소 검색에 실패했습니다.');
      setResults(body.data.places);
      setPage(body.data.page);
      setHasMore(body.data.hasMore);
      setMessage(body.data.places.length
        ? `${isRestaurant ? '등록할 식당을' : '사무실로 사용할 장소를'} 선택해주세요. 검색 결과는 정확도순입니다.`
        : '검색 결과가 없습니다. 지역명과 장소명을 함께 입력해보세요.');
    } catch (error) {
      if (requestId.current === currentRequest) setError((error as Error).message);
    } finally {
      if (requestId.current === currentRequest) setSearching(false);
    }
  }

  return (
    <div className="mt-2">
      <div className="flex gap-2">
        <input ref={input} id={id} maxLength={200} value={value} onChange={(event) => change(event.target.value)} onKeyDown={(event) => {
          if (event.key !== 'Enter') return;
          event.preventDefault();
          event.stopPropagation();
        }} aria-describedby={`${id}-search-status`} placeholder={isRestaurant ? '지역과 식당 이름을 입력하세요' : '예: 판교 카카오, 유정식당'} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-orange-500" />
        <button type="button" disabled={searching} onClick={() => void search()} className="shrink-0 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">{searching ? '검색 중…' : '장소 검색'}</button>
      </div>
      <section aria-label={isRestaurant ? '식당 후보' : '사무실 주소 후보'} aria-busy={searching} className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <h2 className="text-sm font-semibold text-slate-700">{isRestaurant ? '식당 후보' : '주소 후보'}</h2>
      <p id={`${id}-search-status`} role="status" className="mt-2 text-xs leading-5 text-slate-500">{searching ? '키워드로 장소를 검색하고 있습니다…' : message || (isRestaurant ? '식당 이름을 입력하고 장소 검색 버튼을 눌러주세요.' : '장소명이나 건물명을 입력하고 장소 검색 버튼을 눌러주세요.')}</p>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      {results.length > 0 && <ul aria-label="장소 검색 결과" className="mt-3 max-h-80 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 bg-white">
        {results.map((result) => <li key={result.id}>
          <label className={`flex cursor-pointer items-start gap-3 p-4 hover:bg-orange-50 ${selectedPlaceId === result.id ? 'bg-orange-50' : ''}`}>
            <input type="radio" name={`${id}-selection`} value={result.id} checked={selectedPlaceId === result.id} disabled={searching} onChange={() => onSelect(result)} onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault(); }} className="mt-1 h-4 w-4 shrink-0 accent-orange-600" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-800"><span>{result.name}</span>{selectedPlaceId === result.id && <span className="shrink-0 text-xs text-orange-700">선택됨</span>}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{result.address}</span>
              {result.category && <span className="mt-1 block text-xs text-slate-400">{result.category}</span>}
            </span>
          </label>
        </li>)}
      </ul>}
      {(results.length > 0 || page > 1) && <nav aria-label={isRestaurant ? '식당 후보 페이지' : '주소 후보 페이지'} className="mt-3 flex items-center justify-center gap-4 text-sm">
        <button type="button" disabled={searching || page <= 1} onClick={() => void search(page - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">이전</button>
        <span className="text-slate-500">{page}페이지</span>
        <button type="button" disabled={searching || !hasMore} onClick={() => void search(page + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">다음</button>
      </nav>}
      </section>
    </div>
  );
}
