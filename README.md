# Goadi — tourism site rebuild

A rebuild of my 2023 HTML/Bootstrap tourism site with Astro, React and Supabase.

**Stack:** Astro 7 (server output, Node adapter) · React 19 islands · Tailwind CSS v4 · Supabase Auth · Astro Actions + Zod

## Getting started

```sh
npm install
cp .env.example .env   # then fill in your Supabase keys (see below)
npm run dev            # http://localhost:4321
```

The site runs without Supabase keys, but sign-in is disabled until you add them.

## Supabase setup

1. Create a free project at [supabase.com](https://supabase.com).
2. **Project Settings → API Keys:** copy the Project URL and the publishable key into `.env`.
3. **Authentication → URL Configuration:**
   - Site URL: `http://localhost:4321`
   - Redirect URLs: add `http://localhost:4321/auth/callback`
4. Optional: **Authentication → Sign In / Providers → Google** to turn on "Continue with Google".

## Auth routes

| Route | What it does |
| --- | --- |
| `/login` | Password, email magic link or Google sign-in |
| `/signup` | Create an account (sends a confirmation email) |
| `/forgot-password` | Sends a password reset link |
| `/reset-password` | Choose a new password (signed-in only) |
| `/account` | Profile details and log out (signed-in only) |
| `/auth/callback` | Where email links and Google send people back to |
| `/auth/logout` | `POST` only; signs out and returns home |

## Content

Destinations live in `src/content/destinations/*.md`, with the schema in `src/content.config.ts`. Each one has month-by-month seasons, a rough daily budget, how long to stay, coordinates and a hero photo.

Photos come from Wikimedia Commons under CC licences. Each photo's author, licence and source are stored in its file's frontmatter and credited wherever the photo appears.

## Commands

| Command | Action |
| --- | --- |
| `npm run dev` | Start the dev server at `localhost:4321` |
| `npm run build` | Build for production into `./dist/` |
| `npm run preview` | Preview the production build |
| `npx astro check` | Type-check `.astro`, `.ts` and `.tsx` files |
