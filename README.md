# ✈ CK Travel Planner

> A curated, filterable travel planning web application built with Vanilla JavaScript ES Modules.  
> WDD 330 — Web Frontend Development II | Term 2026 Block 2

---

## 🚀 Quick Start

### 1. Clone or Download

```bash
git clone https://github.com/YOUR_USERNAME/ck-travel-planner.git
cd ck-travel-planner
```

### 2. Configure Your API Keys

Open `config.js` and replace the placeholder values:

```js
GEOAPIFY_KEY: 'YOUR_GEOAPIFY_API_KEY_HERE',
UNSPLASH_KEY: 'YOUR_UNSPLASH_ACCESS_KEY_HERE',
```

**Getting a Geoapify key (free, no credit card):**
1. Go to [geoapify.com](https://www.geoapify.com/) → "Get Started Free"
2. Create an account → "Create a New Project"
3. Copy your API key into `config.js`

**Getting an Unsplash key (free, 50 req/hr):**
1. Go to [unsplash.com/developers](https://unsplash.com/developers)
2. "Register as a developer" → "New Application"
3. Copy the **Access Key** (not the Secret Key) into `config.js`

### 3. Run a Local Dev Server

ES Modules require a server (can't open `index.html` directly due to CORS).

**Option A — VS Code Live Server (recommended):**
1. Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
2. Right-click `index.html` → **"Open with Live Server"**

**Option B — Node.js http-server:**
```bash
npx http-server . -p 3000
# Then open http://localhost:3000
```

**Option C — Python:**
```bash
python -m http.server 3000
# Then open http://localhost:3000
```

---

## 📁 Project Structure

```
ck-travel-planner/
├── index.html              # App shell — semantic HTML structure
├── main.js                 # Entry point — wires all modules together
├── config.js               # API keys & configuration
│
├── api/
│   ├── places.js           # Geoapify geocoding + places search
│   └── unsplash.js         # Unsplash photo fetch + sessionStorage cache
│
├── components/
│   ├── card.js             # Place card renderer
│   ├── filters.js          # Category chip filter bar
│   ├── itinerary.js        # Slide-out itinerary drawer + drag-and-drop
│   ├── mapView.js          # Google Maps iframe embed toggle
│   ├── modal.js            # Place detail modal with focus trap
│   └── toast.js            # Toast notification system
│
├── services/
│   ├── animation.js        # Modal, drawer, card animation utilities
│   └── storage.js          # localStorage wrapper with JSON serialisation
│
├── utils/
│   ├── helpers.js          # debounce, truncateText, buildStarRating, etc.
│   └── seo.js              # Dynamic document.title + Open Graph meta tags
│
└── styles/
    ├── variables.css       # CSS design tokens (colors, spacing, type)
    ├── reset.css           # CSS reset + base styles
    ├── typography.css      # Heading and body type rules
    ├── layout.css          # Navbar, hero, grid, map layout
    ├── components.css      # Cards, modal, drawer, chips, buttons, toasts
    ├── animations.css      # Keyframes + stagger/transition utilities
    └── responsive.css      # Mobile / tablet / desktop breakpoints
```

---

## ✨ Features

| Feature | Description |
|---|---|
| **Destination Search** | Autocomplete search via Geoapify Geocoding API |
| **Category Filters** | Food, Culture, Outdoor, Entertainment, Shopping, Hotels |
| **Place Cards** | Photos from Unsplash, rating, address, category badge |
| **Detail Modal** | Full place info, hours, phone, website, Google Maps link |
| **Itinerary Builder** | Bookmark places, drag-to-reorder, persists in localStorage |
| **Touch Drag** | Native touch support for itinerary reorder on mobile |
| **Map View** | Google Maps embed toggled alongside card grid |
| **Skeleton Loaders** | Shimmer placeholders while API data loads |
| **Error States** | Friendly errors with Retry button on network failures |
| **Responsive** | Fully responsive at 320px, 768px, and 1024px+ |
| **Accessible** | ARIA roles, focus trap in modal, keyboard navigation |
| **SEO** | Dynamic `document.title` + Open Graph meta tags per destination |
| **Session Restore** | Remembers last destination and filter on revisit |

---

## 🌐 Deployment to GitHub Pages

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial release"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repo → **Settings** → **Pages**
   - Source: **Deploy from a branch** → `main` → `/ (root)`
   - Click **Save**

3. **Restrict your Geoapify key** (important for security):
   - In [Geoapify dashboard](https://myprojects.geoapify.com/), select your project
   - Under **API key restrictions**, add your GitHub Pages URL:
     `https://YOUR_USERNAME.github.io`

4. **Live URL:** `https://YOUR_USERNAME.github.io/ck-travel-planner/`

---

## 🔒 Security Notes

- API keys are visible in client-side code. This is unavoidable for pure front-end apps.
- Mitigations:
  - Restrict your Geoapify key to your domain in the dashboard
  - Geoapify free tier has daily quotas — no unexpected charges
  - Unsplash Demo tier is rate-limited to 50 req/hr automatically
  - Photo URLs are cached in `sessionStorage` to minimise API calls

---

## 🧪 Accessibility

- All interactive elements are keyboard-accessible
- Modal traps focus and returns focus on close
- ARIA roles: `dialog`, `listbox`, `option`, `group`, `status`, `alert`
- `aria-live` regions for search results and itinerary count
- Reduced motion: all animations are disabled via `prefers-reduced-motion`
- Color contrast ratios meet WCAG AA standards

---

## 📋 W3C Validation

Validate at:
- HTML: https://validator.w3.org/
- CSS: https://jigsaw.w3.org/css-validator/

---

## 🛠 Development

**Lint:**
```bash
npx eslint . --ext .js
```

**APIs Used:**
- [Geoapify Geocoding API](https://apidocs.geoapify.com/docs/geocoding/autocomplete/)
- [Geoapify Places API](https://apidocs.geoapify.com/docs/places/)
- [Unsplash API](https://unsplash.com/documentation)
- Google Maps Embed (no key required for basic embed)

---

## 📄 License

MIT — built for WDD 330, Brigham Young University–Idaho, 2026.
