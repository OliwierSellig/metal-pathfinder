# Architektura UI dla MetalPathfinder

## 1. Przegląd struktury UI

MetalPathfinder to responsywna aplikacja webowa zbudowana na Astro 5 + React 19 + TypeScript + Tailwind 4 + Shadcn/ui. Architektura opiera się na czterech głównych widokach połączonych intuicyjną nawigacją, z naciskiem na odkrywanie muzyki metalowej przez AI, efektywne zarządzanie biblioteką i bezproblemowe odtwarzanie audio.

Aplikacja wykorzystuje wieloetapowy onboarding. Wszystkie widoki są zaprojektowane z myślą o dostępności oraz mobile-first approach.

## 2. Lista widoków

### Auth View (`/auth`)

- **Ścieżka**: `/auth`
- **Główny cel**: Umożliwienie bezpiecznej rejestracji i logowania użytkowników przez Supabase Auth
- **Kluczowe informacje**: Formularze logowania/rejestracji, walidacja danych, informacje o błędach autentykacji
- **Kluczowe komponenty**:
  - Formularz logowania z polami email/hasło
  - Formularz rejestracji z walidacją
  - Toggle między logowaniem a rejestracją
  - Error states dla błędów autentykacji
  - Loading states podczas procesu auth
- **UX/Dostępność/Bezpieczeństwo**:
  - Semantic HTML z proper labels
  - ARIA landmarks dla screen readers
  - Bezpieczne przechowywanie JWT w Supabase
  - Real-time walidacja formularza
  - Error recovery z clear messaging

### Discover View (`/discover`)

- **Ścieżka**: `/discover`
- **Główny cel**: Odkrywanie nowych utworów metalowych na podstawie preferencji użytkownika i AI
- **Kluczowe informacje**: Lista utworów z biblioteki, pole opisu preferencji, suwak temperatury, rekomendacje AI z audio preview
- **Kluczowe komponenty**:
  - Track selector (dropdown z utworami z biblioteki użytkownika)
  - Textarea dla opisu preferencji (min 30 znaków, real-time validation)
  - Temperature slider (0.1-1.0, kroki co 0.1, tooltips przy hover)
  - Lista 10 rekomendacji z wbudowanym audio playerem
  - Modal/expandable szczegółów rekomendacji (BIO zespołu + uzasadnienie AI)
  - Empty state z popup do dodania pierwszego utworu
  - Akcje: Dodaj do biblioteki, Blokuj utwór
- **UX/Dostępność/Bezpieczeństwo**:
  - Keyboard navigation dla wszystkich kontrolek
  - ARIA labels dla audio playerów
  - Debounced interactions (300ms)
  - Graceful fallbacks dla błędów API
  - Auto-focus management w modalu

### Library View (`/library`)

- **Ścieżka**: `/library`
- **Główny cel**: Zarządzanie i przeglądanie biblioteki utworów użytkownika
- **Kluczowe informacje**: Lista utworów z biblioteki, metadata utworów, wyszukiwanie, paginacja
- **Kluczowe komponenty**:
  - Minimalistyczne karty utworów (tytuł, artysta, album art, data dodania)
  - Search bar z submit button (tylko utwory z biblioteki)
  - Pagination controls (Previous/Next + wskaźniki pierwszej/ostatniej strony, 20 utworów na stronę)
  - Wbudowany audio player w każdej karcie
  - Modal potwierdzenia usunięcia (szczególnie dla ostatniego utworu)
  - Empty state z call-to-action
- **UX/Dostępność/Bezpieczeństwo**:
  - URL params dla deep linking paginacji
  - Keyboard shortcuts dla nawigacji
  - Optimistic updates z rollback
  - Confirmation dialogs dla destructive actions
  - Focus management przy usuwaniu elementów

### Blocked Tracks View (`/blocked-tracks`)

- **Ścieżka**: `/blocked-tracks`
- **Główny cel**: Zarządzanie utworami zablokowanymi od rekomendacji
- **Kluczowe informacje**: Lista zablokowanych utworów, czas wygaśnięcia blokad, opcje odblokowania
- **Kluczowe komponenty**:
  - Lista zablokowanych utworów (podobny layout do biblioteki)
  - Wyświetlanie pozostałego czasu dla czasowych blokad (1d, 7d)
  - Oznaczenie permanent blocks
  - Akcje odblokowania z konfirmacją
  - Empty state dla braku blokad
- **UX/Dostępność/Bezpieczeństwo**:
  - Real-time countdown dla czasowych blokad
  - Clear visual distinction między typami blokad
  - Accessible time formatting
  - Automatic cleanup expired blocks

## 3. Mapa podróży użytkownika

### Główny przepływ onboardingu:

1. **Wejście na stronę** → Przekierowanie do `/auth` (jeśli niezalogowany)
2. **Autentykacja** (`/auth`) → Rejestracja/logowanie przez Supabase Auth
3. **Pierwsze logowanie** → Przekierowanie do `/discover`
4. **Empty state handling** → Jeśli biblioteka pusta: modal "Dodaj pierwszy utwór" z integracją Spotify search
5. **Normalne użytkowanie** → Wybór utworu bazowego + opis preferencji + generowanie rekomendacji

### Cykliczny przepływ użytkowania:

