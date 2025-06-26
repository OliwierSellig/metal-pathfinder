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
• Wyświetlanie uzasadnienia wyboru od AI.
• Prezentacja 5-zdaniowego BIO zespołu dla każdej rekomendacji.

C. Zarządzanie biblioteką i rekomendacjami
• Dodawanie rekomendowanych utworów do biblioteki jednym kliknięciem.
• Blokowanie utworów na 1 dzień / 7 dni / na zawsze.
• Zapobieganie ponownemu polecaniu zablokowanych utworów w aktywnym okresie.
• Przegląd biblioteki w formie listy z podstawowymi informacjami.

D. Interfejs użytkownika
• Responsywny layout (320 px+).
• Przejrzyste prezentowanie metadanych utworów.
• Jasna nawigacja między Onboarding, Odkrywanie, Biblioteka.
• Placeholdery z przykładami opisów i stany loading.
• Komunikaty błędów dla Spotify, AI i sieci.

E. Warstwa techniczna
• Integracja Spotify API (Client Credentials Flow dla search i metadata).
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

### US-001 – Rejestracja użytkownika

Opis: Jako nowy użytkownik chcę móc założyć konto w aplikacji, podając swój adres e-mail i hasło, aby uzyskać dostęp do jej funkcjonalności.
Kryteria akceptacji:

1. Istnieje dedykowana strona `/register` z formularzem rejestracyjnym zawierającym pola na e-mail i hasło.
2. Formularz waliduje poprawność formatu e-mail oraz wymagania dotyczące siły hasła (np. minimalna długość).
3. Pomyślna rejestracja tworzy nowego użytkownika w Supabase Auth.
4. Po pomyślnej rejestracji użytkownik jest automatycznie przekierowywany na stronę logowania (`/login`).
5. W przypadku błędu (np. zajęty e-mail) użytkownik otrzymuje czytelny komunikat.

### US-002 – Logowanie użytkownika

Opis: Jako zarejestrowany użytkownik chcę móc zalogować się do aplikacji przy użyciu mojego e-maila i hasła, aby uzyskać dostęp do moich spersonalizowanych danych (biblioteka, blokady).
Kryteria akceptacji:

1. Istnieje dedykowana strona `/login` z formularzem logowania.
2. Formularz zawiera pola na e-mail, hasło oraz linki do stron `/register` i `/forgot-password`.
3. Pomyślne logowanie przekierowuje użytkownika na stronę `/discover`.
4. W przypadku podania błędnych danych logowania, użytkownik otrzymuje czytelny komunikat o błędzie.

### US-003 – Ochrona stron dla niezalogowanych użytkowników

Opis: Jako system chcę zapewnić, że tylko zalogowani użytkownicy mają dostęp do chronionych stron, aby zabezpieczyć dane i spersonalizowane widoki.
Kryteria akceptacji:

1. Próba wejścia na strony `/discover`, `/library` lub `/blocked-tracks` przez niezalogowanego użytkownika skutkuje natychmiastowym przekierowaniem na stronę `/login`.
2. Logika ochrony stron jest zaimplementowana centralnie (np. w middleware Astro).
3. Zalogowany użytkownik, próbujący wejść na `/login` lub `/register`, jest przekierowywany na `/discover`.

### US-004 – Odzyskiwanie zapomnianego hasła

Opis: Jako użytkownik, który zapomniał hasła, chcę mieć możliwość jego zresetowania, aby odzyskać dostęp do mojego konta.
Kryteria akceptacji:

1. Strona `/login` zawiera link do strony odzyskiwania hasła (`/forgot-password`).
2. Na stronie `/forgot-password` znajduje się formularz, w którym użytkownik podaje swój adres e-mail, aby otrzymać instrukcje resetowania.
3. Po wysłaniu formularza, Supabase Auth wysyła na podany e-mail link do zresetowania hasła.
4. Kliknięcie w link z e-maila przenosi użytkownika na dedykowaną stronę `/update-password`, gdzie może on wprowadzić i potwierdzić nowe hasło.
5. Po pomyślnej zmianie hasła, użytkownik jest przekierowywany na stronę logowania (`/login`) z komunikatem o sukcesie.

### US-005 – Zarządzanie sesją użytkownika

Opis: Jako zalogowany użytkownik chcę, aby moja sesja była bezpiecznie zarządzana, abym nie musiał logować się przy każdej wizycie, oraz chcę mieć możliwość wylogowania się w dowolnym momencie.
Kryteria akceptacji:

1. Sesja użytkownika jest trwała, a token dostępowy jest automatycznie odświeżany przez klienta Supabase.
2. W nawigacji aplikacji, w nagłówku, widoczny jest e-mail zalogowanego użytkownika oraz przycisk "Wyloguj".
3. Kliknięcie przycisku "Wyloguj" kończy sesję, usuwa lokalne dane uwierzytelniające i przekierowuje użytkownika na stronę `/login`.

### US-006 – Wybór pierwszego utworu do biblioteki

Opis: Jako zalogowany użytkownik bez utworów w bibliotece chcę zostać zmuszony do wybrania pierwszego utworu metalowego, aby móc korzystać z funkcji odkrywania muzyki.
Kryteria akceptacji:

