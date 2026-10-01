import { NextRequest, NextResponse } from 'next/server';
import { getRestaurantById, updateRestaurant, deleteRestaurant } from '@/lib/storage';
import { UpdateRestaurantInput, RestaurantCategory, RESTAURANT_CATEGORIES } from '@/types/restaurant';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const restaurant = await getRestaurantById(id);

    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: '식당을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: restaurant });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return NextResponse.json(
      { success: false, error: '식당 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: UpdateRestaurantInput = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim()) {
        return NextResponse.json(
          { success: false, error: '식당 이름은 비어있을 수 없습니다.' },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.category !== undefined) {
      if (typeof body.category !== 'string' || !RESTAURANT_CATEGORIES.includes(body.category as RestaurantCategory)) {
        return NextResponse.json(
          { success: false, error: '유효한 카테고리를 선택해주세요.' },
          { status: 400 }
        );
      }
      updateData.category = body.category as RestaurantCategory;
    }

    if (body.address !== undefined) {
      if (typeof body.address !== 'string' || !body.address.trim()) {
        return NextResponse.json(
          { success: false, error: '식당 위치/주소는 비어있을 수 없습니다.' },
          { status: 400 }
        );
      }
      updateData.address = body.address.trim();
    }

    if (body.description !== undefined) {
      if (typeof body.description !== 'string' || !body.description.trim()) {
        return NextResponse.json(
          { success: false, error: '식당 설명은 비어있을 수 없습니다.' },
          { status: 400 }
        );
      }
      updateData.description = body.description.trim();
    }

    if (body.phone !== undefined) {
      updateData.phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    }
    if (body.imageUrl !== undefined) {
      updateData.imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
    }
    if (body.priceRange !== undefined) {
      updateData.priceRange = typeof body.priceRange === 'string' ? body.priceRange.trim() : '';
    }
    if (body.openingHours !== undefined) {
      updateData.openingHours = typeof body.openingHours === 'string' ? body.openingHours.trim() : '';
    }

    const updated = await updateRestaurant(id, updateData);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: '식당을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating restaurant:', error);
    return NextResponse.json(
      { success: false, error: '식당 정보를 수정하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteRestaurant(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: '삭제할 식당을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: '식당이 삭제되었습니다.' });
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    return NextResponse.json(
      { success: false, error: '식당을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
