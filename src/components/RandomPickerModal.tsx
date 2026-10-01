'use client';

import React, { useState } from 'react';
import { Restaurant } from '@/types/restaurant';
import { SparklesIcon, CloseIcon, MapPinIcon } from './Icons';
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

function RandomPickerModalContent({
  onClose,
  restaurants,
  onSelectRestaurant,
}: RandomPickerModalProps) {
  const [selected, setSelected] = useState<Restaurant | null>(() => {
    if (restaurants.length === 0) return null;
    return restaurants[Math.floor(Math.random() * restaurants.length)];
  });
  const [isSpinning, setIsSpinning] = useState(false);

  const spin = () => {
    if (restaurants.length === 0) return;
    setIsSpinning(true);

    let counter = 0;
    const totalFlips = 16;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * restaurants.length);
      setSelected(restaurants[randomIndex]);
      counter++;

      if (counter >= totalFlips) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 90);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <CloseIcon className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 mb-2">
            <SparklesIcon className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-xl font-black text-slate-900">오늘의 점심 메뉴 추천!</h3>
          <p className="text-xs text-slate-500 mt-1">
            솔로몬의 지혜로 오늘 갈 점심 식당을 골라드립니다
          </p>
        </div>

        {/* Picked Restaurant Card */}
        {restaurants.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            등록된 식당이 없습니다. 식당을 먼저 등록해주세요!
          </div>
        ) : selected ? (
          <div
            className={`p-5 rounded-2xl border transition-all duration-200 ${
              isSpinning
                ? 'bg-orange-50/50 border-orange-200 scale-95 opacity-80'
                : 'bg-white border-orange-200 shadow-md ring-2 ring-orange-500/20'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                {selected.category}
              </span>
              {selected.priceRange && (
                <span className="text-xs text-slate-500">{selected.priceRange}</span>
              )}
            </div>

            <h4 className="text-xl font-bold text-slate-900 mb-1">
              {selected.name}
            </h4>

            <div className="flex items-center gap-2 mb-3">
              <StarRating rating={selected.averageRating} size="sm" />
              <span className="text-xs font-bold text-slate-700">
                {selected.averageRating > 0 ? selected.averageRating.toFixed(1) : '0.0'}
              </span>
              <span className="text-xs text-slate-400">
                ({selected.reviewCount}개 리뷰)
              </span>
            </div>

            <p className="text-xs text-slate-600 line-clamp-2 mb-3 bg-slate-50 p-2.5 rounded-xl">
              {selected.description}
            </p>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPinIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{selected.address}</span>
            </div>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={spin}
            disabled={isSpinning || restaurants.length <= 1}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSpinning ? '고르는 중...' : '다시 추천받기'}
          </button>

          {selected && !isSpinning && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectRestaurant(selected);
              }}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 transition-all shadow-md shadow-orange-500/20 cursor-pointer"
            >
              식당 상세 보기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
