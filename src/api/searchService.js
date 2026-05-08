const BASE_URL = "http://localhost:3001";

export async function searchSongs(query) {
  const url = new URL("/api/search", BASE_URL);
  url.searchParams.set("q", query);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? "Arama islemi basarisiz.");
  }

  return data.items ?? [];
}
