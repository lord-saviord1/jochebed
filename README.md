# Jochebed's Touch — 2-page showcase site

Pages: `index.html` (Our Story / Find Us) and `kitchen.html` (Kitchen & Space). No build step, no dependencies. Upload the folder as-is (GitHub Pages works).

## Photos

Photos live in `images/` (`.jpg`) and are already wired in. A missing photo
falls back to a branded gradient, and missing photo-band cards are skipped.

| File | Dish |
|---|---|
| dish-jollof-1.jpg, dish-jollof-2.jpg | Jollof rice & chicken (two shots) |
| dish-noodles-egg.jpg | Indomie & egg |
| dish-noodles-sausage.jpg | Indomie & sausage |
| dish-eba-ogbono.jpg | Eba & ogbono |
| dish-nkwobi.jpg | Nkwobi |
| dish-egusi-2.jpg | Egusi soup |
| dish-suya-1.jpg, dish-suya-2.jpg | Suya (two shots) |
| dish-moimoi-1.jpg, dish-moimoi-2.jpg | Moi moi (two shots) |

Still to add (they appear automatically):
- `gallery-1.jpg` to `gallery-12.jpg`: optional gallery, shown only if at least one exists

Aim for about 1200px on the long side and under 300 KB each.

## Behaviour notes
- ASCII intro plays on the first visit of each browsing session (new tab/visit), can be skipped (button, Enter, Esc, click). Skipped for reduced-motion users and `#links`.
- "Open now" status uses real hours in Africa/Lagos time.
- Mobile: horizontal dish strip is a normal swipe; pinned sections are shorter.
- WhatsApp: +234 707 310 9948 (edit the `wa.me` links to change).
- Testimonials are carried over from the original site; confirm with the client.

## Link previews & icons
- Share preview: `images/og-image.jpg` (1200x630), used by WhatsApp, X, Facebook, LinkedIn, Slack and iMessage via the Open Graph / Twitter tags in each page's `<head>`.
- Icons: `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, plus `site.webmanifest`.
- `robots.txt` and `sitemap.xml` point at https://jochebedstouch.cipherpr.live/. Update them if the domain changes.
- Platforms cache previews. After deploying, refresh WhatsApp's by sharing the link with `?v=2` on the end, and use Facebook's Sharing Debugger to re-scrape.

## Fonts
Brand type follows the client flyer. Baloo 2 is used for the hero word, headings, nav, buttons, labels and the orange italic "Jochebed's". Fredoka is used for the motto ("Every conversation, a connection.") and the tagline. Inter is body text only. All load from Google Fonts in each page's `<head>`.

## v8 — brand guideline pass (Oct 2024 guide)
- Palette: Amethyst #7B3C98, Pear #A0B043, Sky #0397DB, Sunshine #FDD835, Coral #E2552B (taken from the guide's swatches).
- Type: guide specifies Museo Sans Rounded (headlines) + Aktiv Grotesk (body). Both are licensed, so Nunito + Inter are stand-ins. To switch: add the Adobe Fonts / licensed files and change `--head` / `--body` in css/style.css.
- Logos extracted from the guide PDF as vector SVGs: images/logo-white(.svg|-mark.svg), logo-color(.svg|-mark.svg). Replace with the client's originals when available.
- Ordering is two routes only: "Order Now" (opens WhatsApp) or "Call to order" (tel:+2347073109948). No payments. Dish cards say "Ask about this dish".
- Showcase note: "Food photos are a showcase. For the full menu and prices, reach out to us."
- Socials: Instagram @jochebedfood, Facebook, YouTube @Jochebed_food (footer + Visit section + JSON-LD sameAs).
