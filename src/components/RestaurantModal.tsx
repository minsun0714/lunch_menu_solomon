'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PRICE_RANGES, useRestaurantForm } from '@/hooks/use-restaurant-form';
import { CreateRestaurantInput, Restaurant, RestaurantCategory, RESTAURANT_CATEGORIES } from '@/types/restaurant';
import AddressSearch from './AddressSearch';

interface RestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRestaurantInput) => Promise<void>;
  initialData?: Restaurant | null;
}

export default function RestaurantModal(props: RestaurantModalProps) {
  if (!props.isOpen) return null;
  return <RestaurantModalForm key={props.initialData?.id || 'new'} {...props} />;
}

function Required() {
  return <span className="text-orange-500">*</span>;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-red-500">{message}</p> : null;
}

function RestaurantModalForm({ onClose, onSubmit, initialData }: RestaurantModalProps) {
  const { isEditing, isSubmitting, errors, place, query, setQuery, selectPlace, submit, fields, setters } = useRestaurantForm({ initialData, onSubmit, onClose });

  // Keep a previously saved price range selectable even if it is not one of the presets.
  const priceOptions = PRICE_RANGES.includes(fields.priceRange) ? PRICE_RANGES : [fields.priceRange, ...PRICE_RANGES];

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        onInteractOutside={(event) => event.preventDefault()}
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <DialogHeader className="border-b bg-muted/50 px-6 py-4">
          <DialogTitle className="text-lg font-bold text-slate-900">{isEditing ? '식당 정보 수정' : '새 식당 등록'}</DialogTitle>
          <DialogDescription className="sr-only">식당 정보를 입력하고 저장합니다.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex-1 space-y-4 overflow-y-auto p-6">
          {errors.submit && (
            <Alert variant="destructive" className="border-red-100 bg-red-50">
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          <fieldset disabled={isSubmitting} className="min-w-0 space-y-4 disabled:opacity-50">
            {!isEditing && (
              <div>
                <Label htmlFor="restaurant-search" className="text-sm font-semibold text-slate-700">카카오맵에서 식당 검색</Label>
                <AddressSearch id="restaurant-search" purpose="restaurant" value={query} onChange={setQuery} selectedPlaceId={place?.id} onSelect={selectPlace} />
                {errors.place && <p role="alert" className="mt-2 text-sm text-red-600">{errors.place}</p>}
                {place && (
                  <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">선택한 식당: {place.name}</p>
                    <p className="mt-1 text-xs text-slate-600">{place.address}</p>
                    <p className="mt-2 text-xs text-orange-700">아래 식당 등록하기를 눌러야 팀 목록에 추가됩니다.</p>
                  </div>
                )}
              </div>
            )}

            {(isEditing || place) && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="restaurant-name" className="text-xs font-semibold text-slate-700">식당 이름 <Required /></Label>
                    <Input id="restaurant-name" value={fields.name} readOnly={!isEditing} aria-invalid={!!errors.name}
                      onChange={(event) => setters.setName(event.target.value)} placeholder="예: 솔로몬 묵은지 김치찌개" />
                    <FieldError message={errors.name} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="restaurant-category" className="text-xs font-semibold text-slate-700">카테고리 <Required /></Label>
                    <Select value={fields.category} onValueChange={(value) => setters.setCategory(value as RestaurantCategory)}>
                      <SelectTrigger id="restaurant-category" className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {RESTAURANT_CATEGORIES.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="restaurant-address" className="text-xs font-semibold text-slate-700">위치 / 주소 <Required /></Label>
                  <Input id="restaurant-address" value={fields.address} readOnly={!isEditing} aria-invalid={!!errors.address}
                    onChange={(event) => setters.setAddress(event.target.value)} placeholder="예: 서울시 강남구 테헤란로 12길 15" />
                  <FieldError message={errors.address} />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="restaurant-description" className="text-xs font-semibold text-slate-700">설명 및 대표 메뉴 <Required /></Label>
                  <Textarea id="restaurant-description" rows={3} value={fields.description} aria-invalid={!!errors.description}
                    onChange={(event) => setters.setDescription(event.target.value)} placeholder="대표 메뉴, 특징, 추천 이유 등을 적어주세요." className="resize-none" />
                  <FieldError message={errors.description} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="restaurant-price" className="text-xs font-semibold text-slate-700">가격대 (1인 기준)</Label>
                    <Select value={fields.priceRange} onValueChange={setters.setPriceRange}>
                      <SelectTrigger id="restaurant-price" className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {priceOptions.map((range) => <SelectItem key={range} value={range}>{range}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="restaurant-phone" className="text-xs font-semibold text-slate-700">전화번호 (선택)</Label>
                    <Input id="restaurant-phone" value={fields.phone} onChange={(event) => setters.setPhone(event.target.value)} placeholder="예: 02-555-1234" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="restaurant-hours" className="text-xs font-semibold text-slate-700">영업 시간 (선택)</Label>
                    <Input id="restaurant-hours" value={fields.openingHours} onChange={(event) => setters.setOpeningHours(event.target.value)} placeholder="예: 11:00 - 21:00 (일요일 휴무)" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="restaurant-image" className="text-xs font-semibold text-slate-700">대표 사진 URL (선택)</Label>
                    <Input id="restaurant-image" type="url" value={fields.imageUrl} onChange={(event) => setters.setImageUrl(event.target.value)} placeholder="https://images.unsplash.com/..." />
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>취소</Button>
              <Button type="submit" disabled={isSubmitting || (!isEditing && !place)}>
                {isSubmitting ? '저장 중...' : isEditing ? '수정 완료' : '식당 등록하기'}
              </Button>
            </div>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}
