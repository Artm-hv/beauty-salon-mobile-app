# Svoya Nail Studio

Aplikacja do obsługi salonu stylizacji paznokci przygotowana na zajęcia „Aplikacje mobilne” (semestr 5). Administrator prowadzi kalendarz, kasę i kartoteki klientów oraz przydziela role. Stylista widzi swój grafik, dołącza zdjęcia do wizyt i sprawdza prowizję.

## Uruchomienie na Windows

Potrzebne są Node.js z npm (np. Node 22.13 lub nowszy z linii 22), Python 3.11 lub nowszy dostępny jako `python` oraz Expo Go zgodne z SDK 58 do demonstracji na telefonie.

1. Otwórz [Uruchom_Serwer.bat](Uruchom_Serwer.bat) w katalogu głównym. Skrypt przechodzi do katalogu aplikacji, instaluje brakujące zależności i uruchamia serwer Python oraz Expo.
2. Wybierz **1 — LAN** dla telefonu w tej samej sieci Wi-Fi, **2 — tunel** dla telefonu w innej sieci lub **3 — przeglądarka**. W trybie mobilnym zeskanuj kod QR. Na czas prezentacji pozostaw uruchomione API i Metro. Skrypt zwalnia porty 8000 i 8081 przed startem.
3. Zaloguj się na konto przypisane do prezentowanej roli. Nowe konto po rejestracji ma status `PENDING`. Administrator przydziela mu rolę na ekranie personelu.

### Uruchomienie ręczne

W pierwszym terminalu, z katalogu głównego repozytorium:

```powershell
cd application
npm ci
python backend/server.py
```

W drugim terminalu, również z katalogu głównego:

```powershell
cd application
npm start
```

Dla przeglądarki użyj `npm run web`, a dla tunelu `npx expo start --tunnel`. API działa na porcie 8000. Metro udostępnia te same operacje pod ścieżką `/api`.

## Struktura

| Katalog | Zawartość |
|---|---|
| [application/app](application/app) | Ekrany i nawigacja Expo Router, w tym zakładki oraz szczegóły wizyty |
| [application/components](application/components) | Karty wizyt, klientów i paragonów oraz wykresy |
| [application/hooks](application/hooks) | Obsługa akcelerometru, aparatu i galerii |
| [application/services](application/services) | Klient HTTP, sesja użytkownika i obliczenia dla kartotek |
| [application/constants](application/constants) i [application/context](application/context) | Typy domenowe, tłumaczenia, kolory, ustawienia interfejsu i dialogi |
| [application/backend](application/backend) i [application/data](application/data) | Serwer REST oparty na Pythonowym `http.server`, testy HTTP i baza JSON |
| [docs](docs) | [Kontekst techniczny projektu](docs/PROJECT_CONTEXT.md) |

Konfiguracja Expo SDK 58, React Native, TypeScript, Metro i npm znajduje się w [application](application). Serwer weryfikuje token sesji oraz rolę przy dostępie do danych salonu.

## Obrona projektu — po jednym głównym pliku

| Osoba | Plik i pochodzenie funkcji | Co pokazać |
|---|---|---|
| Ihor Namachynskyi | [useAccelerometer.ts](application/hooks/useAccelerometer.ts) — obsługa czujnika w `e733f67`, dopracowanie gestu w `d6f91c1` | Otwórz kalendarz na telefonie i przechyl urządzenie. Pokaż próg przyspieszenia, odstęp między gestami oraz podłączenie zdarzeń do zmiany dnia w [kalendarzu](application/app/%28tabs%29/calendar.tsx). |
| Artem Hizhovskyi | [useCamera.ts](application/hooks/useCamera.ts) — aparat i galeria w `e39d076` | Otwórz wizytę, zrób zdjęcie i otwórz ją ponownie. W hooku pokaż uprawnienia i wynik wyboru zdjęcia, a w [szczegółach wizyty](application/app/appointment/%5Bid%5D.tsx) jego zapis dla konkretnego identyfikatora. |
| Artem Labunskyi | [salary.tsx](application/app/salary.tsx) — ekran prowizji w `d7f57bc` | Zaloguj się jako stylista i otwórz wynagrodzenie. W `loadMasterSalary` pokaż powiązanie konta z grafikiem, wybór wizyt i obliczenie 75% ceny. Do salda trafia prowizja od opłaconych wizyt. |

### Pozostałe funkcje i wkład zespołu

| Funkcja | Plik | Wkład członka zespołu |
|---|---|---|
| Logowanie i rejestracja | [Logowanie](application/app/index.tsx), [rejestracja](application/app/register.tsx), [sesja](application/services/authService.ts) | Ihor przygotował przepływ logowania, rejestracji i oczekiwania. Artem Labunskyi rozwinął przydzielanie ról, a Artem Hizhovskyi później poprawił działanie sesji serwerowych. |
| Grafik i karta wizyty | [Kalendarz](application/app/%28tabs%29/calendar.tsx), [karta](application/components/AppointmentCard.tsx) | Ihor przygotował siatkę, zmianę daty i kartę wizyty. Artem Hizhovskyi rozwijał integrację z danymi, a Artem Labunskyi widok własnego grafiku. |
| Rezerwacje, kasa i klienci | [Rezerwacja](application/app/%28tabs%29/new-booking.tsx), [kasa](application/app/%28tabs%29/cashier.tsx), [kartoteki](application/app/%28tabs%29/clients.tsx) | Ihor utworzył początkowy szkielet zakładek. Artem Hizhovskyi zaimplementował wybór usług i terminu, obsługę paragonów i kartoteki. Artem Labunskyi dodał ograniczenia dostępu według roli. |
| REST API i trwałość danych | [Serwer](application/backend/server.py), [klient HTTP](application/services/api.ts) | Artem Hizhovskyi dodał klienta API i serwer Python. Ihor współtworzył synchronizację płatności, a Artem Labunskyi operacje dotyczące personelu. |
| Personel, statystyki i interfejs PL/UA | [Personel](application/app/staff.tsx), [statystyki](application/app/statistics.tsx), [ustawienia](application/context/AppSettingsContext.tsx) | Artem Labunskyi dodał zarządzanie personelem, analizę miesiąca, tłumaczenia i motywy. Późniejsze poprawki obliczeń i wykresów obejmuje wspólny zakres zmian w `7f5d382`, zapisany przez Artema Hizhovskiego. |

## Sprawdzenie projektu

Z katalogu `application/`:

```powershell
npx tsc --noEmit
python -m unittest discover -s backend -v
npx expo export --platform all
```

Pięć testów HTTP używa tymczasowej bazy. Sprawdzają uprawnienia, zmianę ról i zwolnienie pracownika, przenoszenie wizyt, płatności oraz próbę jednoczesnej rezerwacji jednego terminu.
