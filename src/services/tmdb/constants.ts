export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
export const POSTER_SIZE = 'w342';
export const BACKDROP_SIZE = 'w780';

export function posterUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  return `${TMDB_IMAGE_BASE}/${POSTER_SIZE}${path}`;
}

export function backdropUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  return `${TMDB_IMAGE_BASE}/${BACKDROP_SIZE}${path}`;
}
