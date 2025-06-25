# Plan implementacji widoku Zablokowanych Utworów (Blocked Tracks View)

## 1. Przegląd

Widok Zablokowanych Utworów (`/blocked-tracks`) umożliwia użytkownikom zarządzanie listą utworów, które zostały przez nich wykluczone z rekomendacji AI. Użytkownicy mogą przeglądać zablokowane utwory, sprawdzać czas pozostały do wygaśnięcia tymczasowych blokad oraz trwale je odblokowywać. Widok automatycznie usuwa utwory z listy po upływie czasu blokady, zapewniając płynne i dynamiczne doświadczenie.

## 2. Routing widoku

- **Ścieżka**: `/blocked-tracks`
- **Plik**: `src/pages/blocked-tracks.astro`
- **Dostęp**: Wymaga uwierzytelnienia użytkownika (obsługiwane przez middleware).
- **Renderowanie**: Strona Astro będzie ładować główny komponent React (`BlockedTracksView.tsx`) po stronie klienta za pomocą dyrektywy `client:load`.

## 3. Struktura komponentów

Komponenty będą zorganizowane w sposób hierarchiczny, aby oddzielić logikę od prezentacji.

```
/src/pages/blocked-tracks.astro
└── /src/components/views/BlockedTracksView.tsx
    ├── /src/components/ui/LoadingSkeleton.tsx (stan ładowania)
    ├── /src/components/shared/EmptyState.tsx (stan pusty)
    ├── /src/components/shared/ErrorState.tsx (stan błędu)
    └── /src/components/blocked-tracks/BlockedTracksList.tsx
        └── /src/components/blocked-tracks/BlockedTrackCard.tsx
            ├── /src/components/blocked-tracks/CountdownTimer.tsx
            └── /src/components/ui/button.tsx (Shadcn)
    └── /src/components/blocked-tracks/UnblockConfirmationModal.tsx (Shadcn Dialog)
```

## 4. Szczegóły komponentów

### `BlockedTracksView.tsx`

- **Opis komponentu**: Główny komponent-kontener, który zarządza stanem całego widoku, w tym ładowaniem danych, obsługą błędów oraz logiką odblokowywania utworów.
- **Główne elementy**: Wykorzystuje niestandardowy hook `useBlockedTracksView` do zarządzania stanem. Renderuje warunkowo komponenty `LoadingSkeleton`, `EmptyState`, `ErrorState` lub `BlockedTracksList` w zależności od aktualnego stanu. Kontroluje również widoczność `UnblockConfirmationModal`.
- **Obsługiwane interakcje**:
  - Inicjowanie pobierania danych przy montowaniu komponentu.
  - Otwieranie modalu potwierdzającego po kliknięciu przycisku "Odblokuj" na karcie utworu.
  - Wywoływanie funkcji odblokowującej po potwierdzeniu w modalu.
  - Usuwanie utworu z listy po wygaśnięciu jego timera.
- **Typy**: `LibraryViewState`
- **Propsy**: Brak.

### `BlockedTracksList.tsx`

- **Opis komponentu**: Komponent prezentacyjny, który renderuje listę zablokowanych utworów.
- **Główne elementy**: Mapuje tablicę `BlockedTrackViewModel` i renderuje dla każdego elementu komponent `BlockedTrackCard`.
- **Obsługiwane interakcje**: Brak bezpośrednich interakcji. Przekazuje funkcje obsługi zdarzeń do komponentów `BlockedTrackCard`.
- **Typy**: `BlockedTrackViewModel[]`
- **Propsy**:
  - `tracks: BlockedTrackViewModel[]`
  - `onUnblockClick: (trackId: string) => void`
  - `onTimerExpire: (trackId: string) => void`

### `BlockedTrackCard.tsx`

- **Opis komponentu**: Wyświetla pojedynczy zablokowany utwór, zawierający jego okładkę, tytuł, wykonawcę, timer odliczający czas do odblokowania oraz przycisk do natychmiastowego odblokowania.
- **Główne elementy**: `img` (okładka albumu), `h3` (tytuł utworu), `p` (wykonawca), `CountdownTimer`, `Button`.
- **Obsługiwane interakcje**: `onClick` na przycisku "Odblokuj", który wywołuje `onUnblockClick` z `spotify_track_id` utworu.
- **Typy**: `BlockedTrackViewModel`
- **Propsy**:
  - `track: BlockedTrackViewModel`
  - `onUnblockClick: (trackId: string) => void`
  - `onTimerExpire: (trackId: string) => void`

### `CountdownTimer.tsx`

- **Opis komponentu**: Komponent odpowiedzialny za logikę odliczania i wyświetlanie pozostałego czasu blokady.
- **Główne elementy**: Element `p` lub `span` wyświetlający sformatowany czas.
- **Logika**:
  - Używa `useEffect` z `setInterval` do aktualizacji co sekundę.
  - Oblicza różnicę między `expires_at` a aktualnym czasem.
  - Jeśli `expires_at` jest `null`, wyświetla tekst "Na stałe".
  - Gdy odliczanie dobiegnie końca, czyści interwał i wywołuje `onTimerExpire`.
