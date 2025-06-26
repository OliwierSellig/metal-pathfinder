# Środowisko testowe Metal Pathfinder

## Struktura testów

```
tests/
├── setup.ts              # Konfiguracja globalna dla Vitest
├── global-setup.ts       # Global setup dla Playwright
├── global-teardown.ts    # Global teardown dla Playwright
├── mocks/
│   └── handlers.ts        # MSW handlers dla API mocking
├── unit/                  # Testy jednostkowe (Vitest + React Testing Library)
├── e2e/                   # Testy end-to-end (Playwright)
├── api/                   # Testy API (Playwright/Supertest)
└── utils/                 # Utility functions dla testów
```

## Dostępne komendy

### Testy jednostkowe (Vitest)

```bash
bun run test              # Uruchom testy w trybie watch
bun run test:watch        # Uruchom testy w trybie watch (explicite)
bun run test:ui           # Uruchom Vitest UI
bun run test:coverage     # Uruchom testy z coverage
bun run test:unit         # Uruchom tylko testy jednostkowe
```

### Testy E2E (Playwright)

```bash
bun run test:e2e          # Uruchom testy E2E
bun run test:e2e:ui       # Uruchom testy E2E z UI
bun run test:e2e:debug    # Uruchom testy E2E w trybie debug
bun run test:e2e:headed   # Uruchom testy E2E z widoczną przeglądarką
```

### Wszystkie testy

```bash
bun run test:all          # Uruchom wszystkie testy (unit + e2e)
```

## Konfiguracja

### Vitest

- Konfiguracja w `vitest.config.ts`
- Środowisko jsdom dla testów DOM
- React Testing Library dla testów komponentów
- MSW dla mockowania API calls
- Coverage thresholds ustawione na 80%

### Playwright

- Konfiguracja w `playwright.config.ts`
- Tylko przeglądarka Chromium (zgodnie z wytycznymi)
- Trace viewer dla debugowania
- Visual comparison z screenshots
- API testing support

### MSW (Mock Service Worker)

- Handlers w `tests/mocks/handlers.ts`
- Automatyczne mockowanie API calls
- Konfiguracja dla wszystkich endpoint'ów aplikacji

## Wskazówki

1. **Testy jednostkowe** - umieszczaj w katalogu `tests/unit/` z strukturą odzwierciedlającą `src/`
2. **Testy E2E** - umieszczaj w katalogu `tests/e2e/` z logicznym podziałem na features
3. **Page Object Model** - używaj dla testów Playwright w katalog `tests/e2e/pages/`
4. **API testy** - umieszczaj w katalogu `tests/api/`
5. **Utility functions** - umieszczaj w katalogu `tests/utils/`

## Page Object Model (przykład)

```typescript
// tests/e2e/pages/LoginPage.ts
import { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
```

## Test Coverage

Coverage reports są generowane w katalogu `coverage/` i dostępne w formatach:

- Text (console)
- JSON (programmatic access)
- HTML (przeglądarki web)

## Accessibility Testing

Testy accessibility używają `@axe-core/playwright` do sprawdzania zgodności z WCAG 2.1.
