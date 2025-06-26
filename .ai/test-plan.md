# Plan Testów - MetalPathfinder

## 1. Wprowadzenie i cele testowania

### 1.1 Cel główny

Plan testów ma na celu zapewnienie wysokiej jakości i niezawodności aplikacji MetalPathfinder - platformy do odkrywania muzyki metalowej z wykorzystaniem sztucznej inteligencji. Testowanie obejmuje wszystkie warstwy aplikacji, od interfejsu użytkownika po integracje z zewnętrznymi usługami.

### 1.2 Cele szczegółowe

- Weryfikacja poprawności działania wszystkich funkcjonalności aplikacji
- Zapewnienie bezpieczeństwa i ochrony danych użytkowników
- Potwierdzenie wydajności i responsywności na różnych urządzeniach
- Walidacja integracji z zewnętrznymi API (Spotify, OpenAI, Supabase)
- Sprawdzenie dostępności i zgodności z standardami WCAG 2.1
- Veryfikacja obsługi błędów i przypadków brzegowych

## 2. Zakres testów

### 2.1 Funkcjonalności w zakresie testowania

- **Moduł autentykacji** - rejestracja, logowanie, resetowanie hasła
- **Zarządzanie biblioteką** - dodawanie, usuwanie, przeglądanie utworów
- **System odkrywania** - generowanie rekomendacji AI, wybór utworów bazowych
- **Zarządzanie blokadami** - blokowanie/odblokowanie utworów
- **Nawigacja** - responsywne menu, routing, deep linking
- **Integracje zewnętrzne** - Spotify Web API, OpenAI API
- **Bezpieczeństwo** - autoryzacja, walidacja danych, RLS policies

### 2.2 Funkcjonalności poza zakresem

- Testowanie infrastruktury DigitalOcean (poza scope)
- Load testing na poziomie produkcyjnym
- Testowanie funkcji beta/eksperymentalnych Spotify API
- Penetration testing (wykonywane przez zespół security)

## 3. Typy testów do przeprowadzenia

### 3.1 Testy jednostkowe (Unit Tests)

**Narzędzia:** Vitest, React Testing Library, MSW (Mock Service Worker)

**Zakres:**

- Funkcje pomocnicze w `src/lib/utils/`
- Serwisy w `src/lib/services/`
- Hooki React w `src/hooks/`
- Komponenty UI z `src/components/ui/`
- Walidatory i parsery TypeScript

**Kryteria pokrycia:** >85% pokrycia kodu

### 3.2 Testy integracyjne (Integration Tests)

**Narzędzia:** Playwright, Supertest, Docker Compose (dla bazy testowej)

**Zakres:**

- API endpoints (`src/pages/api/`)
- Przepływy pomiędzy komponentami React
- Integracja z bazą danych Supabase
- Middleware autoryzacyjne
- Przepływy autentykacji end-to-end

### 3.3 Testy end-to-end (E2E Tests)

**Narzędzia:** Playwright, Docker, Supabase CLI

**Zakres:**

- Pełne user journeys (rejestracja → odkrywanie → zarządzanie biblioteką)
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Mobile responsive testing (320px - 1920px)
- Testowanie błędów sieci i API

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1 Autentykacja użytkowników

#### TC-AUTH-001: Rejestracja nowego użytkownika

**Warunki wstępne:** Użytkownik niezalogowany na stronie `/register`
**Kroki:**

1. Wprowadź poprawny email (test@example.com)
2. Wprowadź silne hasło (min. 8 znaków, litery, cyfry, znaki specjalne)
3. Potwierdź hasło
4. Kliknij "Zarejestruj się"
   **Oczekiwany rezultat:**

- Przekierowanie na `/discover`
- Wyświetlenie komunikatu powitalnego
- Utworzenie sesji użytkownika

#### TC-AUTH-002: Logowanie istniejącego użytkownika

**Warunki wstępne:** Użytkownik z kontem, niezalogowany na `/login`
**Kroki:**

1. Wprowadź email
2. Wprowadź hasło
3. Kliknij "Zaloguj się"
   **Oczekiwany rezultat:**

- Przekierowanie na `/discover`
- Sesja użytkownika aktywna
- Nawigacja wyświetla dane użytkownika

#### TC-AUTH-003: Reset hasła

**Warunki wstępne:** Użytkownik na stronie `/forgot-password`
**Kroki:**

1. Wprowadź zarejestrowany email
2. Kliknij "Wyślij link resetujący"
3. Sprawdź email i kliknij link
4. Wprowadź nowe hasło
5. Potwierdź nowe hasło
   **Oczekiwany rezultat:**

