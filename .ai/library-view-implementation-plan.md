# Plan implementacji widoku Library

## 1. Przegląd

Widok `Library` (`/library`) umożliwia uwierzytelnionym użytkownikom przeglądanie, zarządzanie i usuwanie utworów ze swojej osobistej biblioteki muzycznej. Widok prezentuje utwory w formie paginowanej listy, pobierając szczegółowe dane z API Spotify. Implementuje kluczową regułę biznesową, która uniemożliwia usunięcie ostatniego utworu z biblioteki, zapewniając integralność danych użytkownika.

## 2. Routing widoku

- **Ścieżka**: `/library`
- **Plik**: `src/pages/library.astro`

## 3. Struktura komponentów

Widok zostanie zaimplementowany jako React Island wewnątrz strony Astro, zgodnie z istniejącym wzorcem w aplikacji.

```
library.astro
├── (h1, p) // Statyczny nagłówek widoku
└── LibraryView.tsx (React Island, client:load)
    ├── if (isLoading) => LibraryGridSkeleton
    ├── if (error) => ErrorMessage
    ├── if (isEmpty) => EmptyLibraryMessage
    └── if (hasTracks) =>
        ├── LibraryGrid
        │   └── LibraryTrackCard[]
        │       ├── (Album Art, Title, Artist, Date Added)
        │       └── DeleteButton
        ├── PaginationControls
        │   └── (Prev/Next Buttons, Page Info)
        └── DeleteConfirmationModal
            └── (Dialog Title, Description, Confirm/Cancel Buttons)
```

## 4. Szczegóły komponentów

### LibraryView

- **Opis**: Główny kontener React, który zarządza stanem całego widoku, obsługuje logikę biznesową i komunikację z API. Wykorzystuje customowy hook `useLibraryView` do hermetyzacji logiki.
- **Główne elementy**: `LibraryGrid`, `PaginationControls`, `DeleteConfirmationModal`, oraz stany warunkowe (ładowanie, błąd, pusty).
- **Obsługiwane interakcje**: Inicjuje pobieranie biblioteki, zarządza paginacją, otwiera modal potwierdzenia usunięcia.
- **Typy**: `LibraryViewState`.
- **Propsy**: Brak.

### LibraryTrackCard

- **Opis**: Karta prezentująca pojedynczy utwór z biblioteki, zawierająca jego metadane oraz przycisk do usunięcia.
- **Główne elementy**: `img` (okładka albumu), `p` (tytuł, artysta, data dodania), `Button` (Shadcn, do usunięcia).
- **Obsługiwane interakcje**: `onClick` na przycisku usunięcia.
- **Obsługiwana walidacja**: Przycisk usunięcia jest nieaktywny, jeśli `isDeleteDisabled` jest `true`.
- **Typy**: `LibraryTrackViewModel`.
- **Propsy**:
  - `track: LibraryTrackViewModel`
  - `isDeleteDisabled: boolean`
  - `onDelete: (track: LibraryTrackViewModel) => void`

### DeleteConfirmationModal

- **Opis**: Modal (dialog z Shadcn/ui) z prośbą o potwierdzenie usunięcia utworu.
- **Główne elementy**: `DialogHeader`, `DialogDescription`, `DialogFooter` z przyciskami "Anuluj" i "Potwierdź".
- **Obsługiwane interakcje**: `onClick` na przyciskach potwierdzenia lub anulowania.
- **Obsługiwana walidacja**: Przycisk "Potwierdź" może pokazywać stan ładowania.
- **Typy**: `LibraryTrackViewModel | null`.
- **Propsy**:
  - `isOpen: boolean`
  - `track: LibraryTrackViewModel | null`
  - `onConfirm: () => void`
  - `onCancel: () => void`

### PaginationControls

- **Opis**: Komponent nawigacyjny do przełączania się między stronami biblioteki.
- **Główne elementy**: Dwa przyciski `Button` (Shadcn) "Poprzednia" i "Następna" oraz tekst z informacją o bieżącej stronie (np. "Strona 1 z 5").
- **Obsługiwane interakcje**: `onClick` na przyciskach nawigacyjnych.
- **Obsługiwana walidacja**: Przycisk "Poprzednia" jest nieaktywny na pierwszej stronie, a "Następna" na ostatniej.
- **Typy**: `PaginationMeta`.
- **Propsy**:
  - `pagination: PaginationMeta`
  - `onPageChange: (newPage: number) => void`

