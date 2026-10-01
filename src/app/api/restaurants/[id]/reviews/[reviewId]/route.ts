import { NextRequest, NextResponse } from 'next/server';
import { deleteReview } from '@/lib/storage';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const { id: restaurantId, reviewId } = await params;
    const success = await deleteReview(restaurantId, reviewId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: '삭제할 리뷰 또는 식당을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: '리뷰가 삭제되었습니다.' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { success: false, error: '리뷰를 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
