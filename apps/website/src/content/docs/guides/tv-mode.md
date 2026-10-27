---
title: TV mode (living room)
description: Use Seedarr on a TV or set-top box with the remote — spatial navigation and a simplified UI.
---

Seedarr includes an optional **TV mode** for browsers on TVs, consoles, and set-top boxes. It turns on **spatial navigation** (arrow keys / D-pad / remote) and adjusts the layout for distance viewing.

## Enable TV mode

Add `mode=tv` to the URL query string, for example:

```text
https://your-seedarr.example/movies?mode=tv
```

While TV mode is active, in-app navigation keeps `mode=tv` on links so you stay in the remote-friendly UI.

You can bookmark your instance with `?mode=tv` on the page you open most often (e.g. **Movies** or **Library**).

## What changes

- **Top bar** — main sections (Movies, TV Shows, Library, Profile) as focusable pills; search opens the global or library search flow.
- **Discover & carousels** — focus rings and arrow-key navigation between posters and actions.
- **Search** — from the top bar, open search then type with a connected keyboard or on-screen keyboard; results use the grid layout.
- **Library** — search from the top bar; grid view; library sync from the UI is **disabled** in TV mode for now.
- **Player** — playback screen optimized for TV focus (full-screen play, episode carousel where applicable).

## Tips

- Use a **wireless keyboard** or your platform’s on-screen keyboard for search queries.
- TV mode is a **front-end** flag only; permissions and roles are unchanged.
- To leave TV mode, remove `mode=tv` from the URL or open Seedarr without that parameter.

## Development

TV mode is implemented in `apps/web` (`features/tv-mode/`, `?mode=tv` → Zustand store + `data-tv` on `<html>`). See the root `AGENTS.md` for agent-facing notes.
