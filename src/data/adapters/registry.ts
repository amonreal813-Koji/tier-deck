import type { Category } from '@/data/types';

import { itunesMusicAdapter } from './itunesMusic';
import { mealdbAdapter } from './mealdb';
import { rawgAdapter } from './rawg';
import { tmdbAdapter } from './tmdb';
import type { CategoryAdapter } from './types';

export const adapters: Record<Category, CategoryAdapter> = {
  games: rawgAdapter,
  movies: tmdbAdapter,
  food: mealdbAdapter,
  music: itunesMusicAdapter,
};

export function listCategories(): CategoryAdapter[] {
  return Object.values(adapters);
}
