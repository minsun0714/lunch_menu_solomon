'use client';

import React from 'react';
import { UtensilsIcon, PlusIcon, SparklesIcon } from './Icons';

interface NavbarProps {
  onOpenCreateModal: () => void;
  onOpenRandomModal: () => void;
  restaurantCount: number;
}

export default function Navbar({
  onOpenCreateModal,
  onOpenRandomModal,
  restaurantCount,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <UtensilsIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                  솔로몬의 점심 메뉴
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                  {restaurantCount}곳
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                로그인 없이 누구나 자유롭게 식당 등록 & 별점 리뷰
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              type="button"
              onClick={onOpenRandomModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 rounded-xl text-sm font-semibold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 transition-colors shadow-2xs cursor-pointer"
            >
              <SparklesIcon className="w-4 h-4 text-amber-600" />
              <span>오늘 뭐 먹지?</span>
            </button>

            <button
              type="button"
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 transition-all shadow-md shadow-orange-500/25 cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="hidden xs:inline">식당 등록</span>
              <span className="xs:hidden">등록</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
