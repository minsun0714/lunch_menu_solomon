'use client';

import React, { useState } from 'react';
import { Restaurant, CreateReviewInput } from '@/types/restaurant';
import StarRating from './StarRating';
import {
  CloseIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  UserIcon,
  TrashIcon,
  EditIcon,
  MessageSquareIcon,
} from './Icons';

interface RestaurantDetailModalProps {
  restaurant: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
  onEditRestaurant: (restaurant: Restaurant) => void;
  onDeleteRestaurant: (restaurant: Restaurant) => void;
  onAddReview: (restaurantId: string, input: CreateReviewInput) => Promise<void>;
  onDeleteReview: (restaurantId: string, reviewId: string) => Promise<void>;
}

export default function RestaurantDetailModal({
  restaurant,
  isOpen,
  onClose,
  onEditRestaurant,
  onDeleteRestaurant,
  onAddReview,
  onDeleteReview,
}: RestaurantDetailModalProps) {
  // Review form state
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  if (!isOpen || !restaurant) return null;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim()) {
      setFormError('작성자 이름을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      setFormError('리뷰 내용을 입력해주세요.');
      return;
    }

    setFormError('');
    setIsSubmittingReview(true);
    try {
      await onAddReview(restaurant.id, {
        author: author.trim(),
        rating,
        content: content.trim(),
      });
      // Reset form
      setAuthor('');
      setRating(5);
      setContent('');
    } catch (err) {
      console.error(err);
      setFormError('리뷰 등록 중 문제가 발생했습니다.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleReviewDelete = async (reviewId: string) => {
    if (!confirm('이 리뷰를 삭제하시겠습니까?')) return;
    setDeletingReviewId(reviewId);
    try {
      await onDeleteReview(restaurant.id, reviewId);
    } catch (err) {
      console.error(err);
      alert('리뷰 삭제에 실패했습니다.');
    } finally {
      setDeletingReviewId(null);
    }
  };

  // Format date helper
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return `${date.getFullYear()}. ${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}. ${date.getDate().toString().padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="relative border-b border-slate-100 bg-slate-50/60 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
              {restaurant.category}
            </span>
            {restaurant.priceRange && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200/70 text-slate-700">
                {restaurant.priceRange}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onEditRestaurant(restaurant);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <EditIcon className="w-3.5 h-3.5" />
              <span>식당 수정</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onDeleteRestaurant(restaurant);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 bg-white hover:bg-red-50 border border-red-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              <span>식당 삭제</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer ml-1"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {/* Restaurant Details Section */}
          <div className="p-6">
            <h1 className="text-2xl font-black text-slate-900 mb-2">
              {restaurant.name}
            </h1>

            {/* Rating Summary Banner */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/70 rounded-2xl p-4 flex items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-black text-amber-500">
                  {restaurant.averageRating > 0
                    ? restaurant.averageRating.toFixed(1)
                    : '0.0'}
                </div>
                <div>
                  <StarRating rating={restaurant.averageRating} size="md" />
                  <p className="text-xs text-slate-500 mt-0.5">
                    총 <strong className="text-slate-800">{restaurant.reviewCount}개</strong>의
                    솔직한 리뷰
                  </p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-xs px-2.5 py-1 rounded-lg bg-white/80 font-semibold text-amber-800 border border-amber-200 shadow-2xs">
                  로그인 없이 누구나 작성 가능
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                대표 메뉴 및 설명
              </h3>
              <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-line bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                {restaurant.description}
              </p>
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                <MapPinIcon className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="truncate">{restaurant.address}</span>
              </div>

              {restaurant.phone && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <PhoneIcon className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>{restaurant.phone}</span>
                </div>
              )}

              {restaurant.openingHours && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 sm:col-span-2">
                  <ClockIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{restaurant.openingHours}</span>
                </div>
              )}
            </div>
          </div>

          {/* Review Write Form Section */}
          <div className="p-6 bg-slate-50/40">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <MessageSquareIcon className="w-4 h-4 text-orange-500" />
                <span>리뷰 & 별점 작성</span>
              </h3>
              <span className="text-xs text-slate-500">
                로그인 불필요 · 자유롭게 작성
              </span>
            </div>

            <form
              onSubmit={handleReviewSubmit}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4"
            >
              {formError && (
                <div className="p-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Author Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    작성자 이름 <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="예: 점심미식가, 김대리"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                </div>

                {/* Rating selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    별점 선택 · 0.5점 단위 <span className="text-orange-500">*</span>
                  </label>
                  <div className="py-1">
                    <StarRating
                      rating={rating}
                      interactive={true}
                      onChange={(r) => setRating(r)}
                      size="lg"
                      showLabel={true}
                    />
                  </div>
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  리뷰 내용 <span className="text-orange-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="음식의 맛, 분위기, 가성비, 웨이팅 팁 등을 자유롭게 공유해주세요!"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingReview ? '등록 중...' : '리뷰 등록하기'}
                </button>
              </div>
            </form>
          </div>

          {/* Reviews List Section */}
          <div className="p-6">
            <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center justify-between">
              <span>전체 리뷰 목록 ({restaurant.reviews.length})</span>
            </h3>

            {restaurant.reviews.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500 text-sm font-medium">
                  아직 등록된 리뷰가 없습니다.
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  위 양식에서 첫 번째 리뷰를 남겨보세요!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {restaurant.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 transition-all shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                          <UserIcon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-slate-800">
                            {rev.author}
                          </span>
                          <span className="text-slate-400 text-xs ml-2">
                            {formatDate(rev.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <StarRating rating={rev.rating} size="sm" showNumber />
                        <button
                          type="button"
                          onClick={() => handleReviewDelete(rev.id)}
                          disabled={deletingReviewId === rev.id}
                          className="text-slate-300 hover:text-red-500 p-1 transition-colors cursor-pointer"
                          title="리뷰 삭제"
                          aria-label={`${rev.author}의 리뷰 삭제`}
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line pl-9">
                      {rev.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