- Email wysłany pomyślnie
- Link działa poprawnie
- Hasło zostało zmienione
- Możliwość logowania z nowym hasłem

### 4.2 Zarządzanie biblioteką

#### TC-LIB-001: Dodawanie utworu do biblioteki

**Warunki wstępne:** Użytkownik zalogowany na `/discover` lub `/library`
**Kroki:**

1. Wyszukaj utwór przez Spotify Search
2. Wybierz utwór z wyników
3. Kliknij "Dodaj do biblioteki"
   **Oczekiwany rezultat:**

- Utwór dodany do biblioteki użytkownika
- Komunikat potwierdzający
- Utwór widoczny w `/library`

#### TC-LIB-002: Usuwanie utworu z biblioteki

**Warunki wstępne:** Użytkownik z utworami w bibliotece na `/library`
**Kroki:**

1. Znajdź utwór do usunięcia
2. Kliknij przycisk "Usuń"
3. Potwierdź w modalu
   **Oczekiwany rezultat:**

- Modal potwierdzenia wyświetlony
- Po potwierdzeniu utwór usunięty
- Lista biblioteki zaktualizowana

#### TC-LIB-003: Paginacja biblioteki

**Warunki wstępne:** Użytkownik z >20 utworami w bibliotece
**Kroki:**

1. Przejdź na `/library`
2. Sprawdź wyświetlanie pierwszych 20 utworów
3. Kliknij "Następna strona"
4. Sprawdź numerację stron
   **Oczekiwany rezultat:**

- Poprawna paginacja
- URL zawiera parametry strony
- Deep linking działa

### 4.3 System odkrywania muzyki

#### TC-DISC-001: Generowanie rekomendacji AI

**Warunki wstępne:** Użytkownik z utworami w bibliotece na `/discover`
**Kroki:**

1. Wybierz utwór bazowy z biblioteki
2. Wprowadź opis preferencji (min. 30 znaków)
3. Ustaw temperaturę popularności (suwak)
4. Kliknij "Generuj rekomendacje"
   **Oczekiwany rezultat:**

- 10 rekomendacji wygenerowanych
- Każda z uzasadnieniem AI
- Metadata utworów wyświetlona
- Opcje dodania do biblioteki/blokowania

#### TC-DISC-002: Szczegóły rekomendacji

**Warunki wstępne:** Lista rekomendacji wyświetlona
**Kroki:**

1. Kliknij "Szczegóły" przy rekomendacji
2. Sprawdź modal z biografią artysty
3. Sprawdź uzasadnienie AI
   **Oczekiwany rezultat:**

- Modal otwiera się poprawnie
- Biografia artysty wygenerowana
- Możliwość zamknięcia modalu (ESC, X, klik poza)

#### TC-DISC-003: Pusty stan biblioteki

**Warunki wstępne:** Nowy użytkownik bez utworów w bibliotece
**Kroki:**

1. Przejdź na `/discover`
2. Sprawdź wyświetlenie empty state
3. Kliknij "Dodaj pierwszy utwór"
   **Oczekiwany rezultat:**

- Modal wyszukiwania Spotify
- Możliwość dodania utworu
- Po dodaniu - odświeżenie widoku

### 4.4 Zarządzanie blokadami

#### TC-BLOCK-001: Blokowanie utworu

**Warunki wstępne:** Lista rekomendacji wyświetlona
**Kroki:**

1. Kliknij menu "Blokuj" przy utworze
2. Wybierz czas blokady (1 dzień / 7 dni / na zawsze)
3. Potwierdź blokadę
   **Oczekiwany rezultat:**

- Utwór zablokowany na wybrany czas
- Komunikat potwierdzający
- Utwór widoczny w `/blocked-tracks`

#### TC-BLOCK-002: Odblokowanie utworu

**Warunki wstępne:** Użytkownik z zablokowanymi utworami na `/blocked-tracks`
**Kroki:**

1. Znajdź utwór do odblokowania
2. Kliknij "Odblokuj"
3. Potwierdź w modalu
   **Oczekiwany rezultat:**

- Modal potwierdzenia
- Utwór odblokowany
- Usunięcie z listy zablokowanych

#### TC-BLOCK-003: Automatyczne wygasanie blokad

**Warunki wstępne:** Utwory z blokadą czasową
**Kroki:**

1. Sprawdź utwory z blokadą 1-dniową (po czasie)
2. Wygeneruj rekomendacje
   **Oczekiwany rezultat:**

