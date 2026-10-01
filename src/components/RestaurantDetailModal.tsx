'use client';

import { ClockIcon, MapPinIcon, MessageSquareIcon, PencilIcon, PhoneIcon, Trash2Icon, UserIcon, XIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useReviewForm } from '@/hooks/use-review-form';
import { formatDate } from '@/lib/format';
import { CreateReviewInput, Restaurant } from '@/types/restaurant';
import ConfirmModal from './ConfirmModal';
import StarRating from './StarRating';

interface RestaurantDetailModalProps {
  restaurant: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
  onEditRestaurant: (restaurant: Restaurant) => void;
  onDeleteRestaurant: (restaurant: Restaurant) => void;
  onAddReview: (restaurantId: string, input: CreateReviewInput) => Promise<void>;
  onDeleteReview: (restaurantId: string, reviewId: string) => Promise<void>;
}

export default function RestaurantDetailModal({ restaurant, isOpen, ...props }: RestaurantDetailModalProps) {
  if (!isOpen || !restaurant) return null;
  return <RestaurantDetailContent key={restaurant.id} restaurant={restaurant} {...props} />;
}

function RestaurantDetailContent({
  restaurant,
  onClose,
  onEditRestaurant,
  onDeleteRestaurant,
  onAddReview,
  onDeleteReview,
}: Omit<RestaurantDetailModalProps, 'isOpen' | 'restaurant'> & { restaurant: Restaurant }) {
  const form = useReviewForm({ restaurant, onAddReview, onDeleteReview });

  return (
    <>
      <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent showCloseButton={false} className="flex max-h-[92vh] flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-2xl">
          <div className="flex items-center justify-between border-b bg-muted/50 px-6 py-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-100 px-3 py-1 font-bold text-orange-800">{restaurant.category}</Badge>
              {restaurant.priceRange && <Badge variant="secondary" className="bg-slate-200/70 px-2.5 py-1 text-slate-700">{restaurant.priceRange}</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onEditRestaurant(restaurant)} className="text-xs text-slate-700">
                <PencilIcon /> 식당 수정
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => onDeleteRestaurant(restaurant)} className="border-red-200 text-xs text-red-600 hover:bg-red-50 hover:text-red-600">
                <Trash2Icon /> 식당 삭제
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="닫기" className="ml-1 text-slate-400">
                <XIcon />
              </Button>
            </div>
          </div>

          <div className="flex-1 divide-y overflow-y-auto">
            <div className="p-6">
              <DialogTitle className="mb-2 text-2xl font-black text-slate-900">{restaurant.name}</DialogTitle>
              <DialogDescription className="sr-only">식당 상세 정보와 팀 리뷰</DialogDescription>

              <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-black text-amber-500">{restaurant.averageRating > 0 ? restaurant.averageRating.toFixed(1) : '0.0'}</div>
                  <div>
                    <StarRating rating={restaurant.averageRating} size="md" />
                    <p className="mt-0.5 text-xs text-muted-foreground">총 <strong className="text-slate-800">{restaurant.reviewCount}개</strong>의 솔직한 리뷰</p>
                  </div>
                </div>
                <div className="hidden text-right sm:block">
                  <Badge variant="outline" className="rounded-lg border-amber-200 bg-white/80 px-2.5 py-1 text-amber-800">로그인 없이 누구나 작성 가능</Badge>
                </div>
              </div>

              <div className="mb-5">
                <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">대표 메뉴 및 설명</h3>
                <p className="whitespace-pre-line rounded-xl border bg-muted/50 p-3.5 text-sm leading-relaxed text-slate-700">{restaurant.description}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 text-xs text-slate-600 sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2">
                  <MapPinIcon className="size-4 shrink-0 text-orange-500" />
                  <span className="truncate">{restaurant.address}</span>
                </div>
                {restaurant.phone && (
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2">
                    <PhoneIcon className="size-4 shrink-0 text-blue-500" />
                    <span>{restaurant.phone}</span>
                  </div>
                )}
                {restaurant.openingHours && (
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2 sm:col-span-2">
                    <ClockIcon className="size-4 shrink-0 text-emerald-500" />
                    <span>{restaurant.openingHours}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-muted/30 p-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <MessageSquareIcon className="size-4 text-orange-500" />
                  <span>리뷰 & 별점 작성</span>
                </h3>
                <span className="text-xs text-muted-foreground">로그인 불필요 · 자유롭게 작성</span>
              </div>

              <Card className="gap-0 p-4 shadow-xs sm:p-5">
                <form onSubmit={form.submit} className="space-y-4">
                  {form.formError && (
                    <Alert variant="destructive" className="border-red-200 bg-red-50 p-2.5">
                      <AlertDescription className="text-xs">{form.formError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="review-author" className="text-xs font-semibold text-slate-700">작성자 이름 <span className="text-orange-500">*</span></Label>
                      <Input id="review-author" value={form.author} onChange={(event) => form.setAuthor(event.target.value)} placeholder="예: 점심미식가, 김대리" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">별점 선택 · 0.5점 단위 <span className="text-orange-500">*</span></Label>
                      <div className="py-1">
                        <StarRating rating={form.rating} interactive onChange={form.setRating} size="lg" showLabel />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="review-content" className="text-xs font-semibold text-slate-700">리뷰 내용 <span className="text-orange-500">*</span></Label>
                    <Textarea id="review-content" rows={3} value={form.content} onChange={(event) => form.setContent(event.target.value)}
                      placeholder="음식의 맛, 분위기, 가성비, 웨이팅 팁 등을 자유롭게 공유해주세요!" className="resize-none" />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={form.isSubmitting} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 hover:from-orange-600 hover:to-amber-600">
                      {form.isSubmitting ? '등록 중...' : '리뷰 등록하기'}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>

            <div className="p-6">
              <h3 className="mb-4 flex items-center justify-between text-base font-bold text-slate-900">
                <span>전체 리뷰 목록 ({restaurant.reviews.length})</span>
              </h3>

              {restaurant.reviews.length === 0 ? (
                <div className="rounded-2xl border border-dashed bg-muted/50 py-8 text-center">
                  <p className="text-sm font-medium text-muted-foreground">아직 등록된 리뷰가 없습니다.</p>
                  <p className="mt-1 text-xs text-slate-400">위 양식에서 첫 번째 리뷰를 남겨보세요!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {restaurant.reviews.map((review) => (
                    <Card key={review.id} className="gap-0 rounded-2xl border-slate-100 p-4 shadow-2xs transition-all hover:border-slate-200">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex size-7 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                            <UserIcon className="size-3.5" />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-slate-800">{review.author}</span>
                            <span className="ml-2 text-xs text-slate-400">{formatDate(review.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StarRating rating={review.rating} size="sm" showNumber />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => form.requestDelete(review)}
                            disabled={form.deletingReviewId === review.id}
                            className="size-6 text-slate-300 hover:bg-transparent hover:text-red-500"
                            title="리뷰 삭제"
                            aria-label={`${review.author}의 리뷰 삭제`}
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="whitespace-pre-line pl-9 text-sm leading-relaxed text-slate-600">{review.content}</p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={!!form.reviewToDelete}
        title="리뷰 삭제 확인"
        message="이 리뷰를 삭제하시겠습니까?"
        onConfirm={form.confirmDelete}
        onCancel={form.cancelDelete}
      />
    </>
  );
}
