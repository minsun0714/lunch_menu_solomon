import { NextRequest } from 'next/server';
import { handleRoute, okMessage } from '@/server/http';
import { deleteReview } from '@/server/services/restaurant-service';

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string; reviewId: string }> }) {
  return handleRoute({ error: '리뷰를 삭제하는 중 오류가 발생했습니다.', log: 'Error deleting review:' }, async () => {
    const { id, reviewId } = await params;
    await deleteReview(id, reviewId);
    return okMessage('리뷰가 삭제되었습니다.');
  });
}
