# Aplikacja do Zarządzania Rezerwacjami Spotkań (React)

## Cel Projektu

Celem projektu jest stworzenie kompleksowej aplikacji webowej do zarządzania rezerwacjami spotkań, zbudowanej w technologii **React 18+**. Aplikacja ma umożliwiać użytkownikom łatwe rezerwowanie terminów spotkań, ich edycję i anulowanie, natomiast administratorom zapewniać pełną kontrolę nad wszystkimi rezerwacjami i użytkownikami w systemie.

## Technologie Wykorzystane w Projekcie

* **Frontend:** React 18+, React-Bootstrap (zbyt późno zauważyłem że nie ma go na liście...)
* **Zarządzanie stanem:** React Context API (dla uwierzytelniania)
* **Kalendarz:** `react-big-calendar`
* **Backend & Baza Danych:** Firebase (w tym Firebase Authentication do uwierzytelniania i Firestore do przechowywania danych o spotkaniach i użytkownikach)
* **Obsługa formularzy:** Formularze React (wspierane przez `react-bootstrap/Form`)
* **Routing:** React Router (lub podobne rozwiązanie do nawigacji między stronami)
* **Zarządzanie zależnościami:** npm

## Opis Działania Aplikacji i Główne Funkcjonalności

Aplikacja jest systemem zarządzania spotkaniami z wyraźnym podziałem na role: **użytkownika** i **administratora**.

### 1. Uwierzytelnianie i Autoryzacja Użytkowników

* **Rejestracja:** Użytkownicy mogą tworzyć nowe konta za pomocą formularza rejestracyjnego (email, hasło, nazwa użytkownika).
* **Logowanie:** Możliwość logowania do istniejących kont.
* **Resetowanie Hasła:** Funkcjonalność resetowania hasła poprzez email.
* **Obsługa Sesji:** Zarządzanie sesjami użytkowników za pomocą kontekstu uwierzytelniania (`AuthContext`), zapewniające stan logowania w całej aplikacji.
* **Autoryzacja Rolami:**
    * **Administrator:** Posiada pełny dostęp do wszystkich rezerwacji i profili użytkowników w systemie.
    * **Użytkownik:** Może tworzyć, edytować, usuwać i anulować **wyłącznie swoje** rezerwacje oraz dołączać/opuszczać rezerwacje innych.

### 2. Zarządzanie Profilami Użytkowników

* **Lista Użytkowników:** Administratorzy mają dostęp do kompleksowej listy wszystkich zarejestrowanych użytkowników.
* **Zmiana Roli:** Administratorzy mogą zmieniać role użytkowników (pomiędzy 'user' a 'admin').
* **Usuwanie Użytkowników:** Administratorzy mogą usuwać profile użytkowników (konto Firebase Auth pozostaje, ale powiązany profil w Firestore jest usuwany).
* **Ograniczenia:** Administrator nie może zmienić własnej roli ani usunąć własnego konta z poziomu panelu administratora.

### 3. Zarządzanie Spotkaniami

#### 3.1. Dashboard Użytkownika

* **Moje Spotkania:** Wyświetlanie spotkań zorganizowanych przez zalogowanego użytkownika oraz spotkań, w których uczestniczy.
* **Widok Kalendarza:** Interaktywny kalendarz (`react-big-calendar`) z wizualizacją spotkań (widoki miesiąca, tygodnia, dnia, agendy).
* **Tworzenie Spotkań:** Użytkownicy mogą dodawać nowe spotkania, określając datę, godzinę, tytuł, opis oraz opcjonalnych uczestników.
* **Edycja i Anulowanie:** Możliwość edycji i anulowania własnych spotkań.
* **Dołączanie/Opuszczanie:** Uczestnicy mogą dołączać do spotkań lub je opuszczać.

#### 3.2. Lista Spotkań

