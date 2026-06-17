# Train — Calisthenics Training Assistant

A full-stack calisthenics coaching app:

- **Trainee app** — DB-driven workout tracker (pull / push / legs / superset), week strip, streaks, session history, and an **AI coach** that knows your plan and progress.
- **Coach dashboard** — view assigned trainees, edit their reps/sets, and attach a coaching **YouTube video** per exercise.
- **AI coach** — powered by **Google Gemini** (via its OpenAI-compatible endpoint). The API key lives only on the backend; the browser never sees it.

Built with **React + Tailwind** (frontend) and **Node.js + Express + MongoDB** (backend). Auth is **email/password + Google OAuth**, with JWTs stored in secure **httpOnly cookies**.

---

## Project layout

```
Training_Assistant/
├── backend/        Node.js + Express API
│   ├── config/     env, db, passport (Google OAuth)
│   ├── models/     User, Plan, Session, Conversation
│   ├── routes/     auth, plans, sessions, coach, chat
│   ├── services/   coachAI.js  (Gemini integration via OpenAI-compatible API)
│   ├── middleware/ auth (JWT), validation, errors
│   ├── data/       defaultPlan.js  (starter program)
│   └── server.js
├── frontend/       React + Vite + Tailwind
│   └── src/
│       ├── pages/       Login, AuthCallback, TraineeDashboard, CoachDashboard
│       ├── components/  WorkoutTracker, ExerciseModal, AIChat
│       ├── auth.jsx     auth context
│       └── api.js       fetch wrapper (sends cookies)
└── index.html      the original single-file prototype (kept as reference)
```

---

## Prerequisites

- **Node.js 18+** and npm
- A **MongoDB Atlas** account (free tier is fine)
- A **Google Gemini API key** (for the AI coach — free tier available)
- A **Google Cloud** project (for "Continue with Google")

---

## 1. Database — MongoDB Atlas

1. Create a free account at <https://www.mongodb.com/atlas> and create a **free (M0) cluster**.
2. **Database Access** → Add a database user (username + password).
3. **Network Access** → Add IP `0.0.0.0/0` (allow from anywhere) for development.
4. **Connect → Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Insert your password and a database name (`training_assistant`):
   ```
   mongodb+srv://myuser:mypass@cluster0.xxxxx.mongodb.net/training_assistant?retryWrites=true&w=majority
   ```
   Put this in `backend/.env` as `MONGODB_URI`.

---

## 2. Gemini (AI coach)

1. Go to <https://aistudio.google.com/app/apikey> → **Create API key** (`AI…`).
2. Put it in `backend/.env` as `GEMINI_API_KEY`.
3. `GEMINI_MODEL` defaults to `gemini-2.0-flash` (cheap, fast, free tier). You can
   also try `gemini-2.5-flash` or `gemini-1.5-flash`.
4. The free tier covers light usage; for higher limits, enable billing in Google
   AI Studio / Google Cloud. The app uses Gemini's OpenAI-compatible endpoint, so
   no extra SDK is needed.

> If you skip this, the whole app still runs — only the AI coach chat returns "not configured".

---

## 3. Google OAuth ("Continue with Google")

1. Go to <https://console.cloud.google.com/> and create (or select) a project.
2. **APIs & Services → OAuth consent screen**:
   - User type: **External** → Create.
   - Fill app name, support email, developer email. Save.
   - Add your Google account under **Test users** (while the app is unpublished).
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized JavaScript origins**: `http://localhost:5173`
   - **Authorized redirect URIs**: `http://localhost:5000/auth/google/callback`
     *(must match `GOOGLE_CALLBACK_URL` in `.env` exactly)*
   - Create → copy the **Client ID** and **Client Secret**.
4. Put them in `backend/.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

> Skip this and email/password still works; the Google button just returns "not configured".

---

## 4. Configure environment variables

```bash
cd backend
cp .env.example .env      # then edit .env with your real values
```

Generate strong secrets for `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

See `backend/.env.example` for every variable and what it does.

---

## 5. Run it locally

Open **two terminals**.

**Terminal 1 — backend (port 5000):**
```bash
cd backend
npm install
npm run dev        # nodemon; or `npm start`
```

