# 🎬 Stremio Addon Manager

A Stremio addon that lets you **reorder, enable/disable, and manage** your installed addons through a beautiful drag-and-drop configure page — all without leaving Stremio.

---

## Why?

In Stremio, **addon order = stream priority**. The first addon that provides a stream is shown first. Currently, reordering means uninstalling and reinstalling in the right order. This addon fixes that.

---

## Features

| Feature | Status |
|---|---|
| Drag-and-drop reordering | ✅ |
| Move Up / Move Down buttons (keyboard/mobile) | ✅ |
| Enable / Disable addons (without removing) | ✅ |
| Pin addons to the top | ✅ |
| Remove addons | ✅ |
| Search / filter by name | ✅ |
| Group by type (stream, catalog, meta, subtitles) | ✅ |
| Backup & Restore as JSON | ✅ |
| Local API (Stremio desktop, no auth needed) | ✅ |
| Cloud API (cross-device sync with auth key) | ✅ |
| Dark theme, responsive layout | ✅ |

---

## Requirements

- **Node.js 18+**
- For **Local mode**: Stremio desktop running on the same machine
- For **Cloud mode**: your Stremio auth key (works on any host, including Vercel)

---

## Deployment

### 🚀 Option 1 — Vercel (recommended, free, no server needed)

> ⚠️ **Cloud mode only on Vercel.** A remote host cannot reach your local `127.0.0.1:11470`. You must use **Cloud** mode with your Stremio auth key.

#### Via Vercel CLI

```bash
# Install CLI
npm install -g vercel

# Clone and deploy
git clone https://github.com/yourname/stremio-addon-manager.git
cd stremio-addon-manager
vercel        # preview
vercel --prod # production
```

You'll get a URL like `https://stremio-addon-manager.vercel.app`.

**Install in Stremio:** `https://your-app.vercel.app/manifest.json`

#### Via Vercel Dashboard (no CLI)

1. Push this repo to GitHub
2. [vercel.com](https://vercel.com) → Add New Project → import your repo
3. Leave all settings as-is (no build command, no output directory)
4. Click **Deploy**

---

### 🖥 Option 2 — Run locally (Local + Cloud mode)

```bash
git clone https://github.com/yourname/stremio-addon-manager.git
cd stremio-addon-manager
npm install
npm start
# → http://localhost:7000
```

**Install in Stremio:** `http://localhost:7000/manifest.json`

> Make sure Stremio desktop is running before clicking "Load Addons" in Local mode.

---

### Finding your auth key

Required for Cloud mode. Find it one of these ways:

**Stremio desktop:** Settings → Account → Auth Key / API Key

**From file:**
- Windows: `%APPDATA%\stremio\server-settings.json`
- macOS: `~/Library/Application Support/stremio/server-settings.json`
- Linux: `~/.config/stremio/server-settings.json`

Copy the value of the `"authKey"` field.

---

## Usage

1. Install the addon in Stremio using your manifest URL
2. Find **Addon Manager** in your addon list
3. Click **⚙ Configure**
4. Enter your auth key (cloud) or keep Local mode (desktop only)
5. Click **Load Addons**

### Reordering
Drag the ⠿ handle to reorder. Use **▲ / ▼** buttons for keyboard/mobile.

### Pinning
Click 📌 to pin an addon to the top — it won't move during drag operations.

### Disabling
Click **●** to disable an addon (keeps it in the list but excludes it when saving).

### Removing
Click 🗑 to permanently remove an addon. The Addon Manager itself is protected.

### Backup & Restore
Click **📦 Backup** to export your collection as JSON, download it, or paste a backup to restore.

---

## Project Structure

```
stremio-addon-manager/
├── index.js              # Local Express server entry point
├── configure.html        # Interactive management UI (single HTML file)
├── vercel.json           # Vercel routing config
├── api/
│   ├── manifest.js       # GET  /manifest.json  (serverless)
│   ├── configure.js      # GET  /configure      (serverless)
│   ├── health.js         # GET  /api/health      (serverless)
│   └── addons/
│       ├── get.js        # POST /api/addons/get  (serverless)
│       └── set.js        # POST /api/addons/set  (serverless)
├── lib/
│   └── stremioAPI.js     # Stremio local + cloud API helpers
├── package.json
└── README.md
```

---

## Troubleshooting

**"Could not load addons" on Vercel**
→ You must use Cloud mode. Enter your auth key and switch the source selector to Cloud.

**Auth key invalid / 403 error**
→ Double-check the key from `server-settings.json`. Keys are long alphanumeric strings.

**Configure page shows blank**
→ Open `https://your-app.vercel.app/configure` directly in a browser to check for errors.

**Changes don't seem to apply**
→ Some Stremio versions need a restart. Close and reopen Stremio after saving.

**Local mode: "local Stremio server unreachable"**
→ Make sure Stremio desktop is open and running. Port 11470 must be accessible.

---

## License

MIT
