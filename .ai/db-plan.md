# MetalPathfinder - Schemat Bazy Danych PostgreSQL

## 1. Tabele

Tabela users jest w pełni obsługiwana przez Supabase Auth

### user_library

Tabela przechowująca bibliotekę utworów użytkownika z relacją many-to-many między użytkownikami a utworami Spotify.

```sql
CREATE TABLE user_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    spotify_track_id VARCHAR(22) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_user_track UNIQUE (user_id, spotify_track_id)
);
```

**Kolumny:**

- `id` - UUID, klucz główny (używany tylko wewnętrznie, nie eksponowany w API)
- `user_id` - UUID, referencja do Supabase Auth, CASCADE DELETE
- `spotify_track_id` - VARCHAR(22), identyfikator utworu w Spotify (klucz biznesowy w API)
- `created_at` - TIMESTAMPTZ, data dodania utworu do biblioteki

**Ograniczenia:**

- UNIQUE constraint na (user_id, spotify_track_id) zapobiega duplikatom
- NOT NULL dla wszystkich kolumn oprócz id

### blocked_tracks

Tabela przechowująca utwory zablokowane przez użytkownika z mechanizmem czasowym i permanentnym.

```sql
CREATE TABLE blocked_tracks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    spotify_track_id VARCHAR(22) NOT NULL,
    expires_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_user_blocked_track UNIQUE (user_id, spotify_track_id),
    CONSTRAINT valid_expiry_date CHECK (expires_at IS NULL OR expires_at > created_at)
);
```

**Kolumny:**

- `id` - UUID, klucz główny (używany tylko wewnętrznie, nie eksponowany w API)
- `user_id` - UUID, referencja do Supabase Auth, CASCADE DELETE
- `spotify_track_id` - VARCHAR(22), identyfikator zablokowanego utworu (klucz biznesowy w API)
- `expires_at` - TIMESTAMPTZ, data wygaśnięcia blokady (NULL = permanentna)
- `created_at` - TIMESTAMPTZ, data utworzenia blokady

**Ograniczenia:**

- UNIQUE constraint na (user_id, spotify_track_id) zapobiega duplikatom blokad
- CHECK constraint zapewnia, że data wygaśnięcia jest późniejsza niż data utworzenia

## 2. Relacje między tabelami

### user_library → auth.users

- **Typ:** Many-to-One
- **Foreign Key:** user_id → auth.users(id)
- **Akcja:** CASCADE DELETE (usunięcie użytkownika usuwa jego bibliotekę)

### blocked_tracks → auth.users

- **Typ:** Many-to-One
- **Foreign Key:** user_id → auth.users(id)
- **Akcja:** CASCADE DELETE (usunięcie użytkownika usuwa jego blokady)

## 3. Indeksy

```sql
-- Indeks dla efektywnego wyszukiwania biblioteki użytkownika
CREATE INDEX idx_user_library_user_id_created_at ON user_library(user_id, created_at DESC);

-- Indeks dla efektywnego wyszukiwania blokad użytkownika
CREATE INDEX idx_blocked_tracks_user_id ON blocked_tracks(user_id);

-- Indeks dla efektywnego czyszczenia wygasłych blokad
CREATE INDEX idx_blocked_tracks_expires_at ON blocked_tracks(expires_at) WHERE expires_at IS NOT NULL;

-- Indeks dla sprawdzania czy utwór jest zablokowany
CREATE INDEX idx_blocked_tracks_user_spotify ON blocked_tracks(user_id, spotify_track_id);
```

## 4. Zasady Row Level Security (RLS)

```sql
-- Włączenie RLS dla user_library
ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;

-- Policy dla user_library - użytkownicy widzą tylko swoją bibliotekę
CREATE POLICY "Users can only access their own library" ON user_library
    FOR ALL USING (auth.uid() = user_id);

-- Włączenie RLS dla blocked_tracks
ALTER TABLE blocked_tracks ENABLE ROW LEVEL SECURITY;

-- Policy dla blocked_tracks - użytkownicy widzą tylko swoje blokady
CREATE POLICY "Users can only access their own blocked tracks" ON blocked_tracks
    FOR ALL USING (auth.uid() = user_id);
```

## 5. Automatyczne czyszczenie wygasłych blokad

### Funkcja czyszcząca

```sql
CREATE OR REPLACE FUNCTION cleanup_expired_blocks()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM blocked_tracks
    WHERE expires_at IS NOT NULL
    AND expires_at <= now();

    RAISE NOTICE 'Cleaned up expired blocks at %', now();
END;
$$;
```

### Harmonogram czyszczenia (używając pg_cron extension)

```sql
-- Uruchomienie funkcji codziennie o północy
SELECT cron.schedule('cleanup-expired-blocks', '0 0 * * *', 'SELECT cleanup_expired_blocks();');
```

**Alternatywnie** (jeśli pg_cron nie jest dostępne):

```sql
-- Funkcja trigger do czyszczenia przy każdym INSERT/UPDATE
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_blocks()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Czyszczenie tylko jeśli ostatnie czyszczenie było więcej niż 24h temu
    IF NOT EXISTS (
        SELECT 1 FROM blocked_tracks
        WHERE expires_at IS NOT NULL
        AND expires_at <= now() - INTERVAL '24 hours'
    ) THEN
        DELETE FROM blocked_tracks
        WHERE expires_at IS NOT NULL
        AND expires_at <= now();
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_cleanup_on_blocked_tracks_insert
    AFTER INSERT ON blocked_tracks
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_cleanup_expired_blocks();
```

## 6. Dodatkowe uwagi projektowe

### Spotify Track ID

- Używamy VARCHAR(22) zgodnie ze standardem Spotify Track ID
- Wszystkie metadane utworów (tytuł, artysta, etc.) pobierane są real-time z Spotify API
- Nie przechowujemy duplikatów metadanych w bazie

### Klucze API vs Klucze Bazy Danych

- **Klucze bazy danych (`id`)**: UUID używane wewnętrznie dla integralności referencyjnej
- **Klucze API (`spotify_track_id`)**: Naturalne klucze biznesowe eksponowane w API
- API używa `spotify_track_id` jako identyfikatora zasobów, nie UUID bazy danych
- Upraszcza to API - klienci operują na identyfikatorach Spotify, które już znają

### Minimalistyczne podejście

- Brak przechowywania historii rekomendacji
- Brak cache'owania odpowiedzi AI
- Brak tabeli users - korzystamy z Supabase Auth
- Brak soft delete - fizyczne usuwanie danych

### Zabezpieczenia

- Row Level Security zapewnia izolację danych między użytkownikami
- CASCADE DELETE automatycznie czyści dane usuniętych użytkowników
- CHECK constraints zapewniają integralność danych

### Reguły biznesowe

- **Library-Block Conflict Prevention**:
  - Użytkownik nie może zablokować utworu, który już istnieje w jego bibliotece
  - Użytkownik nie może dodać do biblioteki utworu, który jest aktualnie zablokowany
- **Last Track Protection**: Użytkownik nie może usunąć ostatniego utworu ze swojej biblioteki
- **Duplicate Prevention**: Automatyczne zapobieganie duplikatom w obu tabelach przez UNIQUE constraints
- **Active Block Detection**: Blokady są aktywne gdy `expires_at` jest NULL (permanent) lub > NOW()

### Wydajność

- Indeksy zoptymalizowane pod najpopularniejsze zapytania
- Automatyczne czyszczenie wygasłych blokad zapobiega rozrostowi tabeli
- Minimalna liczba tabel ogranicza złożoność JOIN-ów
