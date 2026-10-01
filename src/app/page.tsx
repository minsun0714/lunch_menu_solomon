'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Restaurant,
  RestaurantCategory,
  CreateRestaurantInput,
  CreateReviewInput,
} from '@/types/restaurant';
import Navbar from '@/components/Navbar';
import RestaurantCard from '@/components/RestaurantCard';
import RestaurantModal from '@/components/RestaurantModal';
import RestaurantDetailModal from '@/components/RestaurantDetailModal';
import ConfirmModal from '@/components/ConfirmModal';
import RandomPickerModal from '@/components/RandomPickerModal';
import { SearchIcon, PlusIcon, SparklesIcon, UtensilsIcon } from '@/components/Icons';

const CATEGORIES: ('전체' | RestaurantCategory)[] = [
  '전체',
  '한식',
  '일식',
  '중식',
  '양식',
  '분식',
  '아시안',
  '카페/디저트',
  '기타',
];

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'전체' | RestaurantCategory>('전체');
  const [sortBy, setSortBy] = useState<'latest' | 'rating' | 'reviews' | 'name'>('rating');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [detailRestaurantId, setDetailRestaurantId] = useState<string | null>(null);
  const [deleteConfirmRestaurant, setDeleteConfirmRestaurant] = useState<Restaurant | null>(null);
  const [isRandomModalOpen, setIsRandomModalOpen] = useState(false);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Load restaurants
  const fetchRestaurants = useCallback(async () => {
    try {
      const res = await fetch('/api/restaurants');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRestaurants(data.data);
      }
    } catch (err) {
      console.error('Failed to load restaurants:', err);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await fetch('/api/restaurants');
        const data = await res.json();
        if (!ignore && data.success && Array.isArray(data.data)) {
          setRestaurants(data.data);
        }
      } catch (err) {
        console.error('Failed to load restaurants:', err);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  // Selected restaurant for detail view
  const detailRestaurant = useMemo(() => {
    if (!detailRestaurantId) return null;
    return restaurants.find((r) => r.id === detailRestaurantId) || null;
  }, [restaurants, detailRestaurantId]);

  // Filtered & Sorted Restaurants
  const filteredRestaurants = useMemo(() => {
    return restaurants
      .filter((r) => {
        const matchesCategory =
          selectedCategory === '전체' || r.category === selectedCategory;
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.address.toLowerCase().includes(q);
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          return b.averageRating - a.averageRating;
        }
        if (sortBy === 'reviews') {
          return b.reviewCount - a.reviewCount;
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name, 'ko');
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [restaurants, selectedCategory, searchQuery, sortBy]);

  // Stats calculation
  const totalReviewsCount = useMemo(() => {
    return restaurants.reduce((sum, r) => sum + r.reviewCount, 0);
  }, [restaurants]);

  const topRated = useMemo(() => {
    if (restaurants.length === 0) return null;
    return [...restaurants].sort((a, b) => b.averageRating - a.averageRating)[0];
  }, [restaurants]);

  // Handlers
  const handleCreateRestaurant = async (data: CreateRestaurantInput) => {
    const res = await fetch('/api/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!result.success) {
      throw new Error(result.error || '식당 등록 실패');
    }
    await fetchRestaurants();
    showToast('새 식당이 성공적으로 등록되었습니다!');
  };

  const handleUpdateRestaurant = async (data: CreateRestaurantInput) => {
    if (!editingRestaurant) return;
    const res = await fetch(`/api/restaurants/${editingRestaurant.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!result.success) {
      throw new Error(result.error || '식당 정보 수정 실패');
    }
    await fetchRestaurants();
    showToast('식당 정보가 수정되었습니다.');
  };

  const handleDeleteRestaurant = async () => {
    if (!deleteConfirmRestaurant) return;
    try {
      const res = await fetch(`/api/restaurants/${deleteConfirmRestaurant.id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || '식당 삭제 실패');
      }

      if (detailRestaurantId === deleteConfirmRestaurant.id) {
        setDetailRestaurantId(null);
      }
      setDeleteConfirmRestaurant(null);
      await fetchRestaurants();
      showToast('식당이 삭제되었습니다.');
    } catch (err) {
      console.error(err);
      alert('식당 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleAddReview = async (restaurantId: string, input: CreateReviewInput) => {
    const res = await fetch(`/api/restaurants/${restaurantId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const result = await res.json();
    if (!result.success) {
      throw new Error(result.error || '리뷰 등록 실패');
    }
    await fetchRestaurants();
    showToast('리뷰가 등록되었습니다!');
  };

  const handleDeleteReview = async (restaurantId: string, reviewId: string) => {
    const res = await fetch(`/api/restaurants/${restaurantId}/reviews/${reviewId}`, {
      method: 'DELETE',
    });
    const result = await res.json();
    if (!result.success) {
      throw new Error(result.error || '리뷰 삭제 실패');
    }
    await fetchRestaurants();
    showToast('리뷰가 삭제되었습니다.');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenRandomModal={() => setIsRandomModalOpen(true)}
        restaurantCount={restaurants.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Banner */}
        <section className="mb-8 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-3xl p-6 sm:p-10 text-white shadow-xl shadow-orange-500/15 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md mb-3 text-orange-50">
              <SparklesIcon className="w-3.5 h-3.5" />
              점심 고민 해결 솔로몬
            </span>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-3">
              오늘 점심, 어디서 뭘 먹을까요?
            </h1>
            <p className="text-sm sm:text-base text-orange-50 leading-relaxed font-medium">
              로그인 없이 누구나 자유롭게 새로운 식당을 등록하고 솔직한 별점과 리뷰를 남길 수 있습니다.
              동료들과 함께 나만의 점심 맛집 리스트를 만들어보세요!
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-orange-600 hover:bg-orange-50 transition-colors shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <PlusIcon className="w-4 h-4" />
                식당 등록하기
              </button>
              <button
                type="button"
                onClick={() => setIsRandomModalOpen(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-orange-600/60 hover:bg-orange-600/80 text-white backdrop-blur-md transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <SparklesIcon className="w-4 h-4" />
                랜덤 추천 뽑기
              </button>
            </div>
          </div>

          {/* Quick Stats Badges inside Hero */}
          <div className="mt-8 sm:mt-0 sm:absolute sm:right-10 sm:bottom-10 flex gap-4">
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 text-center min-w-[90px]">
              <div className="text-2xl font-black">{restaurants.length}</div>
              <div className="text-xs text-orange-100 font-semibold mt-0.5">등록된 식당</div>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 text-center min-w-[90px]">
              <div className="text-2xl font-black">{totalReviewsCount}</div>
              <div className="text-xs text-orange-100 font-semibold mt-0.5">누적 리뷰</div>
            </div>
            {topRated && (
              <div
                onClick={() => setDetailRestaurantId(topRated.id)}
                className="bg-white/15 backdrop-blur-md rounded-2xl p-4 text-center min-w-[100px] cursor-pointer hover:bg-white/25 transition-colors hidden md:block"
                title="최고 평점 식당 보기"
              >
                <div className="text-2xl font-black">★ {topRated.averageRating}</div>
                <div className="text-xs text-orange-100 font-semibold mt-0.5 truncate max-w-[100px]">
                  {topRated.name}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Search, Filter & Sort Section */}
        <section className="mb-6 space-y-4">
          {/* Search bar & Sort selector */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="식당 이름, 메뉴, 지역으로 검색..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  지우기
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs font-semibold text-slate-500">정렬:</span>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'latest' | 'rating' | 'reviews' | 'name')
                }
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-xs cursor-pointer"
              >
                <option value="rating">별점 높은 순 ★</option>
                <option value="reviews">리뷰 많은 순 💬</option>
                <option value="latest">최신 등록 순 🕒</option>
                <option value="name">식당 이름 순 가</option>
              </select>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count =
                cat === '전체'
                  ? restaurants.length
                  : restaurants.filter((r) => r.category === cat).length;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                    isSelected
                      ? 'bg-orange-500 text-white shadow-orange-500/20 shadow-md'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Restaurant Grid Section */}
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-semibold text-slate-500">
              맛있는 식당 목록을 불러오는 중...
            </p>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-4">
              <UtensilsIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              조건에 맞는 식당이 없습니다
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              검색어나 카테고리를 변경하거나, 새로운 맛집을 직접 등록해보세요!
            </p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/25 cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              새 식당 등록하기
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-slate-500">
                총 <span className="text-orange-600 font-bold">{filteredRestaurants.length}</span>곳의
                식당
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onViewDetails={(r) => setDetailRestaurantId(r.id)}
                  onEdit={(r) => setEditingRestaurant(r)}
                  onDelete={(r) => setDeleteConfirmRestaurant(r)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-400">
        <p className="font-semibold text-slate-600 mb-1">
          솔로몬의 점심 메뉴 (Lunch Menu Solomon)
        </p>
        <p>NextJS · TypeScript · TailwindCSS · 로그인 없이 자유로운 식당 CRUD 및 별점 리뷰</p>
      </footer>

      {/* Create / Edit Restaurant Modal */}
      <RestaurantModal
        isOpen={isCreateModalOpen || !!editingRestaurant}
        initialData={editingRestaurant}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingRestaurant(null);
        }}
        onSubmit={editingRestaurant ? handleUpdateRestaurant : handleCreateRestaurant}
      />

      {/* Restaurant Detail & Reviews Modal */}
      <RestaurantDetailModal
        restaurant={detailRestaurant}
        isOpen={!!detailRestaurant}
        onClose={() => setDetailRestaurantId(null)}
        onEditRestaurant={(r) => {
          setDetailRestaurantId(null);
          setEditingRestaurant(r);
        }}
        onDeleteRestaurant={(r) => {
          setDeleteConfirmRestaurant(r);
        }}
        onAddReview={handleAddReview}
        onDeleteReview={handleDeleteReview}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmRestaurant}
        title="식당 삭제 확인"
        message={`'${deleteConfirmRestaurant?.name}' 식당을 삭제하시겠습니까?\n등록된 모든 리뷰도 함께 삭제되며 되돌릴 수 없습니다.`}
        confirmText="삭제하기"
        cancelText="취소"
        isDangerous={true}
        onConfirm={handleDeleteRestaurant}
        onCancel={() => setDeleteConfirmRestaurant(null)}
      />

      {/* Lunch Menu Random Picker Modal */}
      <RandomPickerModal
        isOpen={isRandomModalOpen}
        onClose={() => setIsRandomModalOpen(false)}
        restaurants={filteredRestaurants.length > 0 ? filteredRestaurants : restaurants}
        onSelectRestaurant={(r) => {
          setDetailRestaurantId(r.id);
        }}
      />
    </div>
  );
}

