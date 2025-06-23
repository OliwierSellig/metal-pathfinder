# Dokument wymagań produktu (PRD) - MetalPathfinder

## 1. Przegląd produktu

MetalPathfinder to webowy MVP umożliwiający entuzjastom metalu odkrywanie nowych utworów poprzez opisanie tego, co cenią w wybranym kawałku ze swojej biblioteki. System integruje się ze Spotify w celu uwierzytelniania i odtwarzania podglądów audio oraz wykorzystuje OpenAI API do generowania spersonalizowanych rekomendacji. Aplikacja działa wyłącznie online, zapewnia responsywność od 320 px szerokości wzwyż, przechowuje dane w Firebase lub SupaBase i jest projektem edukacyjnym, oferującym wszystkie funkcje bezpłatnie.

Cele:
• Dostarczyć funkcjonalny prototyp, który zweryfikuje koncepcję odkrywania muzyki metalowej.
• Utrzymać minimalny zakres przy jednoczesnym dostarczeniu realnej wartości użytkownikom.
• Zapewnić stabilne, szybkie i przyjazne doświadczenie na desktopie i mobile.

Interesariusze: słuchacze metalu, zespół produktowy, deweloperzy.

## 2. Problem użytkownika

Słuchacze metalu mają trudność z wychodzeniem poza swoją strefę komfortu; istniejące narzędzia odkrywania muzyki pomijają niuanse gatunku i nie pozwalają na dokładne opisanie preferencji. Użytkownicy potrzebują możliwości:
• Precyzyjnego wyrażenia, co podoba im się w utworze (riff, atmosfera, wokal).
• Otrzymania świeżych rekomendacji adekwatnych do sub-gatunków metalu, balansujących popularność i niszę.
• Zapisywania ulubionych utworów i blokowania tych, które im się nie podobają.

## 3. Wymagania funkcjonalne

A. Autentykacja i onboarding
• Rejestracja i logowanie przez SupaBase Auth (email/hasło).
• Wybór co najmniej jednego utworu metalowego do biblioteki początkowej przez wyszukiwanie w katalogu Spotify.

B. Moduł odkrywania
• Lista utworów z biblioteki do wyboru, wybór jednego utworu z biblioteki.
• Pole tekstowe (min. 30 znaków) do opisu preferencji.
• Suwak temperatury (Popularne ↔ Niszowe) przekazywany do AI.
• Generowanie 10 rekomendacji spoza biblioteki.
• Wyświetlanie uzasadnienia wyboru i 30-sek. podglądu ze Spotify.
• Prezentacja 5-zdaniowego BIO zespołu dla każdej rekomendacji.

C. Zarządzanie biblioteką i rekomendacjami
• Dodawanie rekomendowanych utworów do biblioteki jednym kliknięciem.
• Blokowanie utworów na 1 dzień / 7 dni / na zawsze.
• Zapobieganie ponownemu polecaniu zablokowanych utworów w aktywnym okresie.
• Przegląd biblioteki w formie listy z podstawowymi informacjami.

D. Interfejs użytkownika
• Responsywny layout (320 px+).
• Intuicyjny odtwarzacz fragmentów.
• Jasna nawigacja między Onboarding, Odkrywanie, Biblioteka.
• Placeholdery z przykładami opisów i stany loading.
• Komunikaty błędów dla Spotify, AI i sieci.

E. Warstwa techniczna
• Integracja Spotify API (Client Credentials Flow dla search, audio previews, metadata).
• Integracja OpenAI API (prompt-based recommendations).
• Brak cachowania: każde zapytanie o rekomendacje jest świeże.
• Baza danych online (SupaBase) dla bibliotek, blokad i preferencji użytkowników.
• SupaBase Auth dla autentykacji użytkowników.
• Monitoring błędów i wydajności od pierwszego dnia.

## 4. Granice produktu

Poza zakresem MVP:
• Funkcje społecznościowe (sharing, friends, comments).
• Zaawansowana analityka odsłuchu i ML na historii.
• Integracje inne niż Spotify (Apple Music, Tidal, YouTube Music).
• Pełne odtwarzanie utworów wewnątrz aplikacji.
• Funkcje premium (eksport playlist, backup, rozszerzone blokowanie).
• Tryb offline, synchronizacja lokalnych plików.
• Rozbudowane filtry gatunkowe i statystyki.

