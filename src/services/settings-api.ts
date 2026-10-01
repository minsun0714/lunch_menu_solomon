import { TeamSettings } from '@/types/team-settings';
import { apiRequest } from './api-client';

export function fetchTeamSettings(signal?: AbortSignal): Promise<TeamSettings> {
  return apiRequest<TeamSettings>('/api/settings', { signal, noStore: true, fallbackError: '설정을 불러오지 못했습니다.' });
}

export function saveTeamSettings(settings: TeamSettings): Promise<TeamSettings> {
  return apiRequest<TeamSettings>('/api/settings', { method: 'PUT', body: settings, fallbackError: '설정을 저장하지 못했습니다.' });
}
