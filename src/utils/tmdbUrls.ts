import type { MediaType } from '../services/tmdb/types';

export function tmdbWebUrl(mediaType: MediaType, id: number): string {
  return mediaType === 'tv'
    ? `https://www.themoviedb.org/tv/${id}`
    : `https://www.themoviedb.org/movie/${id}`;
}

export function tmdbPersonWebUrl(id: number): string {
  return `https://www.themoviedb.org/person/${id}`;
}
