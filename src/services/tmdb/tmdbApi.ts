import { getWithRetry, tmdbHttp } from '../api/httpClient';

import type {
  DiscoverMovieSort,
  DiscoverTvSort,
  MovieDetail,
  MovieListItem,
  MovieTvCredits,
  Paginated,
  PersonCombinedCredits,
  PersonProfile,
  SearchMultiResult,
  TvDetail,
  TvListItem,
  TvSeasonDetail,
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

export async function searchMovie(query: string, page = 1) {
  const q = query.trim();
  if (!q) {
    return { page: 1, results: [] as MovieListItem[], total_pages: 0, total_results: 0 };
  }
  return getWithRetry(() =>
    tmdbHttp
      .get<Paginated<MovieListItem>>('/search/movie', { params: { query: q, page } })
      .then((r) => r.data),
  );
}

export async function searchTv(query: string, page = 1) {
  const q = query.trim();
  if (!q) {
    return { page: 1, results: [] as TvListItem[], total_pages: 0, total_results: 0 };
  }
  return getWithRetry(() =>
    tmdbHttp
      .get<Paginated<TvListItem>>('/search/tv', { params: { query: q, page } })
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

export async function fetchMovieGenres() {
  return getWithRetry(() =>
    tmdbHttp.get<{ genres: { id: number; name: string }[] }>('/genre/movie/list').then((r) => r.data),
  );
}

export async function fetchTvGenres() {
  return getWithRetry(() =>
    tmdbHttp.get<{ genres: { id: number; name: string }[] }>('/genre/tv/list').then((r) => r.data),
  );
}

export async function discoverMovies(params: {
  page?: number;
  with_genres?: string;
  primary_release_year?: number;
  sort_by?: DiscoverMovieSort;
}) {
  return getWithRetry(() =>
    tmdbHttp.get<Paginated<MovieListItem>>('/discover/movie', { params }).then((r) => r.data),
  );
}

export async function discoverTv(params: {
  page?: number;
  with_genres?: string;
  first_air_date_year?: number;
  sort_by?: DiscoverTvSort;
}) {
  return getWithRetry(() =>
    tmdbHttp.get<Paginated<TvListItem>>('/discover/tv', { params }).then((r) => r.data),
  );
}

export async function fetchNowPlayingMovies(page = 1) {
  return getWithRetry(() =>
    tmdbHttp
      .get<Paginated<MovieListItem>>('/movie/now_playing', { params: { page } })
      .then((r) => r.data),
  );
}

export async function fetchUpcomingMovies(page = 1) {
  return getWithRetry(() =>
    tmdbHttp
      .get<Paginated<MovieListItem>>('/movie/upcoming', { params: { page } })
      .then((r) => r.data),
  );
}

export async function fetchTopRatedMovies(page = 1) {
  return getWithRetry(() =>
    tmdbHttp
      .get<Paginated<MovieListItem>>('/movie/top_rated', { params: { page } })
      .then((r) => r.data),
  );
}

export async function fetchMovieRecommendations(id: number, page = 1) {
  return getWithRetry(() =>
    tmdbHttp
      .get<Paginated<MovieListItem>>(`/movie/${id}/recommendations`, { params: { page } })
      .then((r) => r.data),
  );
}

export async function fetchTvRecommendations(id: number, page = 1) {
  return getWithRetry(() =>
    tmdbHttp
      .get<Paginated<TvListItem>>(`/tv/${id}/recommendations`, { params: { page } })
      .then((r) => r.data),
  );
}

export async function fetchTvSeasonDetail(tvId: number, seasonNumber: number) {
  return getWithRetry(() =>
    tmdbHttp.get<TvSeasonDetail>(`/tv/${tvId}/season/${seasonNumber}`).then((r) => r.data),
  );
}

export async function fetchMovieCredits(id: number) {
  return getWithRetry(() =>
    tmdbHttp.get<MovieTvCredits>(`/movie/${id}/credits`).then((r) => r.data),
  );
}

export async function fetchTvCredits(id: number) {
  return getWithRetry(() =>
    tmdbHttp.get<MovieTvCredits>(`/tv/${id}/credits`).then((r) => r.data),
  );
}

export async function fetchPersonProfile(id: number) {
  return getWithRetry(() => tmdbHttp.get<PersonProfile>(`/person/${id}`).then((r) => r.data));
}

export async function fetchPersonCombinedCredits(id: number) {
  return getWithRetry(() =>
    tmdbHttp.get<PersonCombinedCredits>(`/person/${id}/combined_credits`).then((r) => r.data),
  );
}
