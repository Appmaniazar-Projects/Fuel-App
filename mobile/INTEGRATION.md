Integration notes — connecting `fuelwise` frontend to `fillup-api` backend

Quickstart (local development)

1. Start the FillUp API backend
   - Open a terminal in `api/`
   - Install deps: `npm install`
   - For development without API keys, set: `FILLUP_DEV_MODE=true`
   - Run the server: `node server.js`
   - The API will be available at `http://localhost:3001/api`

2. Start the Fuelwise frontend
   - Open a terminal in `mobile/`
   - Install deps: `npm install`
   - Set environment variables for the frontend (example using Windows PowerShell):

```powershell
$env:EXPO_PUBLIC_FILLUP_API_URL = 'http://localhost:3001/api'
# If you have an API key: $env:EXPO_PUBLIC_FILLUP_API_KEY = 'your_key_here'
# For Expo: create a .env or use Expo dev configuration to pass the vars.
```

   - Start the app: `npx expo start`

Security notes
 - For production, do NOT expose secret API keys in public env vars. Use server-side secrets (Vercel, Supabase functions, etc.).
 - Prefer setting `FILLUP_API_KEYS` or `FILLUP_MASTER_KEY` in the backend host platform and keep the frontend using `FILLUP_DEV_MODE=false`.

What I changed
 - Added `lib/fillupApi.ts` in the frontend to call the FillUp API.
 - Updated `app/(tabs)/prices.tsx` and `app/price-history.tsx` to try the backend endpoints first, with a fallback to existing Supabase queries.
