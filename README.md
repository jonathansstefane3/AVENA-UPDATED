# AVENA Restaurant Website

A responsive three-page website for AVENA, a grain-led restaurant. The front end is plain HTML, CSS and JavaScript with no build step. A small Node server (no npm packages) serves the site and saves bookings and contact messages.

## Contents

- [Features](#features)
- [Quick start](#quick-start)
- [Project structure](#project-structure)
- [JavaScript overview](#javascript-overview)
- [Configuration](#configuration)
- [API](#api)
- [Tests](#tests)
- [Deployment](#deployment)
- [Browser support and accessibility](#browser-support-and-accessibility)
- [Troubleshooting](#troubleshooting)

## Features

**Pages**
- **Home** (`index.html`): hero, photo gallery, menu, booking form
- **Our story** (`about.html`): the restaurant's story and how it cooks
- **Contact** (`contact.html`): address, hours, message form and an embedded Google Map

**Interactive features (all JavaScript)**
- Menu loaded from JSON, with category tabs, live search across every category and Vegan / Vegetarian filters
- Gallery loaded from JSON, with a lightbox (keyboard arrows, Escape to close, click outside to close)
- Open / closed badge in the footer, based on the opening hours and the visitor's clock
- Booking form that limits the time field to the chosen day's hours and refuses closed days
- Validation in the browser and again on the server, with a localStorage fallback on static hosting
- Sections that fade in on scroll, a back-to-top button and a mobile menu
- Hours logic covered by automated tests

## Quick start

Requires Node.js 18 or newer. There is nothing to install.

```bash
npm start
```

Open http://localhost:3000. Other commands:

| Command | What it does |
| --- | --- |
| `npm start` | Runs the server |
| `PORT=8080 npm start` | Runs it on another port |
| `npm run dev` | Restarts the server when files change |
| `npm test` | Runs the tests |

## Project structure

```
avena/
├── package.json
├── server.js                  Static server and the two POST endpoints
├── test/
│   └── hours.test.js          Tests for the opening-hours logic
├── data/                      Created on first use (git-ignored)
│   ├── reservations.json
│   └── messages.json
└── public/
    ├── index.html
    ├── about.html
    ├── contact.html
    ├── css/styles.css
    ├── images/                Gallery and page illustrations
    ├── data/
    │   ├── menu.json          Menu content and currency symbol
    │   └── gallery.json       Gallery images, captions and alt text
    └── js/
        ├── hours.js           Opening hours, open status, booking-slot rules
        ├── app.js             Menu, gallery, forms, mobile nav
        └── extras.js          Open badge, lightbox, scroll reveal, back to top
```

## JavaScript overview

Each page loads three scripts in this order: `hours.js`, `app.js`, `extras.js`. Each script checks that the elements it needs exist, so the same files work on every page.

**`hours.js`** holds the `HOURS` table and exposes `window.AVENA` with:
- `slotRange(date)`: earliest and latest booking time for a date, or `null` if closed
- `validateSlot(date, time)`: returns an empty string if the slot is bookable, otherwise a message
- `openStatus(now)`: returns `{ open, text }`, for example "Open now until 22:00"

The file also works in Node, which is how the tests load it.

**`app.js`** contains:
- The oat stalk drawn into the hero SVG
- The menu: fetches `menu.json`, builds the tabs and renders dishes. A search box (debounced) searches all categories, and the filter chips narrow the results. Vegan dishes also count as vegetarian.
- The gallery: fetches `gallery.json` and renders each photo inside a button
- `wireForm()`, a shared helper that validates, posts JSON to the server and falls back to localStorage if the server is unreachable. The booking and contact forms both use it.
- Mobile navigation

**`extras.js`** adds enhancements that the site works without:
- The open / closed badge, refreshed every minute
- The lightbox, built on the native `<dialog>` element
- Scroll reveal using `IntersectionObserver` (skipped if the visitor prefers reduced motion)
- The back-to-top button

## Configuration

**Opening hours and booking rules.** Edit `HOURS` in `public/js/hours.js` (Sunday is 0, `null` means closed). Bookings stop 60 minutes before closing; change `LAST_BOOKING_BEFORE_CLOSE` to adjust that. Also update the hours shown in `contact.html`, which are plain text. The open badge uses the visitor's own clock, so it can be wrong for visitors in another time zone.

**Menu and prices.** Edit `public/data/menu.json`. Each item has `name`, `desc`, `price` and `tags`. Use the tags `vegan` and `vegetarian` for the filters to work. Change `currency` to your own symbol or code, such as `"UGX "`.

**Photos.** The images in `public/images/` are illustrations that stand in for photography. Add your own JPG or WebP files to that folder, then edit `public/data/gallery.json` (`src`, `alt`, `caption`). Gallery images display at a 4:3 ratio. The image on the story page is set in `about.html`.

**Google Map.** In `contact.html`, replace the `q=` value in the iframe `src` and in the "Open in Google Maps" link with your address, writing spaces as `+`. No API key is needed.

**Address, phone and email.** These appear in `contact.html` and in the footer of every page.

**Colours and fonts.** Change the variables at the top of `public/css/styles.css`.

## API

Both endpoints accept JSON and return `201 { "ok": true }` on success or `400 { "error": "..." }` with a message that is shown to the visitor.

| Endpoint | Fields | Stored in |
| --- | --- | --- |
| `POST /api/reservations` | `name`, `email`, `date`, `time`, `guests` (1 to 12), optional `notes` | `data/reservations.json` |
| `POST /api/messages` | `name`, `email`, `message` (10 to 1000 characters) | `data/messages.json` |

Example:

```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"name":"Sam","email":"sam@example.com","message":"Do you host private events?"}'
```

The server checks that the date is not in the past but does not check opening hours, because those rules live in the browser. If you need them enforced on the server, add `hours.js` to `server.js` with `require('./public/js/hours.js')` and call `validateSlot`. The server also sends no emails, so connect a mail service if you want confirmations or notifications.

## Tests

```bash
npm test
```

The tests in `test/hours.test.js` check that Mondays are closed, that late bookings are refused and that the open status text is correct at several times of day. They use Node's built-in test runner.

## Deployment

**Node hosts** (Render, Railway, Fly.io or a VPS): run `npm start`. The server reads the `PORT` environment variable. Bookings and messages are saved to files, so use a host with persistent storage or replace the file storage with a database.

**Static hosts** (Netlify, GitHub Pages): publish the `public/` folder. The forms then save requests only in the visitor's browser, so connect them to a form service or your own API before going live.

## Browser support and accessibility

The site works in current versions of Chrome, Edge, Firefox and Safari. The lightbox uses `<dialog>`, which these browsers support; without it, gallery images simply stay in the grid. The site has a skip link, visible keyboard focus, labelled controls, live regions for form and menu updates and support for reduced motion.

## Troubleshooting

- **The menu or gallery says it could not load.** Open the site through `npm start`. Opening `index.html` directly from disk blocks `fetch` for the JSON files.
- **The map shows the wrong place.** Replace the placeholder address in `contact.html`.
- **A booking is refused as outside opening hours.** Check `HOURS` in `public/js/hours.js`.
- **Port already in use.** Run with another port, for example `PORT=8080 npm start`.

## License

MIT
