'use client';

import React, { useId, useState } from 'react';
import { StarIcon } from './Icons';

interface StarRatingProps {
  rating: number; // 0 to 5
  maxRating?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  showLabel?: boolean;
}

const RATING_LABELS: Record<number, string> = {
  1: '1점 - 별로예요',
  2: '2점 - 아쉬워요',
  3: '3점 - 보통이에요',
  4: '4점 - 맛있어요!',
  5: '5점 - 최고예요!',
};

export default function StarRating({
  rating,
  maxRating = 5,
  interactive = false,
  onChange,
  size = 'md',
  showNumber = false,
  showLabel = false,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const groupName = useId();

  const activeRating = hoverRating !== null ? hoverRating : rating;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <div className="flex items-center" role={interactive ? 'radiogroup' : 'img'} aria-label={interactive ? '별점 선택 (0.5점 단위)' : `${rating.toFixed(1)}점 / ${maxRating}점`}>
        {Array.from({ length: maxRating }, (_, i) => {
          const starValue = i + 1;
          const fill = Math.max(0, Math.min(1, activeRating - i)) * 100;

          return (
            <span key={starValue} className={`relative inline-flex ${interactive ? 'p-1' : 'p-0.5'}`}>
              <span className="relative inline-flex" aria-hidden="true">
                <StarIcon filled className={`${sizeClasses[size]} text-slate-200 fill-slate-200`} />
                <span className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - fill}% 0 0)` }}>
                  <StarIcon filled className={`${sizeClasses[size]} text-amber-400 fill-amber-400`} />
                </span>
              </span>
              {interactive && [starValue - 0.5, starValue].map((value, half) => (
                <input key={value} type="radio" name={groupName} value={value}
                  aria-label={`${value}점`} title={`${value}점 선택`} checked={rating === value}
                  onChange={() => onChange?.(value)}
                  onMouseEnter={() => setHoverRating(value)} onMouseLeave={() => setHoverRating(null)}
                  onFocus={() => setHoverRating(value)} onBlur={() => setHoverRating(null)}
                  className={`absolute top-0 h-full w-1/2 appearance-none cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-orange-600 ${half === 0 ? 'left-0' : 'right-0'}`} />
              ))}
            </span>
          );
        })}
      </div>

      {showNumber && (
        <span className="font-semibold text-slate-700 text-sm ml-0.5">
          {rating > 0 ? rating.toFixed(1) : '평가 없음'}
        </span>
      )}

      {showLabel && activeRating > 0 && (
        <span className="text-sm font-medium text-amber-600 ml-1">
          {RATING_LABELS[activeRating] || `${activeRating}점`}
        </span>
      )}
    </div>
  );
}
