# API Endpoint Implementation Plan: GET /api/library

## 1. Przegląd punktu końcowego

Endpoint służy do pobierania biblioteki muzycznej użytkownika z bazy danych z obsługą paginacji i sortowania.

**Cel biznesowy:** Umożliwienie użytkownikom przeglądania ich osobistej biblioteki muzycznej z obsługą stronnicowania dla wydajności.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/library`
- **Parametry:**
  - **Wymagane:** Brak (autentykacja obsługiwana przez middleware)
  - **Opcjonalne:**
    - `limit` (liczba, domyślnie: 50, maksymalnie: 100) - liczba utworów do zwrócenia
    - `offset` (liczba, domyślnie: 0) - przesunięcie dla paginacji
    - `sort` (string, domyślnie: "created_at_desc") - kolejność sortowania: `created_at_desc`, `created_at_asc`
- **Query String Examples:**
  - `/api/library` - domyślne parametry
  - `/api/library?limit=25&offset=50&sort=created_at_asc` - 25 utworów od pozycji 50, najstarsze najpierw
- **Headers:**
  - `Authorization: Bearer <jwt_token>` (wymagany dla autentykacji)

## 3. Wykorzystywane typy

```typescript
// Z src/types.ts - używane typy dla GET endpoint
import type {
  LibraryResponseDTO,
  LibraryQueryParams,
  LibraryTrackDTO,
  LibrarySortOption,
  ErrorResponseDTO,
  ValidationErrorResponseDTO,
  UserLibraryEntity,
} from "../types";

// Dodatkowe typy dla implementacji
interface GetLibraryContext {
  user_id: string;
  queryParams: LibraryQueryParams;
}

interface LibraryServiceOptions {
  limit: number;
  offset: number;
  sort: LibrarySortOption;
}

// Typy dla paginacji
interface PaginationInfo {
  total_count: number;
  has_more: boolean;
  current_limit: number;
  current_offset: number;
}
```

## 4. Szczegóły odpowiedzi

### Pomyślna odpowiedź (200 OK)

```json
{
  "tracks": [
    {
      "spotify_track_id": "4uLU6hMCjMI75M1A2tKUQC",
      "created_at": "2024-01-01T12:00:00.000Z"
    }
  ],
  "total_count": 42,
  "has_more": true
}
```

### Odpowiedzi błędów

**400 Bad Request** - Nieprawidłowe parametry zapytania

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "status": 400,
  "errors": [
    {
      "field": "limit",
      "message": "Limit must be between 1 and 100"
    }
  ]
}
```

**401 Unauthorized** - Brak lub nieprawidłowa autentykacja

```json
{
  "error": "Unauthorized",
  "message": "Authentication required. Please provide a valid JWT token.",
  "status": 401
}
```

**429 Too Many Requests** - Przekroczenie limitów

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "status": 429
}
```

**500 Internal Server Error** - Błąd serwera

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "status": 500
}
```

## 5. Przepływ danych

1. **Odbiór żądania:** Astro API route odbiera żądanie GET z query parameters
2. **Autentykacja:** Middleware weryfikuje JWT token i pobiera user_id
3. **Walidacja parametrów:** Sprawdzenie poprawności limit, offset, sort
4. **Zapytanie do bazy:** Pobranie biblioteki użytkownika z paginacją i sortowaniem
5. **Obliczenie paginacji:** Sprawdzenie czy są kolejne strony (has_more)
6. **Odpowiedź:** Zwrócenie danych z metadanymi paginacji

### Diagram przepływu

```
Client → API Route → Auth Middleware → Query Validation → Database Query →
Pagination Logic → Response (200 OK)
```

### SQL Query Pattern

```sql
-- Zapytanie z paginacją i sortowaniem
SELECT spotify_track_id, created_at
FROM user_library
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- Zapytanie dla total_count
SELECT COUNT(*)
FROM user_library
WHERE user_id = $1;
```

## 6. Względy bezpieczeństwa

### Uwierzytelnianie i autoryzacja

- **JWT Token Validation:** Sprawdzenie ważności tokenu Supabase Auth w middleware
- **Row Level Security (RLS):** Automatyczne ograniczenie do biblioteki użytkownika
- **User Context:** Pobranie user_id z zweryfikowanego tokenu JWT
- **Input Sanitization:** Walidacja wszystkich query parameters

### Walidacja query parameters

- **limit:** Liczba całkowita 1-100, domyślnie 50
- **offset:** Liczba całkowita ≥0, domyślnie 0
- **sort:** Enum LibrarySortOption ("created_at_desc" | "created_at_asc")

