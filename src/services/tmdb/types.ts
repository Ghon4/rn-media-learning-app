export type MediaType = 'movie' | 'tv';

export type Paginated<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

export type MovieListItem = {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  overview: string;
  vote_average: number;
  release_date?: string;
};

export type TvListItem = {
  id: number;
  name: string;
  poster_path: string | null;
  overview: string;
  vote_average: number;
  first_air_date?: string;
};

export type MovieDetail = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  runtime?: number | null;
  genres: { id: number; name: string }[];
  release_date?: string;
};

export type TvDetail = {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  episode_run_time?: number[];
  genres: { id: number; name: string }[];
  first_air_date?: string;
};

export type SearchMultiResult =
  | (MovieListItem & { media_type: 'movie' })
  | (TvListItem & { media_type: 'tv' })
  | { media_type: 'person'; id: number; name: string };

export type VideoResult = {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
};

export type VideosResponse = {
  results: VideoResult[];
};