## 5. Typy

Widok będzie korzystał z istniejących DTO oraz wprowadzi nowe typy ViewModel do zarządzania stanem UI.

```typescript
/** Model widoku dla pojedynczego utworu w bibliotece, łączący dane z wielu źródeł */
interface LibraryTrackViewModel extends LibraryTrackWithDetailsDTO {
  // Dziedziczy: spotify_track_id, created_at, name, artists, album, duration_ms
  /** Stan UI dla obsługi optymistycznych aktualizacji */
  uiState: "idle" | "deleting";
}

/** Metadane paginacji potrzebne dla komponentu PaginationControls */
interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasMore: boolean;
}

/** Główny stan widoku Library, zarządzany przez hook useLibraryView */
interface LibraryViewState {
  tracks: LibraryTrackViewModel[];
  pagination: PaginationMeta;
  isLoading: boolean;
  error: Error | null;
  /** Przechowuje utwór wybrany do usunięcia, kontroluje widoczność modala */
  trackToDelete: LibraryTrackViewModel | null;
}
```

## 6. Zarządzanie stanem

Cała logika biznesowa i zarządzanie stanem zostaną zamknięte w customowym hooku `useLibraryView`, zgodnie z wzorcem zastosowanym w `DiscoverView`.

- **`useLibraryView`**:
  - **Cel**: Zarządzanie obiektem `LibraryViewState`, obsługa cyklu życia komponentu (pobieranie danych), hermetyzacja wywołań API (pobieranie i usuwanie utworów) oraz dostarczanie handlerów zdarzeń do komponentów UI.
  - **Zarządzanie stanem**: Używa `React.useState` lub `React.useReducer` do przechowywania `LibraryViewState`.
  - **Synchronizacja z URL**: Hook będzie odpowiedzialny za odczytywanie parametru `?page=` z URL przy pierwszym renderowaniu oraz za jego aktualizację przy zmianie strony za pomocą `URLSearchParams` i `history.pushState`.
  - **Zwraca**: Obiekt zawierający aktualny stan (`state: LibraryViewState`) oraz handlery zdarzeń (`handlers`).

## 7. Integracja API

Widok będzie komunikował się z trzema endpointami API:

1.  **`GET /api/library`**

    - **Trigger**: Przy montowaniu komponentu oraz przy każdej zmianie strony.
    - **Żądanie**: `GET /api/library?limit=20&offset={(page - 1) * 20}`.
    - **Odpowiedź**: `LibraryResponseDTO`.
    - **Akcja**: Pobiera paginowaną listę ID utworów i metadane paginacji.

2.  **`POST /api/spotify/tracks`**

    - **Trigger**: Bezpośrednio po pomyślnym pobraniu danych z `GET /api/library`.
    - **Żądanie**: `POST` z ciałem `{ track_ids: string[] }`.
    - **Odpowiedź**: Tablica obiektów `TrackDetailsResponseDTO`.
    - **Akcja**: Pobiera szczegółowe dane utworów (tytuł, artysta, okładka) dla wszystkich ID z bieżącej strony.

3.  **`DELETE /api/library/{spotify_track_id}`**
    - **Trigger**: Po potwierdzeniu usunięcia w modalu.
    - **Żądanie**: `DELETE` na ścieżkę z ID utworu.
    - **Odpowiedź**: `SuccessMessageDTO`.
    - **Akcja**: Implementuje optymistyczną aktualizację. Natychmiast zmienia stan UI utworu na `deleting`, wysyła żądanie, a po pomyślnej odpowiedzi usuwa utwór z listy i wyświetla toast. W razie błędu cofa zmianę i wyświetla toast błędu.

## 8. Interakcje użytkownika

