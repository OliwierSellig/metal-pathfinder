# Specyfikacja Techniczna: Moduł Uwierzytelniania i Zarządzania Sesją

Poniższy dokument opisuje architekturę i implementację modułu uwierzytelniania, autoryzacji i zarządzania sesją w aplikacji MetalPathfinder, zgodnie z historyjkami użytkownika od US-001 do US-006.

---

### 1. Architektura Interfejsu Użytkownika

#### 1.1. Nowe strony Astro

Wprowadzone zostaną cztery nowe strony w `src/pages/`, które będą renderować formularze i obsługiwać logikę autentykacji.

- **`src/pages/login.astro`**: Strona logowania.
  - **Cel**: Umożliwia użytkownikom zalogowanie się za pomocą e-maila i hasła.
  - **Komponent React**: Będzie renderować `<LoginForm client:load />`, który zawiera interaktywny formularz.
  - **Zawartość**: Oprócz formularza, strona będzie zawierać linki do `/register` oraz `/forgot-password`.
- **`src/pages/register.astro`**: Strona rejestracji.
  - **Cel**: Umożliwia nowym użytkownikom założenie konta.
  - **Komponent React**: Będzie renderować `<RegisterForm client:load />`.
  - **Zawartość**: Link do strony logowania `/login`.
- **`src/pages/forgot-password.astro`**: Strona odzyskiwania hasła.
  - **Cel**: Pozwala użytkownikom zainicjować proces resetowania hasła.
  - **Komponent React**: Będzie renderować `<ForgotPasswordForm client:load />`.
- **`src/pages/update-password.astro`**: Strona aktualizacji hasła.
  - **Cel**: Umożliwia użytkownikom ustawienie nowego hasła po kliknięciu w link z e-maila.
  - **Komponent React**: Będzie renderować `<UpdatePasswordForm client:load />`.

#### 1.2. Nowe komponenty React (Client-Side)

Komponenty zostaną umieszczone w `src/components/auth/`.

- **`<AuthFormContainer />`**: Wrapper dla formularzy autentykacji, zapewniający spójny wygląd (nagłówek, tło, layout).
- **`<LoginForm />`**:
  - **Odpowiedzialność**: Zarządza stanem formularza logowania (e-mail, hasło), walidacją pól i komunikacją z API.
  - **Pola**: `email`, `password`.
  - **Walidacja**: Sprawdza, czy pola nie są puste. Format e-mail jest walidowany po stronie klienta.
  - **Komunikaty**: Wyświetla błędy walidacji pod polami oraz globalne komunikaty o błędach logowania (np. "Nieprawidłowy e-mail lub hasło") za pomocą komponentu `Sonner`.
  - **Akcja**: Po pomyślnym zalogowaniu, nawiguje do `/discover`.
- **`<RegisterForm />`**:
  - **Odpowiedzialność**: Zarządza stanem formularza rejestracji.
  - **Pola**: `email`, `password`, `confirmPassword`.
  - **Walidacja**: Sprawdza poprawność formatu e-maila, minimalną długość hasła (np. 8 znaków) i zgodność haseł.
  - **Komunikaty**: Informuje o błędach (np. "Hasła nie są zgodne", "Adres e-mail jest już zajęty").
  - **Akcja**: Po pomyślnej rejestracji, nawiguje do `/login` z komunikatem o sukcesie.
- **`<ForgotPasswordForm />`**:
  - **Odpowiedzialność**: Obsługuje wysłanie prośby o reset hasła.
  - **Pola**: `email`.
  - **Akcja**: Po wysłaniu formularza, wyświetla komunikat o wysłaniu instrukcji na podany adres e-mail.
- **`<UpdatePasswordForm />`**:
  - **Odpowiedzialność**: Umożliwia wprowadzenie nowego hasła.
  - **Pola**: `password`, `confirmPassword`.
  - **Logika**: Komponent odczyta token z parametrów URL (przekazany przez stronę Astro) i użyje go do aktualizacji hasła.
  - **Akcja**: Po pomyślnej zmianie, nawiguje do `/login` z komunikatem o sukcesie.

#### 1.3. Rozszerzenie istniejących elementów UI

- **Layout (`src/layouts/Layout.astro`)**:
  - **Tryb `non-auth`**: Dla niezalogowanych użytkowników nawigacja w nagłówku będzie ukryta.
  - **Tryb `auth`**: Dla zalogowanych użytkowników w nagłówku pojawi się e-mail użytkownika oraz przycisk "Wyloguj". Logika wylogowania zostanie obsłużona przez dedykowany endpoint API (`/api/auth/logout`).

---

### 2. Logika Backendowa

#### 2.1. Struktura endpointów API

Wszystkie endpointy autentykacji będą zlokalizowane w `src/pages/api/auth/`.

