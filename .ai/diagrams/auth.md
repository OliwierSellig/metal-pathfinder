# Diagram Architektury Autentykacji - MetalPathfinder

## Przepływ Autentykacji w Aplikacji

Poniższy diagram przedstawia kompletny cykl życia procesu autentykacji w aplikacji MetalPathfinder, która wykorzystuje React, Astro i Supabase Auth.

```mermaid
sequenceDiagram
    autonumber

    participant Przeglądarka
    participant Middleware
    participant AstroAPI
    participant SupabaseAuth

    Note over Przeglądarka,SupabaseAuth: Scenariusz 1: Rejestracja nowego użytkownika

    Przeglądarka->>AstroAPI: POST /api/auth/register
    Note right of Przeglądarka: {email, password}
    activate AstroAPI
    AstroAPI->>AstroAPI: Walidacja danych wejściowych
    AstroAPI->>SupabaseAuth: signUp(email, password)
    activate SupabaseAuth

    alt Rejestracja pomyślna
        SupabaseAuth-->>AstroAPI: 201 Created + user data
        deactivate SupabaseAuth
        AstroAPI-->>Przeglądarka: 201 Created
        deactivate AstroAPI
        Przeglądarka->>Przeglądarka: Przekierowanie na /login
        Note right of Przeglądarka: Komunikat o pomyślnej rejestracji
    else Błąd rejestracji
        SupabaseAuth-->>AstroAPI: 409 Conflict
        deactivate SupabaseAuth
        AstroAPI-->>Przeglądarka: 409 "Email już zajęty"
        deactivate AstroAPI
    end

    Note over Przeglądarka,SupabaseAuth: Scenariusz 2: Logowanie użytkownika

    Przeglądarka->>AstroAPI: POST /api/auth/login
    Note right of Przeglądarka: {email, password}
    activate AstroAPI
    AstroAPI->>SupabaseAuth: signInWithPassword(email, password)
    activate SupabaseAuth

    alt Logowanie pomyślne
        SupabaseAuth-->>AstroAPI: 200 OK + JWT token
        Note right of SupabaseAuth: Ustawienie ciasteczek sesji
        deactivate SupabaseAuth
        AstroAPI-->>Przeglądarka: 200 OK
        deactivate AstroAPI
        Przeglądarka->>Przeglądarka: Przekierowanie na /discover
    else Błędne dane logowania
        SupabaseAuth-->>AstroAPI: 401 Unauthorized
        deactivate SupabaseAuth
        AstroAPI-->>Przeglądarka: 401 "Nieprawidłowy email lub hasło"
        deactivate AstroAPI
    end

    Note over Przeglądarka,SupabaseAuth: Scenariusz 3: Dostęp do chronionej strony

    Przeglądarka->>Middleware: GET /discover
    activate Middleware
    Middleware->>SupabaseAuth: Sprawdzenie tokenu z ciasteczek
    activate SupabaseAuth

    alt Token ważny
        SupabaseAuth-->>Middleware: Dane użytkownika
        deactivate SupabaseAuth
        Middleware->>Middleware: Dodanie user do Astro.locals
        Middleware-->>Przeglądarka: Renderowanie strony /discover
        deactivate Middleware
    else Token nieważny lub brak
        SupabaseAuth-->>Middleware: Błąd autentykacji
        deactivate SupabaseAuth
        Middleware-->>Przeglądarka: Przekierowanie na /login
        deactivate Middleware
    end

    Note over Przeglądarka,SupabaseAuth: Scenariusz 4: Dostęp zalogowanego do strony auth

    Przeglądarka->>Middleware: GET /login
    activate Middleware
    Middleware->>SupabaseAuth: Sprawdzenie tokenu
    activate SupabaseAuth
    SupabaseAuth-->>Middleware: Token ważny
    deactivate SupabaseAuth
    Middleware-->>Przeglądarka: Przekierowanie na /discover
    deactivate Middleware
    Note right of Przeglądarka: Zalogowany użytkownik nie może<br/>wejść na stronę logowania

    Note over Przeglądarka,SupabaseAuth: Scenariusz 5: Odzyskiwanie hasła

    Przeglądarka->>AstroAPI: POST /api/auth/forgot-password
    Note right of Przeglądarka: {email}
    activate AstroAPI
    AstroAPI->>SupabaseAuth: resetPasswordForEmail(email)
    activate SupabaseAuth
    SupabaseAuth->>SupabaseAuth: Wysłanie emaila z linkiem
    SupabaseAuth-->>AstroAPI: 200 OK
    deactivate SupabaseAuth
    AstroAPI-->>Przeglądarka: 200 "Email wysłany"
    deactivate AstroAPI

    Note over Przeglądarka,SupabaseAuth: Scenariusz 6: Reset hasła przez email

    Przeglądarka->>SupabaseAuth: GET /api/auth/callback?type=recovery
    Note right of Przeglądarka: Kliknięcie w link z emaila
    activate SupabaseAuth
    SupabaseAuth->>SupabaseAuth: Weryfikacja tokenu recovery

    alt Token ważny
        SupabaseAuth-->>Przeglądarka: Przekierowanie na /update-password
        deactivate SupabaseAuth
        Przeglądarka->>AstroAPI: POST /api/auth/update-password
        Note right of Przeglądarka: {password, confirmPassword}
        activate AstroAPI
        AstroAPI->>SupabaseAuth: updateUser(newPassword)
        activate SupabaseAuth
        SupabaseAuth-->>AstroAPI: 200 OK
        deactivate SupabaseAuth
        AstroAPI-->>Przeglądarka: 200 "Hasło zaktualizowane"
        deactivate AstroAPI
        Przeglądarka->>Przeglądarka: Przekierowanie na /login
    else Token nieważny
        SupabaseAuth-->>Przeglądarka: Błąd weryfikacji
        deactivate SupabaseAuth
    end

    Note over Przeglądarka,SupabaseAuth: Scenariusz 7: Wylogowanie

    Przeglądarka->>AstroAPI: POST /api/auth/logout
    activate AstroAPI
    AstroAPI->>SupabaseAuth: signOut()
    activate SupabaseAuth
    SupabaseAuth->>SupabaseAuth: Usunięcie ciasteczek sesji
    SupabaseAuth-->>AstroAPI: 200 OK
    deactivate SupabaseAuth
    AstroAPI-->>Przeglądarka: 200 OK
    deactivate AstroAPI
    Przeglądarka->>Przeglądarka: Przeładowanie strony
    Przeglądarka->>Middleware: GET current page
    activate Middleware
    Middleware->>SupabaseAuth: Sprawdzenie tokenu
    activate SupabaseAuth
    SupabaseAuth-->>Middleware: Brak tokenu
    deactivate SupabaseAuth
    Middleware-->>Przeglądarka: Przekierowanie na /login
    deactivate Middleware

    Note over Przeglądarka,SupabaseAuth: Scenariusz 8: Odświeżanie tokenu

    loop Podczas aktywnej sesji
        Przeglądarka->>SupabaseAuth: Automatyczne odświeżanie tokenu
        activate SupabaseAuth
        SupabaseAuth->>SupabaseAuth: Sprawdzenie ważności tokenu

        alt Token wygasł
            SupabaseAuth->>SupabaseAuth: Użycie refresh token
            SupabaseAuth-->>Przeglądarka: Nowy access token
            Note right of SupabaseAuth: Aktualizacja ciasteczek
        else Token nadal ważny
            SupabaseAuth-->>Przeglądarka: Token aktualny
        end
        deactivate SupabaseAuth
    end
```

## Opis Architektury

### Główne Komponenty

1. **Przeglądarka** - Obsługuje formularze autentykacji, przechowuje tokeny w ciasteczkach i zarządza przekierowaniami
2. **Middleware** - Centralny punkt kontroli dostępu, weryfikuje tokeny dla chronionych tras
3. **Astro API** - Endpointy autentykacji w `/api/auth/*` obsługujące komunikację z Supabase
4. **Supabase Auth** - Backend autentykacji zarządzający tokenami JWT, sesjami i resetem haseł

### Kluczowe Przepływy

- **Ochrona stron**: Middleware automatycznie sprawdza tokeny i przekierowuje niezalogowanych
- **Zarządzanie sesją**: Supabase SDK automatycznie odświeża tokeny w tle
- **Reset hasła**: Dwuetapowy proces z weryfikacją emailową
- **Bezpieczeństwo**: Row Level Security w bazie danych i weryfikacja tokenów JWT

### Punkty Przekierowań

- Niezalogowani na `/discover`, `/library`, `/blocked-tracks` → `/login`
- Zalogowani na `/login`, `/register` → `/discover`
- Po pomyślnym logowaniu → `/discover`
- Po rejestracji → `/login`
- Po reset hasła → `/login`
