import { NextRequest, NextResponse } from 'next/server';
import { getRestaurantById, updateRestaurant, deleteRestaurant } from '@/lib/storage';
import { UpdateRestaurantInput, RestaurantCategory } from '@/types/restaurant';

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
    if (body.name !== undefined) updateData.name = body.name;
    if (body.category !== undefined) updateData.category = body.category as RestaurantCategory;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.priceRange !== undefined) updateData.priceRange = body.priceRange;
    if (body.openingHours !== undefined) updateData.openingHours = body.openingHours;

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
