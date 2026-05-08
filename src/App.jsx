import { useMemo, useState } from "react";
import { searchSongs } from "./api/searchService";

function useDebouncedAction(delayMs = 800) {
  const [nextAllowedAt, setNextAllowedAt] = useState(0);

  return useMemo(() => {
    return async (action) => {
      const now = Date.now();
      if (now < nextAllowedAt) {
        return false;
      }
      setNextAllowedAt(now + delayMs);
      await action();
      return true;
    };
  }, [delayMs, nextAllowedAt]);
}

export default function App() {
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(true);

  const runDebounced = useDebouncedAction();

  async function onSearch() {
    const q = query.trim();
    if (!q) {
      setError("Lutfen bir sarki sozu girin.");
      setSongs([]);
      return;
    }

    const executed = await runDebounced(async () => {
      setLoading(true);
      setError("");
      try {
        const results = await searchSongs(q);
        if (!results.length) {
          setError("Eslesen bir sarki bulunamadi.");
          setSongs([]);
        } else {
          setSongs(results);
        }
      } catch (err) {
        setError(err.message || "Arama sirasinda hata olustu.");
        setSongs([]);
      } finally {
        setLoading(false);
      }
    });

    if (!executed) {
      setError("Cok hizli deneme yapildi. Lutfen kisa bir sure bekleyin.");
    }
  }

  const themeClass = darkMode ? "theme-dark" : "theme-light";

  return (
    <div className={`app-shell ${themeClass}`}>
      <div className="backdrop" />
      <main className="container">
        <header className="header">
          <h1>LyricMetric</h1>
          <button
            className="theme-toggle"
            onClick={() => setDarkMode((prev) => !prev)}
            type="button"
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </header>

        <section className="search-box">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ornek: sarkilar sokaklara"
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
          />
          <button type="button" onClick={onSearch} disabled={loading}>
            {loading ? "Araniyor..." : "Ara"}
          </button>
        </section>

        {error ? <p className="error">{error}</p> : null}

        <section className="result-list">
          {songs.map((song, idx) => {
            const scoreText = song.listenersLabel
              ? `${song.listenersLabel} dinlenme tahmini`
              : typeof song.popularity === "number"
                ? `%${song.popularity} populerlik`
                : `Genius sira: #${song.geniusRank ?? idx + 1}`;
            return (
              <article key={`${song.id}-${idx}`} className="result-card">
                <span className="rank">{idx + 1}</span>
                <img
                  src={song.thumbnail || "https://placehold.co/72x72?text=No+Art"}
                  alt={`${song.artist} - ${song.title}`}
                  loading="lazy"
                />
                <div className="meta">
                  <h3>
                    {song.artist} - {song.title}
                  </h3>
                  <p>{scoreText}</p>
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
