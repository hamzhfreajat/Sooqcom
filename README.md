# Sooqcom website

Public website for sooq-com.com: real-estate listings in Arabic and English, built for search engines.
It has no backend of its own. Every page reads from the same FastAPI backend the mobile app uses
(`/api/web/*`, see `backend/web_router.py`).

## Run locally

```bash
npm install
cp .env.example .env.local   # point API_URL at a backend that has /api/web
npm run dev
```

## Configuration

| Variable | Meaning | Default |
|---|---|---|
| `API_URL` | FastAPI backend, read at runtime | `https://api.sooq-com.com/api` |
| `NEXT_PUBLIC_SITE_URL` | Public address of the site, read at build time | `https://sooq-com.com` |

## Deploy

Build the `Dockerfile`; the container listens on port 3000.

## Address scheme

| Page | Arabic | English |
|---|---|---|
| Listing | `/للإيجار/شقق/عمان/خلدا/3-غرف-نوم` | `/en/rent/apartments/amman/khalda/3-bedrooms` |
| Ad | `/اعلان/{id}-{slug}` | `/en/ad/{id}-{slug}` |

Everything after the deal is optional, in the order type, city, region, one refinement.
The refinement is a number of bedrooms (`3-غرف-نوم`), or for rentals `مفروشة` (furnished), `يومي` (daily) or `شهري` (monthly).
Type names follow search demand (see `seo/keyword-planner/merged_keywords.tsv`): `استوديو`, `بيوت`, `سكن-طالبات`, `غرف`.
The rules live in `src/lib/taxonomy.ts`; sitemaps are generated from the same rules in `src/lib/sitemap.ts`.

## What search engines may index

- Listing pages with at least 3 ads (`MIN_ADS_TO_INDEX`), without sort or price parameters.
- English listing pages only when the city and region have English names in the database.
- Ad pages in Arabic only (the ad text is Arabic), and only ads with a price, a photo and a real description.
