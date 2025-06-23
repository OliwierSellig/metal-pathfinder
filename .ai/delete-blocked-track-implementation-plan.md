# API Endpoint Implementation Plan: DELETE /api/blocked-tracks/{block_id}

## 1. Przegląd punktu końcowego

Endpoint służy do usuwania blokady utworu z listy zablokowanych utworów użytkownika. Po pomyślnym wykonaniu operacji, utwór będzie mógł ponownie pojawiać się w rekomendacjach. Operacja jest nieodwracalna i wymaga uwierzytelnienia użytkownika.

**Cel biznesowy:** Umożliwienie użytkownikom cofnięcia decyzji o zablokowaniu utworu, zwiększając elastyczność systemu rekomendacji.

## 2. Szczegóły żądania

- **Metoda HTTP:** DELETE
- **Struktura URL:** `/api/blocked-tracks/{block_id}`
- **Parametry:**
  - **Wymagane:**
    - `block_id` (path parameter) - UUID identyfikator rekordu zablokowanego utworu
  - **Opcjonalne:** Brak
- **Request Body:** Brak (metoda DELETE nie wymaga treści żądania)
- **Headers:**
  - `Authorization: Bearer <jwt_token>` (wymagany)
  - `Content-Type: application/json` (opcjonalny, dla spójności)

## 3. Wykorzystywane typy

```typescript
// Z src/types.ts - używane typy
import type { SuccessMessageDTO, ErrorResponseDTO, BlockedTrackEntity } from "../types";

// Dodatkowe typy dla implementacji
interface DeleteBlockedTrackParams {
  block_id: string;
}

interface DeleteBlockedTrackContext {
  user_id: string;
  block_id: string;
}
```

## 4. Szczegóły odpowiedzi

### Pomyślna odpowiedź (200 OK)

```json
{
  "message": "Track unblocked successfully"
}
```

### Odpowiedzi błędów

**400 Bad Request** - Nieprawidłowy UUID

```json
{
  "error": "Bad Request",
  "message": "Invalid block_id format. Must be a valid UUID.",
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

**404 Not Found** - Blokada nie istnieje lub nie należy do użytkownika

```json
{
  "error": "Not Found",
  "message": "Blocked track not found or doesn't belong to user",
  "status": 404
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

1. **Odbiór żądania:** Astro API route odbiera żądanie DELETE
2. **Walidacja parametrów:** Sprawdzenie formatu UUID w `block_id`
3. **Uwierzytelnianie:** Weryfikacja JWT tokenu przez Supabase
4. **Autoryzacja:** RLS automatycznie zapewnia dostęp tylko do własnych blokad
5. **Logika biznesowa:** Service sprawdza istnienie i wykonuje usunięcie
6. **Odpowiedź:** Zwrócenie komunikatu sukcesu lub błędu

### Diagram przepływu

```
Client → API Route → Auth Middleware → Validation → Service → Database → Response
```

## 6. Względy bezpieczeństwa

### Uwierzytelnianie i autoryzacja

- **JWT Token Validation:** Sprawdzenie ważności tokenu Supabase Auth
- **Row Level Security (RLS):** Automatyczne filtrowanie na poziomie bazy danych
- **User Context:** Pobranie user_id z zweryfikowanego tokenu

### Walidacja danych wejściowych

- **UUID Format Validation:** Sprawdzenie czy `block_id` jest prawidłowym UUID
- **SQL Injection Prevention:** Używanie parametryzowanych zapytań przez Supabase
- **Input Sanitization:** Walidacja wszystkich danych wejściowych

### Bezpieczeństwo na poziomie bazy danych

```sql
-- RLS Policy zapewnia dostęp tylko do własnych blokad
CREATE POLICY "Users can only access their own blocked tracks" ON blocked_tracks
    FOR ALL USING (auth.uid() = user_id);
```

## 7. Obsługa błędów

### Kategorie błędów i obsługa

**Błędy walidacji (400)**

- Nieprawidłowy format UUID
- Brakujące parametry wymagane
- Logowanie: WARN level z details parametrów

**Błędy uwierzytelniania (401)**

- Brakujący token Authorization
- Nieprawidłowy lub wygasły JWT
- Logowanie: INFO level (bez logowania tokenu)

**Błędy autoryzacji/not found (404)**

- Blokada nie istnieje
- Blokada należy do innego użytkownika
- Logowanie: INFO level z user_id i block_id

**Błędy serwera (500)**

- Błędy połączenia z bazą danych
- Nieprzewidziane wyjątki
- Logowanie: ERROR level z pełnym stack trace

### Strategia logowania

```typescript
// Przykład struktury logów
{
  level: 'ERROR',
  message: 'Failed to delete blocked track',
  context: {
    user_id: 'uuid',
    block_id: 'uuid',
    error: 'Database connection failed'
  },
  timestamp: '2024-01-01T12:00:00Z'
}
```

## 8. Rozważania dotyczące wydajności

### Optymalizacje

- **Database Index:** Wykorzystanie istniejącego indeksu `idx_blocked_tracks_user_spotify`
- **Single Query:** Jedna operacja DELETE z warunkiem WHERE
- **RLS Efficiency:** Automatyczne filtrowanie na poziomie bazy danych

### Monitorowanie wydajności

- **Query Performance:** Monitoring czasu wykonania zapytań DELETE
- **Error Rate:** Śledzenie współczynnika błędów 404 vs inne
- **Response Time:** Cel < 100ms dla typowych operacji

### Potencjalne wąskie gardła

- **Database Connection Pool:** Monitoring wykorzystania połączeń
- **RLS Performance:** Sprawdzenie wpływu na wydajność zapytań
- **JWT Validation:** Cache dla często używanych tokenów

## 9. Etapy wdrożenia

### Etap 1: Przygotowanie struktury plików

1. Utworzenie `src/pages/api/blocked-tracks/[block_id].ts`
2. Rozszerzenie `src/lib/services/blocked-tracks.service.ts` (lub utworzenie)
3. Dodanie brakujących typów w `src/types.ts` (jeśli potrzebne)

### Etap 2: Implementacja walidacji i middleware

1. Implementacja walidacji UUID z użyciem Zod
2. Konfiguracja middleware uwierzytelniania Supabase
3. Utworzenie error handling utilities

### Etap 3: Implementacja service layer

1. Metoda `deleteBlockedTrack(userId: string, blockId: string)`
2. Obsługa błędów database i business logic
3. Logowanie operacji i błędów

### Etap 4: Implementacja API route

1. Handler DELETE w Astro API route
2. Integracja z service layer
3. Proper HTTP response handling

### Etap 5: Testy i dokumentacja

1. Testy jednostkowe dla service
2. Testy integracyjne dla API endpoint
3. Aktualizacja dokumentacji API

### Etap 6: Deployment i monitoring

1. Deploy na środowisko testowe
2. Testy end-to-end
3. Konfiguracja monitoringu i alertów
4. Deploy na produkcję

### Struktura plików po implementacji

```
src/
├── pages/api/blocked-tracks/
│   └── [block_id].ts                 # DELETE handler
├── lib/
│   ├── services/
│   │   └── blocked-tracks.service.ts # Business logic
│   └── utils/
│       ├── validation.ts             # Zod schemas
│       └── errors.ts                 # Error handling
└── types.ts                          # DTOs and types
```

### Kluczowe metryki sukcesu

- Response time < 100ms (95th percentile)
- Error rate < 1% dla prawidłowych żądań
- 100% coverage dla RLS policies
- Zero incydentów bezpieczeństwa związanych z unauthorized access