## 5. Historyjki użytkowników

### US-001 – Rejestracja i logowanie przez SupaBase

Opis: Jako nowy użytkownik chcę zarejestrować się i zalogować przy użyciu email/hasła, aby móc korzystać z aplikacji i zapisywać swoją bibliotekę.
Kryteria akceptacji:

1. Użytkownik może się zarejestrować podając email i hasło.
2. Użytkownik może się zalogować używając swoich danych.
3. Sesja jest bezpiecznie przechowywana w SupaBase.
4. Niepowodzenie autoryzacji wyświetla komunikat błędu.

### US-002 – Wybór startowych utworów

Opis: Jako nowy użytkownik chcę wybrać co najmniej jeden ulubiony utwór metalowy, aby zbudować swoją początkową bibliotekę.
Kryteria akceptacji:

1. Interfejs wyszukiwania pozwala wskazać utwory z katalogu Spotify.
2. Przycisk „Dalej” jest aktywny dopiero po wyborze ≥1 utworu.
3. Wybrane utwory zapisywane są w bazie.

### US-003 – Wybór utworu bazowego

Opis: Jako użytkownik z kilkoma utworami startowymi chcę wskazać jeden z nich jako bazę dla pierwszej rekomendacji, aby otrzymać trafniejsze wyniki.
Kryteria akceptacji:

1. Po wyborze >1 utworu aplikacja wymusza wybór jednego.
2. Wybrany utwór jest widoczny w widoku odkrywania.

### US-004 – Opis preferencji

Opis: Jako użytkownik chcę opisać tekstowo, co podoba mi się w wybranym utworze, aby AI mogło lepiej zrozumieć moje gusta.
Kryteria akceptacji:

1. Pole tekstowe waliduje min. 30 znaków.
2. Placeholder pokazuje przykładowe opisy.
3. Walidacja w locie informuje o brakującej długości.

### US-005 – Ustawienie temperatury

Opis: Jako użytkownik chcę regulować suwak Popularne↔Niszowe, aby otrzymać odpowiednio znane lub odkrywcze rekomendacje.
Kryteria akceptacji:

1. Suwak ma ciągły zakres 0–1 z opisami skrajnych wartości.
2. Wybrana wartość jest przekazywana do zapytania AI.

### US-006 – Otrzymanie rekomendacji

Opis: Jako użytkownik chcę otrzymać listę 10 nowych utworów, które nie znajdują się w mojej bibliotece, aby poszerzyć horyzonty muzyczne.
Kryteria akceptacji:

1. AI zwraca dokładnie 10 pozycji.
2. Żaden z utworów nie istnieje w bibliotece ani na liście blokad aktywnych.
3. Dla każdego utworu prezentowane są: tytuł, wykonawca, podgląd audio, BIO, uzasadnienie.

### US-007 – Podgląd audio

Opis: Jako użytkownik chcę odsłuchać 30-sek. fragment rekomendowanego utworu bez opuszczania aplikacji.
Kryteria akceptacji:

1. Player odtwarza preview przez Spotify Web API.
2. Odtwarzanie można pauzować i wznawiać.
3. Błąd odtwarzania pokazuje komunikat.

### US-008 – Dodawanie do biblioteki

Opis: Jako użytkownik chcę dodać rekomendowany utwór do mojej biblioteki jednym kliknięciem, aby zapisać go na przyszłość.
Kryteria akceptacji:

1. Kliknięcie „Dodaj” zapisuje utwór w bazie.
2. Utwór znika z listy rekomendacji lub oznacza się jako dodany.
3. Operacja potwierdzona toastem.

### US-009 – Blokowanie utworu

Opis: Jako użytkownik chcę zablokować utwór na 1 dzień, 7 dni lub na zawsze, aby nie był ponownie polecany.
Kryteria akceptacji:

