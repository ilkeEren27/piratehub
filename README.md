# Whitworth Campus App

A modern full-stack web app built for Whitworth University students.
It brings together events, clubs, maps, and a social hub, all in one clean interface.

---

## Features

- **Interactive Campus Map** 🗺

  - Explore Whitworth’s campus with custom markers and icons.
  - Click on events to instantly highlight their location.
- **Events System**

  - Create, edit, and browse campus events.
  - Event markers link directly to map locations.
  - Clean event cards with time, location, and optional images.
- **Authentication & Roles**

  - Secure sign-in/sign-up with [Clerk](https://clerk.com).
  - Roles: `Admin`, `Moderator`, `Faculty`, `ASWU`, `ClubLeader`, `User`.
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
- **Auth**: Clerk
- **Database**: Prisma ORM (configurable with Postgres/Mongo)
- **Hosting**: Vercel

---

## Project Structure

```bash
├── app/
│   ├── admin/          # Admin dashboard
│   ├── events/         # Events pages + editor
│   ├── log-in/         # Auth pages (Clerk)
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
├── utils/roles.js      # Role utilities (Admin, User, etc.)
├── public/             # Images, logos, assets
├── middleware.js       # Clerk middleware + role handling
```