- **`POST /api/auth/login`**:
  - **Cel**: Logowanie użytkownika.
  - **Request Body**: `{ email: string, password: string }`.
  - **Logika**:
    1.  Walidacja danych wejściowych.
    2.  Wywołanie `supabase.auth.signInWithPassword()`.
    3.  W przypadku sukcesu, Supabase automatycznie ustawia odpowiednie ciasteczka sesji. Zwraca status `200 OK`.
    4.  W przypadku błędu, zwraca `401 Unauthorized` z komunikatem.
- **`POST /api/auth/register`**:
  - **Cel**: Rejestracja nowego użytkownika.
  - **Request Body**: `{ email: string, password: string }`.
  - **Logika**:
    1.  Walidacja (format e-mail, siła hasła).
    2.  Wywołanie `supabase.auth.signUp()`.
    3.  Zwraca `201 Created` lub `409 Conflict` (jeśli użytkownik istnieje).
- **`POST /api/auth/logout`**:
  - **Cel**: Wylogowanie użytkownika.
  - **Logika**:
    1.  Wywołanie `supabase.auth.signOut()`.
    2.  Zwraca `200 OK`. Ciasteczka sesji są usuwane przez Supabase.
- **`POST /api/auth/forgot-password`**:
  - **Cel**: Wysłanie linku do resetowania hasła.
  - **Request Body**: `{ email: string }`.
  - **Logika**: Wywołanie `supabase.auth.resetPasswordForEmail()`. Zawsze zwraca `200 OK`, aby nie ujawniać, czy dany e-mail istnieje w bazie.
- **`POST /api/auth/update-password`**:
  - **Cel**: Aktualizacja hasła użytkownika.
  - **Logika**:
    1.  Weryfikacja sesji użytkownika za pomocą `supabase.auth.getUser()`.
    2.  Wywołanie `supabase.auth.updateUser()` z nowym hasłem.
    3.  Zwraca `200 OK` lub `400 Bad Request`.

#### 2.2. Walidacja i obsługa błędów

- **Walidacja**: Do walidacji danych wejściowych (e-mail, hasło) w endpointach API zostanie użyta biblioteka `zod`.
- **Obsługa wyjątków**: Błędy zwracane przez Supabase Auth (np. `Invalid login credentials`, `User already registered`) będą mapowane na odpowiednie statusy HTTP (`401`, `409`) i komunikaty JSON, zgodne ze standardem opisanym w `@supabase-api-plan.md`.

#### 2.3. Renderowanie stron

Plik `astro.config.mjs` nie wymaga modyfikacji w kontekście autentykacji. Strony publiczne (`/login`, `/register` etc.) będą renderowane statycznie, a interakcje będą obsługiwane po stronie klienta przez komponenty React. Strony chronione (`/discover`, `/library`) pozostaną renderowane po stronie serwera (`output: 'server'`), co umożliwi działanie middleware.

---

### 3. System Autentykacji (Integracja z Supabase Auth)

#### 3.1. Middleware (`src/middleware/index.ts`)

Centralnym elementem ochrony tras będzie middleware Astro.

- **Logika**:
  1.  Dla każdej przychodzącej prośby do chronionych ścieżek (`/discover`, `/library`, `/blocked-tracks`), middleware sprawdzi obecność i ważność sesji użytkownika.
  2.  Supabase SDK (po stronie serwera) automatycznie odczyta token z ciasteczek i zweryfikuje go.
  3.  **Jeśli użytkownik jest niezalogowany**: Nastąpi przekierowanie na `/login`.
  4.  **Jeśli użytkownik jest zalogowany i próbuje uzyskać dostęp do `/login` lub `/register`**: Nastąpi przekierowanie na `/discover`.
  5.  Dane zalogowanego użytkownika (ID, e-mail) zostaną dodane do `Astro.locals.user`, aby były dostępne w kontekście renderowania strony.

#### 3.2. Zarządzanie sesją

- **Klient Supabase**: Zarówno po stronie serwera (`supabase.server.ts`), jak i klienta (`supabase.client.ts`), zostanie użyty odpowiedni klient Supabase, który automatycznie zarządza sesją (tokenami i ich odświeżaniem) za pomocą ciasteczek.
- **Wylogowanie**: Kliknięcie przycisku "Wyloguj" wywoła `POST /api/auth/logout`, który zakończy sesję w Supabase, a następnie strona zostanie przeładowana, co spowoduje, że middleware przekieruje użytkownika na `/login`.

#### 3.3. Proces odzyskiwania hasła

1.  Użytkownik na `/forgot-password` podaje e-mail.
2.  Frontend wysyła zapytanie do `POST /api/auth/forgot-password`.
3.  Backend wywołuje `supabase.auth.resetPasswordForEmail()`. Supabase wysyła e-mail z unikalnym linkiem.
4.  Link prowadzi do `https://<twoja-domena>/api/auth/callback?type=recovery&token=<token>`. Ten endpoint jest obsługiwany przez Supabase i po poprawnej weryfikacji tokenu, przekierowuje użytkownika na stronę podaną w konfiguracji Supabase (np. `/update-password`).
5.  Strona `/update-password.astro` renderuje komponent `<UpdatePasswordForm />`, który umożliwia użytkownikowi ustawienie nowego hasła.
