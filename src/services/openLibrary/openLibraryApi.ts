/**
 * Second data source (no API key) — demonstrates a separate base URL from TMDB.
 * @see https://openlibrary.org/developers/api
 */
const OPEN_LIBRARY_SEARCH = 'https://openlibrary.org/search.json';

type SearchResponse = {
  docs?: { title?: string }[];
};

export async function fetchSampleOpenLibraryTitle(): Promise<string | null> {
  const url = `${OPEN_LIBRARY_SEARCH}?q=the+martian&limit=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = (await res.json()) as SearchResponse;
  const title = json.docs?.[0]?.title;
  return typeof title === 'string' ? title : null;
}
