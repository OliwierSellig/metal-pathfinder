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

# Testing Documentation

## Test Structure

### E2E Tests (Playwright)

E2E tests are structured using the **Page Object Model (POM)** pattern for better maintainability and reusability.

#### Page Object Model Structure

```
tests/page-objects/
├── base-page.ts              # Abstract base class with common functionality
├── discover-page.ts          # Main Discover page object
├── index.ts                  # Export index
└── components/
    ├── recommendation-form.ts    # Recommendation form component
    ├── track-selector.ts        # Track selector component
    ├── temperature-slider.ts    # Temperature slider component
    └── recommendations-list.ts  # Recommendations list component
```

#### Using Page Objects in Tests

```typescript
import { DiscoverPage } from "../page-objects";

test("should generate recommendations", async ({ page }) => {
  const discoverPage = new DiscoverPage(page);

  // High-level actions
  await discoverPage.navigate();
  await discoverPage.expectMainLayoutVisible();

  // Component-specific actions
  await discoverPage.form.selectTrack();
  await discoverPage.form.fillDescription("Heavy metal with great solos");
  await discoverPage.form.setTemperature(0.5);
  await discoverPage.form.generateRecommendations();

  // Verify results
  await discoverPage.recommendations.waitForSuccessfulGeneration(10);
});
```

#### Page Object Benefits

- **Encapsulation**: UI locators and actions are encapsulated in page classes
- **Reusability**: Common actions can be reused across multiple tests
- **Maintainability**: UI changes only require updates in page objects, not in tests
- **Readability**: Tests focus on business logic rather than implementation details
- **Type Safety**: Full TypeScript support with proper typing

### Unit Tests (Vitest)

### API Tests (Supertest)

## Data Test IDs for E2E Testing

To facilitate reliable end-to-end testing, key UI elements in the **Discover** flow have been tagged with `data-test-id` attributes:

### Discover View (`DiscoverView.tsx`)

- `discover-view` - Main container for the Discover view
- `library-loading` - Loading state when library is being fetched
- `library-error` - Error state when library fails to load
- `retry-library-button` - Button to retry loading library
- `discover-main-layout` - Main grid layout (form + results)

### Recommendation Form (`RecommendationForm.tsx`)

- `recommendation-form-container` - Main form container
- `recommendation-form` - The actual form element
- `generate-recommendations-button` - Submit button for generating recommendations
- `track-selector-error` - Error message for track selection
- `description-textarea` - Text area for user preferences
- `description-character-counter` - Character counter display
- `description-error` - Error message for description validation

### Track Selector (`TrackSelector.tsx`)

- `track-selector-container` - Main container
- `track-selector-trigger` - Button that opens the dropdown
- `track-selector-dropdown` - Dropdown content container
- `track-option-{spotify_track_id}` - Individual track options (dynamic ID)

### Temperature Slider (`TemperatureSlider.tsx`)

- `temperature-slider-container` - Main container
- `temperature-slider` - The actual slider input
- `temperature-description` - Description text showing current temperature meaning

### Recommendations List (`RecommendationsList.tsx`)

- `recommendations-loading` - Loading state with skeletons
- `recommendation-skeleton-{index}` - Individual skeleton items (0-4)
- `recommendations-error` - Error state container
- `error-message` - Error message text
- `retry-button` - Button to retry after error
- `recommendations-empty` - Empty state (no recommendations yet)
- `recommendations-list` - Container with generated recommendations
- `generation-metadata` - Metadata about the generation process
- `generation-stats` - Statistics (count, time)
- `generation-config` - Configuration used (model, temperature)
- `excluded-tracks-info` - Info about excluded tracks
- `recommendation-item-{index}` - Individual recommendation containers (0-9)

### Example E2E Test Scenarios

#### Basic POM Usage

```typescript
// Navigate and verify main view
const discoverPage = new DiscoverPage(page);
await discoverPage.navigate();
await discoverPage.expectPageLoaded();

// Use component-specific methods
await discoverPage.form.selectTrack();
await discoverPage.form.fillDescription("I love guitar solos!");
await discoverPage.form.setTemperature(0.5);
await discoverPage.form.generateRecommendations();

// Verify results
await discoverPage.recommendations.waitForSuccessfulGeneration();
```

#### High-Level Workflow Methods

```typescript
// Complete success flow
await discoverPage.expectSuccessfulRecommendationFlow({
  description: "Heavy metal with complex guitar solos",
  temperature: 0.6,
  expectedCount: 10,
});

// Error handling flow
await discoverPage.expectErrorRecommendationFlow({
  description: "Test description",
  expectedErrorMessage: "Failed to generate recommendations",
});
```

## Best Practices

### Page Object Model

- **Single Responsibility**: Each page object represents one page or major component
- **Encapsulation**: Keep locators private, expose only actions and verifications
- **Composition**: Use component objects within page objects for complex UIs
- **Meaningful Names**: Use descriptive method names that reflect business actions
- **Return Types**: Methods should return Promise<void> for actions, this for chaining

### Data Test IDs

- Use descriptive `data-test-id` values that clearly indicate the element's purpose
- For dynamic elements (like track options), include the relevant identifier in the ID
- Separate concerns: container elements get `-container` suffix, interactive elements get action-specific names
- Always test both success and error states using the appropriate test IDs

### Test Structure

- Group related tests in describe blocks
- Use meaningful test names that describe the expected behavior
- Follow Arrange-Act-Assert pattern within tests
- Use page object methods for setup and verification
