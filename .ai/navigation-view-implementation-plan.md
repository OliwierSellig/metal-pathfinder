# Plan implementacji widoku Navigation

## 1. Przegląd

Górna nawigacja (Top Navigation Bar) to kluczowy komponent aplikacji MetalPathfinder, który zapewnia użytkownikom intuicyjny dostęp do głównych sekcji aplikacji oraz zarządzanie sesją użytkownika. Nawigacja musi być w pełni responsywna (od 320px), dostępna i bezpieczna, umożliwiając płynne przełączanie między widokami Discover, Library i Blocked Tracks oraz bezpieczne wylogowanie użytkownika.

## 2. Routing widoku

Komponent nawigacji nie ma dedykowanej ścieżki - jest globalnym komponentem renderowanym na każdej chronionej stronie aplikacji:

- `/discover` - strona główna dla zalogowanych użytkowników
- `/library` - biblioteka utworów użytkownika
- `/blocked-tracks` - zarządzanie zablokowanymi utworami

Nawigacja NIE jest wyświetlana na stronach publicznych:

- `/login`, `/register`, `/forgot-password`, `/update-password`

## 3. Struktura komponentów

```
Navigation
├── Logo
├── NavigationDesktop (ukryty na mobile)
│   ├── NavigationLinks
│   │   ├── NavigationLink (Discover)
│   │   ├── NavigationLink (Library)
│   │   └── NavigationLink (Blocked Tracks)
│   └── UserMenu
│       ├── UserEmail
│       └── LogoutButton
└── NavigationMobile (ukryty na desktop)
    ├── HamburgerButton
    └── NavigationDrawer
        ├── NavigationLinks
        │   ├── NavigationLink (Discover)
        │   ├── NavigationLink (Library)
        │   └── NavigationLink (Blocked Tracks)
        └── UserMenu
            ├── UserEmail
            └── LogoutButton
```

## 4. Szczegóły komponentów

### Navigation

- **Opis**: Główny kontener nawigacji odpowiedzialny za renderowanie odpowiedniej wersji (desktop/mobile) na podstawie breakpointów
- **Główne elementy**: `<nav>` z ARIA landmarks, Logo, NavigationDesktop/Mobile
- **Obsługiwane interakcje**: Responsive switching między wersjami desktop/mobile
- **Obsługiwana walidacja**: Sprawdzenie stanu autentykacji użytkownika
- **Typy**: `NavigationProps`, `User`
- **Propsy**: `user: User`, `currentPath: string`

### Logo

- **Opis**: Komponent wyświetlający logo/brand aplikacji MetalPathfinder z linkiem do strony głównej
- **Główne elementy**: `<a>` lub `<Link>` z obrazem/tekstem logo
- **Obsługiwane interakcje**: Kliknięcie prowadzi do `/discover`
- **Obsługiwana walidacja**: Brak specjalnych walidacji
- **Typy**: Brak dodatkowych typów
- **Propsy**: Brak

### NavigationDesktop

- **Opis**: Wersja nawigacji dla ekranów desktop (768px+) z pełnym poziomym layoutem
- **Główne elementy**: `<div>` z flex layout, NavigationLinks, UserMenu
- **Obsługiwane interakcje**: Hover states na linkach i menu użytkownika
- **Obsługiwana walidacja**: Sprawdzenie aktywnego linku na podstawie currentPath
- **Typy**: `NavigationItem[]`, `User`
- **Propsy**: `navigationItems: NavigationItem[]`, `user: User`, `currentPath: string`

### NavigationMobile

- **Opis**: Wersja nawigacji dla urządzeń mobilnych (320-767px) z hamburger menu i drawer
- **Główne elementy**: HamburgerButton, NavigationDrawer (overlay)
- **Obsługiwane interakcje**: Toggle drawer, zamykanie przez ESC/backdrop click
- **Obsługiwana walidacja**: Zarządzanie stanem otwartego menu
- **Typy**: `NavigationItem[]`, `User`
- **Propsy**: `navigationItems: NavigationItem[]`, `user: User`, `currentPath: string`, `isOpen: boolean`, `onToggle: () => void`

### HamburgerButton