- **Typy**: `string | null`
- **Propsy**:
  - `expiresAt: string | null`
  - `onTimerExpire: () => void`

### `UnblockConfirmationModal.tsx`

- **Opis komponentu**: Modal dialogowy (oparty na `Dialog` z Shadcn/ui) proszący użytkownika o potwierdzenie chęci odblokowania utworu.
- **Główne elementy**: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `Button`.
- **Obsługiwane interakcje**:
  - Kliknięcie przycisku "Potwierdź" wywołuje `onConfirm`.
  - Zamknięcie modalu (przez przycisk "Anuluj", "X" lub klawisz Esc) wywołuje `onOpenChange(false)`.
- **Typy**: `BlockedTrackViewModel`
- **Propsy**:
  - `isOpen: boolean`
  - `onOpenChange: (isOpen: boolean) => void`
  - `onConfirm: () => void`
  - `track: BlockedTrackViewModel | null` (do wyświetlenia nazwy utworu w treści)

## 5. Typy

Do implementacji widoku konieczne będzie stworzenie nowego modelu widoku, który połączy dane z kilku źródeł.

- **`BlockedTrackDTO`**: Typ danych zwracany przez `GET /api/blocked-tracks`.
- **`TrackDetailsResponseDTO`**: Typ danych zwracany przez `GET /api/spotify/track/{id}`.

### `BlockedTrackViewModel` (Nowy typ)

Ten model widoku połączy dane o blokadzie z danymi szczegółowymi utworu ze Spotify oraz doda stan specyficzny dla UI.

```typescript
// src/types.ts

import type { TrackDetailsResponseDTO, BlockedTrackDTO } from "./types";

/** Stan UI dla operacji na zablokowanym utworze */
export type BlockedTrackUIState = "idle" | "deleting";

/** Model widoku dla pojedynczego zablokowanego utworu */
export interface BlockedTrackViewModel extends TrackDetailsResponseDTO {
  // Dziedziczy wszystkie szczegóły utworu ze Spotify:
  // spotify_track_id, name, artists, album, duration_ms, etc.

  /** Informacje o blokadzie z naszego API */
  block_info: Pick<BlockedTrackDTO, "expires_at" | "created_at">;

  /** Stan UI do obsługi optymistycznych aktualizacji */
  uiState: BlockedTrackUIState;
}
```

## 6. Zarządzanie stanem

Cała logika biznesowa widoku zostanie zamknięta w niestandardowym hooku `useBlockedTracksView`.

### `useBlockedTracksView.ts`

- **Cel**: Separacja logiki od prezentacji, hermetyzacja stanu i operacji.
- **Zarządzany stan**:
  - `tracks: BlockedTrackViewModel[]`: Lista zablokowanych utworów do wyświetlenia.
  - `isLoading: boolean`: Status ładowania początkowych danych.
  - `error: Error | null`: Obiekt błędu w przypadku niepowodzenia pobierania danych.
  - `trackToUnblock: BlockedTrackViewModel | null`: Przechowuje utwór wybrany do odblokowania, co kontroluje widoczność modala.
- **Udostępniane funkcje**:
  - `handleUnblockClick(trackId: string)`: Otwiera modal potwierdzający.
  - `handleConfirmUnblock()`: Wykonuje żądanie API `DELETE`, aktualizuje stan (optymistycznie) i wyświetla powiadomienia.
  - `handleCloseModal()`: Zamyka modal.
  - `handleTimerExpire(trackId: string)`: Usuwa utwór ze stanu po wygaśnięciu blokady.
- **Logika wewnętrzna**:
  - `useEffect` do pobierania danych przy montowaniu:
    1. Wywołuje `GET /api/blocked-tracks`.
    2. Po otrzymaniu listy ID, wywołuje `Promise.all` dla `GET /api/spotify/track/{id}` dla każdego utworu.
    3. Łączy wyniki w tablicę `BlockedTrackViewModel[]` i aktualizuje stan.

## 7. Integracja API

Integracja będzie opierać się na wywołaniach do trzech endpointów API.

1.  **Pobieranie listy zablokowanych utworów**:

    - **Endpoint**: `GET /api/blocked-tracks`
    - **Typ odpowiedzi**: `BlockedTracksResponseDTO`
    - **Wywołanie**: Raz, przy pierwszym ładowaniu widoku.

2.  **Pobieranie szczegółów utworów**:

    - **Endpoint**: `GET /api/spotify/track/{spotify_track_id}`
    - **Typ odpowiedzi**: `TrackDetailsResponseDTO`
    - **Wywołanie**: Wykonywane dla każdego utworu z listy zablokowanych, zrównoleglone za pomocą `Promise.all`.

3.  **Odblokowanie utworu**:
    - **Endpoint**: `DELETE /api/blocked-tracks/{spotify_track_id}`
    - **Typ odpowiedzi**: `SuccessMessageDTO`
    - **Wywołanie**: Po potwierdzeniu przez użytkownika w modalu.

## 8. Interakcje użytkownika

