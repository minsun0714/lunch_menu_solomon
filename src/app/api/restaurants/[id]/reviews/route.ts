import { NextRequest } from 'next/server';
import { created, handleRoute } from '@/server/http';
import { addReview } from '@/server/services/restaurant-service';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute({ error: '리뷰를 등록하는 중 오류가 발생했습니다.', log: 'Error adding review:' }, async () => (
    created(await addReview((await params).id, await request.json()))
  ));
}