- **Opis**: Przycisk hamburger menu z animowaną ikoną (3 linie → X)
- **Główne elementy**: `<button>` z animowanymi SVG/CSS lines
- **Obsługiwane interakcje**: Click toggle, keyboard activation (Space/Enter)
- **Obsługiwana walidacja**: Aria-expanded state dla screen readers
- **Typy**: Brak dodatkowych typów
- **Propsy**: `isOpen: boolean`, `onClick: () => void`, `ariaLabel?: string`

### NavigationDrawer

- **Opis**: Overlay drawer dla mobile zawierający nawigację i user menu
- **Główne elementy**: Overlay backdrop, drawer container, NavigationLinks, UserMenu
- **Obsługiwane interakcje**: Swipe-to-close, ESC key, backdrop click
- **Obsługiwana walidacja**: Focus trapping w otwartym drawer
- **Typy**: `NavigationItem[]`, `User`
- **Propsy**: `isOpen: boolean`, `onClose: () => void`, `children: ReactNode`

### NavigationLink

- **Opis**: Reużywalny komponent linku nawigacyjnego z active state
- **Główne elementy**: `<a>` lub Astro `<a>` z conditional active styling
- **Obsługiwane interakcje**: Click navigation, hover states, focus management
- **Obsługiwana walidacja**: Aktywny stan na podstawie currentPath matching
- **Typy**: `NavigationItem`
- **Propsy**: `item: NavigationItem`, `isActive: boolean`, `onClick?: () => void`

### UserMenu

- **Opis**: Menu użytkownika wyświetlające email i przycisk wylogowania
- **Główne elementy**: User email display, LogoutButton
- **Obsługiwane interakcje**: Dropdown (desktop) lub inline (mobile)
- **Obsługiwana walidacja**: Sprawdzenie czy user jest zalogowany
- **Typy**: `User`
- **Propsy**: `user: User`, `onLogout: () => Promise<void>`

### LogoutButton

- **Opis**: Przycisk wylogowania z loading state i error handling
- **Główne elementy**: `<button>` z loading spinner i tekstem
- **Obsługiwane interakcje**: Click logout, loading state podczas API call
- **Obsługiwana walidacja**: Disabled state podczas loading, potwierdzenie akcji
- **Typy**: Brak dodatkowych typów
- **Propsy**: `onLogout: () => Promise<void>`, `isLoading?: boolean`

## 5. Typy

```typescript
// Typ użytkownika z SupaBase Auth
interface User {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Definicja elementu nawigacji
interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: string; // opcjonalna ikona
  ariaLabel?: string;
}

// Propsy głównego komponentu nawigacji
interface NavigationProps {
  user: User;
  currentPath: string;
}

// Response z API wylogowania
interface LogoutResponse {
  success: boolean;
  message?: string;
}

// Error type dla obsługi błędów wylogowania
interface LogoutError {
  message: string;
  code?: string;
}

// State hook dla nawigacji mobile
interface UseNavigationMobileState {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
}
```

## 6. Zarządzanie stanem

### Hook useAuth

Zarządza stanem autentykacji użytkownika:

```typescript
interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  error: string | null;
}
```

### Hook useNavigationMobile

Zarządza stanem mobilnego menu:

```typescript
interface UseNavigationMobileReturn {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
}
```

Stan globalny nie jest wymagany - komponenty komunikują się przez props i local state. React Context może być użyty dla user state jeśli potrzebny w wielu miejscach.

## 7. Integracja API

### Endpoint wylogowania

- **Metoda**: `POST /api/auth/logout`
- **Typ żądania**: Brak body (użycie cookies/headers dla sesji)
- **Typ odpowiedzi**: `LogoutResponse`
- **Headers**: `Content-Type: application/json`

```typescript
// Request - brak body, autentykacja przez session cookie
const logoutUser = async (): Promise<LogoutResponse> => {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include", // ważne dla cookies
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Logout failed");
  }

  return response.json();
};
```

## 8. Interakcje użytkownika

### Desktop

1. **Hover na linku nawigacji**: Efekt hover (background color change)
2. **Kliknięcie linku**: Nawigacja do odpowiedniej strony z active state
3. **Hover na UserMenu**: Opcjonalny dropdown effect
4. **Kliknięcie Logout**: Wywołanie API logout → loading state → przekierowanie

### Mobile

