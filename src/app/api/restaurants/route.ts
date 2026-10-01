import { NextRequest } from 'next/server';
import { created, handleRoute, ok } from '@/server/http';
import { createRestaurant, listRestaurants } from '@/server/services/restaurant-service';

export async function GET(request: NextRequest) {
  return handleRoute({ error: '식당 목록을 불러오는 중 오류가 발생했습니다.', log: 'Error fetching restaurants:' }, async () => {
    const { searchParams } = new URL(request.url);
    return ok(await listRestaurants({
      query: searchParams.get('q') || '',
      category: searchParams.get('category') || '',
      sort: searchParams.get('sort') || 'latest',
    }));
  });
}

export async function POST(request: NextRequest) {
  return handleRoute({ error: '식당을 등록하는 중 오류가 발생했습니다.', log: 'Error creating restaurant:' }, async () => (
    created(await createRestaurant(await request.json()))
  ));
}
