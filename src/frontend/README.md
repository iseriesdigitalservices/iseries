# `src/frontend` — browser / UI code

This folder is the **frontend**: everything the visitor sees.

- `components/` — all React components (header, footer, forms, cart, theme toggle, pager …)
- `userStatus.ts` — labels and colours for user statuses

Components marked `"use client"` run in the browser. They never import from
`src/backend` — they talk to the server through `fetch("/api/...")`.

The pages themselves live in `src/app/**` (Next.js requires that location); each
page is a thin file that pulls its UI from this folder.