1. **Kliknięcie hamburger**: Otwarcie drawer z animacją slide-in
2. **Kliknięcie backdrop**: Zamknięcie drawer
3. **ESC key**: Zamknięcie drawer
4. **Kliknięcie linku w drawer**: Nawigacja + automatyczne zamknięcie drawer
5. **Swipe gesture**: Opcjonalne zamknięcie drawer gestem

### Keyboard Navigation

1. **Tab navigation**: Przechodzenie przez wszystkie interaktywne elementy
2. **Enter/Space**: Aktywacja przycisków i linków
3. **ESC**: Zamknięcie mobile drawer
4. **Arrow keys**: Opcjonalna nawigacja w menu

## 9. Warunki i walidacja

### Warunki wyświetlania

- **Nawigacja widoczna**: Tylko gdy user jest zalogowany (`user !== null`)
- **Active link**: `currentPath` matches `NavigationItem.href`
- **Mobile menu**: Widoczny tylko na breakpoint < 768px
- **Desktop menu**: Widoczny tylko na breakpoint >= 768px

### Walidacja stanu

- **User authentication**: Sprawdzenie czy `user.id` istnieje
- **Current path**: Walidacja czy `currentPath` jest valid URL
- **Menu state**: Boolean validation dla `isMenuOpen`

### Walidacja API

- **Logout response**: Sprawdzenie `response.ok` i `success: true`
- **Network errors**: Obsługa timeout i connection errors
- **Session validation**: Sprawdzenie czy sesja jest aktywna przed logout

## 10. Obsługa błędów

### Błędy wylogowania

- **Network error**: Toast notification "Brak połączenia z internetem"
- **Server error (5xx)**: Toast "Błąd serwera, spróbuj ponownie"
- **Timeout**: Toast "Przekroczono czas oczekiwania"
- **Unknown error**: Toast "Wystąpił nieoczekiwany błąd"

### Błędy nawigacji

- **Invalid user state**: Przekierowanie na `/login`
- **Invalid path**: Fallback do `/discover`
- **Component render error**: Error boundary z fallback UI

### Błędy mobile menu

- **Focus trap failure**: Graceful degradation bez focus trap
- **Animation error**: Instant show/hide fallback

### Recovery mechanisms

- **Retry button**: W przypadku błędu logout
- **Auto-refresh**: Sprawdzenie stanu autentykacji po błędzie
- **Graceful degradation**: Podstawowa funkcjonalność bez zaawansowanych features

## 11. Kroki implementacji

1. **Przygotowanie struktury**

   - Utworzenie folderów `src/components/navigation/`
   - Definicja typów w `src/types.ts`
   - Konfiguracja breakpointów w Tailwind

2. **Implementacja podstawowych komponentów**

   - `Logo.tsx` - prosty komponent z linkiem
   - `NavigationLink.tsx` - reużywalny link z active state
   - `LogoutButton.tsx` - przycisk z loading state

3. **Hook useAuth**

   - Integracja z SupaBase Auth
   - Funkcja logout wywołująca API
   - Error handling i loading states

4. **Hook useNavigationMobile**

   - useState dla menu state
   - useEffect dla ESC key handling
   - useEffect dla body scroll lock

5. **NavigationDesktop komponent**

   - Layout flex z justify-between
   - Integracja NavigationLink i UserMenu
   - Responsive hiding (hidden md:flex)

6. **NavigationMobile komponenty**

   - HamburgerButton z animowaną ikoną
   - NavigationDrawer z backdrop i slide animation
   - Focus trapping i accessibility

7. **Główny komponent Navigation**

   - Conditional rendering desktop/mobile
   - Integration z useAuth hook
   - currentPath detection (Astro.url.pathname)

8. **API endpoint implementacja**

   - `src/pages/api/auth/logout.ts`
   - SupaBase Auth signOut
   - Cookie clearing i response

9. **Stylowanie i animacje**

   - Tailwind classes dla responsive design
   - CSS transitions dla hover states
   - Mobile drawer animations

10. **Testing i accessibility**

    - Keyboard navigation testing
    - Screen reader testing
    - Responsive testing na różnych urządzeniach
    - Error scenarios testing

11. **Integracja z layout**

    - Dodanie Navigation do `Layout.astro`
    - Conditional rendering na chronionych stronach
    - Middleware integration dla protected routes

12. **Optymalizacja i polish**
    - Performance optimization
    - Animation polish
    - Error message refinement
    - Accessibility improvements
