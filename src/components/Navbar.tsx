import Link from 'next/link';
import { PlusIcon, UtensilsIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  onOpenCreateModal: () => void;
  restaurantCount: number;
  teamName: string;
}

export default function Navbar({ onOpenCreateModal, restaurantCount, teamName }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b bg-card/95 shadow-xs backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex min-w-0 items-center space-x-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20">
              <UtensilsIcon className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="max-w-[220px] truncate text-lg font-extrabold tracking-tight text-slate-900 sm:max-w-md" title={`${teamName} 맛집 지도`}>
                  {teamName} 맛집 지도
                </span>
                <Badge className="bg-orange-100 text-orange-800">{restaurantCount}곳</Badge>
              </div>
              <p className="hidden text-xs text-muted-foreground sm:block">동료들과 함께 모으는 점심 맛집</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <Button asChild variant="ghost" className="shrink-0 text-muted-foreground">
              <Link href="/settings">설정</Link>
            </Button>
            <Button
              type="button"
              onClick={onOpenCreateModal}
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25 hover:from-orange-600 hover:to-amber-600"
            >
              <PlusIcon />
              <span>식당 등록</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
