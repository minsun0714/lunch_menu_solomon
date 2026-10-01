'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { DEFAULT_TEAM_SETTINGS, TeamSettings } from '@/types/team-settings';
import AddressSearch from '@/components/AddressSearch';
import { SelectedPlace } from '@/types/place';

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<TeamSettings>(DEFAULT_TEAM_SETTINGS);
  const [officeQuery, setOfficeQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch('/api/settings', { signal: controller.signal, cache: 'no-store' });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || '설정을 불러오지 못했습니다.');
        setSettings(result.data);
        setOfficeQuery(result.data.officePlace?.name || result.data.officeAddress);
        setLoaded(true);
      } catch (error) {
        if (!controller.signal.aborted) setError((error as Error).message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await persistSettings(settings, true);
  }

  function selectOffice(officePlace: SelectedPlace) {
    setSettings((previous) => ({ ...previous, officeAddress: officePlace.address, officePlace }));
    setSaved(false);
  }

  async function persistSettings(nextSettings: TeamSettings, redirectHome = false) {
    if (saving) return;
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nextSettings),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || '설정을 저장하지 못했습니다.');
      setSettings(result.data);
      setSaved(true);
      if (redirectHome) {
        router.replace('/');
        router.refresh();
      }
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-orange-600">← 팀 맛집 지도</Link>
        <h1 className="mt-8 text-3xl font-bold tracking-tight">팀 설정</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">우리 팀의 이름과 사무실 위치를 설정하세요. 저장한 설정은 팀 맛집 지도에 함께 적용됩니다.</p>
        <form onSubmit={save} className="mt-8 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          {loading && <p role="status" className="text-sm text-slate-500">설정을 불러오는 중입니다…</p>}
          {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}
            {!loaded && !loading && <button type="button" className="ml-3 underline" onClick={() => { setError(''); setLoading(true); setAttempt(attempt + 1); }}>다시 불러오기</button>}
          </div>}
          <fieldset disabled={!loaded || saving} className="space-y-6 disabled:opacity-50">
            <div>
              <label htmlFor="team-name" className="block text-sm font-semibold">팀 이름</label>
              <input id="team-name" required maxLength={40} value={settings.teamName} onChange={(event) => { setSettings({ ...settings, teamName: event.target.value }); setSaved(false); }} placeholder="예: 플랫폼 개발팀" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-orange-500" />
            </div>
            <div>
              <label htmlFor="office-address" className="block text-sm font-semibold">사무실 위치 <span className="font-normal text-slate-400">선택</span></label>
              <AddressSearch id="office-address" value={officeQuery}
                selectedPlaceId={settings.officePlace?.id}
                onChange={setOfficeQuery}
                onSelect={selectOffice} />
              {settings.officeAddress && <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-800">선택한 사무실: {settings.officePlace?.name || settings.officeAddress}</p>
                {settings.officePlace && <p className="mt-1 text-xs text-blue-700">{settings.officeAddress}</p>}
              </div>}
              <p className="mt-2 text-xs leading-5 text-slate-500">목록에서 하나를 선택한 뒤 아래 저장 버튼을 눌러주세요. 저장하기 전에는 기존 사무실 위치가 유지됩니다.</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
              <p role="status" className="text-sm text-emerald-700">{saved ? '팀 설정을 저장했습니다.' : ''}</p>
              <button type="submit" className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50" disabled={saving}>{saving ? '저장 중…' : '설정 저장'}</button>
            </div>
          </fieldset>
        </form>
      </div>
    </main>
  );
}
