import type { Category } from '@/data/types';

import { animeAdapter } from './anime';
import { itunesMusicAdapter } from './itunesMusic';
import { mealdbAdapter } from './mealdb';
import { openLibraryAdapter } from './openLibrary';
import { rawgAdapter } from './rawg';
import { sportsAdapter } from './sports';
import { tmdbAdapter } from './tmdb';
import type { CategoryAdapter } from './types';
import { wikipediaAdapter } from './wikipedia';

export const adapters: Record<Category, CategoryAdapter> = {
  games: rawgAdapter,
  movies: tmdbAdapter,
  food: mealdbAdapter,
  music: itunesMusicAdapter,
  books: openLibraryAdapter,
  anime: animeAdapter,
  sports: sportsAdapter,
  anything: wikipediaAdapter,
};

export function listCategories(): CategoryAdapter[] {
  return Object.values(adapters);
}
