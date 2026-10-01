'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Restaurant,
  RestaurantCategory,
  CreateRestaurantInput,
  CreateReviewInput,
} from '@/types/restaurant';
import Navbar from '@/components/Navbar';
import RestaurantExplorer from '@/components/RestaurantExplorer';
import { DEFAULT_TEAM_SETTINGS, TeamSettings } from '@/types/team-settings';
import RestaurantModal from '@/components/RestaurantModal';
import RestaurantDetailModal from '@/components/RestaurantDetailModal';
import ConfirmModal from '@/components/ConfirmModal';
import RandomPickerModal from '@/components/RandomPickerModal';
import { SearchIcon } from '@/components/Icons';

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
  const [teamSettings, setTeamSettings] = useState<TeamSettings>(DEFAULT_TEAM_SETTINGS);
  const [loadError, setLoadError] = useState('');
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
    async function loadSettings() {
      try {
        const response = await fetch('/api/settings', { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error('설정을 불러오지 못했습니다.');
        if (!ignore) setTeamSettings(result.data);
      } catch {
        if (!ignore) setLoadError('팀 설정을 불러오지 못했습니다. 새로고침 후 다시 확인해주세요.');
      }
    }
    void loadSettings();
    async function init() {
      try {
        const res = await fetch('/api/restaurants');
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error('식당 목록을 불러오지 못했습니다.');
        if (!ignore && data.success && Array.isArray(data.data)) {
          setRestaurants(data.data);
        }
      } catch (err) {
        console.error('Failed to load restaurants:', err);
        if (!ignore) setLoadError('식당 목록을 불러오지 못했습니다. 새로고침 후 다시 확인해주세요.');
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
        teamName={teamSettings.teamName}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold tracking-widest text-orange-700">함께 모으고, 함께 먹어요</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">오늘 점심도, 우리 팀 맛집에서</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">동료들이 남긴 추천과 리뷰를 보고, 지도에서 오늘 갈 곳을 골라보세요.</p>
          </div>
          <p className="text-xs text-slate-500">함께 모은 식당 <strong className="text-slate-800">{restaurants.length}곳</strong> · 팀 리뷰 <strong className="text-slate-800">{totalReviewsCount}개</strong></p>
        </section>
        {loadError && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{loadError}</p>}

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

        {isLoading ? (
          <p role="status" className="py-20 text-center text-sm text-slate-500">팀 맛집 목록을 불러오는 중입니다…</p>
        ) : (
          <RestaurantExplorer
            restaurants={filteredRestaurants}
            officeAddress={teamSettings.officeAddress}
            officePlace={teamSettings.officePlace}
            onViewDetails={(restaurant) => setDetailRestaurantId(restaurant.id)}
            onEdit={(restaurant) => setEditingRestaurant(restaurant)}
            onDelete={(restaurant) => setDeleteConfirmRestaurant(restaurant)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-400">
        <p className="font-semibold text-slate-600 mb-1">
          솔로몬의 점심 메뉴 (Lunch Menu Solomon)
        </p>
        <p>동료들의 한 끼가 쌓여, 우리 팀의 맛집 지도가 됩니다.</p>
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

