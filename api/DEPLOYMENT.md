Deployment steps and scheduler configuration

1) Environment variables (set in Vercel/project settings):

- `SUPABASE_URL` — your Supabase URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (secret)
- `FILLUP_MASTER_KEY` or `FILLUP_API_KEYS` — API key(s) used by scheduler and admin
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` — optional for frontend

2) Vercel config

- `vercel.json` contains a `crons` entry that will POST to `/api/fuel/update-monthly` on the first Wednesday at 08:00 SAST:

```
{
  "path": "/api/fuel/update-monthly",
  "schedule": "0 8 1-7 * 3",
  "timezone": "Africa/Johannesburg"
}
```

IMPORTANT: Some cron providers treat the day-of-month and day-of-week fields as OR. Vercel's scheduler follows standard cron semantics (both fields are matched using AND when both are restricted). If you are using another scheduler that uses OR semantics, instead schedule every Wednesday at 08:00 and let the endpoint check `new Date().getDate() <= 7` before acting.

3) Deploy steps (example CLI)

```powershell
# from repo root
npm install
# ensure build succeeds
npm run build
# push to git remote then deploy via Vercel CLI
vercel deploy --prod
```

4) Testing the endpoint manually

Use the master key header `X-FillUp-Key` or pass `api_key` query param.

```bash
curl -X POST https://<your-vercel-app>.vercel.app/api/fuel/update-monthly \
  -H "X-FillUp-Key: <YOUR_MASTER_KEY>"
```

5) Local testing (without scheduler)

You can run the serverless functions locally with Vercel CLI and then POST the endpoint the same way. Ensure local env contains the Supabase keys and `FILLUP_MASTER_KEY`.

6) Safety notes

- The fetcher validates required fuels (`unleaded_93`, `unleaded_95`, `diesel_low_sulphur`, `diesel_ultra`) and will fail with a 500 if they are missing. This prevents silent overwrites with partial data.
- If you prefer a defensive mode that does nothing when validation fails, modify `api/fuel/update-monthly.js` accordingly.

7) Rollback and monitoring

- Check function logs in Vercel (or your hosting provider) after scheduled runs.
- Monitor Supabase inserts for duplicates and integrity.

8) Optional: Admin button

Create a secure admin UI that POSTs to `/api/fuel/update-monthly` using `FILLUP_MASTER_KEY` to trigger an immediate refresh.
