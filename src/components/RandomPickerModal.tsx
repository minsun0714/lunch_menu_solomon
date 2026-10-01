'use client';

import { MapPinIcon, SparklesIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRandomPicker } from '@/hooks/use-random-picker';
import { cn } from '@/lib/utils';
import { Restaurant } from '@/types/restaurant';
import StarRating from './StarRating';

interface RandomPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurants: Restaurant[];
  onSelectRestaurant: (restaurant: Restaurant) => void;
}

export default function RandomPickerModal(props: RandomPickerModalProps) {
  if (!props.isOpen) return null;
  return <RandomPickerModalContent {...props} />;
}

function RandomPickerModalContent({ onClose, restaurants, onSelectRestaurant }: RandomPickerModalProps) {
  const { selected, isSpinning, spin } = useRandomPicker(restaurants);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="rounded-3xl p-6 sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="mb-2 inline-flex size-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
            <SparklesIcon className="size-6 animate-pulse" />
          </div>
          <DialogTitle className="text-xl font-black text-slate-900">오늘의 점심 메뉴 추천!</DialogTitle>
          <DialogDescription className="text-xs">솔로몬의 지혜로 오늘 갈 점심 식당을 골라드립니다</DialogDescription>
        </DialogHeader>

        {restaurants.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">등록된 식당이 없습니다. 식당을 먼저 등록해주세요!</div>
        ) : selected ? (
          <div className={cn('rounded-2xl border p-5 transition-all duration-200', isSpinning ? 'scale-95 border-orange-200 bg-orange-50/50 opacity-80' : 'border-orange-200 bg-card shadow-md ring-2 ring-orange-500/20')}>
            <div className="mb-2 flex items-center gap-2">
              <Badge className="bg-orange-100 font-bold text-orange-800">{selected.category}</Badge>
              {selected.priceRange && <span className="text-xs text-muted-foreground">{selected.priceRange}</span>}
            </div>
            <h4 className="mb-1 text-xl font-bold text-slate-900">{selected.name}</h4>
            <div className="mb-3 flex items-center gap-2">
              <StarRating rating={selected.averageRating} size="sm" />
              <span className="text-xs font-bold text-slate-700">{selected.averageRating > 0 ? selected.averageRating.toFixed(1) : '0.0'}</span>
              <span className="text-xs text-slate-400">({selected.reviewCount}개 리뷰)</span>
            </div>
            <p className="mb-3 line-clamp-2 rounded-xl bg-muted/60 p-2.5 text-xs text-slate-600">{selected.description}</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPinIcon className="size-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{selected.address}</span>
            </div>
          </div>
        ) : null}

        <div className="mt-2 flex items-center gap-3">
          <Button type="button" variant="secondary" onClick={spin} disabled={isSpinning || restaurants.length <= 1} className="h-11 flex-1 font-bold">
            {isSpinning ? '고르는 중...' : '다시 추천받기'}
          </Button>
          {selected && !isSpinning && (
            <Button
              type="button"
              onClick={() => {
                onClose();
                onSelectRestaurant(selected);
              }}
              className="h-11 flex-1 bg-gradient-to-r from-orange-500 to-amber-500 font-bold text-white shadow-md shadow-orange-500/20 hover:from-orange-600 hover:to-amber-600"
            >
              식당 상세 보기
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
