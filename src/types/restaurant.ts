export type RestaurantCategory =
  | '한식'
  | '일식'
  | '중식'
  | '양식'
  | '분식'
  | '아시안'
  | '카페/디저트'
  | '기타';

export interface Review {
  id: string;
  restaurantId: string;
  author: string; // 작성자 이름
  rating: number; // 별점 (1 ~ 5)
  content: string; // 리뷰 내용
  createdAt: string; // ISO date string
}

export interface Restaurant {
  id: string;
  name: string; // 식당 이름
  category: RestaurantCategory; // 카테고리
  address: string; // 주소 및 위치
  phone?: string; // 전화번호
  description: string; // 설명 및 대표 메뉴
  imageUrl?: string; // 이미지 URL
  priceRange?: string; // 가격대
  openingHours?: string; // 영업시간
  reviews: Review[]; // 리뷰 목록
  averageRating: number; // 평균 별점 (1~5 소수점 1자리)
  reviewCount: number; // 리뷰 개수
  createdAt: string; // 등록 일시
  updatedAt: string; // 수정 일시
}

export interface CreateRestaurantInput {
  name: string;
  category: RestaurantCategory;
  address: string;
  phone?: string;
  description: string;
  imageUrl?: string;
  priceRange?: string;
  openingHours?: string;
}

export interface UpdateRestaurantInput {
  name?: string;
  category?: RestaurantCategory;
  address?: string;
  phone?: string;
  description?: string;
  imageUrl?: string;
  priceRange?: string;
  openingHours?: string;
}

export interface CreateReviewInput {
  author: string;
  rating: number;
  content: string;
}