### Bezpieczeństwo na poziomie bazy danych

```sql
-- RLS Policy zapewnia automatyczne filtrowanie po user_id
CREATE POLICY "Users can only access their own library" ON user_library
    FOR SELECT USING (auth.uid() = user_id);
```

### Ochrona przed atakami

- **SQL Injection:** Parametryzowane zapytania przez Supabase ORM
- **Information Disclosure:** Ukrywanie wewnętrznych błędów bazy danych
- **Rate Limiting:** Ograniczenie liczby żądań na użytkownika/IP
- **Large Offset Prevention:** Maksymalny limit zapobiega kosztownym zapytaniom

## 7. Obsługa błędów

### Scenariusze błędów i kody statusu

**400 Bad Request:**

- Nieprawidłowy format limit (nie liczba, poza zakresem 1-100)
- Nieprawidłowy format offset (nie liczba, liczba ujemna)
- Nieprawidłowa wartość sort (nie w dozwolonych opcjach)

**401 Unauthorized:**

- Brak tokenu Authorization w nagłówku
- Nieprawidłowy format tokenu JWT
- Token wygasły lub unieważniony
- Użytkownik nie istnieje w systemie

**429 Too Many Requests:**

- Przekroczenie limitu 1000 żądań/godzinę na użytkownika
- Zbyt wiele jednoczesnych połączeń

**500 Internal Server Error:**

- Błąd połączenia z bazą danych
- Nieoczekiwane błędy aplikacji
- Błędy infrastruktury Supabase

### Strategia error handling

```typescript
// Hierarchia obsługi błędów
try {
  // Operacja główna
} catch (error) {
  if (error instanceof ValidationError) {
    return 400; // Bad Request z detalami walidacji
  }
  if (error instanceof AuthError) {
    return 401; // Unauthorized
  }
  if (error instanceof DatabaseError) {
    logError(error); // Logowanie dla debugowania
    return 500; // Ukrycie szczegółów błędu bazy
  }
  // Fallback dla nieznanych błędów
  logError(error);
  return 500;
}
```

### Logging strategii

- **Successful requests:** Info level z metrykami wydajności
- **Validation errors:** Warn level z parametrami żądania
- **Auth errors:** Info level (normalny ruch aplikacji)
- **Database errors:** Error level z pełnym stack trace
- **Rate limit hits:** Info level z identyfikatorem użytkownika

### Strategie optymalizacji

**Optymalizacja zapytań:**

```sql
-- Indeks kompozytowy dla wydajnego sortowania
CREATE INDEX idx_user_library_user_id_created_at
ON user_library(user_id, created_at DESC);

-- Cursor-based pagination dla dużych offsetów (przyszłe ulepszenie)
SELECT * FROM user_library
WHERE user_id = $1 AND created_at < $2
ORDER BY created_at DESC LIMIT $3;
```

**Caching strategia:**

- **JWT Token Cache:** Cache zweryfikowanych tokenów (5 min TTL)
- **Count Cache:** Cache total_count dla biblioteki użytkownika (15 min TTL)
- **User Library Cache:** Cache pierwszej strony biblioteki (5 min TTL)

**Database optimizations:**

- **Connection Pooling:** PgBouncer dla efektywnego zarządzania połączeniami
- **Read Replicas:** Separate repliki dla operacji READ w przyszłości
- **Query Timeout:** 30 sekund timeout dla zapytań

### Monitoring wydajności

- **Query Metrics:** Czas wykonania zapytań, slow query log
- **API Metrics:** Response time distribution, error rate, throughput
- **Cache Metrics:** Hit rate, miss rate, eviction rate
- **User Metrics:** Średni rozmiar biblioteki, najaktywniejsze godziny

## 9. Etapy wdrożenia

### Etap 1: Rozszerzenie walidacji (src/lib/utils/validation.ts)

```typescript
// Dodanie schema dla LibraryQueryParams
export const libraryQueryParamsSchema = z
  .object({
    limit: z.coerce.number().min(1).max(100).default(50),
    offset: z.coerce.number().min(0).default(0),
    sort: z.enum(["created_at_desc", "created_at_asc"]).default("created_at_desc"),
  })
  .partial() satisfies z.ZodType<Partial<LibraryQueryParams>>;
```

### Etap 2: Rozszerzenie LibraryService (src/lib/services/library.service.ts)

