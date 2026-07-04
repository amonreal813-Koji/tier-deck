import { fetchJson } from '@/data/http';
import type { TierItem } from '@/data/types';

import type { CategoryAdapter } from './types';

interface Meal {
  idMeal: string;
  strMeal: string;
  strMealThumb: string | null;
  strCategory: string | null;
  strArea: string | null;
}

interface Drink {
  idDrink: string;
  strDrink: string;
  strDrinkThumb: string | null;
  strCategory: string | null;
}

export const mealdbAdapter: CategoryAdapter = {
  category: 'food',
  label: 'Food & Drinks',
  glyph: '🍜',
  accentColor: '#FF8A3D',
  blurb: 'Dishes, desserts and cocktails',
  isConfigured: () => true,

  async search(query, signal) {
    const q = encodeURIComponent(query);
    // Meals and drinks in parallel; either source failing shouldn't kill the other.
    const [meals, drinks] = await Promise.allSettled([
      fetchJson<{ meals: Meal[] | null }>(`https://www.themealdb.com/api/json/v1/1/search.php?s=${q}`, { signal }),
      fetchJson<{ drinks: Drink[] | null }>(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${q}`, { signal }),
    ]);

    const items: TierItem[] = [];

    if (meals.status === 'fulfilled') {
      for (const m of meals.value.meals ?? []) {
        items.push({
          id: `food:meal-${m.idMeal}`,
          name: m.strMeal,
          imageUrl: m.strMealThumb,
          subtitle: [m.strCategory, m.strArea].filter(Boolean).join(' · ') || undefined,
          category: 'food',
        });
      }
    }

    if (drinks.status === 'fulfilled') {
      for (const d of drinks.value.drinks ?? []) {
        items.push({
          id: `food:drink-${d.idDrink}`,
          name: d.strDrink,
          imageUrl: d.strDrinkThumb,
          subtitle: d.strCategory ? `Drink · ${d.strCategory}` : 'Drink',
          category: 'food',
        });
      }
    }

    // Both requests failed → surface the meal error so the UI can react.
    if (meals.status === 'rejected' && drinks.status === 'rejected') {
      throw meals.reason;
    }

    return items;
  },
};