- Wygasłe blokady nie wpływają na rekomendacje
- Lista `/blocked-tracks` nie pokazuje wygasłych

## 5. Środowisko testowe

### 5.1 Środowiska

- **Lokalne (Development)** - testy jednostkowe i integracyjne
- **Staging** - testy E2E i akceptacyjne
- **Preview** - testy przed release

### 5.2 Dane testowe

- **Konta testowe** - różne role i stany
- **Baza testowa** - PostgreSQL z seed data
- **Mock API** - symulacje Spotify/OpenAI dla dev

### 5.3 Konfiguracja

```bash
# Środowisko testowe
DATABASE_URL=postgresql://test_user:test_pass@localhost:5433/test_metalpath
SPOTIFY_CLIENT_ID=test_client_id
OPENAI_API_KEY=test_api_key
SUPABASE_URL=https://test-project.supabase.co
```

## 6. Narzędzia do testowania

### 6.1 Framework testowy

- **Vitest** - testy jednostkowe, szybkie i kompatybilne z Vite
- **React Testing Library** - testowanie komponentów React
- **Playwright** - testy E2E i cross-browser
- **MSW (Mock Service Worker)** - mockowanie API calls

### 6.2 Narzędzia CI/CD

- **GitHub Actions** - automatyzacja testów
- **Playwright CI** - cross-browser testing w cloud
- **Lighthouse CI** - performance monitoring

### 6.3 Narzędzia jakości kodu

- **ESLint** - analiza statyczna TypeScript/React
- **Prettier** - formatowanie kodu
- **TypeScript** - type checking

### 6.4 Konfiguracja testów

```bash
# Instalacja zależności testowych
bun add -D vitest @testing-library/react @testing-library/jest-dom
bun add -D playwright @playwright/test msw
bun add -D @axe-core/playwright lighthouse
```

## 7. Harmonogram testów

### 7.1 Faza 1: Testy podstawowe (Tydzień 1-2)

- Setup środowiska testowego
- Testy jednostkowe dla utils i services
- Testy podstawowych komponentów UI
- **Deliverable:** 70% pokrycia testów jednostkowych

### 7.2 Faza 2: Testy integracyjne (Tydzień 3-4)

- API endpoints testing
- Database integration tests
- Auth flow testing
- **Deliverable:** Wszystkie API endpoints przetestowane

### 7.3 Faza 3: Testy E2E (Tydzień 5-6)

- User journeys implementation
- Cross-browser testing
- Mobile responsive testing
- **Deliverable:** Kluczowe user flow pokryte

### 7.4 Faza 4: Testy specjalistyczne (Tydzień 7-8)

- Performance testing
- Accessibility testing
- Security testing
- **Deliverable:** WCAG compliance, performance benchmarks

### 7.5 Faza 5: Automatyzacja i CI/CD (Tydzień 9-10)

- GitHub Actions setup
- Automated testing pipeline
- Reporting i monitoring
- **Deliverable:** Pełna automatyzacja testów

## 8. Kryteria akceptacji testów

### 8.1 Kryteria funkcjonalne

- ✅ Wszystkie user stories przetestowane
- ✅ Critical path bez błędów krytycznych
- ✅ API endpoints odpowiadają zgodnie ze specyfikacją
- ✅ Integracje zewnętrzne działają niezawodnie

### 8.2 Kryteria jakości

- ✅ 85%+ pokrycie testów jednostkowych
- ✅ 0 błędów high/critical severity
- ✅ <5 błędów medium severity
- ✅ Performance score >90 (Lighthouse)

### 8.3 Kryteria dostępności

- ✅ WCAG 2.1 AA compliance
- ✅ Keyboard navigation w 100% aplikacji
- ✅ Screen reader compatibility
- ✅ Color contrast >4.5:1

### 8.4 Kryteria bezpieczeństwa

- ✅ Brak podatności high/critical
- ✅ JWT tokens prawidłowo walidowane
- ✅ SQL injection protection
- ✅ Rate limiting efektywne

## 9. Role i odpowiedzialności w procesie testowania

### 9.1 QA Engineer (Lead)

- **Odpowiedzialność:** Planowanie testów, wykonywanie testów manualnych
- **Deliverables:** Plan testów, raporty jakości, test cases
- **Skills:** Testing metodologies, Playwright, accessibility testing

### 9.2 Frontend Developer

