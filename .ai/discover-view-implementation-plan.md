# Plan implementacji widoku Discover

## 1. Przegląd

Widok `Discover` jest centralnym punktem aplikacji, umożliwiającym użytkownikom odkrywanie nowej muzyki metalowej za pomocą AI. Użytkownik wybiera utwór bazowy ze swojej biblioteki, opisuje swoje preferencje i ustawia "temperaturę" (popularność vs. nisza), na podstawie których system generuje 10 spersonalizowanych rekomendacji. Każda rekomendacja zawiera podgląd audio, uzasadnienie AI oraz biografię artysty. Widok obsługuje również dodawanie utworów do biblioteki i ich blokowanie.

## 2. Routing widoku

Widok będzie dostępny pod główną ścieżką po zalogowaniu:

- **Ścieżka**: `/discover`
- **Plik**: `src/pages/discover.astro`

## 3. Struktura komponentów

Widok zostanie zaimplementowany jako React Island wewnątrz strony Astro. Hierarchia komponentów będzie następująca:

```
DiscoverPage.astro
└── DiscoverView (React Island)
    ├── EmptyLibraryModal (jeśli biblioteka jest pusta)
    │   └── SpotifyTrackSearch
    ├── RecommendationForm
    │   ├── TrackSelector (Shadcn Select)
    │   ├── (Shadcn Textarea)
    │   ├── TemperatureSlider (Shadcn Slider)
    │   └── (Shadcn Button "Generate")
    ├── RecommendationsList
    │   ├── (LoadingSkeleton / EmptyState / ErrorState)
    │   └── RecommendationCard[]
    │       ├── AudioPlayer
    │       ├── (Shadcn Button "Add to Library")
    │       ├── (Shadcn DropdownMenu "Block Track")
    │       └── (Shadcn Button "Details")
    └── RecommendationDetailsModal (Shadcn Dialog)
```

Komponenty interaktywne będą renderowane po stronie klienta (`client:load`).

## 4. Szczegóły komponentów

### DiscoverView

- **Opis**: Główny kontener React, który zarządza stanem całego widoku, obsługuje logikę biznesową i komunikację z API.
- **Główne elementy**: `EmptyLibraryModal`, `RecommendationForm`, `RecommendationsList`, `RecommendationDetailsModal`.
- **Obsługiwane interakcje**: Inicjuje pobieranie biblioteki przy montowaniu, obsługuje logikę generowania rekomendacji.
- **Obsługiwana walidacja**: Agreguje walidację z formularza, aby włączyć/wyłączyć przycisk generowania.
- **Typy**: `DiscoverViewState`, `LibraryTrackDTO`, `AIRecommendationDTO`.
- **Propsy**: Brak.

### RecommendationForm

- **Opis**: Formularz grupujący wszystkie kontrolki potrzebne do zdefiniowania preferencji dla rekomendacji.
- **Główne elementy**: `TrackSelector`, `Textarea` (Shadcn), `TemperatureSlider`, `Button` (Shadcn).
- **Obsługiwane interakcje**: `onSubmit` (uruchamia generowanie rekomendacji), `onChange` dla poszczególnych pól (aktualizuje stan).
- **Obsługiwana walidacja**: Sprawdza, czy wszystkie wymagane pola są wypełnione poprawnie.
- **Typy**: `LibraryTrackDTO[]`, `AIRecommendationsCommand`.
- **Propsy**: `libraryTracks: LibraryTrackDTO[]`, `isLoading: boolean`, `onSubmit: (command: AIRecommendationsCommand) => void`.

### TrackSelector

- **Opis**: Komponent `Select` (Shadcn), który wyświetla utwory z biblioteki użytkownika.
- **Główne elementy**: `SelectTrigger`, `SelectContent`, `SelectItem`.
- **Obsługiwane interakcje**: `onValueChange` (wybór utworu).
- **Obsługiwana walidacja**: Pole wymagane.
- **Typy**: `LibraryTrackDTO`.
- **Propsy**: `tracks: LibraryTrackDTO[]`, `onSelect: (trackId: string) => void`, `disabled: boolean`.

### TemperatureSlider

- **Opis**: Komponent `Slider` (Shadcn) do ustawiania "temperatury" rekomendacji.
- **Główne elementy**: `Slider`.
- **Obsługiwane interakcje**: `onValueChange` (zmiana wartości suwaka).
- **Obsługiwana walidacja**: Zakres 0.1 - 1.0, krok 0.1.
- **Typy**: `number`.
- **Propsy**: `defaultValue: number`, `onValueChange: (value: number) => void`, `disabled: boolean`.

### RecommendationsList

