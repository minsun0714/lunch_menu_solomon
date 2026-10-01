'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Restaurant } from '@/types/restaurant';
import { SelectedPlace } from '@/types/place';
import { geocodeAddress, KakaoMap, loadKakaoMaps, MapOverlay } from '@/lib/kakao-maps';

interface Props {
  restaurants: Restaurant[];
  officeAddress: string;
  officePlace?: SelectedPlace;
  onSelect: (restaurant: Restaurant) => void;
}

const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_CLIENT_KEY?.trim()
  || process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY?.trim();

export default function RestaurantMap({ restaurants, officeAddress, officePlace, onSelect }: Props) {
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
    if (!apiKey || !container.current) return;
    let cancelled = false;
    const overlays: MapOverlay[] = [];
    let observer: ResizeObserver | undefined;

    async function renderMap() {
      try {
        const maps = await loadKakaoMaps(apiKey!);
        if (cancelled || !container.current) return;
        setOfficeReady(false);
        const map = mapRef.current ?? new maps.Map(container.current, { center: new maps.LatLng(37.5665, 126.978), level: 5 });
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
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'restaurant-map-pin';
          button.textContent = `${index + 1} · ${restaurant.name}`;
          button.setAttribute('aria-label', `${restaurant.name} 상세 정보 및 팀 리뷰 보기`);
          button.onclick = () => selectRef.current(restaurant);
          addOverlay(coordinates.lat, coordinates.lng, button);
        });
        if (office) {
          const label = document.createElement('div');
          label.className = 'restaurant-map-pin office-map-pin';
          label.textContent = '🏢 우리 사무실';
          label.title = officePlace ? `${officePlace.name} · ${officeAddress}` : officeAddress;
          addOverlay(office.lat, office.lng, label, 10);
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
        observer = new ResizeObserver(() => {
          const center = map.getCenter();
          map.relayout();
          map.setCenter(center);
        });
        observer.observe(container.current!);
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
      observer?.disconnect();
      overlays.forEach((overlay) => overlay.setMap(null));
    };
  }, [restaurants, officeAddress, officePlace, attempt]);

  return (
    <section aria-label="팀 맛집 지도" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div><h2 className="text-sm font-bold">우리 팀 맛집 지도</h2><p className="mt-1 text-xs text-slate-500">{officeAddress || '사무실을 설정하면 식당 위치와 함께 볼 수 있어요.'}</p></div>
        <Link href="/settings" className="shrink-0 text-xs font-semibold text-orange-700 hover:underline">사무실 설정</Link>
      </div>
      <div className="relative">
        <div ref={container} className="h-[340px] bg-slate-100 lg:h-[540px]" />
        {officeReady && !failed && <div className="absolute right-3 top-3 z-10 flex gap-2">
          <button type="button" onClick={() => focusOffice.current?.()} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700 shadow-sm">사무실로 이동</button>
          <button type="button" onClick={() => showAll.current?.()} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">전체 보기</button>
        </div>}
        {(!apiKey || failed) && <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100 px-8 text-center">
          <div className="max-w-xs"><p className="font-semibold text-slate-700">지도를 사용할 수 없습니다</p><p className="mt-2 text-sm leading-6 text-slate-500">목록의 ‘카카오맵에서 보기’로 식당 위치를 확인할 수 있어요.</p>
            {failed && <button type="button" onClick={() => { setFailed(false); setStatus('지도를 다시 불러오는 중입니다…'); setAttempt(attempt + 1); }} className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">다시 시도</button>}
          </div>
        </div>}
      </div>
      <p role="status" className="border-t border-slate-100 px-5 py-3 text-xs leading-5 text-slate-500">{apiKey ? status : '지도 연결을 준비 중입니다. 식당 목록과 리뷰는 이용할 수 있어요.'}</p>
    </section>
  );
}
