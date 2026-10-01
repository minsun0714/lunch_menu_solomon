import { SelectedPlace } from './place';

export interface TeamSettings {
  teamName: string;
  officeAddress: string;
  officePlace?: SelectedPlace;
}

export const DEFAULT_TEAM_SETTINGS: TeamSettings = {
  teamName: '우리 팀',
  officeAddress: '',
};

export function parseTeamSettings(value: unknown): TeamSettings {
  if (!value || typeof value !== 'object') throw new Error('설정 내용을 확인해주세요.');
  const { teamName, officeAddress, officePlace } = value as Record<string, unknown>;
  if (typeof teamName !== 'string' || !teamName.trim() || teamName.trim().length > 40) {
    throw new Error('팀 이름은 1~40자로 입력해주세요.');
  }
  if (typeof officeAddress !== 'string' || officeAddress.trim().length > 200) {
    throw new Error('사무실 주소는 200자 이내로 입력해주세요.');
  }
  const settings: TeamSettings = { teamName: teamName.trim(), officeAddress: officeAddress.trim() };
  if (officePlace != null) {
    if (typeof officePlace !== 'object') throw new Error('선택한 사무실 장소를 확인해주세요.');
    const place = officePlace as Record<string, unknown>;
    if (typeof place.id !== 'string' || !place.id.trim() || place.id.length > 100
      || typeof place.name !== 'string' || !place.name.trim() || place.name.length > 200
      || typeof place.address !== 'string' || !place.address.trim() || place.address.length > 200
      || typeof place.lat !== 'number' || !Number.isFinite(place.lat) || Math.abs(place.lat) > 90
      || typeof place.lng !== 'number' || !Number.isFinite(place.lng) || Math.abs(place.lng) > 180) {
      throw new Error('선택한 사무실 장소를 확인해주세요.');
    }
    // A manually edited address must not keep the previous place's coordinates.
    if (place.address.trim() === settings.officeAddress) {
      settings.officePlace = { id: place.id, name: place.name.trim(), address: place.address.trim(), lat: place.lat, lng: place.lng };
    }
  }
  return settings;
}
