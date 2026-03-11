# Compass Commerce

This app is the website and commerce shell that sits in front of the validated
Compass licensing backend.

Current scope:

- public product page for Compass Tri-Comp
- Stripe-ready checkout entry point
- operator-only entitlement provisioning form
- manual portal for activate, refresh, and revoke testing
- webhook-ready bridge into `POST /internal/v1/entitlements`

It assumes the licensing backend already exists and is reachable over HTTP.

## Environment

Copy `.env.example` to `.env.local` and fill in what you already know.

```bash
cp .env.example .env.local
```

Required later for the full production flow:

- `NEXT_PUBLIC_SITE_URL`
- `LICENSING_API_BASE_URL`
- `LICENSING_ADMIN_API_TOKEN`
- `OPERATOR_DASHBOARD_TOKEN`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_TRICOMP`

## Run

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Routes

- `/` home and backend status
- `/products/tri-comp` product page
- `/checkout` Stripe checkout entry
- `/portal` manual activate / refresh / revoke console
- `/operator/provision` private entitlement creation form

## API routes

- `GET /api/licensing/health`
- `POST /api/licensing/activate`
- `POST /api/licensing/refresh`
- `POST /api/licensing/revoke`
- `POST /api/operator/provision`
- `POST /api/checkout`
- `POST /api/stripe/webhook`

## What still needs user input

- the public hostname you want to use
- real Stripe secrets and price ids
- customer auth and account storage choice
- final production Caddy host config
