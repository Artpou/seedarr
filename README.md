<p align="center">
<img src="./apps/web/public/logo512.png" alt="Seedarr" width="200" style="margin: 20px 0;">
</p>

<h1 align="center">Seedarr</h1>

<p align="center">
A modern, self-hosted media discovery and torrent search platform powered by TMDB and your favorite indexers.
</p>

---

**Seedarr** is a free and open-source web application that combines the power of **[The Movie Database (TMDB)](https://www.themoviedb.org/)** with torrent indexers like **[Prowlarr](https://prowlarr.com/)** and **[Jackett](https://github.com/Jackett/Jackett)** to help you discover and find media content.

## ✨ Features

- **TMDB Integration** - Browse movies and TV shows with rich metadata, ratings, and artwork
- **Torrent Search & Download** - Search for torrents directly through Prowlarr or Jackett
- **WebTorrent Integration** - Download torrents directly in the app with real-time progress
- **Video Streaming** - Stream downloaded videos directly in the browser (MP4 support)
- **Personal Lists** - Like, watch list, and viewing history tracking
- **Multi-language Support** - Available in English and French (more coming soon!)
- **Role-Based Access** - User roles (viewer, member, admin, owner) with different permissions
- **Responsive Design** - Beautiful UI that works seamlessly on desktop, tablet, and mobile

## 🚀 Tech Stack

- **Frontend**: React 19 + TanStack Router + Vite
- **Backend**: Hono + Node.js (tsx runtime)
- **Database**: SQLite with Drizzle ORM
- **Styling**: Tailwind CSS v4 + Radix UI
- **Type Safety**: TypeScript with Zod validation
- **Package Manager**: pnpm
- **Linting**: Biome
- **Torrent**: WebTorrent for downloads and streaming

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) v18.0.0 or higher
- [pnpm](https://pnpm.io/) v9.0.0 or higher
- (Optional) [FFmpeg](https://ffmpeg.org/) for video remuxing (MKV to MP4)
- (Optional) A [TMDB API key](https://www.themoviedb.org/settings/api)
- (Optional) Prowlarr or Jackett instance for torrent search

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/seedarr.git
   cd seedarr
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   # API Configuration
   API_PORT=3002

   # Frontend Configuration
   VITE_API_URL=http://localhost:3002
   VITE_TMDB_API_KEY=your_tmdb_api_key_here
   ```

4. **Initialize the database**

   ```bash
   pnpm db:push
   ```

5. **Start the development servers**

   ```bash
   pnpm dev
   ```

   The application will be available at:
   - **Web**: http://localhost:3000
   - **API**: http://localhost:3002

## 📖 Usage

1. **Create an account** - Sign up with a username and password
2. **Configure indexers** - Go to Settings and add your Prowlarr or Jackett instance
3. **Browse media** - Explore movies and TV shows by category or search
4. **Find torrents** - Click on any title to view details and search for torrents

## 🏗️ Project Structure

```
.
└── 📁 apps/
    ├── 📁 api/                      # Hono Backend (Port 3002)
    │   ├── 📁 src/
    │   │   ├── 📁 auth/            # Authentication utilities
    │   │   ├── 📁 db/              # Database schema & migrations
    │   │   ├── 📁 helpers/         # Utility functions
    │   │   ├── 📁 modules/         # Feature modules (routes & services)
    │   │   └── server.ts           # Hono app entry point
    │   ├── 📁 downloads/            # Downloaded torrent files
    │   └── drizzle.config.ts
    │
    └── 📁 web/                      # React Frontend (Port 3000)
        ├── 📁 public/               # Static assets
        │   ├── logo512.png
        │   ├── 📁 movie/category/   # Movie genre images
        │   └── 📁 tv/category/      # TV genre images
        └── 📁 src/
            ├── 📁 features/        # Feature-based modules
            ├── 📁 shared/          # Shared components and utilities
            ├── 📁 routes/          # TanStack Router routes
            │   ├── _app.*.tsx      # Authenticated layout/routes
            │   └── _auth.*.tsx     # Public layout/routes
            ├── 📁 lib/             # Core utilities & API client
            ├── 📁 locales/         # i18n translations (en, fr)
            ├── main.tsx            # App entry point
            └── styles.css          # Global styles & theme
```

### Key Directories

- **`apps/api/src/modules/`** - Each module contains routes, services, and business logic for a specific feature
- **`apps/web/src/features/`** - Feature-based architecture with components, hooks, and helpers co-located
- **`apps/web/src/shared/`** - Reusable components and utilities used across features
- **`apps/web/src/routes/`** - TanStack Router file-based routing

## 🧪 Development

```bash
# Run both API and web
pnpm dev

# Run API only
pnpm dev:api

# Run web only
pnpm dev:web

# Lint all packages
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Type check
pnpm type-check

# Database commands
pnpm db:generate    # Generate migrations
pnpm db:push        # Push schema to database
pnpm db:studio      # Open Drizzle Studio
```

## ⚙️ Configuration

For detailed configuration options (especially for Docker and indexer setup), see:

- [API Configuration Guide](apps/api/CONFIGURATION.md)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [TMDB](https://www.themoviedb.org/) for their excellent API
- [Prowlarr](https://prowlarr.com/) and [Jackett](https://github.com/Jackett/Jackett) for indexer management
- All the amazing open-source projects that made this possible

---

<p align="center">Made with ❤️ using pnpm, Hono, and React</p>
