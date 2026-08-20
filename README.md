# Cadence — Your workplace intelligence layer

Cadence is an AI workspace that brings email drafting, meeting summaries, day planning, research briefs, productivity insights and an assistant chat into one place. Everything you generate is saved to your account so it's there next time you sign in.

## Features

- **Email** — draft professional emails and follow-ups from a short brief.
- **Meetings** — turn raw notes into an executive summary, decisions and action items with owners, priorities and deadlines.
- **Planner** — build a time-blocked day from your tasks, priorities and deadlines.
- **Research** — generate business briefs with insights, opportunities, risks and recommendations.
- **Insights** — see how your work output trends over time.
- **Chat** — a pragmatic workplace productivity coach.
- **Prompt library** — curated templates plus your own custom prompts.
- **History** — every generated output stored in your account, searchable and deletable.

## Accounts and data

- Email + password and Google sign-in; the whole app sits behind auth.
- History, prompt templates and your profile (name, role) are stored in the cloud database with row-level security, so only you can read your own rows.

## Tech stack

- **TanStack Start** (React 19, file-based routing, server functions)
- **Vite 7** build tooling
- **TypeScript**
- **Tailwind CSS v4** with semantic design tokens
- **Lovable Cloud** (Postgres, auth, RLS) for persistence
- **Lovable AI Gateway** for model calls (no API keys in the client)

## Project structure

```text
src/
  routes/          file-based routes (index, email, meetings, planner,
                   research, insights, chat, prompts, history, settings, auth)
  components/      app shell and shared UI
  lib/             AI server functions, storage hooks, auth helpers
  integrations/    generated backend client
  styles.css       design tokens and Tailwind theme
```

## Local development

Requires Node.js and npm.

```sh
git clone <this-repository-url>
cd <repository-name>
npm install
npm run dev
```

The app runs on http://localhost:8080.

Environment variables for the backend and AI gateway are managed by Lovable and injected automatically; server-side keys are read inside server functions only.

## Deployment

Open the project in [Lovable](https://lovable.dev) and hit Publish. Changes pushed to this repository sync back into Lovable automatically.
