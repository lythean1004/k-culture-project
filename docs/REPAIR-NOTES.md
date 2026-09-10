# September 2026 repair

## Confirmed code and deployment issues

- The deployed Busan page responds, but its map uses circular pseudo-positions instead of coordinates.
- Place and event imports assigned unknown locations to Seoul or the first city in the database.
- Local package details regenerated a different itinerary, repeating stops across days.
- The legacy init.sql schema differs from migrations (address fields, package item IDs, package metadata).
- Redis defaulted to localhost in Vercel, introducing retries when no Redis exists.
- The committed lock file failed npm ci due to inconsistent transitive dependencies.
- Weather and official translation badges were hardcoded instead of backed by verified data.

## Deployment

1. Deploy this app-source repository as the Next.js project root. Node 20 or newer is required.
2. Set server-only SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel. Never use a NEXT_PUBLIC prefix for the service-role key. REDIS_URL is optional.
3. Apply the three migrations dated 20260910 in order. They support both legacy init.sql and the existing migrations. Do not rerun the entire init.sql on a live database.
4. Run `node scripts/check-backend.mjs` with the target environment locally to distinguish missing credentials, authorization failures, missing tables and empty data. The script only reads metadata and counts; it never prints keys.
5. Generate a Busan or Gyeongju itinerary and open its full route. Confirm that the same stop IDs and day assignments survive navigation and refresh.

Without database credentials the app uses its regional starter catalog and labels that mode. Without the snapshot migration, routes survive locally in browser storage and in the current server cache, but durable cross-device sharing requires the snapshot table. The production database and Vercel secrets were not accessible in this checkout, so no production database repair or deployment has been claimed.

Map lines show stop order, not routed roads. Directions open the real coordinates in Google Maps. Intercity transfers, actual opening hours, and event availability require separate verification.
