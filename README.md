# NutriTrack AI

A full-stack nutrition tracker: calorie & macro dashboard, meal diary, weekly trend charts,
an AI nutrition coach (Google Gemini), and multi-user login — built with Next.js 14 (App Router)
and Postgres.

## Stack

- **Framework:** Next.js 14 (App Router, JavaScript)
- **Database:** Postgres, via Vercel Postgres (Neon under the hood) using `@neondatabase/serverless`
- **Auth:** Custom email/password auth — bcrypt password hashing + signed JWT session cookies
- **AI:** Google Gemini (`gemini-1.5-flash`) for the NutriBot chat assistant, with natural-language
  food/water logging (e.g. "I had 2 rotis and dal tadka for lunch" gets parsed and logged automatically)
- **Charts:** Recharts
- **Styling:** Tailwind CSS

## Features

- Sign up / log in (multi-user — each person only sees their own data)
- Dashboard: calories remaining ring, BMR/TDEE, macro split vs targets, water & fiber, nutrition score
- Meal Diary: full breakdown per meal (breakfast/lunch/dinner/snacks) with add/delete
- Weekly Trends: 7-day calorie vs target bar chart, macro adherence line chart
- NutriBot AI: chat with Gemini, ask nutrition questions, or just describe what you ate to log it
- Profile & Goals: age/weight/height/activity/goal, custom macro split %, auto-recalculated targets

## 1. Local setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable       | Where to get it |
|----------------|------------------|
| `POSTGRES_URL` | A Postgres connection string (see step 2 below) |
| `GEMINI_API_KEY` | https://aistudio.google.com/app/apikey |
| `JWT_SECRET`   | Any long random string, e.g. run `openssl rand -base64 32` |

Then run:

```bash
npm run dev
```

Visit `http://localhost:3000` — it'll redirect you to `/signup`. The database tables are created
automatically the first time the app talks to the database (see `lib/db.js` → `ensureSchema()`),
so there's no separate migration step to run.

## 2. Setting up the database (Vercel Postgres)

1. Push this repo to GitHub (step 3) and import it into Vercel, **or** create the database first
   from an existing Vercel project.
2. In your Vercel project: **Storage → Create Database → Postgres**.
3. Once created, Vercel automatically sets `POSTGRES_URL` (and a few related vars) as environment
   variables on your project for Production, Preview, and Development — you don't need to type it in
   yourself there.
4. For local development, open the database in the Vercel dashboard → **.env.local** tab → copy the
   `POSTGRES_URL` value into your local `.env` file.

> This app uses `@neondatabase/serverless`, the actively-maintained driver Vercel Postgres itself
> runs on. Any other Postgres provider (Neon, Supabase, Railway, etc.) works too — just put its
> connection string in `POSTGRES_URL` (or `DATABASE_URL`).

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: NutriTrack AI"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

(`.env` is already git-ignored, so your secrets won't be committed — only `.env.example` is.)

## 4. Deploy to Vercel

1. Go to https://vercel.com/new and import the GitHub repo you just pushed.
2. Vercel will auto-detect Next.js — no build settings need to change.
3. Before the first deploy (or right after), add these **Environment Variables** in
   Project Settings → Environment Variables (skip `POSTGRES_URL` if you already added the
   Postgres storage integration, since Vercel sets it for you):
   - `GEMINI_API_KEY`
   - `JWT_SECRET`
4. Deploy. On first visit, sign up for an account — the database tables are created automatically.

## Project structure

```
app/
  (app)/                  # Authenticated routes, share the sidebar layout
    dashboard/
    meal-diary/
    weekly-trends/
    nutribot/
    profile/
  api/
    auth/                 # signup, login, logout, me
    food-logs/            # CRUD for logged food items
    water-logs/           # water intake logging
    profile/              # update user goals/targets
    weekly/               # 7-day aggregates + streak
    chat/                 # Gemini-powered NutriBot
  login/, signup/         # public auth pages
components/               # Sidebar, TopBar, LogFoodModal
lib/
  db.js                   # Postgres connection + schema creation
  auth.js                 # password hashing + JWT session cookies
  nutrition.js            # BMR/TDEE/macro/score calculations
middleware.js             # route protection
```

## Notes & things you may want to customize

- **Macro split defaults** to 20% protein / 50% carbs / 30% fat — editable per-user on the Profile page.
- **Nutrition score** is a simple weighted formula (calories, protein, water, fiber) — tune the
  weights in `lib/nutrition.js` → `calcDailyScore()` to taste.
- **Gemini model**: set to `gemini-1.5-flash` in `app/api/chat/route.js` for speed/cost. Swap in
  `gemini-1.5-pro` there if you want higher-quality responses.
- Food nutrition values (calories/macros) are either entered manually in the "Log Food" modal or
  estimated by Gemini when you describe a meal in chat — there's no external food-database API
  wired in, so estimates from the AI won't be lab-precise.
