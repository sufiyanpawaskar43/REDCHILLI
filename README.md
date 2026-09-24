# Red Chilli Counter Billing System

Internal counter billing software for Red Chilli.

## Scope

- Staff login and role-based access
- Dine-in, takeaway and room-service billing
- Guest count and table/room capture
- Menu, variants, availability and prices from Supabase
- Server-side order calculation and price validation
- Invoice creation and printing
- KOT/kitchen-slip printing (80mm thermal and A4)
- Dashboard and sales reports
- Menu and hotel/tax settings for authorized staff/admins
- Responsive desktop, laptop, tablet and phone UI

## Excluded

- Payment gateway / Razorpay / online payments
- Customer ordering portal
- Customer tracking portal
- Digital KDS / kitchen status screen
- Customer contact management
- Realtime kitchen workflow

## Setup

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Install and run:

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```