- **Ładowanie widoku**: Użytkownik widzi szkielet interfejsu (`LoadingSkeleton`), a następnie listę utworów, stan pusty lub błąd.
- **Kliknięcie "Odblokuj"**: Otwiera się modal z prośbą o potwierdzenie. Przycisk "Odblokuj" na karcie staje się nieaktywny, aby zapobiec wielokrotnym kliknięciom.
- **Potwierdzenie w modalu**: Modal zostaje zamknięty, utwór znika z listy (aktualizacja optymistyczna), a na ekranie pojawia się powiadomienie toast o sukcesie.
- **Anulowanie w modalu**: Modal zostaje zamknięty, stan listy pozostaje bez zmian.
- **Koniec odliczania timera**: Karta utworu automatycznie i płynnie znika z listy.

## 9. Warunki i walidacja

W tym widoku nie ma pól do walidacji wprowadzanych przez użytkownika. Kluczowe warunki do obsłużenia w UI to:

- Przycisk "Odblokuj" na karcie powinien być nieaktywny (`disabled`), gdy `track.uiState === 'deleting'`, aby uniknąć wielokrotnego wysyłania żądań dla tego samego utworu.
- Przycisk "Potwierdź" w modalu powinien być nieaktywny, gdy żądanie `DELETE` jest w toku.

## 10. Obsługa błędów

- **Błąd pobierania danych**: Jeśli którykolwiek z początkowych zapytań `GET` zakończy się niepowodzeniem, `useBlockedTracksView` ustawi stan `error`. Komponent `BlockedTracksView` wyświetli wtedy komponent `ErrorState` z komunikatem błędu i przyciskiem "Spróbuj ponownie".
- **Błąd odblokowania utworu**: Jeśli żądanie `DELETE` nie powiedzie się, optymistyczna aktualizacja UI zostanie cofnięta (utwór wróci na listę), a użytkownik zobaczy powiadomienie toast z informacją o błędzie (np. "Nie udało się odblokować utworu. Spróbuj ponownie.").
- **Stan pusty**: Jeśli API zwróci pustą listę zablokowanych utworów, zostanie wyświetlony komponent `EmptyState` z informacją i przyciskiem odsyłającym do widoku `Odkrywaj`.

## 11. Kroki implementacji

1.  **Stworzenie struktury plików**:

    - Utwórz plik `src/pages/blocked-tracks.astro`.
    - Utwórz folder `src/components/blocked-tracks`.
    - Wypełnij `blocked-tracks.astro` podstawowym layoutem i dołącz komponent `BlockedTracksView` z `client:load`.

2.  **Definicja typów i hooka**:

    - Zdefiniuj typ `BlockedTrackViewModel` w `src/types.ts`.
    - Stwórz plik `src/hooks/useBlockedTracksView.ts` i zaimplementuj w nim logikę pobierania danych (`useEffect`, `Promise.all`) oraz podstawowe stany (`tracks`, `isLoading`, `error`).

3.  **Implementacja komponentu `BlockedTracksView`**:

    - Stwórz komponent `BlockedTracksView.tsx`.
    - Użyj hooka `useBlockedTracksView`.
    - Zaimplementuj warunkowe renderowanie dla stanów `isLoading`, `error`, `tracks.length === 0` i listy utworów.

4.  **Implementacja komponentów listy i karty**:

    - Stwórz `BlockedTracksList.tsx` i `BlockedTrackCard.tsx`.
    - Wyświetl w karcie dane utworu (obraz, nazwa, wykonawca).
    - Dodaj przycisk "Odblokuj".

5.  **Implementacja `CountdownTimer`**:

    - Stwórz komponent `CountdownTimer.tsx`.
    - Zaimplementuj logikę `setInterval` do odliczania czasu.
    - Dodaj obsługę `expiresAt === null` oraz wywołanie `onTimerExpire`.
    - Zintegruj go z `BlockedTrackCard`.

6.  **Implementacja modalu i logiki odblokowywania**:

    - Stwórz komponent `UnblockConfirmationModal.tsx` przy użyciu `Dialog` z Shadcn/ui.
    - W `useBlockedTracksView` dodaj stan `trackToUnblock` oraz funkcje `handleUnblockClick`, `handleConfirmUnblock`, `handleCloseModal`.
    - Zaimplementuj logikę optymistycznej aktualizacji i obsługę błędów z powiadomieniami toast.

7.  **Stylowanie i animacje**:

    - Użyj Tailwind do ostylowania wszystkich komponentów zgodnie z UI planem.
    - Dodaj subtelne animacje wejścia/wyjścia dla elementów listy (np. używając `Framer Motion` z `AnimatePresence`), aby usunięcie utworu było płynne.

8.  **Testowanie i finalizacja**:
    - Przetestuj wszystkie ścieżki użytkownika: pomyślne ładowanie, stan pusty, błędy API, odblokowywanie, wygasanie timera.
    - Upewnij się, że responsywność jest zachowana zgodnie z wymaganiami.
    - Sprawdź dostępność (obsługa klawiatury, atrybuty ARIA).

</rewritten_file>
