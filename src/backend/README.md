# `src/backend` — server-side code (Node.js only)

This folder is the **backend**. Nothing here ever reaches the browser:
every file starts with `import "server-only"`, so the build fails if a frontend
component ever tries to import it.

| File | What it does |
|---|---|
| `mongo.ts` | MongoDB connection, collections and all data types |
| `auth.ts` | Customer login sessions, password hashing, password rules |
| `admin.ts` | Admin sessions, payment accounts, helpers |
| `security.ts` | Rate limiting, cookies, file-type sniffing, safe compare |
| `secret.ts` | The app secret used for sessions and encryption |
| `vault.ts` | Encrypts / decrypts stored passwords (AES-256-GCM) |
| `activity.ts` | Writes the user activity log |
| `referral.ts` | Refer & Earn: 10% commission and balances |
| `mail.ts` | Sending email (Gmail SMTP + free relay) and the email log |
| `emailTemplates.ts` | The HTML of every email we send |
| `notify.ts` | Admin alerts by email + WhatsApp |

The HTTP endpoints that use this code live in `src/app/api/**` (Next.js requires
routes to live there). Those files are thin: they read the request, call a
function from this folder, and return JSON.
