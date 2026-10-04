# I Series Digital Services — Website

Passport, CNIC, ECL, PCL, FIR, CRO, Degree, LAT/GAT and NADRA document services.
Cart + bank-transfer checkout with payment slip, customer accounts, **Refer & Earn 10%**,
a full admin panel, and email / WhatsApp notifications.

**Stack:** Next.js (React) · Node.js API · MongoDB

---

## Folder structure

```
src/
├── backend/      ← SERVER CODE (Node.js only, never sent to the browser)
│   ├── mongo.ts          database connection + all data types
│   ├── auth.ts           customer login sessions & passwords
│   ├── admin.ts          admin sessions, payment accounts
│   ├── security.ts       rate limits, cookies, file checks
│   ├── secret.ts         app secret
│   ├── vault.ts          encrypt / decrypt stored passwords
│   ├── activity.ts       user activity log
│   ├── referral.ts       Refer & Earn 10% logic
│   ├── mail.ts           sending email + email log
│   ├── emailTemplates.ts the HTML of every email
│   └── notify.ts         admin alerts (email + WhatsApp)
│
├── frontend/     ← BROWSER CODE (everything the visitor sees)
│   ├── components/       all React components
│   └── userStatus.ts     status labels & colours
│
├── shared/       ← USED BY BOTH
│   └── site.ts           company info, services, PRICES, documents, FAQs
│
└── app/          ← ROUTING ONLY (Next.js requires this folder)
    ├── api/**/route.ts   backend endpoints → call src/backend
    └── **/page.tsx       pages → render src/frontend
```

Each folder has its own `README.md` explaining what belongs inside it.

**Why is `src/app/` separate?** Next.js builds the website's URLs from that folder, so it
cannot be moved or renamed. The files inside it are deliberately thin: API routes just call
`src/backend`, and pages just render `src/frontend`.

**Enforced separation:** every file in `src/backend` starts with `import "server-only"`.
If a frontend component ever tries to import backend code, **the build fails on purpose**.
Your database connection string and secrets can never leak into the browser.

### The file you will edit most

`src/shared/site.ts` — change prices, add or remove services, edit phone numbers, email,
the referral rate (`REFERRAL_RATE`) and the FAQs.

---

## Run it on your computer (VS Code)

1. Install **Node.js 20 or 22** (nodejs.org) and **MongoDB Community Server**
   (mongodb.com/try/download/community). VS Code too, of course.
2. Open the project folder in VS Code, then in the terminal (`Ctrl + ~`):
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and fill it in. **This project is already set up to use
   MongoDB Atlas (cloud)**, so the same database is used on your computer and on the live site:
   ```
   MONGODB_URI="mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/iseries?retryWrites=true&w=majority&appName=Cluster0"
   MONGODB_DB=iseries
   ADMIN_PASSWORD=1234
   AUTH_SECRET=any-long-random-text
   ```
   To check it at any time:
   ```
   node scripts/check-db.mjs
   ```
4. Start it:
   ```
   npm run dev
   ```
   - Website: http://localhost:3000
   - Admin panel: http://localhost:3000/admin

No database setup command is needed — MongoDB creates the collections automatically.

### Production build
```
npm run build
npm start
```

---

## Putting it on GitHub

```
git init
git add .
git commit -m "I Series Digital Services website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

Make the repository **Private**. `.gitignore` already keeps `node_modules`, `.next` and `.env`
out of Git — **never commit your `.env` file or any password.**

---

## Going live on your GoDaddy domain

See **[DEPLOY.md](./DEPLOY.md)** for the complete step-by-step guide.

Short version: the database goes on **MongoDB Atlas** (free), the website goes on a host that
runs **Node.js** (Vercel is easiest, or GoDaddy's Node.js web hosting plan), and your GoDaddy
domain points at it.

> GoDaddy's classic / WordPress shared hosting cannot run this site, and GoDaddy does not
> host MongoDB. Your domain can stay at GoDaddy either way.

---

## Admin panel

`/admin` — not linked anywhere on the website and hidden from search engines.

- **Orders** — verify payment slip → *In process* → progress updates → *Process done* + delivery
- **Users** — activate / deactivate / hold / pending / delete, see and set passwords, full activity log, referral payouts
- **Inquiries** — contact-form messages, reply by email
- **Payment Accounts** — the bank / EasyPaisa / JazzCash details shown at checkout
- **Notifications** — connect Gmail & WhatsApp alerts, send email, see the log

All long lists show **10 per page** with Previous / Next buttons.

For security, the admin session ends the moment you leave the admin panel, so the password
is required again every time you come back.

---

## Email / WhatsApp notifications

In **Admin → Notifications**:
1. **Send test email**, then click **Activate Form** in the FormSubmit email (one time) — turns on admin alerts.
2. Connect a **Gmail App Password** — needed so customers get emails (order updates, password reset codes, delivery).
3. Optional: a **CallMeBot API key** for WhatsApp alerts.

---

## Backups — please read

Customer CNIC / passport images and payment slips are stored **inside MongoDB**.
Turn on backups in MongoDB Atlas (or run `mongodump` regularly).
If the database is lost, those documents are lost with it.

---

## Security built in

- Admin session ends on leaving the admin panel, plus a 90-minute idle timeout
- Rate limiting on login, registration, password reset, orders and inquiries; lockout after 6 wrong passwords
- Passwords hashed with scrypt; a separate AES-256-GCM encrypted copy lets the admin help users (viewing it is logged)
- Password reset by 6-digit email code (10 minutes, 5 attempts)
- CSRF protection, HttpOnly cookies, security headers + CSP
- Uploads checked by real file content (JPG / PNG / WEBP / PDF only); documents are private to the owner and the admin
- `server-only` boundary between `src/backend` and the browser

**Before going live:** change `ADMIN_PASSWORD` from `1234`, set a long `AUTH_SECRET`,
and set `COOKIE_SAMESITE=lax`.

---

## Helper scripts

| Script | What it does |
|---|---|
| `node scripts/check-db.mjs` | Shows which database is in use and how many orders / users / files it holds |
| `node scripts/sync-to-atlas.mjs --reset` | Copies everything from a local MongoDB into Atlas |
| `node scripts/migrate-pg-to-mongo.mjs --reset` | Only for the old PostgreSQL version — new installs can ignore it |
