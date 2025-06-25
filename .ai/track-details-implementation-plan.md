# API Endpoint Implementation Plan: Spotify Track Details

## 1. Przegląd punktu końcowego

Endpoint **GET /api/spotify/track/{spotify_track_id}** służy do pobierania szczegółowych informacji o konkretnym utworze z katalogu Spotify. Endpoint zwraca kompletne metadane utworu włączając informacje o wykonawcy, albumie, popularności i preview URL. Integuje się z Spotify Web API używając Client Credentials Flow. Na tym etapie rozwoju używa mockup użytkownika (TEST_USER_ID) zamiast pełnej walidacji JWT.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/spotify/track/{spotify_track_id}`
- **Parametry:**
  - **Wymagane (Path Parameters):**
    - `spotify_track_id` (string) - identyfikator utworu Spotify
      - Dokładnie 22 znaki
      - Alfanumeryczne + podkreślnik/myślnik
      - Przykład: "4iV5W9uYEdYUVa79Axb7Rh"
  - **Opcjonalne (Query Parameters):**
    - `market` (string) - rynek dla dostępności utworu
      - Domyślnie: "US"
      - Format: ISO 3166-1 alpha-2 (np. "US", "PL", "GB")
- **Headers:** Brak (na razie używamy mockup użytkownika)
- **Request Body:** Brak (GET request)

## 3. Szczegóły odpowiedzi

**Struktura odpowiedzi (200 OK):**

```json
{
  "spotify_track_id": "string",
  "name": "string",
  "artists": [
    {
      "name": "string",
      "spotify_artist_id": "string",
      "genres": ["black metal", "death metal"]
    }
  ],
  "album": {
    "name": "string",
    "spotify_album_id": "string",
    "release_date": "2023-01-01",
    "total_tracks": 10,
    "images": [
      {
        "url": "https://...",
        "height": 640,
        "width": 640
      }
    ]
  },
  "duration_ms": 240000,
  // preview_url removed - no audio functionality
  "explicit": false,
  "popularity": 65
}
```

**Kody statusu:**

- `200 OK` - Szczegóły utworu pobrane pomyślnie
- `400 Bad Request` - Nieprawidłowy format spotify_track_id lub market
- `404 Not Found` - Utwór nie znaleziony lub niedostępny na rynku
- `429 Too Many Requests` - Przekroczony limit żądań
- `503 Service Unavailable` - API Spotify niedostępne
- `500 Internal Server Error` - Błąd wewnętrzny serwera

## 4. Przepływ danych

1. **Mockup użytkownika:**

   - Użycie TEST_USER_ID z supabase.client.ts do symulacji użytkownika
   - Brak walidacji uwierzytelnienia na tym etapie

2. **Walidacja parametrów wejściowych:**

   - Sprawdzenie formatu spotify_track_id (dokładnie 22 znaki)
   - Walidacja opcjonalnego parametru market
   - Ekstrakacja parametrów z URL path i query string

3. **Uwierzytelnienie Spotify:**

   - Pobranie access token z cache lub odnowienie przez Client Credentials Flow
   - Zarządzanie tokenami po stronie serwera

4. **Wywołanie Spotify API:**

   - Wywołanie endpointu Spotify `/v1/tracks/{id}` dla metadanych utworu
   - Obsługa błędów i retry logic

5. **Przetwarzanie odpowiedzi:**

   - Mapowanie danych ze struktury Spotify na własne DTO
   - Transformacja danych wykonawców i albumu

6. **Cache i optymalizacja:**
   - Zapisanie wyników w cache (24 godziny TTL zgodnie ze specyfikacją)
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

  - Strict validation formatu spotify_track_id
  - Walidacja market code przeciwko whitelist krajów
  - Sanityzacja parametrów przed przekazaniem do Spotify

- **Rate Limiting:**
  - Podstawowy rate limiting na poziomie aplikacji
  - Monitoring użycia API Spotify
  - Graceful degradation przy przekroczeniu limitów
  - Uwaga: Per-user rate limiting zostanie dodany po implementacji pełnej autentykacji

## 6. Obsługa błędów

**Walidacja parametrów (400 Bad Request):**

- Nieprawidłowy format spotify_track_id (nie 22 znaki)
- Nieprawidłowe znaki w spotify_track_id
- Nieprawidłowy kod market (nie ISO 3166-1 alpha-2)
- Brakujący spotify_track_id w path

**Zasób nie znaleziony (404 Not Found):**

- Utwór nie istnieje w katalogu Spotify
- Utwór niedostępny na określonym rynku
- Utwór został usunięty z katalogu

**Rate Limiting (429 Too Many Requests):**

- Przekroczenie limitu aplikacji
- Przekroczenie limitu Spotify API
- Implementacja exponential backoff

**Zewnętrzne serwisy (503 Service Unavailable):**

- Niedostępność Spotify API
- Timeout przy wywołaniach zewnętrznych
- Błędy sieci i connectivity

**Błędy wewnętrzne (500 Internal Server Error):**

- Błędy transformacji danych
- Błędy komunikacji z Spotify API
- Nieoczekiwane wyjątki aplikacji

## 7. Rozważania dotyczące wydajności

**Strategia cache'owania:**

- Cache szczegółów utworów: 24 godziny TTL (zgodnie ze specyfikacją)
- Cache tokenów Spotify: do czasu wygaśnięcia
- Implementacja cache key na podstawie track_id + market

**Optymalizacja żądań:**

- Connection pooling dla Spotify API
- Efficient data transformation i mapping

**Skalowanie:**

- Horizontal scaling readiness
- CDN dla statycznych assets (okładki albumów)
- Database query optimization dla przyszłych integracji

## 8. Etapy wdrożenia

### Krok 1: Przygotowanie struktury plików

- Utworzenie `/src/pages/api/spotify/track/[spotify_track_id].ts`
- Rozszerzenie typów DTO w `/src/types.ts`
- Rozszerzenie service w `/src/lib/services/spotify.service.ts`

### Krok 2: Implementacja typów i walidacji

- Zdefiniowanie `TrackDetailsRequest` i `TrackDetailsResponse` DTOs
- Dodanie `SpotifyTrackDetails` types
- Implementacja walidacji parametrów używając Zod
- Walidacja spotify_track_id format (regex dla 22 znaków)

### Krok 3: Rozszerzenie SpotifyService

- Metoda `getTrackDetails()` w spotify.service.ts
- Implementacja retry logic i error handling
- Transformacja danych Spotify na własne DTO

### Krok 4: Implementacja endpointu API

- Handler GET w `/src/pages/api/spotify/track/[spotify_track_id].ts`
- Użycie TEST_USER_ID z supabase.client.ts jako mockup użytkownika
- Ekstrakacja spotify_track_id z dynamic route
- Integracja z rozszerzonym SpotifyService

### Krok 5: Implementacja cache'owania

- Dodanie cache layer dla track details (24h TTL)
- Implementacja cache keys i TTL management
- Cache invalidation strategy

### Krok 6: Optymalizacja i error handling

- Implementacja efficient data transformation
- Error handling dla API failures
- Response validation i sanitization

### Krok 7: Testy i walidacja

- Unit testy dla service methods
- Integration testy dla endpointu
- Testy walidacji parametrów path i query
- Testy scenariuszy błędów (404, 400, 503)

### Krok 8: Dokumentacja i monitoring

- Aktualizacja API documentation
- Implementacja logging i monitoring
- Performance testing dla API calls
- Security audit i validation testing
