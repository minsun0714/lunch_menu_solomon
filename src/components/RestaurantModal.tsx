'use client';

import React, { useState } from 'react';
import { Restaurant, RestaurantCategory, CreateRestaurantInput } from '@/types/restaurant';
import { CloseIcon } from './Icons';

interface RestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRestaurantInput) => Promise<void>;
  initialData?: Restaurant | null;
}

const CATEGORIES: RestaurantCategory[] = [
  '한식',
  '일식',
  '중식',
  '양식',
  '분식',
  '아시안',
  '카페/디저트',
  '기타',
];

const PRICE_RANGES = [
  '1만원 이하',
  '1만~1.5만원',
  '1.5만~2만원',
  '2만원 이상',
];

export default function RestaurantModal(props: RestaurantModalProps) {
  if (!props.isOpen) return null;
  return <RestaurantModalForm key={props.initialData?.id || 'new'} {...props} />;
}

function RestaurantModalForm({
  onClose,
  onSubmit,
  initialData,
}: RestaurantModalProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState<RestaurantCategory>(initialData?.category || '한식');
  const [address, setAddress] = useState(initialData?.address || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [priceRange, setPriceRange] = useState(initialData?.priceRange || '1만원 이하');
  const [openingHours, setOpeningHours] = useState(initialData?.openingHours || '');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!name.trim()) errs.name = '식당 이름을 입력해주세요.';
    if (!address.trim()) errs.address = '식당 위치나 주소를 입력해주세요.';
    if (!description.trim()) errs.description = '대표 메뉴나 설명을 입력해주세요.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
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
      setErrors((prev) => ({ ...prev, submit: '저장 중 오류가 발생했습니다.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900">
            {initialData ? '식당 정보 수정' : '새 식당 등록'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errors.submit && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
              {errors.submit}
            </div>
          )}

          {/* Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                식당 이름 <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 솔로몬 묵은지 김치찌개"
                className={`w-full px-3.5 py-2 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${
                  errors.name ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                카테고리 <span className="text-orange-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as RestaurantCategory)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              위치 / 주소 <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="예: 서울시 강남구 테헤란로 12길 15"
              className={`w-full px-3.5 py-2 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${
                errors.address ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
              }`}
            />
            {errors.address && (
              <p className="mt-1 text-xs text-red-500">{errors.address}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              설명 및 대표 메뉴 <span className="text-orange-500">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="대표 메뉴, 특징, 추천 이유 등을 적어주세요."
              className={`w-full px-3.5 py-2 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none ${
                errors.description ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Price Range & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                가격대 (1인 기준)
              </label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              >
                {PRICE_RANGES.map((pr) => (
                  <option key={pr} value={pr}>
                    {pr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                전화번호 (선택)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="예: 02-555-1234"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          {/* Opening Hours & Image URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                영업 시간 (선택)
              </label>
              <input
                type="text"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="예: 11:00 - 21:00 (일요일 휴무)"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                대표 사진 URL (선택)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? '저장 중...' : initialData ? '수정 완료' : '식당 등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