1. Menu blokowania pozwala wybrać zakres czasu.
2. Zablokowany utwór jest natychmiast usuwany z listy.
3. Blokada wygasa automatycznie po czasie (o ile nie na zawsze).

### US-010 – Przegląd biblioteki

Opis: Jako użytkownik chcę przeglądać moją bibliotekę w formie listy, aby zarządzać zapisanymi utworami.
Kryteria akceptacji:

1. Widok listy pokazuje tytuł, artystę i datę dodania.
2. Lista ładuje się z bazy po wejściu.
3. Brak utworów wyświetla stan pusty.

### US-011 – Wyświetlanie BIO zespołu

Opis: Jako użytkownik chcę zobaczyć krótkie (max 5 zdań) BIO zespołu dla rekomendowanego utworu, aby lepiej poznać artystę.
Kryteria akceptacji:

1. BIO generowane jest przez AI na żądanie.
2. Treść nie przekracza 5 zdań.

### US-012 – Uzasadnienie rekomendacji

Opis: Jako użytkownik chcę wiedzieć, dlaczego dany utwór został polecony, aby zrozumieć logikę AI.
Kryteria akceptacji:

1. AI zwraca krótkie wytłumaczenie (1–2 zdania) dla każdego utworu.
2. Uzasadnienie jest wyświetlane pod nazwą utworu.

### US-013 – Responsywny interfejs

Opis: Jako użytkownik mobilny chcę korzystać z aplikacji na ekranie 320 px, aby wygodnie odkrywać muzykę na telefonie.
Kryteria akceptacji:

1. Layout nie wymaga poziomego scrolla na 320 px.
2. Wszystkie elementy są dostępne dotykowo.

### US-014 – Obsługa błędów API

Opis: Jako użytkownik chcę otrzymywać przyjazne komunikaty, gdy Spotify lub OpenAI API jest niedostępne, aby wiedzieć, co się stało.
Kryteria akceptacji:

1. Błędy 4xx/5xx Spotify lub OpenAI API wyświetlają dedykowany stan błędu.
2. Użytkownik może ponowić próbę.

### US-015 – Bezpieczne przechowywanie sesji

Opis: Jako użytkownik chcę, aby moja sesja była bezpiecznie przechowywana i odświeżana, abym nie musiał logować się zbyt często.
Kryteria akceptacji:

1. Sesja użytkownika jest przechowywana bezpiecznie w SupaBase.
2. Token sesji odnawia dostęp automatycznie.
3. Wylogowanie usuwa dane sesji lokalnie i w SupaBase.

### US-016 – Usuwanie utworu z biblioteki

Opis: Jako użytkownik chcę móc usunąć utwór z mojej biblioteki, aby mógł on ponownie pojawić się w rekomendacjach, przy czym nie mogę usunąć ostatniego pozostałego utworu.
Kryteria akceptacji:

1. Każdy utwór w widoku biblioteki posiada akcję „Usuń”.
2. Po potwierdzeniu utwór jest usuwany z bazy danych i ponownie kwalifikuje się do rekomendacji (o ile nie jest zablokowany).
3. Gdy w bibliotece znajduje się tylko 1 utwór, akcja „Usuń” jest nieaktywna lub wyświetla komunikat informujący, że minimum jeden utwór musi pozostać.
4. Operacja zakończona jest komunikatem potwierdzającym (toast/snackbar).

## 6. Metryki sukcesu

Produktowe:
• Engagement: średnio ≥3 sesje odkrywania na użytkownika w tygodniu.
• Konwersja rekomendacji: ≥30 % poleconych utworów dodanych do biblioteki.

Techniczne:
• 99 % udanych wywołań Spotify i OpenAI API (5xx <1 %).
• Czas renderu pierwszej treści ≤2 s na sieci 4G.
• 100 % pokrycia kluczowych ścieżek e2e testami.
• Brak krytycznych błędów UI na urządzeniach od 320 px do desktop.

Lista kontrolna przeglądu:
• Każda historia ma mierzalne kryteria akceptacji i obejmuje uwierzytelnianie.
• Zakres historii pokrywa pełną funkcjonalność MVP.
• Kryteria są jednoznaczne i testowalne automatycznie lub manualnie.
