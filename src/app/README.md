# `src/app` — routing only (Next.js requirement)

Next.js decides the website's URLs from this folder, so it cannot be moved.
Keep the files here thin:

- `api/**/route.ts` → **backend endpoints**; they call functions from `src/backend`
- every other `page.tsx` → **frontend pages**; they render components from `src/frontend`

| URL | File |
|---|---|
| `/` | `page.tsx` |
| `/services`, `/services/[slug]` | `services/` |
| `/cart`, `/checkout`, `/track` | `cart/`, `checkout/`, `track/` |
| `/login`, `/register`, `/forgot-password` | `login/`, `register/`, `forgot-password/` |
| `/account`, `/account/orders/[orderNo]` | `account/` |
| `/admin/...` | `admin/` |
| `/api/...` | `api/` |
