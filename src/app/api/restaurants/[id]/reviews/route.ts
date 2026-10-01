import { NextRequest, NextResponse } from 'next/server';
import { addReview } from '@/lib/storage';
import { CreateReviewInput } from '@/types/restaurant';
import { isValidRating } from '@/types/rating';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params;
    const body = await request.json();
    const { author, rating, content } = body;

    if (!author || typeof author !== 'string' || !author.trim()) {
      return NextResponse.json(
        { success: false, error: '작성자 이름을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!isValidRating(rating)) {
      return NextResponse.json(
        { success: false, error: '별점은 0.5~5점 사이에서 0.5점 단위로 선택해주세요.' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { success: false, error: '리뷰 내용을 작성해주세요.' },
        { status: 400 }
      );
    }

    const input: CreateReviewInput = {
      author: author.trim(),
      rating,
      content: content.trim(),
    };

    const createdReview = await addReview(restaurantId, input);
    if (!createdReview) {
      return NextResponse.json(
        { success: false, error: '해당 식당을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: createdReview }, { status: 201 });
  } catch (error) {
    console.error('Error adding review:', error);
    return NextResponse.json(
      { success: false, error: '리뷰를 등록하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
