import { supabase } from '@/lib/supabase';
import type { Category, TierList } from '@/data/types';
import { listToDraft, type ImportDraft } from '@/utils/share';

/**
 * Community data layer — publish / browse / like against Supabase.
 * Every function assumes `supabase` is configured; callers gate on
 * `isCommunityEnabled` before showing any community UI.
 *
 * The author embed must name its foreign key
 * (`profiles!published_lists_author_id_fkey`): likes and reports also join
 * lists to profiles, so an unqualified `profiles(...)` embed is ambiguous and
 * PostgREST rejects it with PGRST201.
 */

export type FeedSort = 'hot' | 'new';

export interface PublishedList {
  id: string;
  author_id: string;
  title: string;
  category: Category;
  tagline: string | null;
  tiers: ImportDraft['tiers'];
  like_count: number;
  created_at: string;
  author?: { display_name: string | null; avatar_url: string | null } | null;
  /** Filled in client-side from the viewer's likes. */
  liked?: boolean;
}

function client() {
  if (!supabase) throw new Error('Community backend is not configured.');
  return supabase;
}

async function currentUserId(): Promise<string | null> {
  const { data } = await client().auth.getUser();
  return data.user?.id ?? null;
}

/** Publish one of the viewer's boards to the community feed. */
export async function publishList(list: TierList, tagline?: string): Promise<PublishedList> {
  const uid = await currentUserId();
  if (!uid) throw new Error('Sign in to publish.');
  const draft = listToDraft(list);
  const { data, error } = await client()
    .from('published_lists')
    .insert({
      author_id: uid,
      title: list.title,
      category: list.category,
      tagline: tagline ?? null,
      tiers: draft.tiers,
    })
    .select(`*, author:profiles!published_lists_author_id_fkey(display_name, avatar_url)`)
    .single();
  if (error) throw error;
  return data as PublishedList;
}

/** A page of community lists, sorted hot (most-liked) or new, with liked flags. */
export async function fetchFeed(
  sort: FeedSort,
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {}
): Promise<PublishedList[]> {
  let q = client()
    .from('published_lists')
    .select(`*, author:profiles!published_lists_author_id_fkey(display_name, avatar_url)`)
    .range(offset, offset + limit - 1);
  q = sort === 'hot'
    ? q.order('like_count', { ascending: false }).order('created_at', { ascending: false })
    : q.order('created_at', { ascending: false });
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as PublishedList[];

  const liked = await fetchLikedIds(rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, liked: liked.has(r.id) }));
}

/** One published list by id (for the detail view), with the viewer's liked flag. */
export async function fetchPublished(id: string): Promise<PublishedList | null> {
  const { data, error } = await client()
    .from('published_lists')
    .select(`*, author:profiles!published_lists_author_id_fkey(display_name, avatar_url)`)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const liked = await fetchLikedIds([id]);
  return { ...(data as PublishedList), liked: liked.has(id) };
}

/** Which of the given list ids the signed-in viewer has liked (empty if signed out). */
export async function fetchLikedIds(listIds: string[]): Promise<Set<string>> {
  const uid = await currentUserId();
  if (!uid || listIds.length === 0) return new Set();
  const { data, error } = await client()
    .from('likes')
    .select('list_id')
    .eq('user_id', uid)
    .in('list_id', listIds);
  if (error) return new Set();
  return new Set((data ?? []).map((r) => r.list_id as string));
}

/** Like or unlike a list. Requires sign-in (RLS enforces user_id = auth.uid()). */
export async function setLike(listId: string, liked: boolean): Promise<void> {
  const uid = await currentUserId();
  if (!uid) throw new Error('Sign in to like.');
  if (liked) {
    const { error } = await client().from('likes').insert({ user_id: uid, list_id: listId });
    // Ignore duplicate-like races (unique PK violation).
    if (error && error.code !== '23505') throw error;
  } else {
    const { error } = await client().from('likes').delete().eq('user_id', uid).eq('list_id', listId);
    if (error) throw error;
  }
}

/** Flag a list for moderation. Reports are only visible to you in the dashboard. */
export async function reportList(listId: string, reason: string): Promise<void> {
  const uid = await currentUserId();
  const { error } = await client()
    .from('reports')
    .insert({ list_id: listId, reporter_id: uid, reason });
  if (error) throw error;
}

/** Delete one of the viewer's own published lists (RLS enforces ownership). */
export async function unpublishList(id: string): Promise<void> {
  const { error } = await client().from('published_lists').delete().eq('id', id);
  if (error) throw error;
}

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

/** The signed-in viewer's own profile row, or null if signed out. */
export async function fetchMyProfile(): Promise<Profile | null> {
  const uid = await currentUserId();
  if (!uid) return null;
  const { data, error } = await client()
    .from('profiles')
    .select('id, display_name, avatar_url')
    .eq('id', uid)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

/**
 * Is this display name free? Case-insensitive, ignoring the viewer's own row so
 * re-saving your current name doesn't read as "taken". `name` is matched as a
 * literal — callers pass a plain name, never a pattern.
 */
export async function isNameAvailable(name: string): Promise<boolean> {
  const uid = await currentUserId();
  const target = name.trim().toLowerCase();
  // ilike narrows server-side, but `_`/`%` in the name are ILIKE wildcards, so
  // re-check exact (case-insensitive) equality in JS. The DB unique index is
  // still the authority on save.
  const { data, error } = await client()
    .from('profiles')
    .select('id, display_name')
    .ilike('display_name', name);
  if (error) return true; // fall through to the DB unique index on save
  return !(data ?? []).some(
    (r) => (r as Profile).display_name?.trim().toLowerCase() === target && (r as Profile).id !== uid
  );
}

/** Update the viewer's name and/or avatar. Throws a friendly error if the name
 *  is taken (unique-violation 23505 from the DB index). */
export async function updateProfile(patch: { display_name?: string; avatar_url?: string }): Promise<void> {
  const uid = await currentUserId();
  if (!uid) throw new Error('Sign in first.');
  const { error } = await client().from('profiles').update(patch).eq('id', uid);
  if (error) {
    if (error.code === '23505') throw new Error('That name is already taken.');
    throw error;
  }
}
