import { NextRequest, NextResponse } from 'next/server';
import { getAllRestaurants, createRestaurant } from '@/lib/storage';
import { CreateRestaurantInput, RestaurantCategory } from '@/types/restaurant';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.toLowerCase() || '';
    const category = searchParams.get('category') || '';
    const sort = searchParams.get('sort') || 'latest';

    let restaurants = await getAllRestaurants();

    if (category && category !== '전체') {
      restaurants = restaurants.filter((r) => r.category === category);
    }

    if (q) {
      restaurants = restaurants.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.address.toLowerCase().includes(q)
      );
    }

    if (sort === 'rating') {
      restaurants.sort((a, b) => b.averageRating - a.averageRating);
    } else if (sort === 'reviews') {
      restaurants.sort((a, b) => b.reviewCount - a.reviewCount);
    } else if (sort === 'name') {
      restaurants.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    } else {
      // latest
      restaurants.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return NextResponse.json({ success: true, data: restaurants });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return NextResponse.json(
      { success: false, error: '식당 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, address, phone, description, imageUrl, priceRange, openingHours } =
      body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: '식당 이름을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!category || typeof category !== 'string') {
      return NextResponse.json(
        { success: false, error: '카테고리를 선택해주세요.' },
        { status: 400 }
      );
    }

    if (!address || typeof address !== 'string' || !address.trim()) {
      return NextResponse.json(
        { success: false, error: '식당 위치/주소를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json(
        { success: false, error: '식당 설명 또는 대표 메뉴를 입력해주세요.' },
        { status: 400 }
      );
    }

    const input: CreateRestaurantInput = {
      name: name.trim(),
      category: category as RestaurantCategory,
      address: address.trim(),
      phone: phone?.trim(),
      description: description.trim(),
      imageUrl: imageUrl?.trim(),
      priceRange: priceRange?.trim(),
      openingHours: openingHours?.trim(),
    };

    const created = await createRestaurant(input);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating restaurant:', error);
    return NextResponse.json(
      { success: false, error: '식당을 등록하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
