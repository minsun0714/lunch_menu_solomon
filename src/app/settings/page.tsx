'use client';

import Link from 'next/link';
import AddressSearch from '@/components/AddressSearch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettingsPage } from '@/hooks/use-settings-page';

export default function SettingsPage() {
  const page = useSettingsPage();
  const { settings } = page;

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-semibold text-muted-foreground hover:text-orange-600">← 팀 맛집 지도</Link>
        <h1 className="mt-8 text-3xl font-bold tracking-tight">팀 설정</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">우리 팀의 이름과 사무실 위치를 설정하세요. 저장한 설정은 팀 맛집 지도에 함께 적용됩니다.</p>
        <Card className="mt-8 gap-0 rounded-2xl p-6 shadow-none sm:p-8">
          <form onSubmit={page.submit} className="space-y-6">
            {page.loading && <p role="status" className="text-sm text-muted-foreground">설정을 불러오는 중입니다…</p>}
            {page.error && (
              <Alert variant="destructive" className="border-red-100 bg-red-50 p-3">
                <AlertDescription className="flex items-center">
                  {page.error}
                  {!page.loaded && !page.loading && <Button type="button" variant="link" className="ml-3 h-auto p-0 text-red-700" onClick={page.retry}>다시 불러오기</Button>}
                </AlertDescription>
              </Alert>
            )}
            <fieldset disabled={!page.loaded || page.saving} className="min-w-0 space-y-6 disabled:opacity-50">
              <div className="space-y-2">
                <Label htmlFor="team-name" className="text-sm font-semibold">팀 이름</Label>
                <Input
                  id="team-name"
                  required
                  maxLength={40}
                  value={settings.teamName}
                  onChange={(event) => page.changeTeamName(event.target.value)}
                  placeholder="예: 플랫폼 개발팀"
                  className="h-11"
                />
              </div>
              <div>
                <Label htmlFor="office-address" className="text-sm font-semibold">사무실 위치 <span className="font-normal text-slate-400">선택</span></Label>
                <AddressSearch id="office-address" value={page.officeQuery} selectedPlaceId={settings.officePlace?.id} onChange={page.setOfficeQuery} onSelect={page.selectOffice} />
                {settings.officeAddress && (
                  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm font-semibold text-blue-800">선택한 사무실: {settings.officePlace?.name || settings.officeAddress}</p>
                    {settings.officePlace && <p className="mt-1 text-xs text-blue-700">{settings.officeAddress}</p>}
                  </div>
                )}
                <p className="mt-2 text-xs leading-5 text-muted-foreground">목록에서 하나를 선택한 뒤 아래 저장 버튼을 눌러주세요. 저장하기 전에는 기존 사무실 위치가 유지됩니다.</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-6">
                <p role="status" className="text-sm text-emerald-700">{page.saved ? '팀 설정을 저장했습니다.' : ''}</p>
                <Button type="submit" size="lg" disabled={page.saving}>{page.saving ? '저장 중…' : '설정 저장'}</Button>
              </div>
            </fieldset>
          </form>
        </Card>
      </div>
    </main>
  );
}
