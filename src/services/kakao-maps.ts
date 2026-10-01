export interface Coordinates { lat: number; lng: number }
export interface KakaoAddress {
  x: string;
  y: string;
  address_name?: string;
  road_address?: { address_name: string; building_name?: string } | null;
}
export interface OfficePlace {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
}
interface LatLng { getLat(): number; getLng(): number }
interface Bounds { extend(position: LatLng): void }
export interface KakaoMap {
  setBounds(bounds: Bounds): void;
  setCenter(position: LatLng): void;
  getCenter(): LatLng;
  setLevel(level: number): void;
  relayout(): void;
}
export interface MapOverlay { setMap(map: KakaoMap | null): void }
export interface KakaoMaps {
  load(callback: () => void): void;
  LatLng: new (lat: number, lng: number) => LatLng;
  LatLngBounds: new () => Bounds;
  Map: new (container: HTMLElement, options: { center: LatLng; level: number }) => KakaoMap;
  CustomOverlay: new (options: { position: LatLng; content: HTMLElement; yAnchor: number; zIndex?: number }) => MapOverlay;
  services: {
    Status: { OK: string; ZERO_RESULT: string };
    Geocoder: new () => {
      addressSearch(address: string, callback: (result: KakaoAddress[], status: string, pagination?: { hasNextPage: boolean }) => void, options?: { size: number }): void;
    };
    Places: new () => {
      keywordSearch(query: string, callback: (result: OfficePlace[], status: string, pagination: { hasNextPage: boolean }) => void, options?: { size: number }): void;
    };
  };
}

declare global {
  interface Window { kakao?: { maps: KakaoMaps } }
}

export const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_CLIENT_KEY?.trim()
  || process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY?.trim();

let sdkPromise: Promise<KakaoMaps> | undefined;

export function loadKakaoMaps(key: string): Promise<KakaoMaps> {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<KakaoMaps>((resolve, reject) => {
    const script = document.createElement('script');
    let finished = false;
    const fail = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeout);
      script.remove();
      reject(new Error('지도를 불러오지 못했습니다.'));
    };
    const timeout = window.setTimeout(fail, 15000);
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false&libraries=services`;
    script.async = true;
    script.onerror = fail;
    script.onload = () => {
      if (finished) return;
      if (!window.kakao?.maps) return fail();
      window.kakao.maps.load(() => {
        if (finished) return;
        const maps = window.kakao?.maps;
        if (!maps?.services || !maps.Map) return fail();
        finished = true;
        window.clearTimeout(timeout);
        resolve(maps);
      });
    };
    document.head.appendChild(script);
  }).catch((error) => {
    sdkPromise = undefined;
    throw error;
  });
  return sdkPromise;
}

const coordinatesCache = new Map<string, Promise<Coordinates | null>>();

export function geocodeAddress(maps: KakaoMaps, address: string): Promise<Coordinates | null> {
  const normalized = address.trim();
  if (!normalized) return Promise.resolve(null);
  const cached = coordinatesCache.get(normalized);
  if (cached) return cached;
  const result = new Promise<Coordinates | null>((resolve) => {
    const timer = setTimeout(() => resolve(null), 10000);
    new maps.services.Geocoder().addressSearch(normalized, (results, status) => {
      clearTimeout(timer);
      const first = results[0];
      if (status !== maps.services.Status.OK || !first || !first.x.trim() || !first.y.trim()) return resolve(null);
      const lat = Number(first.y);
      const lng = Number(first.x);
      resolve(Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null);
    });
  }).then((coordinates) => {
    // Failed lookups may succeed on retry; retain only successful coordinates.
    if (!coordinates) coordinatesCache.delete(normalized);
    return coordinates;
  });
  coordinatesCache.set(normalized, result);
  return result;
}

export function kakaoSearchUrl(name: string, address: string): string {
  return `https://map.kakao.com/link/search/${encodeURIComponent(`${address} ${name}`.trim())}`;
}

export async function findOfficeLocation(maps: KakaoMaps, query: string): Promise<{ coordinates: Coordinates | null; candidates: OfficePlace[] }> {
  const coordinates = await geocodeAddress(maps, query);
  if (coordinates || !query.trim()) return { coordinates, candidates: [] };
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ coordinates: null, candidates: [] }), 10000);
    new maps.services.Places().keywordSearch(query.trim(), (results, status, pagination) => {
      clearTimeout(timer);
      if (status !== maps.services.Status.OK) return resolve({ coordinates: null, candidates: [] });
      const candidates = results.filter((place) => place.x.trim() && place.y.trim()
        && Number.isFinite(Number(place.x)) && Number.isFinite(Number(place.y))
        && Math.abs(Number(place.x)) <= 180 && Math.abs(Number(place.y)) <= 90
        && (place.road_address_name || place.address_name));
      // Never choose one branch of an ambiguous place name automatically.
      if (results.length === 1 && candidates.length === 1 && !pagination.hasNextPage) {
        return resolve({ coordinates: { lat: Number(candidates[0].y), lng: Number(candidates[0].x) }, candidates: [] });
      }
      resolve({ coordinates: null, candidates });
    }, { size: 15 });
  });
}


export function createRestaurantPin(label: string, ariaLabel: string, onSelect: () => void): HTMLElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'restaurant-map-pin';
  button.textContent = label;
  button.setAttribute('aria-label', ariaLabel);
  button.onclick = onSelect;
  return button;
}

export function createOfficePin(title: string): HTMLElement {
  const label = document.createElement('div');
  label.className = 'restaurant-map-pin office-map-pin';
  label.textContent = '🏢 우리 사무실';
  label.title = title;
  return label;
}

export function observeResize(element: Element, onResize: () => void): () => void {
  const observer = new ResizeObserver(onResize);
  observer.observe(element);
  return () => observer.disconnect();
}
