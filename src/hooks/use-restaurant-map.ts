'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createOfficePin,
  createRestaurantPin,
  geocodeAddress,
  KAKAO_MAP_API_KEY,
  KakaoMap,
  loadKakaoMaps,
  MapOverlay,
  observeResize,
} from '@/services/kakao-maps';
import { SelectedPlace } from '@/types/place';
import { Restaurant } from '@/types/restaurant';

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

interface Options {
  restaurants: Restaurant[];
  officeAddress: string;
  officePlace?: SelectedPlace;
  onSelect: (restaurant: Restaurant) => void;
}

export function useRestaurantMap({ restaurants, officeAddress, officePlace, onSelect }: Options) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const selectRef = useRef(onSelect);
  const [status, setStatus] = useState('지도를 불러오는 중입니다…');
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [officeReady, setOfficeReady] = useState(false);
  const focusOffice = useRef<(() => void) | null>(null);
  const showAll = useRef<(() => void) | null>(null);

  useEffect(() => { selectRef.current = onSelect; }, [onSelect]);

  useEffect(() => {
    const element = container.current;
    if (!KAKAO_MAP_API_KEY || !element) return;
    let cancelled = false;
    const overlays: MapOverlay[] = [];
    let stopObserving: (() => void) | undefined;

    async function renderMap() {
      try {
        const maps = await loadKakaoMaps(KAKAO_MAP_API_KEY!);
        if (cancelled) return;
        setOfficeReady(false);
        const map = mapRef.current ?? new maps.Map(element!, { center: new maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng), level: 5 });
        mapRef.current = map;
        const locations = await Promise.all(restaurants.map(async (restaurant) => ({
          restaurant,
          coordinates: restaurant.place?.address === restaurant.address
            ? { lat: restaurant.place.lat, lng: restaurant.place.lng }
            : await geocodeAddress(maps, restaurant.address),
        })));
        const office = officePlace?.address === officeAddress
          ? { lat: officePlace.lat, lng: officePlace.lng }
          : await geocodeAddress(maps, officeAddress);
        if (cancelled) return;
        const bounds = new maps.LatLngBounds();
        let count = 0;
        const addOverlay = (lat: number, lng: number, content: HTMLElement, zIndex = 1) => {
          const position = new maps.LatLng(lat, lng);
          bounds.extend(position);
          const overlay = new maps.CustomOverlay({ position, content, yAnchor: 1.2, zIndex });
          overlay.setMap(map);
          overlays.push(overlay);
          count++;
        };
        locations.forEach(({ restaurant, coordinates }, index) => {
          if (!coordinates) return;
          addOverlay(coordinates.lat, coordinates.lng, createRestaurantPin(
            `${index + 1} · ${restaurant.name}`,
            `${restaurant.name} 상세 정보 및 팀 리뷰 보기`,
            () => selectRef.current(restaurant),
          ));
        });
        if (office) {
          addOverlay(office.lat, office.lng, createOfficePin(officePlace ? `${officePlace.name} · ${officeAddress}` : officeAddress), 10);
          focusOffice.current = () => {
            map.setLevel(3);
            map.setCenter(new maps.LatLng(office.lat, office.lng));
          };
          setOfficeReady(true);
        }
        if (count) {
          showAll.current = () => map.setBounds(bounds);
          map.setBounds(bounds);
          if (count === 1) map.setLevel(3);
        }
        if (office) focusOffice.current?.();
        stopObserving = observeResize(element!, () => {
          const center = map.getCenter();
          map.relayout();
          map.setCenter(center);
        });
        const missing = locations.filter(({ coordinates }) => !coordinates).length;
        const messages = [
          count ? '식당 이름을 누르면 팀 리뷰를 볼 수 있어요.' : '표시할 위치가 없습니다. 식당이나 사무실 주소를 확인해주세요.',
          missing ? `${missing}곳은 주소를 찾지 못해 목록에만 표시됩니다.` : '',
          officeAddress && !office ? '사무실 위치가 지정되지 않았습니다. 사무실 설정에서 검색 결과를 선택해주세요.' : '',
        ];
        setStatus(messages.filter(Boolean).join(' '));
        setFailed(false);
      } catch {
        if (!cancelled) {
          setStatus('지도를 불러오지 못했습니다. 목록에서 식당을 확인하거나 카카오맵으로 열어보세요.');
          setFailed(true);
        }
      }
    }
    void renderMap();
    return () => {
      cancelled = true;
      focusOffice.current = null;
      showAll.current = null;
      stopObserving?.();
      overlays.forEach((overlay) => overlay.setMap(null));
    };
  }, [restaurants, officeAddress, officePlace, attempt]);

  function retry() {
    setFailed(false);
    setStatus('지도를 다시 불러오는 중입니다…');
    setAttempt((value) => value + 1);
  }

  return {
    container, status, failed, officeReady, hasApiKey: !!KAKAO_MAP_API_KEY,
    focusOffice: () => focusOffice.current?.(),
    showAll: () => showAll.current?.(),
    retry,
  };
}
