'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRestaurantMap } from '@/hooks/use-restaurant-map';
import { SelectedPlace } from '@/types/place';
import { Restaurant } from '@/types/restaurant';

interface Props {
  restaurants: Restaurant[];
  officeAddress: string;
  officePlace?: SelectedPlace;
  onSelect: (restaurant: Restaurant) => void;
}

export default function RestaurantMap({ restaurants, officeAddress, officePlace, onSelect }: Props) {
  const { container, status, failed, officeReady, hasApiKey, focusOffice, showAll, retry } = useRestaurantMap({ restaurants, officeAddress, officePlace, onSelect });

  return (
    <section aria-label="팀 맛집 지도">
      <Card className="gap-0 overflow-hidden py-0 shadow-xs">
        <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
          <div>
            <h2 className="text-sm font-bold">우리 팀 맛집 지도</h2>
            <p className="mt-1 text-xs text-muted-foreground">{officeAddress || '사무실을 설정하면 식당 위치와 함께 볼 수 있어요.'}</p>
          </div>
          <Button asChild variant="link" className="h-auto shrink-0 p-0 text-xs text-orange-700">
            <Link href="/settings">사무실 설정</Link>
          </Button>
        </div>
        <div className="relative">
          <div ref={container} className="h-[340px] bg-muted lg:h-[540px]" />
          {officeReady && !failed && (
            <div className="absolute right-3 top-3 z-10 flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={focusOffice} className="border-blue-200 text-xs font-bold text-blue-700 hover:text-blue-700">사무실로 이동</Button>
              <Button type="button" variant="outline" size="sm" onClick={showAll} className="text-xs text-slate-600">전체 보기</Button>
            </div>
          )}
          {(!hasApiKey || failed) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted px-8 text-center">
              <div className="max-w-xs">
                <p className="font-semibold text-slate-700">지도를 사용할 수 없습니다</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">목록의 ‘카카오맵에서 보기’로 식당 위치를 확인할 수 있어요.</p>
                {failed && <Button type="button" variant="outline" onClick={retry} className="mt-4">다시 시도</Button>}
              </div>
            </div>
          )}
        </div>
        <p role="status" className="border-t px-5 py-3 text-xs leading-5 text-muted-foreground">
          {hasApiKey ? status : '지도 연결을 준비 중입니다. 식당 목록과 리뷰는 이용할 수 있어요.'}
        </p>
      </Card>
    </section>
  );
}
