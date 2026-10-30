# FuelApp (FuelWise)

Consumer fuel intelligence app for South African motorists: current and
historical fuel prices, nearby stations, vehicle garage, fill-up tracking
and consumption insights.

## Layout

| Folder    | What it is                                   | Stack                          |
|-----------|----------------------------------------------|--------------------------------|
| `mobile/` | The FuelWise app                             | Expo, React Native, TypeScript |
| `api/`    | FillUp API — scrapes SA fuel prices (FIASA)  | Node.js, Express, Cheerio, Vercel |
| `mobile/supabase/` | Database migrations and edge functions | Supabase                       |

Both parts share one Supabase project.

## Run locally

**API**

```powershell
cd api
npm install
copy .env.example .env   # then fill in the Supabase values
node server.js           # http://localhost:3001/api
```

**Mobile app** (in a second terminal)

```powershell
cd mobile
npm install
copy .env.example .env   # then fill in the Supabase values
npx expo start
```

## History

`mobile/` carries over the full commit history of
[CrazyChips34/fuelwise](https://github.com/CrazyChips34/fuelwise).
The API was previously not under version control.