- **Przeglądanie stron**: Kliknięcie na "Następna" lub "Poprzednia" w `PaginationControls` wywołuje `onPageChange`, co aktualizuje parametr `?page=` w URL i uruchamia pobieranie danych dla nowej strony.
- **Inicjowanie usunięcia**: Kliknięcie przycisku "Usuń" na `LibraryTrackCard` wywołuje `onDelete`, co ustawia `trackToDelete` w stanie i otwiera `DeleteConfirmationModal`.
- **Potwierdzenie usunięcia**: Kliknięcie "Potwierdź" w modalu uruchamia proces usuwania z optymistyczną aktualizacją.
- **Anulowanie usunięcia**: Kliknięcie "Anuluj" zamyka modal i resetuje stan `trackToDelete`.

## 9. Warunki i walidacja

- **Wyłączenie usuwania ostatniego utworu**:
  - **Warunek**: `pagination.totalCount <= 1`.
  - **Komponent**: `LibraryView` przekazuje prop `isDeleteDisabled` do `LibraryTrackCard`.
  - **Stan UI**: Przycisk "Usuń" na karcie jest nieaktywny (`disabled`).
- **Walidacja paginacji**:
  - **Warunek**: `pagination.currentPage === 1` (dla "Poprzednia") oraz `!pagination.hasMore` (dla "Następna").
  - **Komponent**: `PaginationControls`.
  - **Stan UI**: Odpowiednie przyciski nawigacyjne są nieaktywne.

## 10. Obsługa błędów

- **Błąd pobierania biblioteki**: Jeśli `GET /api/library` lub `POST /api/spotify/tracks` zwróci błąd, `useLibraryView` ustawi stan `error`. `LibraryView` wyświetli komponent `ErrorMessage` z komunikatem i przyciskiem "Spróbuj ponownie".
- **Błąd usuwania utworu**: W przypadku błędu z `DELETE /api/library/...`, optymistyczna aktualizacja zostanie cofnięta, a użytkownik zobaczy powiadomienie toast (np. "Nie udało się usunąć utworu").
- **Pusta biblioteka**: Jeśli `pagination.totalCount` wynosi 0, `LibraryView` wyświetli komponent `EmptyLibraryMessage` z Call-To-Action, np. linkiem do widoku `Discover`.
- **Stan ładowania**: Podczas pobierania danych (`isLoading: true`), `LibraryView` będzie renderować komponent `LibraryGridSkeleton`, aby zapobiec przesunięciom layoutu (layout shifting).

## 11. Kroki implementacji

1.  **Struktura plików**: Stworzenie `src/pages/library.astro` oraz plików dla komponentów React: `src/components/views/LibraryView.tsx`, `src/components/library/LibraryTrackCard.tsx`, `src/components/library/PaginationControls.tsx`, `src/components/library/DeleteConfirmationModal.tsx`.
2.  **Strona Astro**: Stworzenie `library.astro`, dodanie w nim statycznego nagłówka (`h1`, `p`), a następnie osadzenie `LibraryView.tsx` jako `client:load`.
3.  **Główny komponent i hook**: Implementacja `LibraryView.tsx` oraz customowego hooka `useLibraryView` z definicją typów `LibraryViewState`, `LibraryTrackViewModel`, `PaginationMeta`.
4.  **Pobieranie danych**: Implementacja w `useLibraryView` logiki pobierania danych z `GET /api/library` i `POST /api/spotify/tracks`, w tym obsługa stanów ładowania i błędów.
5.  **Komponenty UI**: Stworzenie komponentów `LibraryTrackCard` i `PaginationControls` z wykorzystaniem komponentów Shadcn/ui.
6.  **Paginacja**: Implementacja logiki paginacji w `useLibraryView`, włączając synchronizację z parametrami URL.
7.  **Logika usuwania**: Implementacja pełnego przepływu usuwania: otwarcie modala, potwierdzenie, optymistyczna aktualizacja, wywołanie API i obsługa sukcesu/błędu za pomocą `sonner` (toasts).
8.  **Stany krańcowe**: Implementacja renderowania warunkowego dla stanów ładowania (Skeletons), błędu (`ErrorMessage`) i pustej biblioteki (`EmptyLibraryMessage`).
9.  **Stylowanie i RWD**: Dopracowanie stylów za pomocą Tailwind CSS, zapewnienie responsywności siatki utworów na różnych urządzeniach.
10. **Testowanie**: Przeprowadzenie testów manualnych całego przepływu: ładowanie, paginacja, usuwanie (w tym próba usunięcia ostatniego utworu), obsługa błędów.
