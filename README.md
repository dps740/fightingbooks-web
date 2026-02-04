# FightingBooks Web

Commercial web app for generating custom animal battle books for kids.

## Features

- 🎨 Pick any two animals for an epic illustrated battle
- 📖 AI-generated 15-page picture book with educational facts
- 🎮 **CYOA Mode** - Choose Your Own Adventure with 27 unique paths per matchup
- 🗄️ **Smart Caching** - Books and CYOA paths cached in Vercel Blob for instant replay
- 🔧 **Admin Panel** - Manage cache, regenerate images, view CYOA path coverage
- 💰 First book free, $1 per additional book
- 👤 User accounts with book history
- 💳 Stripe payments

## CYOA (Choose Your Own Adventure)

Each CYOA book has 3 decision gates with 3 choices each, creating 27 possible story paths:
- Choices: **A** (favors animal A), **B** (favors animal B), **N** (neutral)
- Paths like `A-B-N`, `B-A-A`, etc. are cached after first playthrough
- Same choices = same outcomes (consistent experience)

**Admin Panel:** `/admin` → CYOA Paths tab shows path coverage per matchup

## Tech Stack

- **Frontend**: Next.js 15, React, Tailwind CSS
- **Auth/Database**: Supabase
- **Payments**: Stripe
- **PDF Generation**: Python backend (fightingbooks-redesign)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

Create a new Supabase project and run this SQL:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  credits INTEGER DEFAULT 1,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Books table
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  animal_a TEXT NOT NULL,
  animal_b TEXT NOT NULL,
  environment TEXT,
  winner TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  amount INTEGER,
  credits INTEGER,
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can read own books" ON books
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can do anything" ON users
  FOR ALL USING (true);
  
CREATE POLICY "Service role can do anything" ON books
  FOR ALL USING (true);
  
CREATE POLICY "Service role can do anything" ON payments
  FOR ALL USING (true);
```

### 3. Set up Stripe

1. Create a Stripe account
2. Get your API keys from the Stripe dashboard
3. Set up a webhook endpoint pointing to `/api/webhook`
4. Add the `checkout.session.completed` event

### 4. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Railway (for Python backend)

The Python generator can run as a separate service on Railway if needed for scaling.

## Pricing

- First book: **FREE** (no account required)
- Additional books: **$1 each**
- Bulk credits: 5 for $5 (volume discounts possible)

## File Structure

```
src/
├── app/
│   ├── page.tsx           # Animal picker landing page
│   ├── generate/          # Book generation with progress
│   ├── signup/            # Auth (signup/login)
│   ├── dashboard/         # User dashboard & book history
│   └── api/
│       ├── generate/      # Book generation API
│       ├── auth/          # Auth endpoints
│       ├── checkout/      # Stripe checkout
│       ├── webhook/       # Stripe webhooks
│       └── user/          # User data
├── lib/
│   └── supabase.ts        # Supabase client
└── ...
```

## License

Proprietary - FightingBooks
