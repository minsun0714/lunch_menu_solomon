'use client';

import React from 'react';
import { Restaurant, RestaurantCategory } from '@/types/restaurant';
import StarRating from './StarRating';
import {
  MapPinIcon,
  PhoneIcon,
  EditIcon,
  TrashIcon,
  MessageSquareIcon,
  ClockIcon,
} from './Icons';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onViewDetails: (restaurant: Restaurant) => void;
  onEdit: (restaurant: Restaurant) => void;
  onDelete: (restaurant: Restaurant) => void;
}

const CATEGORY_COLORS: Record<
  RestaurantCategory,
  { bg: string; text: string; border: string; banner: string }
> = {
  한식: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    banner: 'from-orange-500 to-amber-600',
  },
  일식: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    banner: 'from-sky-500 to-indigo-600',
  },
  중식: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    banner: 'from-red-500 to-rose-600',
  },
  양식: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    banner: 'from-emerald-500 to-teal-600',
  },
  분식: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    banner: 'from-amber-500 to-yellow-600',
  },
  아시안: {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    banner: 'from-teal-500 to-cyan-600',
  },
  '카페/디저트': {
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-200',
    banner: 'from-pink-500 to-rose-500',
  },
  기타: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    banner: 'from-slate-500 to-zinc-600',
  },
};

export default function RestaurantCard({
  restaurant,
  onViewDetails,
  onEdit,
  onDelete,
}: RestaurantCardProps) {
  const categoryStyle =
    CATEGORY_COLORS[restaurant.category] || CATEGORY_COLORS['기타'];
  const latestReview = restaurant.reviews[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col group">
      {/* Top Banner / Image */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
        {restaurant.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.imageUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Hide image on error and fallback to gradient
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        ) : null}

        {/* Fallback decorative background if no image */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${categoryStyle.banner} opacity-90 -z-10 flex items-center justify-center p-4`}
        >
          <span className="text-white/80 font-bold text-2xl tracking-wider">
            {restaurant.category}
          </span>
        </div>

        {/* Category & Price Badge overlay */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md bg-white/95 ${categoryStyle.text} shadow-xs border ${categoryStyle.border}`}
          >
            {restaurant.category}
          </span>
          {restaurant.priceRange && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md bg-black/60 text-white shadow-xs">
              {restaurant.priceRange}
            </span>
          )}
        </div>

        {/* Quick Edit/Delete buttons on hover/overlay */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(restaurant);
            }}
            aria-label={`${restaurant.name} 수정`}
            className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-700 hover:text-orange-600 transition-colors shadow-xs backdrop-blur-xs cursor-pointer"
            title="식당 정보 수정"
          >
            <EditIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(restaurant);
            }}
            aria-label={`${restaurant.name} 삭제`}
            className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-700 hover:text-red-600 transition-colors shadow-xs backdrop-blur-xs cursor-pointer"
            title="식당 삭제"
          >
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Title & Rating */}
        <div className="mb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-lg text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
              {restaurant.name}
            </h3>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={restaurant.averageRating} size="sm" />
            <span className="text-sm font-bold text-slate-800">
              {restaurant.averageRating > 0
                ? restaurant.averageRating.toFixed(1)
                : '0.0'}
            </span>
            <span className="text-xs text-slate-400">
              ({restaurant.reviewCount}개 리뷰)
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-slate-600 text-sm line-clamp-2 mb-4 leading-relaxed">
          {restaurant.description}
        </p>

        {/* Meta details */}
        <div className="space-y-1.5 text-xs text-slate-500 mb-4 mt-auto">
          <div className="flex items-center gap-1.5">
            <MapPinIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{restaurant.address}</span>
          </div>
          {restaurant.phone && (
            <div className="flex items-center gap-1.5">
              <PhoneIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{restaurant.phone}</span>
            </div>
          )}
          {restaurant.openingHours && (
            <div className="flex items-center gap-1.5">
              <ClockIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{restaurant.openingHours}</span>
            </div>
          )}
        </div>

        {/* Latest review preview if available */}
        {latestReview ? (
          <div className="bg-slate-50 rounded-xl p-2.5 mb-4 border border-slate-100">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-xs font-semibold text-slate-700 truncate">
                {latestReview.author}
              </span>
              <span className="text-xs text-amber-500 font-bold shrink-0">
                ★ {latestReview.rating}
              </span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1 italic">
              &quot;{latestReview.content}&quot;
            </p>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-xl p-2.5 mb-4 border border-dashed border-slate-200 text-center">
            <span className="text-xs text-slate-400">
              아직 등록된 리뷰가 없습니다. 첫 리뷰를 남겨보세요!
            </span>
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={() => onViewDetails(restaurant)}
          className="w-full mt-auto py-2.5 px-4 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <MessageSquareIcon className="w-4 h-4" />
          <span>상세 정보 & 리뷰 ({restaurant.reviewCount})</span>
        </button>
      </div>
    </div>
  );
}
