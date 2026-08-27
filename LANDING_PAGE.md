# Home Gym Creator — landing page

## Makieta

![Makieta landing page Home Gym Creator](./mockups/home-gym-landing-page-v1.png)

## Cel strony

Landing page powinien przede wszystkim prowadzić użytkownika do kreatora, a nie do katalogu produktów.

Główna obietnica produktu:

> Zaprojektuj domową siłownię, która naprawdę zmieści się w Twoim pokoju.

Strona powinna możliwie szybko pokazać wyróżnik projektu: wspólną pracę użytkownika i agenta nad układem, który uwzględnia wymiary pomieszczenia, przeszkody, strefy bezpieczeństwa, cele treningowe i budżet.

## Struktura strony

### 1. Hero

Nagłówek:

> Zaprojektuj domową siłownię, która naprawdę zmieści się w Twoim pokoju.

Opis:

> Podaj wymiary, budżet i cele treningowe. Wspólnie z agentem dobierz sprzęt, rozmieść go i sprawdź kolizje oraz strefy bezpieczeństwa.

Główne działania:

- **Uruchom przykładowy projekt** — podstawowe CTA kierujące do gotowego scenariusza demonstracyjnego.
- **Zacznij od pustego pokoju** — drugorzędne CTA dla użytkownika, który chce utworzyć własny projekt.

Obok treści należy pokazać makietę kreatora, najlepiej plan 2D z widocznymi strefami bezpieczeństwa i ostrzeżeniem o ograniczeniu przestrzennym.

### 2. Jak to działa

Proces należy przedstawić w trzech krokach:

1. **Opisz przestrzeń** — podaj wymiary, przeszkody, drzwi i wysokość pomieszczenia.
2. **Podaj cele i budżet** — określ planowane ćwiczenia, preferencje i maksymalny koszt.
3. **Projektuj razem z agentem** — agent dobiera i rozmieszcza sprzęt, a użytkownik może ręcznie poprawiać projekt.

### 3. Najważniejszy wyróżnik

Landing powinien wyjaśniać, że projekt analizuje równocześnie:

- czy sprzęt fizycznie mieści się w pomieszczeniu,
- czy pozostaje przestrzeń potrzebna do bezpiecznego wykonywania ćwiczeń,
- czy wybrany zestaw mieści się w budżecie.

Ta sekcja jest ważniejsza niż rozbudowana prezentacja katalogu.

### 4. Przykładowy scenariusz

Na stronie należy pokazać konkretny przypadek:

> Pokój 4 × 3,2 m, nieruchoma szafa, budżet 10 000 zł. Cele: przysiady, wyciskanie i podciąganie.

Przykładowe podsumowanie rezultatu:

- 4 dobrane produkty,
- koszt 9 640 zł,
- wszystkie cele treningowe pokryte,
- brak kolizji,
- zachowana strefa do martwego ciągu.

CTA tej sekcji: **Otwórz ten projekt**.

### 5. Możliwości kreatora

Krótka prezentacja najważniejszych funkcji:

- edycja pokoju i przeszkód,
- przeciąganie i obracanie sprzętu,
- automatyczna walidacja układu,
- wizualizacja stref bezpieczeństwa,
- widoki 2D i 3D,
- współpraca użytkownika i agenta na tym samym projekcie.

### 6. Końcowe CTA

Komunikat:

> Masz już pomieszczenie. Teraz sprawdź, jaka siłownia naprawdę się w nim zmieści.

Przycisk: **Zaprojektuj moją siłownię**.

## Nawigacja i miejsca docelowe

| Element | Miejsce docelowe |
| --- | --- |
| Uruchom przykładowy projekt | `/creator?start=demo` |
| Zacznij od pustego pokoju | `/creator?start=new` |
| Otwórz ten projekt | `/creator?start=demo` |
| Zaprojektuj moją siłownię | `/creator?start=new` |
| Otwórz kreator | `/creator?start=new` |
| Zobacz sprzęt | `/catalog` |
| Karta konkretnego produktu | `/catalog/[slug]` |
| Logo | `/` |

Dokładny sposób przekazania trybu startowego może zostać zmieniony podczas implementacji. Ważne jest zachowanie dwóch intencji:

- `demo` ładuje gotowy pokój i przykładowy układ, aby natychmiast pokazać możliwości aplikacji,
- `new` otwiera pusty projekt z krótkim panelem konfiguracji: wymiary, cele i budżet.

## Zasady flow

- Główne CTA w nawigacji powinno brzmieć **Otwórz kreator**.
- Katalog jest ścieżką drugorzędną i nie powinien dominować głównego scenariusza.
- Konfiguracja nowego projektu odbywa się w panelu wewnątrz `/creator`, a nie na osobnych stronach onboardingu.
- Użytkownik powinien dotrzeć do wspólnej pracy z agentem jednym kliknięciem z hero.
- Landing sprzedaje efekt końcowy i współpracę z agentem; katalog jedynie dostarcza elementów do projektu.
