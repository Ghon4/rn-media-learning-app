import type { SearchMultiResult } from '../../services/tmdb/types';

export type SearchRow =
  | { kind: 'movie'; id: number; title: string; posterPath: string | null; subtitle?: string }
  | { kind: 'tv'; id: number; title: string; posterPath: string | null; subtitle?: string };

export function mapSearchMultiResults(results: SearchMultiResult[]): SearchRow[] {
  const rows: SearchRow[] = [];
  for (const r of results) {
    if (r.media_type === 'movie' && 'title' in r) {
      rows.push({
        kind: 'movie',
        id: r.id,
        title: r.title,
        posterPath: r.poster_path,
        subtitle: r.release_date?.slice(0, 4),
      });
    } else if (r.media_type === 'tv' && 'name' in r) {
      rows.push({
        kind: 'tv',
        id: r.id,
        title: r.name,
        posterPath: r.poster_path,
        subtitle: r.first_air_date?.slice(0, 4),
      });
    }
  }
  return rows;
}
