# Going live — GitHub → hosting → your GoDaddy domain

Your website is a **Next.js (Node.js) app with a MongoDB database**. Two things must be hosted:

| Part | Where it runs |
|---|---|
| The website (Node.js app) | a host that can run Node.js |
| The database (MongoDB) | **MongoDB Atlas** (free tier is enough) |

> ⚠️ **Read this first about GoDaddy**
> - GoDaddy's **classic / WordPress shared hosting cannot run this website.** It only runs PHP.
> - GoDaddy **does not host MongoDB at all** — the database always goes to MongoDB Atlas.
> - It works on GoDaddy's **Web Hosting plans that say "Node.js"** (Economy / Deluxe / Ultimate) or a GoDaddy VPS.
> - **Your domain stays at GoDaddy either way.** The domain and the hosting do not have to be the same company.

---

# ⚠️ FIRST: allow your database to be reached

Atlas blocks every computer that is not on its **Network Access** list — including your
hosting. Until you do this, the website cannot read or write anything.

1. Open **https://cloud.mongodb.com** → your project → **Network Access** (left menu)
2. **+ ADD IP ADDRESS** → **ALLOW ACCESS FROM ANYWHERE** (`0.0.0.0/0`) → **Confirm**
3. Wait until the status turns green (**Active**), about 1–2 minutes

This is required because Vercel / GoDaddy change their server IPs. Your database is still
protected by its username and password.

---

# STEP 1 — Create the database (needed for every option)

1. Go to **https://www.mongodb.com/atlas** → create a free account.
2. Create a **free M0 cluster**. Pick a region near Pakistan (Mumbai is good).
3. **Database Access → Add New Database User**
   - Username: e.g. `iseries`
   - Password: press *Autogenerate* and **save it somewhere safe**