- **Opis**: Renderuje listę kart z rekomendacjami lub stany zastępcze (ładowanie, brak wyników, błąd).
- **Główne elementy**: `RecommendationCard[]`, `LoadingSkeleton`, `EmptyState`, `ErrorState`.
- **Obsługiwane interakcje**: Przekazuje zdarzenia z `RecommendationCard` do `DiscoverView`.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `RecommendationCardViewModel[]`.
- **Propsy**: `recommendations: RecommendationCardViewModel[]`, `isLoading: boolean`, `error: Error | null`, `onAddToLibrary: (trackId: string) => void`, `onBlockTrack: (trackId: string, duration: BlockDuration) => void`, `onViewDetails: (track: AIRecommendationDTO) => void`.

### RecommendationCard

- **Opis**: Karta prezentująca pojedynczą rekomendację z informacjami o utworze, odtwarzaczem i akcjami.
- **Główne elementy**: `img` (okładka), `p` (tytuł, artysta), `AudioPlayer`, `Button` (Shadcn "Add"), `DropdownMenu` (Shadcn "Block"), `Button` (Shadcn "Details").
- **Obsługiwane interakcje**: `onClick` na przyciskach akcji.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `RecommendationCardViewModel`.
- **Propsy**: `track: RecommendationCardViewModel`, `onAddToLibrary`, `onBlockTrack`, `onViewDetails`.

## 5. Typy

Oprócz typów DTO z `src/types.ts`, widok będzie korzystał z wewnętrznych typów ViewModel do zarządzania stanem UI.

```typescript
/** Główny stan widoku Discover */
interface DiscoverViewState {
  library: {
    tracks: LibraryTrackDTO[];
    isLoading: boolean;
    error: Error | null;
  };
  form: {
    base_track_id: string;
    description: string;
    temperature: number;
  };
  recommendations: {
    list: RecommendationCardViewModel[];
    isLoading: boolean;
    error: Error | null;
    metadata: GenerationMetadataDTO | null;
  };
  activeModal: {
    type: "details" | null;
    data: AIRecommendationDTO | null;
  };
  isLibraryEmpty: boolean;
}

/** Rozszerzenie DTO rekomendacji o stan UI */
interface RecommendationCardViewModel extends AIRecommendationDTO {
  uiState: "idle" | "adding" | "blocking" | "added" | "blocked";
}
```

## 6. Zarządzanie stanem

Stan będzie zarządzany centralnie w komponencie `DiscoverView` za pomocą hooka `useReducer` lub customowego hooka `useDiscoverView`, który hermetyzuje całą logikę.

- **`useDiscoverView`**:

  - **Cel**: Separacja logiki od prezentacji. Zarządza obiektem `DiscoverViewState`, obsługuje wywołania API i aktualizuje stan w odpowiedzi na akcje użytkownika.
  - **Zwraca**: Obiekt ze stanem (`viewState`) i handlerami (`handlers`), które zostaną przekazane do komponentów podrzędnych.

- **`useAudioPlayer` (Globalny Hook/Context)**:
  - **Cel**: Zapewnienie, że w danym momencie odtwarzany jest tylko jeden podgląd audio.
  - **Stan**: Przechowuje referencję do aktualnie odtwarzanego `HTMLAudioElement` i jego `preview_url`.
  - **Działanie**: Gdy wywoływana jest funkcja `play(newUrl)`, hook najpierw zatrzymuje poprzedni dźwięk, a następnie uruchamia nowy. Będzie dostarczany przez React Context API na poziomie `DiscoverView`.

## 7. Integracja API

Widok będzie komunikował się z czterema głównymi endpointami:

1.  **`GET /api/library`**

    - **Akcja**: Wywoływany przy załadowaniu widoku w celu pobrania biblioteki użytkownika.
    - **Typy**: Odpowiedź: `LibraryResponseDTO`.
    - **Obsługa**: Wyniki zasilają `TrackSelector`. W przypadku pustej biblioteki, uruchamiany jest modal `EmptyLibraryModal`.

2.  **`POST /api/spotify/recommendations`**

    - **Akcja**: Wywoływany po kliknięciu przycisku "Generate Recommendations".
    - **Typy**: Żądanie: `AIRecommendationsCommand`, Odpowiedź: `AIRecommendationsResponseDTO`.
    - **Obsługa**: Wyniki zasilają `RecommendationsList`.

3.  **`POST /api/library`**

    - **Akcja**: Wywoływany po kliknięciu przycisku "Add to Library" na karcie rekomendacji.
    - **Typy**: Żądanie: `AddTrackToLibraryCommand`.
    - **Obsługa**: Po pomyślnym dodaniu, stan karty jest aktualizowany na "added", a użytkownik otrzymuje powiadomienie (toast).

4.  **`POST /api/blocked-tracks`**
    - **Akcja**: Wywoływany po wybraniu opcji blokady na karcie rekomendacji.
    - **Typy**: Żądanie: `BlockTrackCommand`.
    - **Obsługa**: Po pomyślnym zablokowaniu, stan karty jest aktualizowany na "blocked", a użytkownik otrzymuje powiadomienie.

