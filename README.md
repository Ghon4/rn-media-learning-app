# RN Media Learning App

Expo (SDK 54) + TypeScript app for learning React Native: **bottom tabs**, **nested stack navigators**, **TMDB** networking with **Axios interceptors**, **FlashList** search, **AsyncStorage** watchlist, **light/dark** theme, **WebView** trailers, **deep links**, and a sample **Open Library** request (second base URL, no API key).

## Prerequisites

- Node.js 20+
- [Expo CLI / npx](https://docs.expo.dev/get-started/installation/)
- iOS Simulator, Android emulator, or Expo Go on a device

## Setup

1. Clone the repo and install dependencies:

   ```bash
   cd rn-media-learning-app
   npm install
   ```

2. Copy environment template and add your **TMDB** credentials (free):

   ```bash
   cp .env.example .env
   ```

   Edit `.env` — use the **read access token** (Bearer) and/or **API key** from [TMDB API settings](https://www.themoviedb.org/settings/api):

   ```env
   EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN=your_token_here
   EXPO_PUBLIC_TMDB_API_KEY=your_key_here
   ```

   If both are set, the token is used for requests. Never commit `.env` (it is gitignored).

3. Start the dev server:

   ```bash
   npm start
   ```

   Then press `i` / `a` / `w` for iOS, Android, or web.

## Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: TMDB media learning app"
git branch -M main
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

Replace `YOUR_USER/YOUR_REPO` with your repository. Do **not** commit `.env` (it is gitignored).

## Deep linking

- Scheme: `rnmedia` (see `app.config.js`).
- Example (Home stack detail): `rnmedia://home/media/movie/550`  
  (Adjust IDs to real TMDB IDs.)

## EAS Build (optional)

```bash
npx eas-cli login
npx eas build --profile preview --platform ios
```

Profiles are defined in [eas.json](eas.json).

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB. See the in-app **Settings → About** screen.

## Project layout

- `src/navigation` — tab + stack navigators, typed routes, linking config
- `src/services/api` — Axios client, errors, retries
- `src/services/tmdb` — TMDB types and API helpers
- `src/services/openLibrary` — sample second-origin fetch
- `src/features` — screens by feature
- `src/context` — theme preference + watchlist
- `src/shared/components` — reusable UI

## Scripts

| Command        | Description        |
| -------------- | ------------------ |
| `npm start`    | Expo dev server    |
| `npm run ios`  | Open iOS           |
| `npm run android` | Open Android   |
| `npm run web`  | Open web           |

Typecheck:

```bash
npx tsc --noEmit
```