- **Odpowiedzialność:** Testy jednostkowe komponentów React, UI testing
- **Deliverables:** Unit tests, component tests, visual regression tests
- **Skills:** React Testing Library, Vitest, CSS testing

### 9.3 Backend Developer

- **Odpowiedzialność:** API testing, database testing, integration tests
- **Deliverables:** API tests, database migration tests, service tests
- **Skills:** Supertest, SQL, API testing, Supabase

### 9.4 DevOps Engineer

- **Odpowiedzialność:** CI/CD pipeline, test environment management
- **Deliverables:** GitHub Actions workflows, environment configs
- **Skills:** Docker, GitHub Actions, deployment automation

### 9.5 Product Owner

- **Odpowiedzialność:** Definicja kryteriów akceptacji, priorytetyzacja
- **Deliverables:** User stories, acceptance criteria, UAT scenarios
- **Skills:** Domain knowledge, user experience, business requirements

## 10. Procedury raportowania błędów

### 10.1 Klasyfikacja błędów

#### Critical (P1) - Naprawa w 24h

- Aplikacja nie uruchamia się
- Brak możliwości logowania
- Utrata danych użytkownika
- Security vulnerabilities

#### High (P2) - Naprawa w 3 dni

- Kluczowe funkcje nie działają
- API 500 errors
- Cross-browser compatibility issues
- Performance degradation >50%

#### Medium (P3) - Naprawa w 1 tydzień

- UI inconsistencies
- Minor functionality issues
- Accessibility violations
- Non-critical API errors

#### Low (P4) - Naprawa w następnym release

- Cosmetic issues
- Enhancement requests
- Documentation gaps
- Minor UX improvements

### 10.2 Template zgłoszenia błędu

```markdown
## Bug ID: BUG-[YYYY-MM-DD]-[numer]

### Podstawowe informacje

- **Priorytet:** [Critical/High/Medium/Low]
- **Środowisko:** [Development/Staging/Production]
- **Browser:** [Chrome 119, Firefox 118, etc.]
- **Urządzenie:** [Desktop/Mobile - model]
- **Reporter:** [Imię nazwisko]
- **Data:** [YYYY-MM-DD]

### Opis błędu

[Krótki, jasny opis problemu]

### Kroki do reprodukcji

1. [Szczegółowy krok 1]
2. [Szczegółowy krok 2]
3. [Szczegółowy krok 3]

### Oczekiwany rezultat

[Co powinno się stać]

### Aktualny rezultat

[Co się faktycznie dzieje]

### Dane pomocnicze

- **Screenshots/Video:** [załączniki]
- **Console errors:** [błędy JavaScript]
- **Network logs:** [błędy API]
- **User ID:** [dla błędów związanych z danymi]

### Workaround

[Jeśli istnieje obejście problemu]

### Dodatkowe notatki

[Inne istotne informacje]
```

### 10.3 Workflow obsługi błędów

1. **Zgłoszenie** → Reporter tworzy issue w GitHub
2. **Triage** → QA Lead przypisuje priorytet i osobę odpowiedzialną
3. **Development** → Developer implementuje fix
4. **Code Review** → Peer review + automated tests
5. **QA Verification** → QA weryfikuje fix na staging
6. **Closure** → Bug zamknięty po weryfikacji

### 10.4 Metryki i KPI

#### Jakość procesu

- **Bug detection rate** - liczba znalezionych błędów / tydzień
- **Bug resolution time** - średni czas naprawy według priorytetu
- **Test coverage** - % pokrycia kodu testami
- **Regression rate** - % błędów powracających po fix

#### Jakość produktu

- **Bug density** - liczba błędów / KLOC (1000 linii kodu)
- **Customer satisfaction** - feedback score z UAT
- **Performance metrics** - Core Web Vitals trends
- **Security score** - wyniki audytów bezpieczeństwa

---

## Podsumowanie

Plan testów MetalPathfinder zapewnia kompleksowe pokrycie wszystkich aspektów aplikacji, od podstawowych funkcjonalności po zaawansowane integracje z AI i zewnętrznymi API. Szczególny nacisk położono na bezpieczeństwo, wydajność i dostępność, co jest kluczowe dla aplikacji webowej obsługującej dane użytkowników i integrującej się z zewnętrznymi serwisami.

Harmonogram 10-tygodniowy pozwala na systematyczne budowanie jakości od podstaw, a zdefiniowane role i procedury zapewniają efektywną współpracę zespołu. Kryteria akceptacji i procedury raportowania błędów gwarantują utrzymanie wysokich standardów jakości przez cały cykl życia produktu.
