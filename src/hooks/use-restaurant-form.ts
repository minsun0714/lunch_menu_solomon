'use client';

import { FormEvent, useState } from 'react';
import { PlaceSearchResult, SelectedPlace } from '@/types/place';
import { CreateRestaurantInput, Restaurant, RestaurantCategory, RESTAURANT_CATEGORIES } from '@/types/restaurant';

export const PRICE_RANGES = ['1만원 이하', '1만~1.5만원', '1.5만~2만원', '2만원 이상'];

type FormErrors = Partial<Record<'place' | 'name' | 'address' | 'description' | 'submit', string>>;

function categoryFromPlace(placeCategory: string): RestaurantCategory {
  const categories = placeCategory.split(' > ');
  return RESTAURANT_CATEGORIES.find((item) => categories.includes(item))
    || (categories.some((item) => /카페|디저트|제과/.test(item)) ? '카페/디저트' : '기타');
}

interface Options {
  initialData?: Restaurant | null;
  onSubmit: (data: CreateRestaurantInput) => Promise<void>;
  onClose: () => void;
}

export function useRestaurantForm({ initialData, onSubmit, onClose }: Options) {
  const isEditing = !!initialData;
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState<RestaurantCategory>(initialData?.category || '한식');
  const [address, setAddress] = useState(initialData?.address || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [priceRange, setPriceRange] = useState(initialData?.priceRange || PRICE_RANGES[0]);
  const [openingHours, setOpeningHours] = useState(initialData?.openingHours || '');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [query, setQuery] = useState('');
  const [place, setPlace] = useState<SelectedPlace | undefined>(initialData?.place);

  function selectPlace(result: PlaceSearchResult) {
    setPlace({ id: result.id, name: result.name, address: result.address, lat: result.lat, lng: result.lng });
    setName(result.name);
    setAddress(result.address);
    setPhone(result.phone);
    setCategory(categoryFromPlace(result.category));
    setDescription(result.category || result.name);
    setErrors({});
  }

  function validate() {
    const next: FormErrors = {};
    if (!isEditing && !place) next.place = '검색 결과에서 등록할 식당을 선택해주세요.';
    if (!name.trim()) next.name = '식당 이름을 입력해주세요.';
    if (!address.trim()) next.address = '식당 위치나 주소를 입력해주세요.';
    if (!description.trim()) next.description = '대표 메뉴나 설명을 입력해주세요.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (isSubmitting || !validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...(place && place.address === address.trim() ? { place } : {}),
        name: name.trim(),
        category,
        address: address.trim(),
        phone: phone.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        priceRange: priceRange.trim(),
        openingHours: openingHours.trim(),
      });
      onClose();
    } catch (error) {
      console.error(error);
      setErrors((previous) => ({ ...previous, submit: '저장 중 오류가 발생했습니다.' }));
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    isEditing, isSubmitting, errors, place, query, setQuery, selectPlace, submit,
    fields: { name, category, address, phone, description, imageUrl, priceRange, openingHours },
    setters: { setName, setCategory, setAddress, setPhone, setDescription, setImageUrl, setPriceRange, setOpeningHours },
  };
}