* **Kompleksowa Lista:** Widok tabelaryczny wszystkich spotkań.
* **Filtrowanie:** Możliwość filtrowania rezerwacji według tytułu/opisu, uczestników, oraz statusu (zaplanowane, anulowane).
* **Sortowanie:** Możliwość sortowania spotkań według daty, godziny rozpoczęcia, czasu utworzenia, oraz tytułu.
* **Szczegóły Spotkań:** Przeglądanie szczegółowych informacji o każdym spotkaniu.
* **Akcje:** Twórcy spotkań mogą je edytować, anulować lub usuwać. Uczestnicy mogą dołączyć lub opuścić spotkanie.

#### 3.3. Panel Administratora (`AdminPage`)

* **Pełny Dostęp:** Administratorzy mają dostęp do pełnej listy wszystkich spotkań w systemie.
* **Operacje CRUD:** Możliwość dodawania, edycji, anulowania i usuwania **dowolnego** spotkania w systemie.

### 4. Komponenty Wielokrotnego Użytku

* **`MeetingFormModal`:** Modalny formularz do dodawania i edycji spotkań. Jest to komponent wielokrotnego użytku, wykorzystywany zarówno na Dashboardzie użytkownika, jak i w Panelu Administratora. Umożliwia wybór uczestników spośród wszystkich zarejestrowanych użytkowników.
* **`CalendarToolbar`:** Niestandardowy pasek narzędzi dla komponentu kalendarza `react-big-calendar`, zapewniający funkcje nawigacji i zmiany widoków.

### 5. Obsługa Danych i Komunikacja z Backendem

* **Firebase Firestore:** Aplikacja integruje się z Firebase Firestore jako bazą danych NoSQL, służącą do trwałego przechowywania danych o użytkownikach i spotkaniach.
* **Warstwa Serwisowa:** Logika komunikacji z bazą danych (operacje CRUD) została wydzielona do osobnych serwisów (`meetingService.ts`, `userService.ts`), co zwiększa modularność, czytelność i łatwość utrzymania kodu.
* **REST API:** Komunikacja z backendem (Firestore) odbywa się poprzez operacje na bazie danych, symulujące interakcje REST API.

### 6. Interfejs Użytkownika (UI/UX)

* **Responsywność:** Interfejs użytkownika jest responsywny, dzięki wykorzystaniu biblioteki React-Bootstrap, co zapewnia optymalne wyświetlanie na różnych urządzeniach.
* **Informacje Zwrotne:** Aplikacja zapewnia użytkownikowi jasne informacje zwrotne dotyczące stanu operacji (np. wskaźniki ładowania Spinner, komunikaty o błędach Alert, powiadomienia o sukcesie).

### 7. Obsługa Błędów i Walidacja Formularzy

* **Walidacja Pól:** Wdrożono walidację pól wejściowych w formularzach (np. poprawność formatu daty, adresu email) po stronie frontendowej.
* **Obsługa Błędów:** Aplikacja jest przygotowana do obsługi błędów zarówno po stronie backendu (Firebase), jak i frontendowego interfejsu użytkownika, informując o nich odpowiednimi komunikatami.

---

## Uruchomienie Aplikacji

### 1. Wymagania

* **Node.js:** Wersja 14.x+
* **npm:** Menedżer pakietów Node.js
* Program do rozpakowywania plików `.zip`

### 2. Kroki Uruchomienia

1.  **Rozpakuj** plik `.zip` z kodem programu do wybranej lokalizacji.
2.  Otwórz **terminal** (lub wiersz poleceń) i przejdź do rozpakowanego folderu projektu.
    * Przykład: `cd C:\moj_folder\aplikacja`
3.  **Zainstaluj zależności** projektu. W terminalu wpisz:

    npm install

4.  **Konfiguracja Firebase:** Konfiguracja Firebase jest już zawarta w pliku `src/firebase/config.ts`.
5.  **Uruchom program.** W terminalu wpisz:

    npm start

6.  Aplikacja automatycznie otworzy się w przeglądarce pod adresem: `http://localhost:3000`.

---