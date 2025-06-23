# API Endpoint Implementation Plan: POST /api/library

## 1. Przegląd punktu końcowego

Endpoint służy do dodawania utworów Spotify do osobistej biblioteki muzycznej użytkownika.

**Cel biznesowy:** Umożliwienie użytkownikom budowania personalnej biblioteki muzycznej.

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** `/api/library`
- **Parametry:**
  - **Wymagane:** Brak (dane w request body)
  - **Opcjonalne:** Brak
- **Request Body:**
  ```json
  {
    "spotify_track_id": "string" // Wymagane, dokładnie 22 znaki alfanumeryczne
  }
  ```
- **Headers:**
  - `Content-Type: application/json` (wymagany)

**Mockowanie użytkownika:** Na potrzeby developmentu używamy stałego user_id: `7138b8c4-5a27-48d9-ba3b-f7ad825e4ada` (email: oliwier@kryptonum.eu)

## 3. Wykorzystywane typy

```typescript
// Z src/types.ts - używane typy
import type {
  AddTrackToLibraryCommand,
  LibraryTrackDTO,
  ErrorResponseDTO,
  ValidationErrorResponseDTO,
  UserLibraryInsert,
  SpotifyTrackId,
  createSpotifyTrackId,
} from "../types";

// Dodatkowe typy dla implementacji
interface AddTrackContext {
  user_id: string;
  spotify_track_id: SpotifyTrackId;
}

interface AddTrackRequest {
  body: AddTrackToLibraryCommand;
  user: { id: string };
}
```

## 4. Szczegóły odpowiedzi

