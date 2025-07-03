Frontend - Astro z React dla komponentów interaktywnych:

- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:

- Zapewnia bazę danych PostgreSQL dla przechowywania bibliotek użytkowników, blokad i preferencji
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników (SupaBase Auth dla email/hasło)
- Integracja ze Spotify API przez Client Credentials Flow (jedno Client ID/Secret dla całej aplikacji)

Spotify Integration - Client Credentials Flow:

- Jeden zestaw Client ID/Secret dla całej aplikacji (przechowywany bezpiecznie w zmiennych środowiskowych)
- Publiczne API endpoints Spotify (search, track metadata)
- Brak dostępu do prywatnych danych użytkowników Spotify
- Rate limiting: 100 requests/sec (wystarczające dla aplikacji kursowej)

AI - Bezpośrednia integracja z OpenAI API:

- Wykorzystanie najnowszych modeli OpenAI do generowania rekomendacji muzycznych
- Kontrola kosztów poprzez monitorowanie użycia API
- Optymalizacja promptów dla lepszych wyników w dziedzinie muzyki metalowej

CI/CD i Hosting:

- Github Actions do tworzenia pipeline’ów CI/CD
- Cloudflare Pages jako hosting aplikacji Astro

Manager paczek

- Do zarządzania paczkami w Node uzywamy wyłącznie Bun

Testing - Kompleksowe pokrycie testowe dla zapewnienia jakości:

- Vitest jako główny framework do testów jednostkowych - szybki i kompatybilny z Vite
- React Testing Library do testowania komponentów React z perspektywy użytkownika
- Playwright do testów end-to-end i cross-browser testing (Chrome, Firefox, Safari, Edge)
- MSW (Mock Service Worker) do mockowania API calls w testach
- Supertest do testowania API endpoints
- Docker Compose dla izolowanych środowisk testowych z bazą danych
- GitHub Actions do automatyzacji testów w pipeline CI/CD
- Lighthouse CI do monitorowania wydajności i dostępności
- @axe-core/playwright do testowania accessibility i zgodności z WCAG 2.1