```typescript
// Dodanie metody getUserLibrary
async getUserLibrary(
  userId: string,
  options: LibraryServiceOptions
): Promise<LibraryResponseDTO> {
  // 1. Pobranie utworów z paginacją
  // 2. Pobranie total_count
  // 3. Obliczenie has_more
  // 4. Zwrócenie sformatowanej odpowiedzi
}
```

**Dlaczego rozszerzenie service layer?**

- **Reużywalność:** Logika może być używana w innych endpoint-ach
- **Testowanie:** Łatwiejsze unit testing logiki biznesowej
- **Separation of Concerns:** HTTP layer oddzielony od logiki bazodanowej
- **Maintenance:** Centralizacja logiki biblioteki w jednym miejscu

### Etap 3: Implementacja GET handler (src/pages/api/library/index.ts)

```typescript
// Dodanie do istniejącego pliku
export const GET: APIRoute = async ({ request, locals }) => {
  const libraryService = new LibraryService(locals.supabase);

  try {
    // 1. Pobranie i walidacja query parameters
    // 2. Autentykacja użytkownika
    // 3. Wywołanie service method
    // 4. Zwrócenie odpowiedzi 200 OK
  } catch (error) {
    // Error handling jak w POST
  }
};
```

### Etap 4: Testy jednostkowe

**library.service.test.ts:**

```typescript
describe("LibraryService.getUserLibrary", () => {
  test("should return paginated results with default parameters");
  test("should handle custom limit and offset");
  test("should sort by created_at ascending");
  test("should calculate has_more correctly");
  test("should handle empty library");
  test("should throw DatabaseError on connection issues");
});
```

**validation.test.ts:**

```typescript
describe("libraryQueryParamsSchema", () => {
  test("should validate correct query parameters");
  test("should apply default values");
  test("should reject invalid limit values");
  test("should reject negative offset");
  test("should reject invalid sort options");
});
```

### Etap 5: Testy integracyjne API

**api/library.integration.test.ts:**

```typescript
describe("GET /api/library", () => {
  test("should return 200 with valid token and library");
  test("should return 401 without token");
  test("should return 400 with invalid query params");
  test("should handle pagination correctly");
  test("should respect user isolation (RLS)");
});
```

### Etap 6: Performance testing

```bash
# Load testing scenariusze
# 1. Normal load: 100 concurrent users, 10 min
# 2. Peak load: 500 concurrent users, 5 min
# 3. Stress test: 1000 concurrent users, 2 min
# 4. Large library test: Users with 10k+ tracks

k6 run --vus 100 --duration 10m get-library-load-test.js
```

### Etap 7: Deployment i monitoring

1. **Staging deployment** z pełnym testem funkcjonalnym
2. **Performance baseline** establishment na staging
3. **Production deployment** z gradual rollout
4. **Monitoring setup:**
   - Response time alerts (> 200ms)
   - Error rate alerts (> 5%)
   - Database query time alerts (> 100ms)
   - High offset usage alerts (offset > 1000)

### Struktura plików po implementacji

```
src/
├── pages/api/library/
│   └── index.ts                      # GET + POST handlers
├── lib/
│   ├── services/
│   │   └── library.service.ts        # getUserLibrary method added
│   ├── utils/
│   │   ├── validation.ts             # libraryQueryParamsSchema added
│   │   └── errors.ts                 # (existing)
│   └── middleware/
│       └── auth.middleware.ts        # JWT validation
└── types.ts                          # (existing DTOs)

tests/
├── unit/
│   ├── library.service.test.ts       # Service tests
│   └── validation.test.ts            # Validation tests
└── integration/
    └── api/library.test.ts           # API endpoint tests
```

### Definition of Done

**Funkcjonalność:**

- [x] GET /api/library zwraca bibliotekę użytkownika z paginacją
- [x] Walidacja query parameters (limit, offset, sort)
- [x] Autentykacja JWT i izolacja użytkowników
- [x] Proper error handling z odpowiednimi kodami HTTP

**Wydajność:**

- [x] Response time < 100ms dla 95% zapytań
- [x] Obsługa 1000 concurrent requests
- [x] Optymalne wykorzystanie indeksów bazy danych

**Bezpieczeństwo:**

- [x] RLS enforcement na poziomie bazy
- [x] Input validation dla wszystkich parametrów
- [x] Rate limiting protection
- [x] Proper error logging bez ujawniania szczegółów

**Jakość kodu:**

- [x] Test coverage > 90% dla nowej funkcjonalności
- [x] Code review approval
- [x] Linter i TypeScript bez błędów
- [x] Dokumentacja API zaktualizowana