1. Po zalogowaniu, jeśli użytkownik nie ma żadnego utworu w bibliotece, zostaje przekierowany na stronę `/discover` (jeśli już tam nie jest).
2. Na stronie `/discover` automatycznie otwiera się modal z wyszukiwarką Spotify, którego nie można zamknąć bez wybrania utworu.
3. Modal pozwala wyszukać i wybrać dokładnie jeden utwór ze Spotify (nie więcej, nie mniej).
4. Po wybraniu utworu, modal się zamyka, utwór zostaje zapisany w bibliotece jako pierwszy element.
5. Użytkownik może teraz normalnie korzystać z funkcji odkrywania rekomendacji.

### US-007 – Wybór utworu bazowego

Opis: Jako użytkownik z kilkoma utworami startowymi chcę wskazać jeden z nich jako bazę dla pierwszej rekomendacji, aby otrzymać trafniejsze wyniki.
Kryteria akceptacji:

1. Po wyborze >1 utworu aplikacja wymusza wybór jednego.
2. Wybrany utwór jest widoczny w widoku odkrywania.

### US-008 – Opis preferencji

Opis: Jako użytkownik chcę opisać tekstowo, co podoba mi się w wybranym utworze, aby AI mogło lepiej zrozumieć moje gusta.
Kryteria akceptacji:

1. Pole tekstowe waliduje min. 30 znaków.
2. Placeholder pokazuje przykładowe opisy.
3. Walidacja w locie informuje o brakującej długości.

### US-009 – Ustawienie temperatury

Opis: Jako użytkownik chcę regulować suwak Popularne↔Niszowe, aby otrzymać odpowiednio znane lub odkrywcze rekomendacje.
Kryteria akceptacji:

1. Suwak ma ciągły zakres 0–1 z opisami skrajnych wartości.
2. Wybrana wartość jest przekazywana do zapytania AI.

### US-010 – Otrzymanie rekomendacji

Opis: Jako użytkownik chcę otrzymać listę 10 nowych utworów, które nie znajdują się w mojej bibliotece, aby poszerzyć horyzonty muzyczne.
Kryteria akceptacji:

1. AI zwraca dokładnie 10 pozycji.
2. Żaden z utworów nie istnieje w bibliotece ani na liście blokad aktywnych.
3. Dla każdego utworu prezentowane są: tytuł, wykonawca, BIO, uzasadnienie.

### US-011 – Dodawanie do biblioteki

Opis: Jako użytkownik chcę dodać rekomendowany utwór do mojej biblioteki jednym kliknięciem, aby zapisać go na przyszłość.
Kryteria akceptacji:

1. Kliknięcie "Dodaj" zapisuje utwór w bazie.
2. Utwór znika z listy rekomendacji lub oznacza się jako dodany.
3. Operacja potwierdzona toastem.

### US-012 – Blokowanie utworu

Opis: Jako użytkownik chcę zablokować utwór na 1 dzień, 7 dni lub na zawsze, aby nie był ponownie polecany.
Kryteria akceptacji:

1. Menu blokowania pozwala wybrać zakres czasu.
2. Zablokowany utwór jest natychmiast usuwany z listy.
3. Blokada wygasa automatycznie po czasie (o ile nie na zawsze).

### US-013 – Przegląd biblioteki

Opis: Jako użytkownik chcę przeglądać moją bibliotekę w formie listy, aby zarządzać zapisanymi utworami.
Kryteria akceptacji:

1. Widok listy pokazuje tytuł, artystę i datę dodania.
2. Lista ładuje się z bazy po wejściu.
3. Brak utworów wyświetla stan pusty.

### US-014 – Wyświetlanie BIO zespołu

Opis: Jako użytkownik chcę zobaczyć krótkie (max 5 zdań) BIO zespołu dla rekomendowanego utworu, aby lepiej poznać artystę.
Kryteria akceptacji:

1. BIO generowane jest przez AI na żądanie.
2. Treść nie przekracza 5 zdań.

### US-015 – Uzasadnienie rekomendacji

Opis: Jako użytkownik chcę wiedzieć, dlaczego dany utwór został polecony, aby zrozumieć logikę AI.
Kryteria akceptacji:

1. AI zwraca krótkie wytłumaczenie (1–2 zdania) dla każdego utworu.
2. Uzasadnienie jest wyświetlane pod nazwą utworu.

### US-016 – Responsywny interfejs

Opis: Jako użytkownik mobilny chcę korzystać z aplikacji na ekranie 320 px, aby wygodnie odkrywać muzykę na telefonie.
Kryteria akceptacji:

1. Layout nie wymaga poziomego scrolla na 320 px.
2. Wszystkie elementy są dostępne dotykowo.

### US-017 – Obsługa błędów API

Opis: Jako użytkownik chcę otrzymywać przyjazne komunikaty, gdy Spotify lub OpenAI API jest niedostępne, aby wiedzieć, co się stało.
Kryteria akceptacji:

1. Błędy 4xx/5xx Spotify lub OpenAI API wyświetlają dedykowany stan błędu.
2. Użytkownik może ponowić próbę.

### US-018 – Usuwanie utworu z biblioteki

Opis: Jako użytkownik chcę móc usunąć utwór z mojej biblioteki, aby mógł on ponownie pojawić się w rekomendacjach, przy czym nie mogę usunąć ostatniego pozostałego utworu.
Kryteria akceptacji:

1. Każdy utwór w widoku biblioteki posiada akcję "Usuń".
2. Po potwierdzeniu utwór jest usuwany z bazy danych i ponownie kwalifikuje się do rekomendacji (o ile nie jest zablokowany).
3. Gdy w bibliotece znajduje się tylko 1 utwór, akcja "Usuń" jest nieaktywna lub wyświetla komunikat informujący, że minimum jeden utwór musi pozostać.
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
