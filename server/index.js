import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const GENIUS_URL = "https://api.genius.com/search";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_SEARCH_URL = "https://api.spotify.com/v1/search";

let spotifyTokenCache = {
  token: "",
  expiresAt: 0
};

function toListenersLabel(popularity) {
  if (typeof popularity !== "number") {
    return null;
  }
  if (popularity >= 85) {
    return "Yuksek";
  }
  if (popularity >= 60) {
    return "Orta";
  }
  if (popularity >= 35) {
    return "Gelisen";
  }
  return "Dusuk";
}

async function getSpotifyAccessToken() {
  const now = Date.now();
  if (spotifyTokenCache.token && now < spotifyTokenCache.expiresAt) {
    return spotifyTokenCache.token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  const body = new URLSearchParams();
  body.set("grant_type", "client_credentials");

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const token = data?.access_token;
  const expiresIn = Number(data?.expires_in ?? 0);

  if (!token || !expiresIn) {
    return null;
  }

  spotifyTokenCache = {
    token,
    expiresAt: now + Math.max(expiresIn - 30, 1) * 1000
  };

  return token;
}

async function searchSpotifyTrack(trackTitle, artistName, token) {
  const url = new URL(SPOTIFY_SEARCH_URL);
  url.searchParams.set("q", `track:${trackTitle} artist:${artistName}`);
  url.searchParams.set("type", "track");
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data?.tracks?.items?.[0] ?? null;
}

app.get("/api/search", async (req, res) => {
  try {
    const q = String(req.query.q ?? "").trim();
    if (!q) {
      return res.status(400).json({ message: "Arama metni zorunlu." });
    }

    const geniusToken = process.env.GENIUS_ACCESS_TOKEN;
    if (!geniusToken) {
      return res.status(500).json({ message: "GENIUS_ACCESS_TOKEN eksik." });
    }

    const geniusUrl = new URL(GENIUS_URL);
    geniusUrl.searchParams.set("q", q);

    const geniusResponse = await fetch(geniusUrl.toString(), {
      headers: {
        Authorization: `Bearer ${geniusToken}`
      }
    });

    if (!geniusResponse.ok) {
      return res.status(502).json({ message: "Genius API hatasi." });
    }

    const geniusData = await geniusResponse.json();
    const hits = geniusData?.response?.hits ?? [];

    const rankedHits = hits.slice(0, 12);
    if (!rankedHits.length) {
      return res.json({ items: [] });
    }

    const spotifyToken = await getSpotifyAccessToken();

    const items = await Promise.all(
      rankedHits.map(async (hit, index) => {
        const result = hit?.result;
        const title = result?.title ?? "";
        const artist = result?.primary_artist?.name ?? "";

        let spotifyTrack = null;
        if (spotifyToken && title && artist) {
          spotifyTrack = await searchSpotifyTrack(title, artist, spotifyToken);
        }

        const popularity = spotifyTrack?.popularity ?? null;

        return {
          id: result?.id ?? spotifyTrack?.id ?? crypto.randomUUID(),
          title,
          artist,
          thumbnail:
            spotifyTrack?.album?.images?.[2]?.url ??
            spotifyTrack?.album?.images?.[1]?.url ??
            spotifyTrack?.album?.images?.[0]?.url ??
            result?.song_art_image_thumbnail_url ??
            result?.song_art_image_url ??
            null,
          popularity,
          listeners: popularity,
          listenersLabel: toListenersLabel(popularity),
          geniusRank: index + 1
        };
      })
    );

    const sorted = items.filter((item) => item.title && item.artist);

    res.json({ items: sorted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Beklenmeyen bir hata olustu." });
  }
});

app.listen(PORT, () => {
  console.log(`Backend API hazir: http://localhost:${PORT}`);
});
