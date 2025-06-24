# API Endpoint Implementation Plan: Spotify Track Search

## 1. Przegląd punktu końcowego

Endpoint **GET /api/spotify/search** służy do wyszukiwania utworów w katalogu Spotify, zoptymalizowany pod kątem odkrywania muzyki metalowej. Integuje się z Spotify Web API używając Client Credentials Flow. Na tym etapie rozwoju używa mockup użytkownika (TEST_USER_ID) zamiast pełnej walidacji JWT.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/spotify/search`
- **Parametry:**
  - **Wymagane:**
    - `q` (string) - zapytanie wyszukiwania (nazwa utworu, wykonawca, album)
      - Minimum: 1 znak
      - Maksimum: 100 znaków
  - **Opcjonalne:**
    - `limit` (integer) - liczba wyników do zwrócenia
      - Domyślnie: 20
      - Zakres: 1-50
    - `offset` (integer) - przesunięcie paginacji
      - Domyślnie: 0
      - Minimum: 0
    - `market` (string) - rynek dla dostępności utworów
      - Domyślnie: "US"
      - Format: ISO 3166-1 alpha-2 (np. "US", "PL", "GB")
- **Headers:** Brak (na razie używamy mockup użytkownika)
- **Request Body:** Brak (GET request)

## 3. Szczegóły odpowiedzi

**Struktura odpowiedzi (200 OK):**

```json
{
  "tracks": [
    {
      "spotify_track_id": "string",
      "name": "string",
      "artists": [
        {
          "name": "string",
          "spotify_artist_id": "string"
        }
      ],
      "album": {
        "name": "string",
        "spotify_album_id": "string",
        "release_date": "2023-01-01",
        "images": [
          {
            "url": "https://...",
            "height": 640,
            "width": 640
          }
        ]
      },
      "duration_ms": 240000,
      "preview_url": "https://..." // nullable
    }
  ],
  "total": 1000,
  "limit": 20,
  "offset": 0,
  "has_more": true
}
```

**Kody statusu:**

- `200 OK` - Wyszukiwanie zakończone pomyślnie
- `400 Bad Request` - Błędne lub brakujące parametry zapytania
- `429 Too Many Requests` - Przekroczony limit żądań
- `503 Service Unavailable` - API Spotify niedostępne
- `500 Internal Server Error` - Błąd wewnętrzny serwera

## 4. Przepływ danych

1. **Mockup użytkownika:**

   - Użycie TEST_USER_ID z supabase.client.ts do symulacji użytkownika
   - Brak walidacji uwierzytelnienia na tym etapie

2. **Walidacja parametrów wejściowych:**

   - Sprawdzenie wymaganych parametrów (q)
   - Walidacja zakresów dla limit i offset
   - Walidacja formatu market code

3. **Uwierzytelnienie Spotify:**

   - Pobranie access token z cache lub odnowienie przez Client Credentials Flow
   - Zarządzanie tokenami po stronie serwera

4. **Wywołanie Spotify API:**

   - Wysłanie żądania do Spotify Web API `/v1/search`
   - Transformacja parametrów i dodanie filtru typu "track"
   - Obsługa błędów i retry logic

5. **Przetwarzanie odpowiedzi:**

   - Mapowanie danych ze struktury Spotify na własne DTO
   - Filtrowanie i wzbogacanie danych (opcjonalne preferencje metalowe)
   - Implementacja logiki paginacji

6. **Cache i optymalizacja:**
   - Zapisanie wyników w cache (1 godzina TTL)
   - Sprawdzenie cache przed wywołaniem API

## 5. Względy bezpieczeństwa

- **Mockup użytkownika (tymczasowo):**

  - Używanie TEST_USER_ID z supabase.client.ts
  - Brak walidacji uwierzytelnienia na tym etapie rozwoju
  - Uwaga: W produkcji wymagana będzie pełna implementacja JWT

- **Spotify API Security:**

  - Client Credentials przechowywane w zmiennych środowiskowych
  - Tokeny Spotify zarządzane po stronie serwera
  - Brak dostępu do prywatnych danych użytkowników Spotify

- **Walidacja danych wejściowych:**

  - Sanityzacja query string przed przekazaniem do Spotify
  - Walidacja wszystkich parametrów numerycznych
  - Ochrona przed injection attacks

- **Rate Limiting:**
  - Podstawowy rate limiting na poziomie aplikacji
  - Monitoring użycia API Spotify
  - Graceful degradation przy przekroczeniu limitów
  - Uwaga: Per-user rate limiting zostanie dodany po implementacji pełnej autentykacji

## 6. Obsługa błędów

**Walidacja parametrów (400 Bad Request):**

- Brakujący parametr `q`
- Nieprawidłowy format `limit` lub `offset`
- Nieprawidłowy kod `market`
- Query string za długi (>100 znaków)

**Rate Limiting (429 Too Many Requests):**

- Przekroczenie limitu per-user
- Przekroczenie limitu Spotify API
- Implementacja exponential backoff

**Zewnętrzne serwisy (503 Service Unavailable):**

- Niedostępność Spotify API
- Timeout przy wywołaniach zewnętrznych
- Błędy sieci i connectivité

**Błędy wewnętrzne (500 Internal Server Error):**

- Błędy bazy danych
- Błędy transformacji danych
- Nieoczekiwane wyjątki aplikacji

## 7. Rozważania dotyczące wydajności

**Strategia cache'owania:**

- Cache wyników wyszukiwania: 1 godzina TTL
- Cache tokenów Spotify: do czasu wygaśnięcia
- Implementacja cache key na podstawie query + user preferences

**Optymalizacja żądań:**

- Connection pooling dla Spotify API
- Parallel processing dla multiple API calls
- Compression dla dużych odpowiedzi

**Skalowanie:**

- Horizontal scaling readiness
- CDN dla statycznych assets (okładki albumów)

## 8. Etapy wdrożenia

### Krok 1: Przygotowanie struktury plików

- Utworzenie `/src/pages/api/spotify/search.ts`
- Dodanie typów DTO w `/src/types.ts`
- Przygotowanie service w `/src/lib/services/spotify.service.ts`

### Krok 2: Implementacja typów i walidacji

- Zdefiniowanie `SearchTrackRequest` i `SearchTrackResponse` DTOs
- Implementacja walidacji parametrów używając Zod
- Utworzenie error types w `/src/lib/utils/errors.ts`

### Krok 3: Implementacja SpotifyService

- Metoda `searchTracks()` w spotify.service.ts
- Logika uwierzytelnienia Client Credentials Flow
- Implementacja retry logic i error handling
- Cache management dla tokenów

### Krok 4: Implementacja endpointu API

- Handler GET w `/src/pages/api/spotify/search.ts`
- Użycie TEST_USER_ID z supabase.client.ts jako mockup użytkownika
- Integracja z SpotifyService
- Implementacja response mapping

### Krok 5: Implementacja cache'owania

- Dodanie cache layer (Redis/Memory)
- Implementacja cache keys i TTL
- Cache invalidation strategy

### Krok 6: Implementacja rate limiting

- Per-user rate limiting logic
- Integration z middleware
- Monitoring i alerting

### Krok 7: Testy i walidacja

- Unit testy dla service methods
- Integration testy dla endpointu
- Testy walidacji parametrów
- Testy scenariuszy błędów

### Krok 8: Dokumentacja i monitoring

- Aktualizacja API documentation
- Implementacja logging i monitoring
- Performance testing i optimization
- Security audit
