'use client';

import { FormEvent, useState } from 'react';
import { notifier } from '@/services/notifier';
import { CreateReviewInput, Restaurant, Review } from '@/types/restaurant';

interface Options {
  restaurant: Restaurant;
  onAddReview: (restaurantId: string, input: CreateReviewInput) => Promise<void>;
  onDeleteReview: (restaurantId: string, reviewId: string) => Promise<void>;
}

export function useReviewForm({ restaurant, onAddReview, onDeleteReview }: Options) {
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!author.trim()) return setFormError('작성자 이름을 입력해주세요.');
    if (!content.trim()) return setFormError('리뷰 내용을 입력해주세요.');
    setFormError('');
    setIsSubmitting(true);
    try {
      await onAddReview(restaurant.id, { author: author.trim(), rating, content: content.trim() });
      setAuthor('');
      setRating(5);
      setContent('');
    } catch (error) {
      console.error(error);
      setFormError('리뷰 등록 중 문제가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!reviewToDelete) return;
    const reviewId = reviewToDelete.id;
    setReviewToDelete(null);
    setDeletingReviewId(reviewId);
    try {
      await onDeleteReview(restaurant.id, reviewId);
    } catch (error) {
      console.error(error);
      notifier.error('리뷰 삭제에 실패했습니다.');
    } finally {
      setDeletingReviewId(null);
    }
  }

  return {
    author, setAuthor, rating, setRating, content, setContent, formError, isSubmitting,
    reviewToDelete, requestDelete: setReviewToDelete, cancelDelete: () => setReviewToDelete(null),
    deletingReviewId, submit, confirmDelete,
  };
}
