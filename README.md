# User Analytics Application

A full-stack user analytics platform that tracks page views and clicks, visualizes sessions, and generates heatmaps — built as a monorepo with a Node.js backend, Next.js dashboard, vanilla JS tracker, and demo site.

---

## Architecture

```
/Assign-CF
├── /backend      # Node.js + Express API (TypeScript)
├── /frontend     # Next.js Dashboard (App Router + Tailwind CSS)
├── /tracker      # Vanilla JS tracking script
├── /demo         # HTML demo site with tracker integration
└── README.md
```

## Tech Stack

| Layer           | Technology                                |
|-----------------|-------------------------------------------|
| **Backend**     | Node.js, Express, TypeScript, Mongoose    |
| **Database**    | MongoDB                                   |
| **Frontend**    | Next.js (App Router), Tailwind CSS, TypeScript |
| **Tracker**     | Vanilla JavaScript (ES6)                  |

---

## Setup Instructions

### Prerequisites

- **Node.js** v18+ installed
- **MongoDB** running locally on `mongodb://localhost:27017` (or update the `.env` file)
- **npm** package manager

### 1. Start the Backend

```bash
cd backend
npm install
npm run dev
```

The API server will start on `http://localhost:3001`.

#### Environment Variables

Create or modify `backend/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/user-analytics
PORT=3001
```

### 2. Start the Frontend Dashboard

```bash
cd frontend
npm install
npm run dev
```

The dashboard will start on `http://localhost:3000`.

### 3. Serve the Demo Site

Use any static file server. For example:

```bash
# Using Python
cd demo
python -m http.server 8080

# Using npx serve
npx -y serve demo -l 8080

# Or simply open demo/index.html directly in the browser
```

### 4. Generate Events

1. Open the demo site (e.g., `http://localhost:8080/index.html`)
2. Click around the page, navigate between Home and About
3. Open the dashboard at `http://localhost:3000` to see your sessions and heatmaps

---

## API Endpoints

| Method | Endpoint                          | Description                                   |
|--------|-----------------------------------|-----------------------------------------------|
| `GET`  | `/api/health`                     | Health check                                  |
| `POST` | `/api/events`                     | Ingest a tracking event                       |
| `GET`  | `/api/sessions`                   | List all sessions with aggregated data        |
| `GET`  | `/api/sessions/:sessionId/events` | Get all events for a specific session         |
| `GET`  | `/api/heatmap?pageUrl=<url>`      | Get click events for a specific page URL      |
| `GET`  | `/api/pages`                      | List all distinct tracked page URLs           |

---

## Trade-offs & Assumptions

### `localStorage` vs Cookies
- **Decision:** `localStorage` is used for session ID storage.
- **Rationale:** Simpler implementation with no server-side cookie handling. Works well for single-domain tracking.
- **Trade-off:** Does not support cross-subdomain tracking (e.g., `app.example.com` ↔ `www.example.com`). Cookies with a `.example.com` domain would be needed for that.

### Fixed Viewport Assumptions for Heatmap
- **Decision:** The heatmap renders click coordinates (`pageX`, `pageY`) as absolute-positioned dots.
- **Assumption:** The heatmap viewport has fixed dimensions (1440×900). Clicks from devices with different screen sizes or resolutions may appear offset.
- **Improvement:** In production, normalize coordinates to percentages of the page width/height, or capture the viewport dimensions alongside each click event.

### Session ID Persistence
- **Decision:** Sessions persist until `localStorage` is cleared.
- **Trade-off:** A single user may have an extremely long session spanning days. In production, implement session expiration (e.g., 30-minute inactivity timeout) or rotate sessions on each visit.

### sendBeacon API
- **Decision:** `navigator.sendBeacon` is the primary transport, with `fetch` as fallback.
- **Rationale:** `sendBeacon` is non-blocking and survives page navigation/unload, making it ideal for analytics. It has excellent browser support (95%+).
- **Trade-off:** `sendBeacon` has a 64KB payload limit, which is more than sufficient for individual events but wouldn't work for batched bulk uploads.

### Production Deployment
- In a production CI/CD environment, this stack would benefit from:
  - **Docker Compose** for containerized local development and consistent deployments
  - **Environment-specific configs** for staging/production MongoDB URIs
  - **Rate limiting** on the event ingestion endpoint to prevent abuse
  - **Data retention policies** and TTL indexes on MongoDB to auto-expire old events
  - **CDN distribution** for the tracker script (similar to Google Analytics)
  - **HTTPS enforcement** and CORS origin whitelisting

---

## License

MIT
