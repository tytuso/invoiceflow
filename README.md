# BizDocs AI

Premium business document SaaS/PWA for invoices, quotations, receipts, delivery notes, purchase orders and statements.

## Stack
Next.js 16 · TypeScript · Tailwind CSS · Supabase · Vercel

## Local setup
1. Copy `.env.example` to `.env.local`.
2. Fill the Supabase publishable key and server-side OpenAI key.
3. Run `npm install`.
4. Run `npm run dev`.

## Supabase
The BizDocs tables use Row Level Security scoped to the authenticated business owner. Google OAuth must be enabled in Supabase Auth and the callback URL configured as `/auth/callback`.

## Production
Vercel is configured for Next.js and installs with `npm install`.