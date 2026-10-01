'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchTeamSettings, saveTeamSettings } from '@/services/settings-api';
import { SelectedPlace } from '@/types/place';
import { DEFAULT_TEAM_SETTINGS, TeamSettings } from '@/types/team-settings';

export function useSettingsPage() {
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
        const data = await fetchTeamSettings(controller.signal);
        setSettings(data);
        setOfficeQuery(data.officePlace?.name || data.officeAddress);
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

  function changeTeamName(teamName: string) {
    setSettings((previous) => ({ ...previous, teamName }));
    setSaved(false);
  }

  function selectOffice(officePlace: SelectedPlace) {
    setSettings((previous) => ({ ...previous, officeAddress: officePlace.address, officePlace }));
    setSaved(false);
  }

  function retry() {
    setError('');
    setLoading(true);
    setAttempt((value) => value + 1);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      setSettings(await saveTeamSettings(settings));
      setSaved(true);
      router.replace('/');
      router.refresh();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return {
    settings, officeQuery, setOfficeQuery, loading, loaded, saving, error, saved,
    changeTeamName, selectOffice, retry, submit,
  };
}
