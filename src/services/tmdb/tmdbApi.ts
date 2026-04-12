import { getWithRetry, tmdbHttp } from '../api/httpClient';

import type {
  MovieDetail,
  MovieListItem,
  Paginated,
  SearchMultiResult,
  TvDetail,
  TvListItem,
  VideosResponse,
} from './types';

export async function fetchTrendingMovies() {
  return getWithRetry(() =>
    tmdbHttp.get<Paginated<MovieListItem>>('/trending/movie/day').then((r) => r.data),
  );
}

export async function fetchPopularMovies(page = 1) {
  return getWithRetry(() =>
    tmdbHttp
      .get<Paginated<MovieListItem>>('/movie/popular', { params: { page } })
      .then((r) => r.data),
  );
}

export async function fetchPopularTv(page = 1) {
  return getWithRetry(() =>
    tmdbHttp.get<Paginated<TvListItem>>('/tv/popular', { params: { page } }).then((r) => r.data),
  );
}

export async function searchMulti(query: string, page = 1) {
  const q = query.trim();
  if (!q) {
    return { page: 1, results: [] as SearchMultiResult[], total_pages: 0, total_results: 0 };
  }
  return getWithRetry(() =>
    tmdbHttp
      .get<Paginated<SearchMultiResult>>('/search/multi', { params: { query: q, page } })
      .then((r) => r.data),
  );
}

export async function fetchMovieDetail(id: number) {
  return getWithRetry(() => tmdbHttp.get<MovieDetail>(`/movie/${id}`).then((r) => r.data));
}

export async function fetchTvDetail(id: number) {
  return getWithRetry(() => tmdbHttp.get<TvDetail>(`/tv/${id}`).then((r) => r.data));
}

export async function fetchSimilarMovies(id: number) {
  return getWithRetry(() =>
    tmdbHttp.get<Paginated<MovieListItem>>(`/movie/${id}/similar`).then((r) => r.data),
  );
}

export async function fetchSimilarTv(id: number) {
  return getWithRetry(() =>
    tmdbHttp.get<Paginated<TvListItem>>(`/tv/${id}/similar`).then((r) => r.data),
  );
}

export async function fetchMovieVideos(id: number) {
  return getWithRetry(() =>
    tmdbHttp.get<VideosResponse>(`/movie/${id}/videos`).then((r) => r.data),
  );
}

export async function fetchTvVideos(id: number) {
  return getWithRetry(() => tmdbHttp.get<VideosResponse>(`/tv/${id}/videos`).then((r) => r.data));
}
