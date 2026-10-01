'use client';

import React from 'react';
import Link from 'next/link';
import { UtensilsIcon, PlusIcon, SparklesIcon } from './Icons';

interface NavbarProps {
  onOpenCreateModal: () => void;
  onOpenRandomModal: () => void;
  restaurantCount: number;
  teamName: string;
}

export default function Navbar({
  onOpenCreateModal,
  onOpenRandomModal,
  restaurantCount,
  teamName,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
          {/* Logo & Title */}
          <div className="flex min-w-0 items-center space-x-3">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <UtensilsIcon className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="max-w-[220px] truncate font-extrabold text-lg text-slate-900 tracking-tight sm:max-w-md" title={`${teamName} 맛집 지도`}>
                  {teamName} 맛집 지도
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                  {restaurantCount}곳
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                동료들과 함께 모으는 점심 맛집
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link href="/settings" className="shrink-0 rounded-xl px-2 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">설정</Link>

            <button
              type="button"
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 transition-all shadow-md shadow-orange-500/25 cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              <span>식당 등록</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
