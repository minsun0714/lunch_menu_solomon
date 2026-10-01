'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { usePlaceSearch, PlaceSearchPurpose } from '@/hooks/use-place-search';
import { cn } from '@/lib/utils';
import { PlaceSearchResult } from '@/types/place';

interface Props {
  id: string;
  value: string;
  selectedPlaceId?: string;
  onChange: (address: string) => void;
  onSelect: (place: PlaceSearchResult) => void;
  purpose?: PlaceSearchPurpose;
}

export default function AddressSearch({ id, value, selectedPlaceId, onChange, onSelect, purpose = 'office' }: Props) {
  const { isRestaurant, input, results, searching, message, error, page, hasMore, changeQuery, search } = usePlaceSearch(value, purpose, onChange);

  return (
    <div className="mt-2">
      <div className="flex gap-2">
        <Input
          ref={input}
          id={id}
          maxLength={200}
          value={value}
          onChange={(event) => changeQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            event.stopPropagation();
          }}
          aria-describedby={`${id}-search-status`}
          placeholder={isRestaurant ? '지역과 식당 이름을 입력하세요' : '예: 판교 카카오, 유정식당'}
          className="h-11 min-w-0 flex-1"
        />
        <Button type="button" variant="secondary" disabled={searching} onClick={() => void search()} className="h-11 shrink-0 bg-slate-900 text-white hover:bg-slate-700">
          {searching ? '검색 중…' : '장소 검색'}
        </Button>
      </div>
      <section aria-label={isRestaurant ? '식당 후보' : '사무실 주소 후보'} aria-busy={searching} className="mt-3 rounded-xl border bg-muted/50 p-3">
        <h2 className="text-sm font-semibold text-slate-700">{isRestaurant ? '식당 후보' : '주소 후보'}</h2>
        <p id={`${id}-search-status`} role="status" className="mt-2 text-xs leading-5 text-muted-foreground">
          {searching ? '키워드로 장소를 검색하고 있습니다…' : message || (isRestaurant ? '식당 이름을 입력하고 장소 검색 버튼을 눌러주세요.' : '장소명이나 건물명을 입력하고 장소 검색 버튼을 눌러주세요.')}
        </p>
        {error && (
          <Alert variant="destructive" className="mt-2 border-0 bg-transparent p-0">
            <AlertDescription className="text-sm text-red-700">{error}</AlertDescription>
          </Alert>
        )}
        {results.length > 0 && (
          <RadioGroup
            aria-label="장소 검색 결과"
            value={selectedPlaceId ?? ''}
            disabled={searching}
            onValueChange={(placeId) => {
              const result = results.find((item) => item.id === placeId);
              if (result) onSelect(result);
            }}
            className="mt-3 max-h-80 gap-0 divide-y divide-slate-100 overflow-y-auto rounded-xl border bg-card"
          >
            {results.map((result) => (
              <Label
                key={result.id}
                htmlFor={`${id}-${result.id}`}
                className={cn('flex cursor-pointer items-start gap-3 p-4 font-normal hover:bg-orange-50', selectedPlaceId === result.id && 'bg-orange-50')}
              >
                <RadioGroupItem id={`${id}-${result.id}`} value={result.id} className="mt-1" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-800">
                    <span>{result.name}</span>
                    {selectedPlaceId === result.id && <span className="shrink-0 text-xs text-orange-700">선택됨</span>}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">{result.address}</span>
                  {result.category && <span className="mt-1 block text-xs text-slate-400">{result.category}</span>}
                </span>
              </Label>
            ))}
          </RadioGroup>
        )}
        {(results.length > 0 || page > 1) && (
          <nav aria-label={isRestaurant ? '식당 후보 페이지' : '주소 후보 페이지'} className="mt-3 flex items-center justify-center gap-4 text-sm">
            <Button type="button" variant="outline" size="sm" disabled={searching || page <= 1} onClick={() => void search(page - 1)}>이전</Button>
            <span className="text-muted-foreground">{page}페이지</span>
            <Button type="button" variant="outline" size="sm" disabled={searching || !hasMore} onClick={() => void search(page + 1)}>다음</Button>
          </nav>
        )}
      </section>
    </div>
  );
}