### Pomyślna odpowiedź (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "spotify_track_id": "4uLU6hMCjMI75M1A2tKUQC",
  "created_at": "2024-01-01T12:00:00.000Z"
}
```

### Odpowiedzi błędów

**400 Bad Request** - Utwór już w bibliotece

```json
{
  "error": "Bad Request",
  "message": "Track already exists in your library",
  "status": 400
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

**422 Unprocessable Entity** - Błędy walidacji

```json
{
  "error": "Unprocessable Entity",
  "message": "Validation failed",
  "status": 422,
  "errors": [
    {
      "field": "spotify_track_id",
      "message": "Must be exactly 22 alphanumeric characters"
    }
  ]
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

1. **Odbiór żądania:** Astro API route odbiera żądanie POST z body
2. **Walidacja JSON:** Sprawdzenie poprawności struktury request body
3. **Walidacja danych:** Weryfikacja formatu spotify_track_id (22 znaki alfanumeryczne)
4. **Mockowanie użytkownika:** Użycie stałego user_id: `7138b8c4-5a27-48d9-ba3b-f7ad825e4ada`
5. **Sprawdzenie duplikatów:** Kontrola czy utwór już nie istnieje w bibliotece
6. **Zapis do bazy:** Dodanie nowego rekordu do tabeli user_library
7. **Odpowiedź:** Zwrócenie danych utworu z statusem 201

### Diagram przepływu

```
Client → API Route → JSON Validation → Data Validation → Mock User ID →
Duplicate Check → Database Insert → Response (201 Created)
```

## 6. Względy bezpieczeństwa

### Uwierzytelnianie i autoryzacja

- **JWT Token Validation:** Sprawdzenie ważności tokenu Supabase Auth
- **Row Level Security (RLS):** Automatyczne powiązanie z user_id z tokenu
- **User Context:** Pobranie user_id z zweryfikowanego tokenu JWT

### Walidacja danych wejściowych

- **Spotify Track ID Format:** Dokładnie 22 znaki alfanumeryczne
- **JSON Schema Validation:** Użycie Zod do walidacji struktury request body
- **Input Sanitization:** Walidacja i czyszczenie wszystkich danych wejściowych
- **SQL Injection Prevention:** Parametryzowane zapytania przez Supabase

### Bezpieczeństwo na poziomie bazy danych

```sql
-- RLS Policy zapewnia automatyczne przypisanie user_id
CREATE POLICY "Users can only access their own library" ON user_library
    FOR ALL USING (auth.uid() = user_id);

-- Unique constraint zapobiega duplikatom
CONSTRAINT unique_user_track UNIQUE (user_id, spotify_track_id)
```

### Ograniczenie zasobów

- **Rate Limiting:** 1000 requests/hour per user zgodnie ze specyfikacją
- **Request Size Limit:** Minimalne request body (tylko spotify_track_id)

## 7. Obsługa błędów

### Kategorie błędów i obsługa

**Błędy walidacji JSON (400)**

- Nieprawidłowa struktura JSON
- Brakujące pole spotify_track_id
- Logowanie: WARN level z malformed request details

**Błędy walidacji danych (422)**

- Nieprawidłowy format spotify_track_id (nie 22 znaki lub nie alfanumeryczne)
- Puste lub null spotify_track_id
- Logowanie: INFO level z validation details

**Błędy duplikatów (400)**

- Utwór już istnieje w bibliotece użytkownika
- Database constraint violation
- Logowanie: INFO level z user_id i spotify_track_id

**Błędy uwierzytelniania (401)**

- Brakujący token Authorization
- Nieprawidłowy lub wygasły JWT
- Logowanie: INFO level (bez logowania tokenu)

**Błędy serwera (500)**

- Błędy połączenia z bazą danych
- Nieprzewidziane wyjątki w Supabase
- Logowanie: ERROR level z pełnym stack trace

### Strategia logowania

```typescript
// Przykład struktury logów
{
  level: 'INFO',
  message: 'Track added to library successfully',
  context: {
    user_id: 'uuid',
    spotify_track_id: '4uLU6hMCjMI75M1A2tKUQC',
    operation: 'add_track_to_library'
  },
  timestamp: '2024-01-01T12:00:00Z'
}
```

## 8. Rozważania dotyczące wydajności

### Optymalizacje bazy danych

- **Primary Key Index:** Wykorzystanie automatycznego indeksu na id (UUID)
- **Composite Index:** `idx_user_library_user_id_created_at` dla efektywnego wyszukiwania
- **Unique Constraint Index:** `unique_user_track` automatycznie tworzy indeks

### Optymalizacje aplikacji

- **Single Insert Query:** Jedna operacja INSERT na request
- **Minimal Response:** Zwracanie tylko niezbędnych danych
- **Early Validation:** Walidacja danych przed operacjami bazodanowymi

### Monitorowanie wydajności

- **Insert Performance:** Monitoring czasu wykonania operacji INSERT
- **Validation Time:** Czas walidacji spotify_track_id
- **Response Time:** Cel < 150ms dla typowych operacji
- **Duplicate Rate:** Śledzenie % żądań z duplikatami

### Potencjalne wąskie gardła

- **Unique Constraint Check:** Koszt sprawdzania duplikatów na dużej bibliotece
- **Database Connection Pool:** Monitoring wykorzystania połączeń
- **JWT Validation Overhead:** Cache dla często używanych tokenów

### Strategie skalowania

- **Database Partitioning:** Możliwość partycjonowania po user_id w przyszłości
- **Read Replicas:** Dla operacji sprawdzania duplikatów
- **Caching Layer:** Redis dla często sprawdzanych kombinacji user_id + spotify_track_id

## 9. Etapy wdrożenia

### Etap 1: Przygotowanie struktury plików

1. Utworzenie `src/pages/api/library/index.ts` (POST handler)
2. Utworzenie `src/lib/services/library.service.ts`
3. Weryfikacja typów w `src/types.ts` (już istnieją)
4. Utworzenie `src/lib/utils/validation.ts` dla Zod schemas

### Etap 2: Implementacja walidacji i schema

1. Schema Zod dla `AddTrackToLibraryCommand`
2. Walidator `createSpotifyTrackId` z branded types
3. JSON request validation middleware
4. Error handling utilities

### Etap 3: Implementacja service layer

**Dlaczego service layer?** Service layer służy do separacji logiki biznesowej od warstwy HTTP. W service umieszczamy:

- Operacje na bazie danych (CRUD)
- Logikę biznesową (sprawdzanie duplikatów, walidacja)
- Error handling specyficzny dla domeny
- Logging operacji biznesowych

To pozwala na:

- Reużywalność logiki w różnych endpoint-ach
- Łatwiejsze testowanie logiki biznesowej
- Czystszą strukturę kodu (separation of concerns)

1. Metoda `addTrackToLibrary(userId: string, spotifyTrackId: SpotifyTrackId)`
2. Sprawdzenie duplikatów przed insertem
3. Obsługa database constraints i błędów
4. Comprehensive logging

### Etap 4: Implementacja API route

1. POST handler w Astro API route (`export const POST`)
2. Request body parsing i validation
3. Integracja z service layer
4. Proper HTTP status codes (201, 400, 401, 422, 500)

### Etap 5: Error handling i middleware

1. Global error handler dla API routes
2. Authentication middleware z Supabase
3. Rate limiting middleware
4. Request logging middleware

### Etap 6: Testy i dokumentacja

1. Testy jednostkowe dla service (`library.service.test.ts`)
2. Testy walidacji (`validation.test.ts`)
3. Testy integracyjne API endpoint
4. Performance testing dla concurrent requests

### Etap 7: Security audit i deployment

1. Security review (input validation, auth, RLS)
2. Load testing z różnymi scenariuszami
3. Deploy na środowisko testowe
4. End-to-end testing
5. Production deployment

### Struktura plików po implementacji

```
src/
├── pages/api/library/
│   └── index.ts                      # POST handler
├── lib/
│   ├── services/
│   │   └── library.service.ts        # Business logic
│   ├── utils/
│   │   ├── validation.ts             # Zod schemas
│   │   ├── errors.ts                 # Error handling
│   │   └── auth.ts                   # Auth utilities
│   └── middleware/
│       └── auth.middleware.ts        # JWT validation
└── types.ts                          # DTOs and types (existing)
```

### Kluczowe metryki sukcesu

- Response time < 150ms (95th percentile)
- Error rate < 2% dla prawidłowych żądań
- Duplicate detection accuracy 100%
- Zero unauthorized access incidents
- Database constraint violations < 0.1% (handled gracefully)
- User satisfaction: możliwość dodania utworu w < 3 sekundy end-to-end