1. **Discover** → Generowanie rekomendacji AI na podstawie preferencji
2. **Audio preview** → Odsłuchiwanie 30-sek fragmentów (jeden na raz)
3. **Akcje na rekomendacjach**:
   - Dodaj do biblioteki → Optimistic update + sync z API
   - Blokuj utwór → Wybór czasu blokady (1d/7d/permanent)
   - Zobacz szczegóły → Modal z BIO zespołu + uzasadnienie AI
4. **Zarządzanie kolekcją**:
   - `/library` → Przeglądanie, wyszukiwanie, usuwanie utworów
   - `/blocked-tracks` → Zarządzanie blokadami, odblokowanie utworów

### Przepływy pomocnicze:

- **Error recovery** → Graceful fallbacks, retry mechanisms, user-friendly error messages
- **Navigation** → Astro page transitions z preserved state w React islands
- **Audio management** → Global state w React islands zapewniający jeden odtwarzacz na raz

## 4. Układ i struktura nawigacji

### Top Navigation Bar

- **Layout**: Horizontal navigation bar na górze aplikacji
- **Elementy**:
  - Logo/Brand name (po lewej)
  - Navigation links: "Discover" | "Library" | "Blocked Tracks" (centrum)
  - User menu z logout (po prawej)
- **Responsive behavior**:
  - Mobile (320-768px): Hamburger menu z drawer
  - Desktop (768px+): Full horizontal layout
- **Active states**: Visual indication aktywnego widoku
- **Accessibility**: Skip links, keyboard navigation, ARIA roles

### URL Structure & Routing

- **Astro file-based routing** z automatycznym lazy loading stron
- **Struktura plików**:
  - `src/pages/auth.astro` - strona autentykacji
  - `src/pages/discover.astro` - główny widok odkrywania
  - `src/pages/library.astro` - biblioteka z obsługą query params
  - `src/pages/blocked-tracks.astro` - zarządzanie blokadami
- **Deep linking**: Query parameters obsługiwane przez Astro.url.searchParams
- **Route guards**: Astro middleware dla przekierowania niezalogowanych użytkowników
- **React Islands**: Interaktywne komponenty jako client:load lub client:idle

### Modal Navigation

- **Modal dialogs** dla:
  - Szczegóły rekomendacji (BIO + uzasadnienie AI)
  - Potwierdzenie usunięcia z biblioteki
  - Dodanie pierwszego utworu (empty state)
- **Z-index management**: Proper layering dla modali
- **Focus trapping**: Keyboard navigation w obrze modalu
- **ESC key handling**: Zamykanie modalu z przywróceniem focus

## 5. Kluczowe komponenty

### Global Audio Player (`useAudioPlayer`)

- **Funkcjonalność**: Globalny state management zapewniający odtwarzanie tylko jednego utworu jednocześnie
- **Features**: Play/pause, progress bar, auto-stop przy zmianie widoku/modal close
- **Integration**: Wbudowany w track cards w każdym widoku
- **Accessibility**: Keyboard controls, ARIA labels, screen reader announcements

### Temperature Slider (`TemperatureSlider`)

- **Funkcjonalność**: Precyzyjny suwak do wyboru poziomu popularności rekomendacji
- **Range**: 0.1 - 1.0 z krokami co 0.1
- **UI**: Tooltips przy hover/drag, oznaczenia "Popular" (0.1) i "Niche" (1.0)
- **Integration**: Real-time preview wartości, walidacja zakresu

### Track Card (`TrackCard`)

- **Użycie**: Uniwersalny komponent dla wszystkich list utworów
- **Variants**: Library card (z delete action), Recommendation card (z add/block actions), Blocked card (z unblock action)
- **Features**: Audio player, metadata display, responsive layout
- **Accessibility**: Semantic structure, keyboard interactions

### Pagination Component (`Pagination`)

- **Funkcjonalność**: Previous/Next buttons + wskaźniki pierwszej/ostatniej strony
- **Integration**: URL params z Astro.url.searchParams, React Query cache dla stanu
- **UI**: Disabled states, loading indicators, responsive hiding
- **Performance**: Virtualization dla dużych list (jeśli potrzebne)

### Modal System (`Modal`, `Dialog`)

- **Komponenty**: Reusable modal wrapper z Shadcn/ui Dialog
- **Features**: Focus management, ESC handling, backdrop click close
- **Variants**: Confirmation modal, Details modal, Add track modal
- **Animations**: Smooth enter/exit z Framer Motion

### Error Boundary System (`ErrorBoundary`)

- **Hierarchia**: Network/API failures → Error boundaries, Validation → Toast notifications
- **Recovery**: Retry mechanisms, fallback UI, graceful degradation
- **Logging**: Error tracking bez exposed sensitive data
- **UX**: User-friendly messaging z clear action steps

### Empty State Components (`EmptyState`)

- **Variants**: Empty library, No search results, No blocked tracks, No recommendations
- **Features**: Illustrations, call-to-action buttons, helpful messaging
- **Integration**: Context-aware actions (np. "Add first track" popup)

### Loading System (`LoadingSkeleton`, `Spinner`)

- **Skeleton screens**: Dopasowane do final layout każdego widoku
- **Spinners**: Dla długotrwałych operacji (AI generation)
- **Progress indicators**: Real-time feedback dla user actions
- **Accessibility**: ARIA live regions, screen reader announcements
