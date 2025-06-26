# MetalPathfinder

A web-based MVP that enables metal music enthusiasts to discover new tracks by describing what they appreciate in a selected piece from their library. The system integrates with Spotify for music metadata, and utilizes OpenAI API to generate personalized recommendations.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

MetalPathfinder is an educational project that addresses the challenge metal music listeners face when trying to discover new music beyond their comfort zone. The application allows users to:

- **Authenticate via Spotify OAuth** to access their music library
- **Describe musical preferences** in natural language for selected tracks
- **Receive AI-powered recommendations** with explanations and artist biographies
- **Control recommendation style** via a popularity slider (Popular ↔ Niche)
- **Manage their music library** by adding/removing tracks
- **Block unwanted recommendations** for specified time periods

### Key Features

- Responsive design (320px+ viewport support)
- Integration with Spotify Web API for music data and metadata
- AI-powered music recommendations via OpenAI API
- Personal music library management
- Smart content filtering and blocking system

## Tech Stack

### Frontend

- **Astro 5** - Fast, modern web framework with minimal JavaScript
- **React 19** - Interactive components where needed
- **TypeScript 5** - Static typing for better development experience
- **Tailwind CSS 4** - Utility-first CSS framework
- **Shadcn/ui** - Accessible React component library

### Backend

- **Supabase** - Complete backend-as-a-service solution
  - PostgreSQL database
  - Built-in user authentication
  - Real-time subscriptions
  - RESTful API

### AI Integration

- **OpenAI API** - Direct integration with OpenAI's language models
- Advanced prompt engineering for music recommendations

### Testing

- **Vitest** - Fast unit testing framework compatible with Vite
- **React Testing Library** - Testing React components with user-centric approach
- **Playwright** - End-to-end and cross-browser testing
- **MSW (Mock Service Worker)** - API mocking for development and testing
- **Lighthouse CI** - Performance and accessibility monitoring

### Development & Deployment

- **GitHub Actions** - CI/CD pipeline with automated testing
- **DigitalOcean** - Cloud hosting with Docker containers
- **ESLint & Prettier** - Code quality and formatting
- **Husky** - Git hooks for pre-commit validation

## Getting Started Locally

### Prerequisites

- **Node.js** 22.14.0 (specified in `.nvmrc`)
- **Bun** (recommended) or npm
- **Spotify Developer Account** for API credentials
- **OpenAI API key** for AI recommendations
- **Supabase project** for database and authentication

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd metal-pathfinder
   ```

2. **Install dependencies**

   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Configure the following variables:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `OPENAI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

4. **Run the development server**

   ```bash
   bun run dev
   ```

5. **Open the application**
   Navigate to `http://localhost:4321` in your browser

## Available Scripts

| Script             | Description                          |
| ------------------ | ------------------------------------ |
| `bun run dev`      | Start the development server         |
| `bun run build`    | Build the application for production |
| `bun run preview`  | Preview the production build locally |
| `bun run astro`    | Run Astro CLI commands               |
| `bun run lint`     | Run ESLint to check code quality     |
| `bun run lint:fix` | Fix auto-fixable ESLint issues       |
| `bun run format`   | Format code with Prettier            |

## Project Scope

### ✅ In Scope (MVP)

**Core Functionality:**

- Spotify OAuth authentication and user onboarding
- Music library management (add, remove, view tracks)
- AI-powered music discovery with natural language descriptions
- Advanced music metadata display
- Recommendation blocking system (1 day, 7 days, forever)
- Responsive UI design (320px to desktop)
- Artist biography generation

**Technical Features:**

- Real-time API integrations (Spotify, OpenAI)
- Online database storage (Supabase)
- Error handling for network and API failures
- Performance monitoring and optimization

### ❌ Out of Scope (Future Versions)

- Social features (sharing, friends, comments)
- Advanced analytics and ML on listening history
- Multiple streaming service integrations
- Audio playback or preview functionality
- Premium features (playlist export, advanced filtering)
- Offline mode and local file synchronization
- Complex genre filtering and statistics

## Project Status

🚧 **In Development** - MVP Phase

This is an educational project currently in active development. The application is being built as a functional prototype to validate the concept of AI-powered metal music discovery.

### Success Metrics

**Product Goals:**

- ≥3 discovery sessions per user per week
- ≥30% of recommended tracks added to user libraries

**Technical Goals:**

- 99% uptime for Spotify and OpenAI API calls
- ≤2s first content render time on 4G networks
- 100% e2e test coverage for critical user paths
- Responsive design compatibility from 320px to desktop

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Note:** This is an educational project created to explore modern web development practices and AI integration in music discovery applications. All features are provided free of charge.
