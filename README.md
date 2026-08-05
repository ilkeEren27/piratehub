# Whitworth Campus App

A modern full-stack web app built for Whitworth University students.
It brings together events, clubs, maps, and a social hub, all in one clean interface.

---

## Features

- **Interactive Campus Map**

  - Explore Whitworth’s campus with custom markers and icons.
  - Click on events to instantly highlight their location.
- **Events System**

  - Create, edit, and browse campus events.
  - Event markers link directly to map locations.
  - Clean event cards with time, location, and optional images.
- **Authentication & Roles**

  - Email/password auth with [Better Auth](https://better-auth.com) — custom sign-up/log-in pages, email verification, and password reset.
  - Verification/reset emails sent via [Resend](https://resend.com) with fully customizable templates (`lib/email.js`).
  - Roles: `Admin`, `Moderator`, `Faculty`, `ASWU`, `ClubLeader`, `User` — stored in our own database.
  - Admin dashboard with user management tools.
- **Social Hub (in progress)**

  - A forum-style space for students to discuss classes, clubs, and campus life.
  - Likes, replies, tags, and moderation planned.
- **Modern UI**

  - Built with [TailwindCSS](https://tailwindcss.com) + [Shadcn UI](https://ui.shadcn.com).
  - Clean, responsive design with dark/light support.

---

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org)
- **UI**: TailwindCSS + Shadcn UI
- **Auth**: Better Auth + Resend (transactional emails)
- **Database**: Prisma ORM (configurable with Postgres/Mongo)
- **Hosting**: Vercel

---

## Environment Variables

```bash
# Database (Neon Postgres)
POSTGRES_PRISMA_URL=        # pooled connection string
POSTGRES_URL_NON_POOLING=   # direct connection string (for migrations)

# Better Auth
BETTER_AUTH_SECRET=         # random 32+ char secret (npx @better-auth/cli secret)
BETTER_AUTH_URL=            # app URL, e.g. http://localhost:3000 or https://yourdomain.com

# Emails (Resend)
RESEND_API_KEY=             # from resend.com dashboard
EMAIL_FROM=                 # e.g. "PirateHub <noreply@yourdomain.com>" (optional, defaults to onboarding@resend.dev)
```

---

## Project Structure

```bash
├── app/
│   ├── admin/          # Admin dashboard
│   ├── events/         # Events pages + editor
│   ├── log-in/         # Custom auth pages (Better Auth)
│   ├── sign-up/
│   ├── map/            # Interactive campus map
│   ├── social/         # Social hub (forum)
│
├── components/
│   ├── admin/          # SearchUsers, role controls
│   ├── cards/          # EventCard, etc.
│   ├── map/            # CampusMap with custom markers
│   ├── nav/            # NavigationBar
│   ├── ui/             # Shadcn UI components
│
├── data/
│   ├── events.js       # Seed events
│   ├── places.js       # Campus locations
│
├── lib/                # Utilities
│   ├── mapIcons.js
│   ├── utils.js
│
├── lib/auth.js         # Better Auth server config (email flows, roles)
├── lib/auth-client.js  # Better Auth browser client (useSession, signIn, ...)
├── lib/email.js        # Resend email templates (edit these freely)
├── utils/roles.js      # Session + role helpers (getSessionUser, checkRole)
├── public/             # Images, logos, assets
├── middleware.js       # next-intl + session-cookie route protection
```
