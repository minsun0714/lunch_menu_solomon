'use client';

import { useEffect, useRef, useState } from 'react';
import { Restaurant } from '@/types/restaurant';

const TOTAL_FLIPS = 16;
const FLIP_INTERVAL_MS = 90;

const pickRandom = (restaurants: Restaurant[]) => restaurants[Math.floor(Math.random() * restaurants.length)];

export function useRandomPicker(restaurants: Restaurant[]) {
  const [selected, setSelected] = useState<Restaurant | null>(() => (restaurants.length ? pickRandom(restaurants) : null));
  const [isSpinning, setIsSpinning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  function spin() {
    if (restaurants.length === 0) return;
    setIsSpinning(true);
    let counter = 0;
    timer.current = setInterval(() => {
      setSelected(pickRandom(restaurants));
      counter++;
      if (counter >= TOTAL_FLIPS) {
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        setIsSpinning(false);
      }
    }, FLIP_INTERVAL_MS);
  }

  return { selected, isSpinning, spin };
}
