# POS SaaS — Frontend

Vite + React + Tailwind CSS v4 frontend for the Multi-Business POS SaaS backend.

## Getting started

```bash
npm install
cp .env.example .env   # adjust VITE_API_BASE_URL if needed
npm run dev
```

The app expects the backend running at the URL in `VITE_API_BASE_URL`
(defaults to `http://localhost:8000/api`) and relies on an httpOnly
auth cookie, so `credentials: "include"` is set on every request.

## What's implemented

- Auth: login, logout, forgot password → OTP → reset password
- Users, Businesses, Business Types, Brands, Models — full CRUD,
  matching the backend's exact (singular) route names and HTTP verbs
- Roles & Permissions management with grouped permission selection
- Role/permission-based sidebar, route guards, and UI controls
  (`usePermissions` hook — see `src/utils/permissions.js`)
- Light / dark / system appearance + a swappable business "theme"
  engine (`src/themes/`) built on semantic CSS variables — no backend
  Theme API exists yet, so themes are stored locally by design
- Reusable UI kit in `src/components/ui`, tables in
  `src/components/tables`, forms in `src/components/forms`
- Loading skeletons, empty states, error states with retry, and toast
  notifications everywhere the backend responds
- Sidebar items for modules with no backend yet (Products, Inventory,
  Sales, etc.) render as "Coming Soon" — see `src/config/sidebarConfig.js`

## Project layout

See `src/app`, `src/features`, `src/components`, `src/pages`,
`src/routes`, `src/config`, `src/hooks`, `src/utils`, `src/themes`.
Each RTK Query feature (`src/features/<name>/<name>Api.js`) injects
into the single `baseApi` in `src/app/api/baseApi.js`, so caching tags
and hooks all live in one place.

## Next steps

Wire up the remaining sidebar sections (Products, Inventory, Sales,
Customers, Reports, etc.) once their backend APIs exist, following the
same pattern used for Users/Businesses/Brands/Models.
