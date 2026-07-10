import { fetchJson } from '@/data/http';
import type { TierItem } from '@/data/types';

import type { CategoryAdapter } from './types';

interface SportsDBPlayer {
  idPlayer: string;
  strPlayer: string;
  strSport: string | null;
  strTeam: string | null;
  strThumb: string | null;
  strCutout: string | null;
}

/** TheSportsDB "3" is the documented public/test key — key-free for users. */
const API = 'https://www.thesportsdb.com/api/v1/json/3';

/** Team names sometimes come back as "_Free Agent Basketball" / "_Retired". */
function cleanTeam(team: string | null): string | undefined {
  if (!team) return undefined;
  const t = team.replace(/^_/, '').trim();
  if (!t || /^(free agent|retired)/i.test(t)) return undefined;
  return t;
}

/** Athletes via TheSportsDB (key-free). Cutout art looks great on a tile. */
export const sportsAdapter: CategoryAdapter = {
  category: 'sports',
  label: 'Athletes',
  glyph: '🏆',
  accentColor: '#F59E0B',
  blurb: 'Players & legends, with photos',
  isConfigured: () => true,

  async search(query, signal) {
    const url = `${API}/searchplayers.php?p=${encodeURIComponent(query)}`;
    const json = await fetchJson<{ player: SportsDBPlayer[] | null }>(url, { signal });
    return (json.player ?? [])
      .filter((p) => p.strCutout || p.strThumb)
      .map<TierItem>((p) => ({
        id: `sports:${p.idPlayer}`,
        name: p.strPlayer,
        imageUrl: p.strCutout || p.strThumb,
        subtitle: [p.strSport, cleanTeam(p.strTeam)].filter(Boolean).join(' · ') || undefined,
        category: 'sports',
      }));
  },
};
