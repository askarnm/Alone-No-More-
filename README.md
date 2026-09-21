# Alone No More — Website (Frontend + Backend)

This is your full website: the pages people see (frontend) and the server that
saves registrations and messages (backend).

## What's inside

```
alone-no-more-app/
├── frontend/
│   ├── index.html     ← Home, Login, and Register pages (one file)
│   └── admin.html      ← Private page for you to see registrations & messages
└── backend/
    ├── server.js        ← The server (handles saving/checking accounts)
    └── package.json      ← List of packages it needs
```

## Running it on your own computer (to test)

1. Install [Node.js](https://nodejs.org) if you don't have it (choose the LTS version).
2. Open a terminal in the `backend` folder and run:
   ```
   npm install
   npm start
   ```
3. Open your browser to **http://localhost:3000** — that's your website.
4. Your private owner page is at **http://localhost:3000/admin.html**
   (default password: `changeme123` — change this before going live, see below).

## Before you put this online (important)

Open `backend/server.js` and change these two lines, or better, set them as
environment variables on your hosting service instead of writing them in the file:

- `ADMIN_PASSWORD` — the password for your owner dashboard (`admin.html`).
  Currently `changeme123` — pick something only you know.
- `SESSION_SECRET` — any long random text, used to keep logins secure.

## Putting it online for real (so customers can use it)

This needs to run on a server that stays on all the time — a few good free/cheap options:

- **Render.com** (easiest): create a free account, "New Web Service", connect
  this project, set the start command to `npm start` (from the `backend` folder),
  and add the `ADMIN_PASSWORD`/`SESSION_SECRET` as environment variables in its settings.
- **Railway.app**: similar process, also has a simple free tier.

Once deployed, your site will have a real address (like `https://your-site.onrender.com`)
that anyone can visit, register on, and message you through — and you'll be able
to see everyone who registered and every message at `/admin.html`.

If you're not comfortable doing this yourself, any freelance developer can deploy
this for you in under an hour — it's a small, standard Node.js project.

## How the data is stored

Registrations and messages are saved in a small file called `data.sqlite`
inside the `backend` folder, created automatically the first time the server runs.
Back this file up occasionally if it's holding real customer information.