4. **Network Access → Add IP Address → Allow access from anywhere (`0.0.0.0/0`)**
   (You can tighten this later to your host's IPs.)
5. **Connect → Drivers → copy the connection string**, then edit it:
   ```
   mongodb+srv://iseries:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/iseries?retryWrites=true&w=majority
   ```
   - put your real password where `YOUR_PASSWORD` is
   - make sure **`/iseries`** is there before the `?` (that is the database name)

Collections (users, orders, files …) are created automatically on first run.

---

# STEP 2 — Prepare the values you will need

Create these now and keep them in a safe note:

| Name | Value |
|---|---|
| `MONGODB_URI` | the Atlas string from Step 1 |
| `ADMIN_PASSWORD` | a long password you choose — **not `1234`** |
| `AUTH_SECRET` | a long random text (command below) |
| `SITE_URL` | `https://yourdomain.com` |
| `COOKIE_SAMESITE` | `lax` |

Generate `AUTH_SECRET` on your computer:
```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**These never go into GitHub.** They are typed into the hosting panel only.

---

# STEP 3 — Put the code on GitHub

In VS Code's terminal, inside the project folder:

```
git init
git add .
git commit -m "I Series Digital Services website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

- Create the repository on github.com first, and choose **Private**.
- `.gitignore` already blocks `node_modules`, `.next` and `.env`.
- Before pushing, double-check: `git status` must **not** list `.env`.

---

# STEP 4 — Choose your hosting

## Option A — Vercel (recommended: easiest, free to start) ⭐

1. **https://vercel.com** → *Sign up with GitHub*.
2. **Add New → Project** → pick your repository → *Import*.
3. **Environment Variables** — add all five from Step 2. (Framework: it detects Next.js by itself.)
4. Click **Deploy**. In ~2 minutes you get a working `*.vercel.app` link — test it.
5. **Attach your GoDaddy domain:**
   - Vercel → *Project → Settings → Domains → Add* → type `yourdomain.com` → it also offers `www`.
   - Vercel shows you the DNS records to create.
   - GoDaddy → *My Products → your domain → DNS → Manage DNS* → add exactly what Vercel showed, typically:
     | Type | Name | Value |
     |---|---|---|
     | A | `@` | `76.76.21.21` |
     | CNAME | `www` | `cname.vercel-dns.com` |
   - Delete GoDaddy's default "Parked"/forwarding records for `@` and `www` if they exist.
6. Wait 10 minutes to a few hours for DNS. HTTPS is issued automatically.

## Option B — GoDaddy Web Hosting (Node.js plan)

Check first: **My Products → Web Hosting → Manage**. You need a plan that lists **Node.js**.
If you only see WordPress or classic shared hosting, this option will not work — use Option A,
or upgrade/buy GoDaddy's Web Hosting (Economy or higher) or a VPS.

Newer GoDaddy panels have a **"Deploy a Node.js app"** screen where you connect GitHub directly:

1. cPanel → **Node.js** (sometimes *Setup Node.js App* / *Application Manager*).
2. **Create Application** with:
   | Field | Value |
   |---|---|
   | Node.js version | **22** (or 20) |
   | Application mode | **Production** |
   | Application root | e.g. `iseries` (a folder in your home directory) |
   | Application URL | your domain |
   | Application startup file | `server.js` *(see note below)* |
3. **Environment variables:** add all five values from Step 2 in that same screen,
   plus `NODE_ENV` = `production`.
4. Get the code there — either connect GitHub, or upload a ZIP of the project
   **without** `node_modules` and `.next`, and extract it into the application root.
5. Press **Run NPM Install**, then open the panel's terminal and run:
   ```
   npm run build
   ```
6. Press **Restart Application**, then open your domain.
7. cPanel → **SSL/TLS Status** → turn on the free certificate, and force HTTPS.

**Note on the startup file:** cPanel asks for a single JS file, while Next.js normally starts
with `npm start`. If the panel does not accept `npm start`, create a file named `server.js`
in the project root with this content, and point the startup file at it:

```js
const { createServer } = require("http");
const next = require("next");

const port = process.env.PORT || 3000;
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port);
  console.log("Ready on port " + port);
});
```

(You still must run `npm run build` before starting.)

**Every time you change the code:** upload/pull the new code → `npm install` → `npm run build` → *Restart Application*.

## Option C — A VPS (full control: Hostinger, Contabo, DigitalOcean, GoDaddy VPS)

```
# on the server
git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git
cd YOUR-REPO
npm install
npm run build
npm install -g pm2
pm2 start npm --name iseries -- start
pm2 save && pm2 startup
```
Then put **Nginx** in front for the domain, and get free HTTPS with **certbot**.
In GoDaddy DNS, point an `A` record for `@` to your server's IP.

---

# STEP 5 — After the site is live

1. Open `https://yourdomain.com` and click around — services, cart, FAQ, dark mode.
2. Open `https://yourdomain.com/admin` and log in with your new `ADMIN_PASSWORD`.
3. **Notifications** page → **Send test email** → go to the inbox of
   `iseriesdigitalservices@gmail.com` and click **Activate Form** (one time only).
4. On the same page connect the **Gmail App Password**, so customers also get emails
   (order confirmation, password reset codes, delivery).
   - Gmail → 2-Step Verification ON → https://myaccount.google.com/apppasswords → create a 16-letter password.
5. **Payment Accounts** page → confirm the bank details are correct.
6. Register a test customer, place a small order, approve it, deliver it — then delete the test user.

---

# Moving your existing orders (optional)

The 3 current orders live in the development database. To copy old PostgreSQL data into Atlas:

```
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/app_db" \
MONGODB_URI="<your Atlas connection string>" \
node scripts/migrate-pg-to-mongo.mjs --reset
```

If you would rather start fresh on the live site, just skip this.

---

# Backups (please do this)

Customer CNIC / passport images and payment slips are stored **inside MongoDB**.
In Atlas open **Backup** and enable snapshots.
If the database is lost, those documents are gone with it.

---

# Final security checklist

- [ ] `ADMIN_PASSWORD` is long and not `1234`
- [ ] `AUTH_SECRET` is a long random text (it also protects stored passwords)
- [ ] `COOKIE_SAMESITE=lax` is set
- [ ] Atlas database user has a strong password
- [ ] `.env` is **not** in the GitHub repository
- [ ] HTTPS works on the domain
- [ ] Never share these values with anyone — including in a chat
