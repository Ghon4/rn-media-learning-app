/**
 * Second data source (no API key) — demonstrates a separate base URL from TMDB.
 * @see https://openlibrary.org/developers/api
 */
const OPEN_LIBRARY_SEARCH = 'https://openlibrary.org/search.json';

type SearchResponse = {
  docs?: {
    title?: string;
    author_name?: string[];
    key?: string;
  }[];
};

export type OpenLibraryBook = {
  title: string;
  authorName?: string;
  key?: string;
};

export async function fetchSampleOpenLibraryTitle(): Promise<string | null> {
  const url = `${OPEN_LIBRARY_SEARCH}?q=the+martian&limit=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = (await res.json()) as SearchResponse;
  const title = json.docs?.[0]?.title;
  return typeof title === 'string' ? title : null;
}

export async function searchBooksByTitle(title: string, limit = 8): Promise<OpenLibraryBook[]> {
  const q = title.trim();
  if (!q) return [];
  const url = `${OPEN_LIBRARY_SEARCH}?q=${encodeURIComponent(q)}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = (await res.json()) as SearchResponse;
  const docs = json.docs ?? [];
  return docs.slice(0, limit).map((d) => ({
    title: typeof d.title === 'string' ? d.title : 'Untitled',
    authorName: d.author_name?.[0],
    key: typeof d.key === 'string' ? d.key : undefined,
  }));
}
