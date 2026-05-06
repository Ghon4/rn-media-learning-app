import { mapSearchMultiResults } from '../searchMappers';
import type { SearchMultiResult } from '../../../services/tmdb/types';

describe('mapSearchMultiResults', () => {
  it('maps movies and tv, skips people', () => {
    const input: SearchMultiResult[] = [
      {
        media_type: 'movie',
        id: 1,
        title: 'A',
        poster_path: '/p.jpg',
        overview: '',
        vote_average: 8,
        release_date: '2020-01-01',
      },
      {
        media_type: 'tv',
        id: 2,
        name: 'B',
        poster_path: null,
        overview: '',
        vote_average: 7,
        first_air_date: '2019-06-01',
      },
      { media_type: 'person', id: 3, name: 'Actor' },
    ];
    const out = mapSearchMultiResults(input);
    expect(out).toEqual([
      {
        kind: 'movie',
        id: 1,
        title: 'A',
        posterPath: '/p.jpg',
        subtitle: '2020',
      },
      {
        kind: 'tv',
        id: 2,
        title: 'B',
        posterPath: null,
        subtitle: '2019',
      },
    ]);
  });

  it('returns empty for empty input', () => {
    expect(mapSearchMultiResults([])).toEqual([]);
  });
});
