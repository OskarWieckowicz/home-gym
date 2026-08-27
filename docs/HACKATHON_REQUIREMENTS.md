# WebMCP Challenge — źródła i wymagania

> Stan informacji: 27 sierpnia 2026. Ten dokument jest roboczym podsumowaniem. W przypadku rozbieżności źródłem rozstrzygającym są aktualne oficjalne zasady opublikowane przez Devpost.

## Najważniejsze linki

### Strony challenge'u

- [WebMCP Challenge na Devpost](https://webmcp.devpost.com/) — rejestracja, terminy, wymagania i formularz zgłoszeniowy.
- [Oficjalny regulamin](https://webmcp.devpost.com/rules) — pełne, prawnie wiążące zasady.
- [Materiały i zasoby Devpost](https://webmcp.devpost.com/resources) — dokumentacja, przykłady i materiały partnerów.
- [Strona challenge'u na OpenAI](https://openai.com/webmcp-challenge/) — opis idei, daty, nagrody i inspiracje.
- [WebMCP Showcase](https://developers.openai.com/showcase?view=webmcp-apps) — przykładowe aplikacje agent-native.

### Dokumentacja WebMCP

- [OpenAI Docs — Site tools / WebMCP](https://learn.chatgpt.com/docs/webmcp) — sposób działania WebMCP w ChatGPT i Codex.
- [Specyfikacja WebMCP](https://webmachinelearning.github.io/webmcp/) — proponowany standard i API.
- [Repozytorium WebMCP](https://github.com/webmachinelearning/webmcp) — źródła specyfikacji, explainery i otwarte problemy.
- [Dokumentacja WebMCP dla Chrome](https://developer.chrome.com/docs/ai/webmcp) — API, uruchamianie i testowanie.
- [WebMCP best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices) — projektowanie nazw, schematów i zestawu narzędzi.
- [WebMCP tool security](https://developer.chrome.com/docs/ai/webmcp/secure-tools) — bezpieczeństwo, zaufanie i prompt injection.

## Cel challenge'u

Należy zbudować działającą aplikację webową wykorzystującą WebMCP, która pokazuje przyszłość otwartego internetu, w którym ludzie i agenci mogą wspólnie wykonywać zadania, współpracować i tworzyć.

Projekt powinien być **znacząco lepszy dzięki wspólnej pracy człowieka i agenta**. Samo dodanie pojedynczego narzędzia WebMCP do zwykłej strony może nie wystarczyć do uzyskania wysokiej oceny za wykorzystanie technologii.

WebMCP umożliwia stronie udostępnienie agentowi uporządkowanych narzędzi działających na otwartej stronie i jej aktualnym stanie. Agent nie musi zgadywać kolejnych kliknięć w interfejsie — może wywoływać zdefiniowane operacje z wejściami opisanymi przez JSON Schema.

## Najważniejsze terminy

- **Otwarcie rejestracji i zgłoszeń:** 25 sierpnia 2026.
- **Deadline zgłoszenia:** 3 września 2026, godz. 13:00 PDT.
- **Deadline w Polsce:** 3 września 2026, godz. 22:00 CEST.
- **Okres oceniania:** 4–21 września 2026.
- **Planowane ogłoszenie wyników:** około 23 września 2026; termin może ulec zmianie.

Po zakończeniu okresu zgłoszeń nie można swobodnie zmieniać wysłanego submission. Devpost może zezwolić jedynie na ograniczone korekty, między innymi w przypadku naruszeń praw, ujawnienia danych osobowych lub nieodpowiednich materiałów.

## Kto może uczestniczyć

Challenge jest przeznaczony dla:

- pełnoletnich uczestników spełniających wymagania kraju zamieszkania,
- zespołów złożonych z uprawnionych uczestników,
- uprawnionych organizacji.

Uczestnik lub organizacja musi pochodzić z kraju albo terytorium obsługiwanego przez OpenAI API i nie może podlegać wyłączeniom opisanym w regulaminie. Zespół lub organizacja musi wyznaczyć jednego reprezentanta upoważnionego do dokonania zgłoszenia.

Przed wysłaniem projektu należy ponownie sprawdzić sekcję Eligibility w [oficjalnym regulaminie](https://webmcp.devpost.com/rules).

## Wymagania dotyczące projektu

Projekt musi:

- być aplikacją webową wykorzystującą WebMCP,
- działać stabilnie i zgodnie z zachowaniem przedstawionym w opisie oraz filmie,
- być dostępny na platformie wskazanej w zgłoszeniu,
- posiadać nietrywialną, działającą implementację WebMCP,
- umożliwiać jurorom dostęp i testowanie bez opłat oraz ograniczeń w okresie oceniania,
- być oryginalną pracą uczestnika lub zespołu,
- nie naruszać praw autorskich, znaków towarowych, prywatności ani innych praw osób trzecich.

Aplikacja może być hostowana między innymi na ChatGPT Sites, Cloudflare, Vercel, Render, Netlify, Shopify lub dowolnej innej platformie.

Autoryzacja jest dozwolona. Jeżeli aplikacja wymaga logowania, w zgłoszeniu trzeba podać działające dane testowe i jasne instrukcje dostępu.

## Nowy lub istniejący projekt

Dozwolone są dwa przypadki:

1. nowy projekt utworzony w okresie challenge'u,
2. istniejący projekt znacząco rozszerzony o WebMCP po rozpoczęciu okresu zgłoszeń.

W przypadku wcześniejszego projektu oceniana jest wyłącznie praca dodana podczas challenge'u. Trzeba jasno odróżnić wcześniejszy zakres od nowych zmian i posiadać dowody, na przykład datowaną historię commitów.

Dla Home Gym Creatora oznacza to, że warto:

- utrzymywać czytelną historię Git od początku pracy,
- wykonywać regularne, opisowe commity,
- zaznaczyć w README, że projekt został utworzony na WebMCP Challenge,
- opisać, które elementy realizują WebMCP.

## Integracje i materiały zewnętrzne

Jeżeli projekt wykorzystuje zewnętrzne API, SDK, dane, modele 3D, zdjęcia, fonty, muzykę lub inne materiały, uczestnik musi posiadać prawo do ich wykorzystania i przestrzegać odpowiednich licencji.

Dla Home Gym Creatora najbezpieczniejszy wariant na hackathon to:

- fikcyjne marki i produkty,
- własne dane katalogowe,
- własne lub prawidłowo licencjonowane modele i grafiki,
- brak cudzej muzyki w filmie,
- zapisanie licencji użytych zależności i assetów.

## Elementy wymagane w submission

### 1. Działający publiczny adres aplikacji

Trzeba przekazać działający live URL dostępny dla jurorów w:

- przeglądarce wbudowanej w ChatGPT, albo
- Google Chrome z włączoną obsługą WebMCP.

Adres musi pozostać bezpłatnie dostępny do zakończenia okresu oceniania. Nie należy zakładać, że jurorzy samodzielnie naprawią konfigurację, utworzą konto albo domyślą się sposobu uruchomienia projektu.

### 2. Opis tekstowy projektu

Opis musi wyjaśniać:

- dlaczego przypadek użycia dobrze pasuje do WebMCP,
- w jaki sposób WebMCP poprawia doświadczenie użytkownika,
- co człowiek i agent mogą zrobić razem, co wcześniej było trudne lub niemożliwe,
- w jaki sposób WebMCP zostało zaimplementowane.

Opis powinien również jasno przedstawić:

- realny problem i docelowego użytkownika,
- główny scenariusz demonstracyjny,
- najważniejsze funkcje aplikacji,
- zakres działania agenta,
- rolę deterministycznej logiki aplikacji,
- ograniczenia prototypu.

### 3. Publiczne repozytorium

Trzeba podać publiczny adres repozytorium w GitHub, GitLab albo Bitbucket. Repozytorium musi zawierać:

- cały wymagany kod źródłowy,
- wymagane assety,
- instrukcje instalacji i uruchomienia,
- instrukcje testowania WebMCP,
- plik licencji open source,
- faktyczną implementację narzędzi WebMCP, np. przez `document.modelContext.registerTool(...)`.

Licencja powinna być wykrywana i widoczna u góry strony repozytorium, w sekcji About. Przed wysłaniem trzeba sprawdzić widok repozytorium jako niezalogowany użytkownik.

Zalecana zawartość README:

- krótki opis produktu,
- live demo URL,
- zrzuty ekranu lub GIF,
- wymagania środowiskowe,
- instalacja i uruchomienie,
- uruchomienie testów,
- instrukcja włączenia WebMCP,
- lista udostępnianych narzędzi,
- przykładowe prompty demonstracyjne,
- architektura aplikacji,
- informacja o licencji i assetach.

### 4. Film demonstracyjny

Film musi:

- trwać **krócej niż 3 minuty**,
- pokazywać działający projekt,
- zawierać dźwięk lub narrację wyjaśniającą produkt i wykorzystanie WebMCP,
- być publicznie dostępny w YouTube,
- zostać podlinkowany w formularzu zgłoszeniowym,
- nie zawierać cudzych znaków towarowych, muzyki lub materiałów chronionych bez odpowiedniego pozwolenia.

Jurorzy nie muszą oglądać materiału po przekroczeniu trzech minut. Mogą też ocenić zgłoszenie bez samodzielnego testowania aplikacji, wyłącznie na podstawie filmu, tekstu i grafik. Dlatego film powinien pokazywać cały najważniejszy przepływ, a nie tylko zapowiadać dostępne funkcje.

### 5. Język zgłoszenia

Wszystkie materiały zgłoszeniowe muszą być w języku angielskim. Jeżeli któryś materiał jest w innym języku, trzeba dostarczyć angielskie tłumaczenie, w tym dla:

- filmu,
- opisu,
- instrukcji testowania,
- pozostałych materiałów submission.

Najprościej przygotować od początku angielski interfejs aplikacji, README, narrację filmu i opis na Devpost.

## Testowanie WebMCP

Według aktualnej dokumentacji challenge'u projekt można testować na dwa sposoby:

### ChatGPT / Codex

- użyć aktualnej aplikacji desktopowej ChatGPT,
- otworzyć stronę we wbudowanej przeglądarce,
- pozwolić agentowi odkryć narzędzia strony,
- testować wywołania na tej samej otwartej stronie i sesji.

Według aktualnych OpenAI Docs site tools działają z GPT-5.6 Sol i GPT-5.6 Terra; GPT-5.6 Luna ma obecnie WebMCP wyłączone. Stan dostępności może się zmienić, dlatego należy go ponownie sprawdzić przed nagrywaniem filmu i submission.

### Google Chrome

- użyć Chrome 149 lub nowszego,
- wejść na `chrome://flags/#enable-webmcp-testing`,
- ustawić flagę jako włączoną,
- ponownie uruchomić przeglądarkę,
- zweryfikować rejestrację, schematy wejściowe, odpowiedzi i błędy narzędzi.

Projekt powinien zostać przetestowany w świeżej sesji, ponieważ środowisko jurora nie będzie posiadać stanu lokalnego autora.

## Kryteria oceny

Najpierw zgłoszenie przechodzi etap pass/fail sprawdzający podstawową zgodność z tematem i wymaganym wykorzystaniem technologii.

Projekty, które przejdą dalej, są oceniane w czterech równoważnych kategoriach:

### 1. WebMCP Leverage

- Jak dokładnie i umiejętnie projekt wykorzystuje WebMCP?
- Czy implementacja jest działająca i nietrywialna?
- Czy agent rzeczywiście korzysta ze stanu oraz funkcji aplikacji?

### 2. Execution

- Czy projekt działa lub można go uruchomić?
- Czy tworzy spójne, kompletne doświadczenie produktowe?
- Czy jest czymś więcej niż technicznym proof of concept?

### 3. Potential Impact

- Czy projekt rozwiązuje konkretny problem konkretnej grupy użytkowników?
- Czy demonstracja pokazuje, że rozwiązanie faktycznie odpowiada na ten problem?

### 4. Creativity & Ambition

- Czy koncepcja jest kreatywna i ambitna?
- Czy różni się od istniejących rozwiązań i pozostałych projektów?

W przypadku remisu pierwszeństwo ma wynik w pierwszym kryterium, czyli **WebMCP Leverage**, następnie kolejne kryteria w podanej kolejności.

## Jak wymagania przekładają się na Home Gym Creator

Projekt powinien szczególnie pokazać:

- odczyt aktualnego modelu pokoju przez agenta,
- tworzenie i edycję przeszkód przez WebMCP,
- wyszukiwanie produktów według budżetu, rozmiaru i celów,
- widoczne rozmieszczanie sprzętu przez agenta,
- deterministyczną walidację kolizji i stref roboczych,
- iteracyjne poprawianie projektu po wynikach walidacji,
- ręczną zmianę dokonaną przez użytkownika,
- reakcję agenta na nowy stan tej samej sceny,
- końcową listę zakupową i podsumowanie kosztów.

Najważniejsza scena dla oceny WebMCP powinna wyglądać tak:

1. użytkownik ręcznie zmienia projekt,
2. agent odczytuje zaktualizowany stan,
3. agent wykonuje kilka powiązanych operacji przez WebMCP,
4. aplikacja waliduje rezultat,
5. użytkownik widzi i ocenia zmiany w tym samym interfejsie.

## Checklista przed submission

### Organizacja

- [ ] Rejestracja na Devpost została ukończona.
- [ ] Uczestnik lub wszyscy członkowie zespołu spełniają wymagania Eligibility.
- [ ] W przypadku zespołu wyznaczono reprezentanta.
- [ ] Submission jest zapisane jako draft odpowiednio wcześnie.

### Aplikacja

- [ ] Live URL działa bez środowiska deweloperskiego autora.
- [ ] Aplikacja uruchamia się w przeglądarce ChatGPT.
- [ ] Aplikacja działa w Chrome z WebMCP.
- [ ] Narzędzia są wykrywane po świeżym przeładowaniu strony.
- [ ] Schematy wejściowe są prawidłowe.
- [ ] Narzędzia read-only i modyfikujące stan zachowują się zgodnie z opisem.
- [ ] Wyniki narzędzi zawierają dane pozwalające agentowi zweryfikować operację.
- [ ] Błędy są czytelne dla użytkownika i agenta.
- [ ] Główny scenariusz demo działa powtarzalnie.
- [ ] Nie są potrzebne prywatne dane ani lokalny stan autora.

### Repozytorium

- [ ] Repozytorium jest publiczne.
- [ ] Kod i wszystkie wymagane assety są obecne.
- [ ] README zawiera kompletne instrukcje.
- [ ] Dodano plik licencji open source.
- [ ] Licencja jest wykryta i widoczna w About.
- [ ] Historia commitów dokumentuje pracę wykonaną podczas challenge'u.
- [ ] W repozytorium nie ma sekretów, kluczy API ani prywatnych danych.
- [ ] Licencje zależności, modeli i grafik są zgodne z użyciem.

### Film i opis

- [ ] Film trwa krócej niż 3 minuty.
- [ ] Film pokazuje działającą aplikację, a nie wyłącznie slajdy.
- [ ] Film pokazuje rzeczywiste wywołania WebMCP i widoczne rezultaty.
- [ ] Film ma angielską narrację lub pełne angielskie tłumaczenie.
- [ ] Film jest publiczny w YouTube.
- [ ] Nie zawiera nieautoryzowanych znaków, muzyki ani materiałów.
- [ ] Opis odpowiada na wszystkie cztery wymagane pytania dotyczące WebMCP.
- [ ] Opis, instrukcje testowania i pozostałe materiały są po angielsku.

### Finalizacja

- [ ] Wszystkie linki sprawdzono w trybie prywatnym lub po wylogowaniu.
- [ ] Jeśli wymagane jest logowanie, podano działające konto testowe.
- [ ] Submission wysłano przed 3 września 2026, godz. 22:00 CEST.
- [ ] Po wysłaniu zapisano kopię tekstu, linków i wersji filmu.
