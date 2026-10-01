import { ApiError } from '@/server/errors';
import { isValidRating } from '@/types/rating';
import { parseSelectedPlace } from '@/types/place';
import {
  CreateRestaurantInput,
  CreateReviewInput,
  RestaurantCategory,
  RESTAURANT_CATEGORIES,
  UpdateRestaurantInput,
} from '@/types/restaurant';

type Body = Record<string, unknown>;

const asBody = (value: unknown): Body => (value && typeof value === 'object' ? (value as Body) : {});
const isFilled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isCategory = (value: unknown): value is RestaurantCategory =>
  typeof value === 'string' && (RESTAURANT_CATEGORIES as readonly string[]).includes(value);
const trimmed = (value: unknown) => (typeof value === 'string' ? value.trim() : undefined);

export function parsePlace(value: unknown) {
  try {
    return parseSelectedPlace(value);
  } catch (error) {
    throw new ApiError(400, (error as Error).message);
  }
}

export const PLACE_ADDRESS_MISMATCH = '선택한 식당의 주소가 일치하지 않습니다.';

export function parseCreateRestaurantInput(value: unknown): CreateRestaurantInput {
  const body = asBody(value);
  if (!isFilled(body.name)) throw new ApiError(400, '식당 이름을 입력해주세요.');
  if (!isCategory(body.category)) throw new ApiError(400, '유효한 카테고리를 선택해주세요.');
  if (!isFilled(body.address)) throw new ApiError(400, '식당 위치/주소를 입력해주세요.');
  if (!isFilled(body.description)) throw new ApiError(400, '식당 설명 또는 대표 메뉴를 입력해주세요.');
  const address = body.address.trim();
  let place: CreateRestaurantInput['place'];
  if (body.place !== undefined) {
    place = parsePlace(body.place);
    if (place.address !== address) throw new ApiError(400, PLACE_ADDRESS_MISMATCH);
  }
  return {
    ...(place ? { place } : {}),
    name: body.name.trim(),
    category: body.category,
    address,
    phone: trimmed(body.phone),
    description: body.description.trim(),
    imageUrl: trimmed(body.imageUrl),
    priceRange: trimmed(body.priceRange),
    openingHours: trimmed(body.openingHours),
  };
}

// The selected place is validated separately because it must match the stored address when the address is not edited.
export function parseUpdateRestaurantInput(value: unknown): { input: UpdateRestaurantInput; place?: NonNullable<UpdateRestaurantInput['place']> } {
  const body = asBody(value);
  const input: UpdateRestaurantInput = {};
  if (body.name !== undefined) {
    if (!isFilled(body.name)) throw new ApiError(400, '식당 이름은 비어있을 수 없습니다.');
    input.name = body.name.trim();
  }
  if (body.category !== undefined) {
    if (!isCategory(body.category)) throw new ApiError(400, '유효한 카테고리를 선택해주세요.');
    input.category = body.category;
  }
  if (body.address !== undefined) {
    if (!isFilled(body.address)) throw new ApiError(400, '식당 위치/주소는 비어있을 수 없습니다.');
    input.address = body.address.trim();
  }
  if (body.description !== undefined) {
    if (!isFilled(body.description)) throw new ApiError(400, '식당 설명은 비어있을 수 없습니다.');
    input.description = body.description.trim();
  }
  for (const key of ['phone', 'imageUrl', 'priceRange', 'openingHours'] as const) {
    if (body[key] !== undefined) input[key] = trimmed(body[key]) ?? '';
  }
  return { input, place: body.place !== undefined ? parsePlace(body.place) : undefined };
}

export function parseCreateReviewInput(value: unknown): CreateReviewInput {
  const { author, rating, content } = asBody(value);
  if (!isFilled(author)) throw new ApiError(400, '작성자 이름을 입력해주세요.');
  if (!isValidRating(rating)) throw new ApiError(400, '별점은 0.5~5점 사이에서 0.5점 단위로 선택해주세요.');
  if (!isFilled(content)) throw new ApiError(400, '리뷰 내용을 작성해주세요.');
  return { author: author.trim(), rating, content: content.trim() };
}