## 8. Interakcje użytkownika

- **Wybór utworu bazowego**: Użytkownik wybiera utwór z `TrackSelector`, co aktualizuje stan formularza.
- **Opis preferencji**: Użytkownik wpisuje tekst w `Textarea`, co aktualizuje stan i jest walidowane na bieżąco.
- **Ustawienie temperatury**: Użytkownik przesuwa `TemperatureSlider`, co aktualizuje stan.
- **Generowanie rekomendacji**: Użytkownik klika "Generate", co dezaktywuje formularz i uruchamia proces pobierania rekomendacji.
- **Odtwarzanie podglądu**: Użytkownik klika "Play" na `AudioPlayer`, co uruchamia odtwarzanie i pauzuje inne podglądy.
- **Dodawanie/blokowanie**: Użytkownik używa przycisków na `RecommendationCard` do zarządzania rekomendacjami, co wywołuje odpowiednie API i aktualizuje UI.
- **Wyświetlanie szczegółów**: Użytkownik klika "Details", co otwiera modal z `ai_reasoning` i `artist_bio`.

## 9. Warunki i walidacja

- **Przycisk "Generate Recommendations"**:
  - **Warunek**: Aktywny tylko, gdy:
    1. Wybrano utwór bazowy (`base_track_id` nie jest pusty).
    2. Opis preferencji ma co najmniej 30 znaków (`description.length >= 30`).
  - **Komponenty**: `RecommendationForm`, `Button`.
  - **Stan UI**: Przycisk ma atrybut `disabled`, jeśli warunki nie są spełnione.
- **Textarea opisu**:
  - **Warunek**: Musi zawierać co najmniej 30 znaków.
  - **Komponent**: `Textarea`.
  - **Stan UI**: Pod polem tekstowym wyświetlany jest licznik znaków i komunikat o błędzie walidacji, jeśli tekst jest za krótki.

## 10. Obsługa błędów

- **Błąd pobierania biblioteki**: Zamiast formularza wyświetlany jest komunikat o błędzie z przyciskiem "Spróbuj ponownie".
- **Pusta biblioteka**: Otwierany jest modal `EmptyLibraryModal`, który prowadzi użytkownika przez proces dodania pierwszego utworu.
- **Błąd generowania rekomendacji**: W miejscu listy rekomendacji wyświetlany jest komponent błędu zawierający informację o problemie i przycisk "Spróbuj ponownie". Formularz zostaje ponownie włączony.
- **Błąd dodawania/blokowania utworu**: Wyświetlany jest `Toast` z informacją o błędzie, a UI karty wraca do stanu `idle`.
- **Błąd odtwarzania audio**: `AudioPlayer` wyświetla ikonę błędu zamiast przycisku "Play".

## 11. Kroki implementacji

1.  **Struktura plików**: Stworzenie `src/pages/discover.astro` oraz pliku dla komponentu React `src/components/views/DiscoverView.tsx`.
2.  **Komponent `DiscoverView`**: Implementacja głównego komponentu, definicja stanu `DiscoverViewState` i hooka `useDiscoverView`.
3.  **Pobieranie biblioteki**: Implementacja logiki `GET /api/library` przy montowaniu komponentu i obsługa stanu ładowania/błędu/pustej biblioteki.
4.  **Komponent `EmptyLibraryModal`**: Stworzenie modala z komponentem do wyszukiwania i dodawania utworów (`SpotifyTrackSearch`).
5.  **Komponent `RecommendationForm`**: Budowa formularza z komponentów `TrackSelector`, `Textarea`, `TemperatureSlider` i przycisku "Generate". Implementacja logiki walidacji.
6.  **Logika rekomendacji**: Implementacja wywołania `POST /api/spotify/recommendations` i obsługa stanu ładowania/błędu.
7.  **Komponent `RecommendationsList`**: Stworzenie komponentu do wyświetlania listy rekomendacji, w tym stanów zastępczych (ładowanie, pusty, błąd) z użyciem `Skeleton` z Shadcn.
8.  **Komponent `RecommendationCard`**: Implementacja karty dla pojedynczej rekomendacji, w tym jej stanów (`idle`, `adding`, `added` itd.).
9.  **Globalny `AudioPlayer`**: Stworzenie hooka `useAudioPlayer` i `Context.Provider` w `DiscoverView` w celu zarządzania globalnym stanem odtwarzacza.
10. **Akcje na karcie**: Implementacja logiki dla przycisków "Add to Library" i "Block Track", włączając wywołania API i aktualizacje UI.
11. **Modal szczegółów**: Stworzenie `RecommendationDetailsModal` do wyświetlania `ai_reasoning` i `artist_bio`.
12. **Stylowanie i testowanie**: Dopracowanie stylów za pomocą Tailwind CSS, zapewnienie responsywności i przeprowadzenie testów manualnych całego przepływu.
