# Multi-Tenant Form App

A lightweight, deployment-ready form application with Magic Link authentication.

## Features

- **Multi-tenancy**: Organizations and Users.
- **Role-based Access Control**: Admin vs Client.
- **Shared Form**: Single form with different permissions.
- **Magic Link Auth**: Passwordless login.
- **Legal Compliance**: Privacy Policy, Terms, Cookie Banner.
- **Soft Deletes**: Data retention safety.

## Tech Stack

- **Frontend**: React, Tailwind CSS, React Hook Form
- **Backend**: Node.js, Express, Prisma
- **Database**: SQLite (MVP) / PostgreSQL (Production)

## Setup

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Setup Database**:
    ```bash
    npx prisma generate
    npx prisma db push
    npx tsx prisma/seed.ts
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

4.  **Open Browser**:
    Navigate to `http://localhost:3000`.

## Demo Credentials

- **Admin**: `admin@acme.com` (Check console for magic link)
- **Client**: `client@acme.com` (Check console for magic link)

## Deployment (Vercel)

This project is configured as a monorepo (Frontend + Backend). For Vercel deployment, it is recommended to split them or use Vercel Serverless Functions.

### Option A: Deploy as Container (Recommended for simplicity)
1.  Use `docker-compose up --build` on any VPS (DigitalOcean, Hetzner).

### Option B: Vercel (Frontend) + Supabase (Backend)
1.  Create a Supabase project.
2.  Update `.env` with `DATABASE_URL`.
3.  Deploy the Express app to a service like Render or Railway.
4.  Deploy the React app to Vercel.

## Environment Variables

```env
DATABASE_URL="file:./dev.db" # Or PostgreSQL URL
JWT_SECRET="your-secret-key"
APP_URL="https://your-app.com"
```