**Terminal 2 — frontend (port 5173):**
```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. The Vite dev server proxies `/api` and `/auth`
to the backend, so cookies are same-origin and everything just works.

### Create a coach account

By default a new signup is a **trainee**. To create a coach and link existing
trainees to them:

```bash
cd backend
npm run seed       # creates coach@example.com / coach1234 (change after login)
```

Log in as that coach to land on the **coach dashboard**. Trainees who sign up
are auto-linked to the seeded coach when you re-run `npm run seed`.

---

## Authentication flows (how it works)

### Email / password
1. **Register** → backend validates input, hashes the password with **bcrypt** (cost 12),
   stores the user, signs a **JWT**, and sets it as a secure **httpOnly cookie**.
2. **Login** → backend looks up the user, compares the password hash, and on success
   sets the same httpOnly cookie. "Remember me" controls cookie lifetime.
3. **Protected requests** → the browser automatically sends the cookie; `requireAuth`
   middleware verifies the JWT and loads the user.
4. **Logout** → backend clears the cookie.

The token is **never** stored in `localStorage` (which is XSS-readable). httpOnly
cookies can't be read by JavaScript, which mitigates token theft via XSS.

### Google OAuth 2.0
1. User clicks **Continue with Google** → browser navigates to `/auth/google`.
2. Backend (Passport) redirects to Google's consent screen.
3. Google redirects back to `/auth/google/callback` with the user's profile.
4. Backend **finds or creates** the user:
   - Already linked to this Google ID → log in.
   - Email already exists as a local account → **link** Google to it (no duplicate).
   - New → create a Google-backed trainee account.
5. Backend signs its **own JWT**, sets the httpOnly cookie, and redirects to the
   frontend `/auth/callback`, which re-fetches the user and routes to the dashboard.

This prevents duplicate accounts: the same email can't end up as two separate users.

---

## Security notes

- **Passwords**: bcrypt-hashed (cost 12); never stored or returned in plaintext (`select: false`).
- **Tokens**: JWT in httpOnly, `sameSite`, `secure`-in-production cookies — not localStorage.
- **Secrets**: all in `.env` (gitignored); nothing hardcoded. The Gemini key is server-only.
- **Input validation**: on both client and server (`express-validator`); inputs sanitized/escaped.
- **NoSQL injection**: `express-mongo-sanitize` strips `$`/`.` from request payloads.
- **Headers**: `helmet` sets safe security headers.
- **CORS**: locked to the exact frontend origin with `credentials: true`.
- **Rate limiting**: auth and AI-chat endpoints are throttled.
- **HTTPS-ready**: set `NODE_ENV=production` and `trust proxy` is enabled so secure
  cookies work behind a TLS-terminating proxy (Render, Railway, Nginx, etc.).

---

## Production deployment (outline)

1. **Backend**: deploy to Render/Railway/Fly. Set all `.env` vars, `NODE_ENV=production`,
   `SERVER_URL`/`CLIENT_URL` to your real domains, and update `GOOGLE_CALLBACK_URL`
   (plus the Google Cloud redirect URI) to the production URL.
2. **Frontend**: `npm run build` → deploy `frontend/dist` to Vercel/Netlify/static host.
   Point its API calls at the backend domain (configure a proxy/rewrite, or swap the
   relative paths in `src/api.js` for the absolute backend URL).
3. Because the frontend and backend are on different domains in production, the cookie
   uses `sameSite: 'none'; secure: true` (already handled when `NODE_ENV=production`).

---

## API reference (quick)

| Method | Endpoint                               | Auth        | Purpose                          |
|--------|----------------------------------------|-------------|----------------------------------|
| POST   | `/auth/register`                       | —           | Email/password signup            |
| POST   | `/auth/login`                          | —           | Email/password login             |
| GET    | `/auth/me`                             | cookie      | Current user                     |
| POST   | `/auth/logout`                         | —           | Clear session                    |
| GET    | `/auth/google`                         | —           | Start Google OAuth               |
| GET    | `/auth/google/callback`                | —           | Google OAuth callback            |
| GET    | `/api/plans/me`                        | trainee     | Get my plan (creates default)    |
| GET    | `/api/sessions/me`                     | trainee     | My session history               |
| POST   | `/api/sessions`                        | trainee     | Log a finished workout           |
| GET    | `/api/chat`                            | trainee     | Load AI chat history             |
| POST   | `/api/chat`                            | trainee     | Send message → Gemini reply      |
| GET    | `/api/coach/trainees`                  | coach       | List my trainees                 |
| GET    | `/api/coach/trainees/:id`              | coach       | Trainee plan + sessions          |
| PUT    | `/api/coach/trainees/:id/plan`         | coach       | Update a trainee's plan          |
| PUT    | `/api/coach/sessions/:id/note`         | coach       | Leave a note on a session        |

---

## Roadmap (future)

- Native mobile app (React Native) sharing this same backend.
- Bodyweight charts and per-exercise PRs.
- Skill-tree progressions (muscle-up, handstand, front lever) the AI coach can plan toward.
- Microsoft OAuth, password reset email flow.
