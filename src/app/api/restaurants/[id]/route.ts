import { NextRequest } from 'next/server';
import { handleRoute, ok, okMessage } from '@/server/http';
import { deleteRestaurant, getRestaurant, updateRestaurant } from '@/server/services/restaurant-service';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  return handleRoute({ error: '식당 정보를 불러오는 중 오류가 발생했습니다.', log: 'Error fetching restaurant:' }, async () => (
    ok(await getRestaurant((await params).id))
  ));
}

export async function PUT(request: NextRequest, { params }: Context) {
  return handleRoute({ error: '식당 정보를 수정하는 중 오류가 발생했습니다.', log: 'Error updating restaurant:' }, async () => (
    ok(await updateRestaurant((await params).id, await request.json()))
  ));
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  return handleRoute({ error: '식당을 삭제하는 중 오류가 발생했습니다.', log: 'Error deleting restaurant:' }, async () => {
    await deleteRestaurant((await params).id);
    return okMessage('식당이 삭제되었습니다.');
  });
}
