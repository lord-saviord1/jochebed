# Jochebed's Touch — showcase site (2 pages)

Pages: `index.html` (story, ends on the map) and `kitchen.html` (dishes, space, gallery, order).
No build step, no libraries, no CDN. Upload the whole folder to GitHub Pages as-is.

## Replace the old files
Delete from the repo: `menu.html`, `menu.css`, `script.js`, `styles.css` (the menu, cart and forms are gone).

## Photos (put them in `images/`, same names, .jpg)
- Dishes: `dish-jollof-chicken.jpg`, `dish-noodles-egg.jpg`, `dish-eba-ogbono.jpg`, `dish-nkwobi.jpg`
  (Egusi, Suya and Moi Moi use the Unsplash links from the old site; swap the `src` in kitchen.html when you have your own.)
- Space: `space-lounge.jpg`, `space-matchnight.jpg`
- Client photos: `gallery-1.jpg` ... `gallery-12.jpg`. Drop them in and a "Come as you are" gallery appears by itself. No code changes. With none present, the section stays hidden.
Missing photos show a branded leaf-gradient placeholder instead of a broken image.

## Things to edit
- WhatsApp number: search `2347077310948` in index.html and kitchen.html.
- Text: plain HTML, edit directly. Testimonials are the old site's; confirm they are real before launch.
- Colors: top of `css/style.css` (`:root`). Scene palettes: top of `js/gl.js`.
