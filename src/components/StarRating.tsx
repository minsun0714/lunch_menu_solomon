'use client';

import React, { useState } from 'react';
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

  const activeRating = hoverRating !== null ? hoverRating : rating;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <div className="flex items-center">
        {Array.from({ length: maxRating }, (_, i) => {
          const starValue = i + 1;
          const isFilled = starValue <= activeRating;

          if (interactive) {
            return (
              <button
                type="button"
                key={starValue}
                onClick={() => onChange?.(starValue)}
                onMouseEnter={() => setHoverRating(starValue)}
                onMouseLeave={() => setHoverRating(null)}
                className="p-1 focus:outline-none focus:scale-110 transition-transform duration-100 text-amber-400 hover:text-amber-500 cursor-pointer"
                title={`${starValue}점 선택`}
                aria-label={`${starValue}점`}
              >
                <StarIcon
                  filled={isFilled}
                  className={`${sizeClasses[size]} ${
                    isFilled ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                  }`}
                />
              </button>
            );
          }

          return (
            <span key={starValue} className="p-0.5">
              <StarIcon
                filled={isFilled}
                className={`${sizeClasses[size]} ${
                  isFilled ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                }`}
              />
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
