# TikTok creatives

A library of 1080×1920 images for posting to TikTok by hand. Every note, chord name and quiz answer comes from the app's own theory code (`src/utils/theory.ts`), so a creative can't show something the app would get wrong. Each creative also runs content checks, and the build stops if one fails.

## Render

```bash
npx sucrase-node marketing/tiktok/build.ts
```

- Images go to `out/{id}.png`. Open `out/index.html` for a contact sheet with the caption for each image.
- Pass a filter to render a subset: `npx sucrase-node marketing/tiktok/build.ts identify`.
- Needs Chrome or Edge (or set `CHROME_PATH`) and internet access for Google Fonts.
- Any text that doesn't fit shows up in the image with a **red outline**. Shorten the copy and re-render.

`out/` is gitignored because it can be regenerated. `tracker.csv` is committed.

## Templates

| Letter | Layout | Use for |
|---|---|---|
| A | Headline, subhead, visual | Showing a feature |
| B | Quiz, answer printed upside down | Comments and engagement |
| C | Cheat-sheet rows | Saves |

## IDs

`fret_{YYYYMMDD}_{angle}_{template}_{nn}`, e.g. `fret_20260916_identify_B_02`.

IDs are permanent. They're how a row in `tracker.csv` maps back to an image, so never renumber or reuse one. To add creatives, append to `creatives.ts` with today's date or the next number. The build rejects bad or duplicate IDs.

## Posting and tracking

1. Get the images to your phone (AirDrop, iCloud or Google Drive).
2. Post 1–2 a day, pasting the caption from the contact sheet.
3. Fill in `posted_date` in `tracker.csv`. A few days later, add views, likes, comments, shares, saves and profile visits from TikTok's per-post analytics.

The build appends rows for new IDs and never touches existing rows, so your numbers are safe.

After 4–6 weeks, compare by `angle` and `template`. Make more of what earns saves and profile visits, and drop the rest. If downloads don't move at all, that tells you something too.
