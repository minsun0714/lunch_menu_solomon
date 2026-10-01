'use client';

import { SearchIcon } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import Navbar from '@/components/Navbar';
import RandomPickerModal from '@/components/RandomPickerModal';
import RestaurantDetailModal from '@/components/RestaurantDetailModal';
import RestaurantExplorer from '@/components/RestaurantExplorer';
import RestaurantModal from '@/components/RestaurantModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHomePage } from '@/hooks/use-home-page';
import { CATEGORY_FILTERS, SORT_OPTIONS } from '@/hooks/use-restaurant-filters';
import { RestaurantSort } from '@/lib/restaurant-list';
import { cn } from '@/lib/utils';

export default function Home() {
  const page = useHomePage();
  const { filters } = page;

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <Navbar onOpenCreateModal={page.openCreateForm} restaurantCount={page.restaurants.length} teamName={page.teamSettings.teamName} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold tracking-widest text-orange-700">함께 모으고, 함께 먹어요</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">오늘 점심도, 우리 팀 맛집에서</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">동료들이 남긴 추천과 리뷰를 보고, 지도에서 오늘 갈 곳을 골라보세요.</p>
          </div>
          <p className="text-xs text-muted-foreground">함께 모은 식당 <strong className="text-slate-800">{page.restaurants.length}곳</strong> · 팀 리뷰 <strong className="text-slate-800">{page.totalReviewsCount}개</strong></p>
        </section>
        {page.loadError && (
          <Alert variant="destructive" className="mb-5 border-red-100 bg-red-50 p-4">
            <AlertDescription>{page.loadError}</AlertDescription>
          </Alert>
        )}

        <section className="mb-6 space-y-4">
          <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-md flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                value={filters.searchQuery}
                onChange={(event) => filters.setSearchQuery(event.target.value)}
                placeholder="식당 이름, 메뉴, 지역으로 검색..."
                aria-label="식당 검색"
                className="h-11 rounded-2xl bg-card pl-10 pr-16"
              />
              {filters.searchQuery && (
                <Button type="button" variant="ghost" onClick={() => filters.setSearchQuery('')} className="absolute right-1 top-1/2 h-7 -translate-y-1/2 px-2 text-xs font-semibold text-slate-400 hover:bg-transparent hover:text-slate-600">
                  지우기
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs font-semibold text-muted-foreground">정렬:</span>
              <Select value={filters.sortBy} onValueChange={(value) => filters.setSortBy(value as RestaurantSort)}>
                <SelectTrigger size="sm" aria-label="정렬" className="bg-card text-xs font-semibold text-slate-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {CATEGORY_FILTERS.map((category) => {
              const isSelected = filters.selectedCategory === category;
              return (
                <Button
                  key={category}
                  type="button"
                  size="sm"
                  variant={isSelected ? 'default' : 'outline'}
                  aria-pressed={isSelected}
                  onClick={() => filters.setSelectedCategory(category)}
                  className={cn('text-xs font-bold', isSelected ? 'bg-orange-500 shadow-md shadow-orange-500/20 hover:bg-orange-600' : 'text-slate-600')}
                >
                  <span>{category}</span>
                  <span className={cn('rounded-full px-1.5 text-[11px]', isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500')}>
                    {filters.categoryCounts.get(category) ?? 0}
                  </span>
                </Button>
              );
            })}
          </div>
        </section>

        {page.isLoading ? (
          <p role="status" className="py-20 text-center text-sm text-muted-foreground">팀 맛집 목록을 불러오는 중입니다…</p>
        ) : (
          <RestaurantExplorer
            restaurants={filters.filteredRestaurants}
            officeAddress={page.teamSettings.officeAddress}
            officePlace={page.teamSettings.officePlace}
            onViewDetails={page.openDetail}
            onEdit={page.openEditForm}
            onDelete={page.requestDelete}
          />
        )}
      </main>

      <footer className="mt-16 border-t bg-card py-8 text-center text-xs text-slate-400">
        <p className="mb-1 font-semibold text-slate-600">솔로몬의 점심 메뉴 (Lunch Menu Solomon)</p>
        <p>동료들의 한 끼가 쌓여, 우리 팀의 맛집 지도가 됩니다.</p>
      </footer>

      <RestaurantModal
        isOpen={page.isRestaurantFormOpen}
        initialData={page.editingRestaurant}
        onClose={page.closeRestaurantForm}
        onSubmit={page.submitRestaurant}
      />

      <RestaurantDetailModal
        restaurant={page.detailRestaurant}
        isOpen={!!page.detailRestaurant}
        onClose={page.closeDetail}
        onEditRestaurant={page.editFromDetail}
        onDeleteRestaurant={page.requestDelete}
        onAddReview={page.addReview}
        onDeleteReview={page.deleteReview}
      />

      <ConfirmModal
        isOpen={!!page.deleteTarget}
        title="식당 삭제 확인"
        message={`'${page.deleteTarget?.name}' 식당을 삭제하시겠습니까?\n등록된 모든 리뷰도 함께 삭제되며 되돌릴 수 없습니다.`}
        confirmText="삭제하기"
        cancelText="취소"
        isDangerous
        onConfirm={page.confirmDelete}
        onCancel={page.cancelDelete}
      />

      <RandomPickerModal
        isOpen={page.isRandomOpen}
        onClose={page.closeRandom}
        restaurants={page.randomPool}
        onSelectRestaurant={page.openDetail}
      />
    </div>
  );
}
