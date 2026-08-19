# Deprecated — not in use

`fillup-api` (the Vercel backend) is now the canonical source for fuel
price data. This edge function queried the same tables correctly, but
nothing in the app calls it — `lib/fillupApi.ts` only talks to `fillup-api`.

Kept here for reference rather than deleted outright. If you're confident
nothing needs it, you can also remove it from the deployed Supabase project
with:

    supabase functions delete fuel-prices
