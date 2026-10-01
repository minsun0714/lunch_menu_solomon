'use client';

import { Restaurant } from '@/types/restaurant';
import { SelectedPlace } from '@/types/place';
import { kakaoSearchUrl } from '@/lib/kakao-maps';
import RestaurantMap from './RestaurantMap';

interface Props {
  restaurants: Restaurant[];
  officeAddress: string;
  officePlace?: SelectedPlace;
  onViewDetails: (restaurant: Restaurant) => void;
  onEdit: (restaurant: Restaurant) => void;
  onDelete: (restaurant: Restaurant) => void;
}

export default function RestaurantExplorer({ restaurants, officeAddress, officePlace, onViewDetails, onEdit, onDelete }: Props) {
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
      <div className="order-2 space-y-3 lg:order-1">
        <p className="text-xs font-semibold text-slate-500">함께 모은 맛집 <span className="text-orange-700">{restaurants.length}곳</span></p>
        {restaurants.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm leading-6 text-slate-500">조건에 맞는 식당이 없습니다.<br />검색어나 카테고리를 변경해보세요.</div>}
        {restaurants.map((restaurant, index) => <article key={restaurant.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-colors hover:border-orange-300">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-sm font-bold text-orange-700">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-500"><span>{restaurant.category}</span><span>·</span><span>{restaurant.priceRange || '가격 정보 없음'}</span></div>
              <button type="button" onClick={() => onViewDetails(restaurant)} className="text-left text-lg font-bold text-slate-900 hover:text-orange-700">{restaurant.name}</button>
              <p className="mt-1 text-xs"><span className="font-bold text-amber-600">★ {restaurant.averageRating.toFixed(1)}</span><span className="ml-2 text-slate-500">팀 리뷰 {restaurant.reviewCount}개</span></p>
            </div>
          </div>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{restaurant.description}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{restaurant.address}</p>
          {restaurant.reviews[0] && <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5"><span className="font-semibold text-slate-700">{restaurant.reviews[0].author}</span><p className="mt-1 line-clamp-2 text-slate-500">{restaurant.reviews[0].content}</p></div>}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-slate-100 pt-3 text-xs font-semibold">
            <button type="button" onClick={() => onViewDetails(restaurant)} className="text-orange-700 hover:underline">팀 리뷰 보기</button>
            <a href={kakaoSearchUrl(restaurant.name, restaurant.address)} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:underline">카카오맵에서 보기 ↗</a>
            <div className="ml-auto flex gap-3"><button type="button" aria-label={`${restaurant.name} 수정`} onClick={() => onEdit(restaurant)} className="text-slate-500 hover:text-orange-700">수정</button><button type="button" aria-label={`${restaurant.name} 삭제`} onClick={() => onDelete(restaurant)} className="text-slate-400 hover:text-red-600">삭제</button></div>
          </div>
        </article>)}
      </div>
      <div className="order-1 lg:sticky lg:top-20 lg:order-2"><RestaurantMap restaurants={restaurants} officeAddress={officeAddress} officePlace={officePlace} onSelect={onViewDetails} /></div>
    </div>
  );
}
