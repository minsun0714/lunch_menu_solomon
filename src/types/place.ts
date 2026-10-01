export interface SelectedPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface PlaceSearchResult extends SelectedPlace {
  category: string;
  phone: string;
}

export function parseSelectedPlace(value: unknown): SelectedPlace {
  if (!value || typeof value !== 'object') throw new Error('선택한 장소 정보를 확인해주세요.');
  const place = value as Record<string, unknown>;
  if (typeof place.id !== 'string' || !place.id.trim() || place.id.length > 100
    || typeof place.name !== 'string' || !place.name.trim() || place.name.length > 200
    || typeof place.address !== 'string' || !place.address.trim() || place.address.length > 200
    || typeof place.lat !== 'number' || !Number.isFinite(place.lat) || Math.abs(place.lat) > 90
    || typeof place.lng !== 'number' || !Number.isFinite(place.lng) || Math.abs(place.lng) > 180) {
    throw new Error('선택한 장소 정보를 확인해주세요.');
  }
  return { id: place.id.trim(), name: place.name.trim(), address: place.address.trim(), lat: place.lat, lng: place.lng };
}
