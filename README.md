# 🎵 LyricMetric

**LyricMetric** is a full-stack web application that allows users to discover songs based on lyric snippets and analyzes their popularity using real-time data.

## 🚀 Key Features
- **Lyric-Based Search:** Identify songs and artists from a fragment of lyrics via Genius API.
- **Popularity Ranking:** Sort results based on Spotify's popularity metrics (from most to least streamed).
- **Modern UI:** A clean, responsive interface built with React and Tailwind CSS.
- **Dark Mode Support:** Optimized for a comfortable viewing experience.

## 🛠️ Tech Stack
- **Frontend:** React.js, Vite, Tailwind CSS
- **Backend:** Node.js, Express.js
- **APIs:** Genius API, Spotify Web API

## ⚙️ Setup & Installation
1. Clone the repository: `git clone https://github.com/berkayarsln/LyricMetric.git`
2. Install dependencies: `npm install`
3. Create a `.env` file and add your API credentials:
   ```env
   GENIUS_ACCESS_TOKEN=your_token
   SPOTIFY_CLIENT_ID=your_id
   SPOTIFY_CLIENT_SECRET=your_secret
   
4. Run the server: npm run server

5.Start the frontend: npm run dev