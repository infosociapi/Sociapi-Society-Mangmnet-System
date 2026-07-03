# Sociapi Society Management System

A lightweight React + Vite application for managing society membership, events, communications, and internal tools.

## Features
- Dashboard and member management
- Attendance tracking and reports
- Communications (email/WhatsApp) integrations
- Auth flows and account management
- Simple admin tools and activity logs

## Quickstart

Prerequisites:
- Node.js 18+ and npm/yarn

Install dependencies:

```bash
npm install
# or
yarn
```

Run the development server:

```bash
npm run dev
# or
yarn dev
```

Build for production:

```bash
npm run build
# or
yarn build
```

Start production preview:

```bash
npm run preview
# or
yarn preview
```

## Project structure
- `src/` – React app source (components, pages, layouts)
- `api/` – server-side helpers and email integrations
- `supabase/` – SQL schema and edge functions
- `netlify/functions` – serverless functions (legacy)

## Environment
Create a `.env` or set env vars needed by the app (Supabase URL/keys, Mailjet API keys, etc.). See `src/lib/supabase.ts` and `api/` for references.

## Contributing
Open an issue or submit a pull request. Keep changes focused and add tests where appropriate.

## License
This repository does not include a license file. Add a license if you intend to make this project public.
