'use client';

import { useEffect, useState } from 'react';
import { fetchTeamSettings } from '@/services/settings-api';
import { DEFAULT_TEAM_SETTINGS, TeamSettings } from '@/types/team-settings';

// Read-only team settings for pages that only display them (the settings page has its own editable hook).
export function useTeamSettings() {
  const [settings, setSettings] = useState<TeamSettings>(DEFAULT_TEAM_SETTINGS);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let ignore = false;
    fetchTeamSettings()
      .then((data) => { if (!ignore) setSettings(data); })
      .catch(() => { if (!ignore) setLoadError('팀 설정을 불러오지 못했습니다. 새로고침 후 다시 확인해주세요.'); });
    return () => { ignore = true; };
  }, []);

  return { settings, loadError };
}
