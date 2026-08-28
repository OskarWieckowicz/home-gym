# WebMCP — źródła i dokumentacja techniczna

> Stan informacji: 28 sierpnia 2026. WebMCP jest eksperymentalnym i rozwijającym się standardem. Przed wdrożeniem oraz nagraniem filmu należy ponownie sprawdzić specyfikację, status implementacji i zachowanie obsługiwanych przeglądarek.

## Pięć głównych źródeł

### 1. OpenAI WebMCP Showcase

**Link:** [developers.openai.com/showcase?view=webmcp-apps](https://developers.openai.com/showcase?view=webmcp-apps)

Showcase zawiera przykładowe aplikacje zaprojektowane do współpracy człowieka z agentem. Jest źródłem inspiracji produktowej i UX, a nie formalną specyfikacją API.

Warto analizować w przykładach:

- jak rozdzielono operacje ręczne od wykonywanych przez agenta,
- czy człowiek i agent pracują na tym samym stanie,
- jakie operacje odczytują stan, a jakie go zmieniają,
- jak aplikacja wizualizuje działanie narzędzia,
- jak agent otrzymuje wystarczająco dużo danych, aby zweryfikować rezultat,
- jak wąski jest główny scenariusz demonstracyjny.

Najbardziej przydatne przykłady dla Home Gym Creatora:

#### Codex Modeling Studio

**Link:** [Codex Modeling Studio](https://developers.openai.com/showcase/codex-modeling-studio)

Przeglądarkowe studio 3D, w którym agent może odczytywać scenę oraz modyfikować geometrię i materiały. To najbliższy przykład współpracy na przestrzennym canvasie.

Do sprawdzenia:

- sposób reprezentowania sceny jako stanu zrozumiałego dla agenta,
- narzędzia tworzące i edytujące obiekty,
- widoczne aktualizowanie viewportu,
- iteracyjna praca agent–walidacja–poprawka.

#### Verdant Market

**Link:** [Verdant Market](https://developers.openai.com/showcase/verdant-market)

Fikcyjny sklep spożywczy, w którym agent może przeszukiwać katalog, odczytywać produkty i zarządzać wspólnym koszykiem.

Do sprawdzenia:

- struktura narzędzi katalogowych,
- wyszukiwanie i filtrowanie produktów,
- odczyt szczegółów produktu,
- wspólny stan katalogu i koszyka,
- widoczne potwierdzanie zmian dokonanych przez agenta.

#### Webroom

**Link:** [Webroom](https://developers.openai.com/showcase/webroom)

Edytor zdjęć, w którym użytkownik i agent pracują na tym samym obrazie. Pokazuje wzorzec współdzielonego edytora z licznymi operacjami read/write.

Do sprawdzenia:

- granularność narzędzi edytora,
- podział na narzędzia odczytujące i modyfikujące,
- kontynuowanie pracy przez agenta po ręcznej zmianie użytkownika.

#### Sunday Table

**Link:** [Sunday Table](https://developers.openai.com/showcase/sunday-table)

Planer posiłków, przepisów i zakupów. Może być przydatny jako wzorzec łączenia preferencji użytkownika, ograniczeń, wyboru elementów i końcowej listy zakupowej.

### 2. Oficjalna specyfikacja WebMCP

**Link:** [webmachinelearning.github.io/webmcp](https://webmachinelearning.github.io/webmcp/)

**Test suite:** [wpt.fyi/results/webmcp](https://wpt.fyi/results/webmcp)

To kanoniczny kontrakt API: Draft Community Group Report z 26 sierpnia 2026, publikowany przez Web Machine Learning Community Group. Nie jest to standard W3C ani dokument na ścieżce standaryzacji W3C.

Redaktorzy: Brandon Walderman (Microsoft), Khushal Sagar (Google), Dominic Farolino (Google).

Specyfikacja definiuje, że strona z WebMCP działa jak serwer MCP, którego narzędzia wykonują się w skrypcie klienckim, a nie na backendzie. Umożliwia to wspólną pracę użytkownika i agenta w tym samym interfejsie.

Powierzchnia API (`document.modelContext`):

- `registerTool(tool, options?)` — rejestracja narzędzia,
- `getTools(options?)` — odczyt narzędzi z dokumentu i jego potomków (dla agentów in-page w JavaScript),
- `executeTool(tool, inputObject?, options?)` — wywołanie narzędzia; wynik jest serializowany do JSON string,
- `ontoolchange` — zdarzenie przy zmianie zestawu narzędzi.

Definicja narzędzia (`ModelContextTool`):

- `name` — 1–128 znaków; tylko ASCII alfanumeryczne oraz `_`, `-`, `.`,
- `title` — etykieta UI (lokalizowana),
- `description` — opis naturalny dla agenta,
- `inputSchema` — obiekt JSON Schema,
- `execute(inputObject, { signal })` — callback; `signal` to `AbortSignal` anulowania wykonania,
- `annotations.readOnlyHint` — narzędzie tylko czyta stan,
- `annotations.untrustedContentHint` — wynik zawiera treść niezaufaną.

Opcje rejestracji: `exposedTo` (originy, którym narzędzie jest widoczne) oraz `signal` (`AbortSignal` wyrejestrowuje narzędzie po abort).

Istotne ograniczenia ze specyfikacji:

- API wymaga secure context oraz origin-keyed agent cluster (poza `file:`); w przeciwnym razie `SecurityError`.
- Dostęp jest za Permissions Policy `"tools"` z domyślnym allowlist `'self'`.
- Nazwa narzędzia musi być unikalna w danym `ModelContext`; ponowna rejestracja tej samej nazwy odrzuca promise (`InvalidStateError`).
- Declarative API w specyfikacji jest nadal TODO — na razie obowiązuje [Declarative API explainer](https://github.com/webmachinelearning/webmcp/blob/main/declarative-api-explainer.md).
- Agent przeglądarki nie korzysta z `getTools()`; odkrywa narzędzia własnym mechanizmem obserwacji strony.

Specyfikację należy sprawdzać, gdy potrzebujemy odpowiedzi na pytania dotyczące dokładnego kontraktu API, błędów, anulowania, origin isolation, iframe'ów i zdarzeń.

### 3. Repozytorium WebMCP

**Repozytorium:** [github.com/webmachinelearning/webmcp](https://github.com/webmachinelearning/webmcp)

Repozytorium uzupełnia renderowaną specyfikację o explainery, status implementacji, kwestie bezpieczeństwa i aktywne dyskusje.

Najważniejsze dokumenty:

- [README / główny explainer](https://github.com/webmachinelearning/webmcp/blob/main/README.md)
- [Implementation status](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md)
- [Declarative API explainer](https://github.com/webmachinelearning/webmcp/blob/main/declarative-api-explainer.md)
- [Security and privacy questionnaire](https://github.com/webmachinelearning/webmcp/blob/main/security-privacy-questionnaire.md)
- [Otwarte issues](https://github.com/webmachinelearning/webmcp/issues)
- [TypeScript types — `webmcp-types`](https://www.npmjs.com/package/webmcp-types)

Repozytorium należy sprawdzać, gdy potrzebujemy odpowiedzi na pytania dotyczące:

- statusu implementacji w przeglądarkach,
- planowanych, ale jeszcze niedostępnych możliwości,
- dyskusji nad multimodalnymi argumentami i bezpieczeństwem,
- praktycznych przykładów i typów TypeScript.

### 4. Dokumentacja WebMCP dla Chrome

**Polska wersja:** [developer.chrome.com/docs/ai/webmcp?hl=pl](https://developer.chrome.com/docs/ai/webmcp?hl=pl)

**Angielska wersja:** [developer.chrome.com/docs/ai/webmcp](https://developer.chrome.com/docs/ai/webmcp)

Dokumentacja Chrome opisuje praktyczną implementację WebMCP w przeglądarce, lokalne uruchamianie, dostępne API, ograniczenia oraz wymagania dotyczące bezpieczeństwa.

Powiązane dokumenty:

- [Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Declarative API](https://developer.chrome.com/docs/ai/webmcp/declarative-api)
- [Best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices)
- [Tool security](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [Evals](https://developer.chrome.com/docs/ai/webmcp/evals)
- [Origin trial](https://developer.chrome.com/origintrials/#/view_trial/4365061253447380993)

Dokumentację Chrome należy sprawdzać podczas:

- lokalnej konfiguracji przeglądarki,
- implementowania narzędzi,
- debugowania rejestracji,
- testowania schematów wejściowych,
- weryfikowania ograniczeń aktualnej wersji Chrome,
- przygotowania aplikacji do origin trial lub publicznego hostingu.

[Evals for WebMCP](https://developer.chrome.com/docs/ai/webmcp/evals) opisuje, jak testować narzędzia wobec modelu generatywnego. Testy deterministyczne sprawdzają logikę narzędzia; evals sprawdzają, czy agent wybiera właściwe narzędzie, argumenty i kolejność wywołań.

Przed udostępnieniem narzędzi trzeba potwierdzić, że agent:

- rozumie cel narzędzia z opisu i schematu,
- wybiera właściwe narzędzie z poprawnymi parametrami,
- używa wyniku jednego narzędzia do kolejnego wywołania,
- potrafi dokończyć scenariusz użytkownika dostępnym zestawem narzędzi.

Typowe tryby awarii:

- agent pomija narzędzie lub woła złe,
- agent woła narzędzia w złej kolejności,
- argumenty nie mapują intencji użytkownika na `inputSchema`,
- wynik narzędzia jest zbyt skąpy, zbyt gadatliwy albo nie nadaje się do kolejnego kroku,
- błąd JavaScript nie wraca do agenta w czytelnej formie.

Dokumentacja zaleca najpierw testować narzędzia w izolacji (`expectedCall` względem pełnego zestawu narzędzi w danym stanie), potem scenariusze end-to-end z łańcuchami `ordered` / `unordered`, oraz awarie w środku łańcucha. Narzędzie CLI jest w [webmcp-evals](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/webmcp-evals).

### 5. Narzędzia i dema Google Chrome Labs

**Repozytorium:** [github.com/GoogleChromeLabs/webmcp-tools](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main)

**Awesome list:** [AWESOME_WEBMCP.md](https://github.com/GoogleChromeLabs/webmcp-tools/blob/main/AWESOME_WEBMCP.md)

Zestaw narzędzi deweloperskich i oficjalnych dem Google Chrome Labs do wdrażania WebMCP. To źródło praktycznych wzorców implementacji i debugowania, a nie specyfikacja API.

Narzędzia deweloperskie:

- [Model Context Tool Inspector](https://github.com/beaufortfrancois/model-context-tool-inspector) — rozszerzenie Chrome do inspekcji zarejestrowanych narzędzi, schematów wejścia i problemów z połączeniem,
- [WebMCP Evals](https://developer.chrome.com/docs/ai/webmcp/evals) — dokumentacja Chrome i [CLI](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/webmcp-evals) do sprawdzania, czy agent wywołuje narzędzia zgodnie z przypadkami testowymi,
- [WebMCP Studio](https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/webmcp-studio) — środowisko do pracy z narzędziami WebMCP,
- polyfill — pozwala uruchamiać narzędzia i związane z nimi pseudo-klasy CSS w przeglądarkach bez natywnego API.

Najbardziej przydatne dema dla Home Gym Creatora:

- [The Morning Ritual](https://googlechromelabs.github.io/webmcp-tools/demos/coffee-shop/) — katalog, specyfikacje produktu i nawigacja (imperative),
- [Luxe Leather](https://googlechromelabs.github.io/webmcp-tools/demos/leather-bag/) oraz [WebMCP Sports](https://googlechromelabs.github.io/webmcp-tools/demos/sport-shop-angular/) — sklep: wyszukiwanie, polityki, koszyk,
- [UrbanEstates](https://googlechromelabs.github.io/webmcp-tools/demos/real-estate-map/) — filtry i widok mapy (imperative),
- [WebMCP Smart Home](https://googlechromelabs.github.io/webmcp-tools/demos/smart-home/) — dashboard, w którym agent rekonfiguruje elementy przestrzenne,
- [Explainer mini-site](https://googlechromelabs.github.io/webmcp-tools/demos/explainer/) — porównanie scrapingu strony z narzędziami WebMCP.

Repozytorium należy sprawdzać podczas:

- podglądu, jak inne aplikacje rejestrują narzędzia imperative i declarative,
- debugowania ekspozycji narzędzi w Chrome,
- oceny polyfilla, jeśli natywne API nie jest dostępne,
- szukania gotowych wzorców katalogu, koszyka i filtrów.

## Czym jest WebMCP

WebMCP pozwala aplikacji webowej udostępnić jej funkcjonalność jako narzędzia opisane nazwą, naturalnym opisem i ustrukturyzowanym schematem wejścia. Narzędziem może być:

- funkcja JavaScript zarejestrowana przez Imperative API,
- formularz HTML udostępniony przez Declarative API.

Agent może odkryć narzędzia otwartej strony, wywołać je i otrzymać ustrukturyzowany wynik. Kod narzędzia działa w kontekście strony i może ponownie wykorzystywać istniejącą logikę aplikacji oraz aktualizować ten sam interfejs, który widzi użytkownik.

WebMCP jest projektowane do pracy lokalnej w przeglądarce z człowiekiem w pętli. Nie jest zamiennikiem backendowego MCP ani zwykłego API serwerowego.

## Imperative API

Imperative API pozwala rejestrować narzędzia w JavaScript, w przybliżeniu w następującej postaci:

```ts
await document.modelContext.registerTool({
  name: "get_project_state",
  description: "Read the current room, obstacles, placed equipment and budget.",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false
  },
  annotations: {
    readOnlyHint: true
  },
  execute: async () => {
    return getProjectState();
  }
});
```

To prawdopodobnie będzie główne API dla Home Gym Creatora, ponieważ aplikacja udostępnia niestandardowe operacje na stanie, katalogu i scenie geometrycznej.

Przykładowe zastosowania:

- odczyt całego projektu,
- wyszukiwanie produktów,
- dodawanie przeszkód,
- umieszczanie i przesuwanie sprzętu,
- uruchamianie walidacji układu,
- pobieranie listy zakupowej.

## Declarative API

Declarative API pozwala oznaczyć standardowy formularz HTML jako narzędzie. Przeglądarka może na tej podstawie utworzyć definicję narzędzia bez osobnego rejestrowania pełnej funkcji JavaScript.

Może być przydatne dla prostych formularzy, na przykład:

- ustawienie budżetu,
- podanie podstawowych preferencji,
- formularz kontaktowy,
- proste filtrowanie katalogu.

Dla operacji na canvasie i geometrii prawdopodobnie nie będzie wystarczające. W tych obszarach należy użyć Imperative API.

## Istotne ograniczenia

### Strona musi być otwarta

Narzędzia wykonują kod JavaScript w kontekście strony, dlatego wymagana jest otwarta karta lub webview. Agent nie odkryje narzędzi strony, której nie odwiedził.

### WebMCP nie zastępuje backendu

WebMCP udostępnia agentowi możliwości interfejsu i logiki klienckiej. Nie zastępuje bazy danych, API katalogowego, uwierzytelnienia ani backendowego MCP działającego niezależnie od otwartej strony.

### Złożony interfejs wymaga wspólnego modelu stanu

W aplikacji z canvasem nie należy implementować osobnej logiki dla kliknięć użytkownika i osobnej dla WebMCP. Obie ścieżki powinny wywoływać te same komendy domenowe i aktualizować ten sam store.

### Standard nadal się zmienia

Nie wszystkie omawiane możliwości są stabilne lub zaimplementowane. Należy regularnie sprawdzać `implementation-status.md`, issues i dokumentację konkretnej wersji przeglądarki.

### Multimodalne argumenty są otwartym tematem

Obsługa binarnych i multimodalnych wejść oraz wyjść narzędzi nadal jest przedmiotem dyskusji w specyfikacji.

Dla Home Gym Creatora bezpieczny przepływ wygląda następująco:

1. użytkownik przesyła zdjęcie pokoju agentowi,
2. agent analizuje zdjęcie i zbiera wymiary referencyjne,
3. agent wywołuje zwykłe narzędzia WebMCP z ustrukturyzowaną geometrią,
4. aplikacja tworzy pokój i przeszkody,
5. użytkownik ręcznie zatwierdza lub poprawia rezultat.

Nie należy uzależniać MVP od bezpośredniego przekazywania obrazu jako argumentu WebMCP.

## Bezpieczeństwo i uprawnienia

WebMCP przekracza tradycyjną granicę zaufania pomiędzy stroną a agentem. Projekt powinien:

- używać `readOnlyHint` dla operacji, które nie zmieniają stanu,
- oznaczać dane zewnętrzne jako niezaufane, jeśli API na to pozwala,
- stosować istniejące uwierzytelnienie i autoryzację aplikacji,
- walidować wszystkie argumenty narzędzi po stronie aplikacji,
- nie ufać temu, że sam JSON Schema zastępuje walidację wykonania,
- zwracać wystarczająco dużo danych, aby agent i użytkownik mogli sprawdzić rezultat,
- ograniczać narzędzia do najmniejszego wymaganego zakresu,
- wyraźnie rozdzielać odczyt od mutacji,
- unikać wykonywania nieodwracalnych operacji bez potwierdzenia.

WebMCP jest ograniczone przez origin isolation oraz Permissions Policy. W szczególności konfiguracja `document.domain` może wyłączyć API, a cross-origin iframe wymaga odpowiedniej polityki `tools`.

## Lokalna konfiguracja Chrome

Według aktualnej dokumentacji lokalne testowanie wygląda następująco:

1. zainstaluj odpowiednią wersję Chrome wspierającą WebMCP,
2. otwórz `chrome://flags/#enable-webmcp-testing`,
3. ustaw flagę na `Enabled`,
4. ponownie uruchom Chrome,
5. otwórz aplikację bezpośrednio,
6. sprawdź zarejestrowane narzędzia, ich schematy, odpowiedzi i błędy.

Przed publicznym wdrożeniem należy sprawdzić aktualne wymagania origin trial i nagłówków HTTP.

## Kolejność korzystania ze źródeł

### Podczas projektowania produktu

1. OpenAI WebMCP Showcase — wzorce UX i scenariusze człowiek–agent.
2. Home Gym Creator product concept — własny problem i zakres projektu.
3. Best practices Chrome — strategia oraz granularność narzędzi.

### Podczas projektowania kontraktów narzędzi

1. oficjalna specyfikacja WebMCP,
2. dokumentacja Imperative API Chrome,
3. dokumentacja bezpieczeństwa,
4. status implementacji i issues w repozytorium.

### Podczas developmentu i debugowania

1. dokumentacja Chrome dla aktualnie używanej wersji,
2. Tool Inspector i dema z `webmcp-tools`,
3. `implementation-status.md`,
4. otwarte issues WebMCP,
5. przykładowe aplikacje i ich publiczne implementacje, jeśli są dostępne.

### Przed submission

1. oficjalny regulamin challenge'u,
2. aktualna dokumentacja OpenAI Docs dotycząca site tools,
3. dokumentacja Chrome i wymagania origin trial,
4. evals narzędzi w izolacji i scenariusza end-to-end,
5. test w świeżej sesji ChatGPT/Codex,
6. test w świeżej sesji Chrome.

## Powiązane dokumenty projektu

- [Koncepcja produktu](./PRODUCT_CONCEPT.md)
- [Wymagania hackathonu](./HACKATHON_REQUIREMENTS.md)

## Kontrakt implementacyjny dla fazy 4

Poniższe decyzje zostały sprawdzone 28 sierpnia 2026 na podstawie aktualnej
[specyfikacji WebMCP](https://webmachinelearning.github.io/webmcp/),
[Imperative API w Chrome](https://developer.chrome.com/docs/ai/webmcp/imperative-api) oraz
[zaleceń bezpieczeństwa Chrome](https://developer.chrome.com/docs/ai/webmcp/secure-tools).
Tabela rozdziela fakty z aktualnych źródeł od lokalnych decyzji Home Gym Creatora.

| Obszar | Fakt zweryfikowany w źródle pierwotnym | Decyzja projektu |
|---|---|---|
| Punkt wejścia | Imperative API jest dostępne jako `document.modelContext`; `navigator.modelContext` nie jest aktualnym kontraktem. | Wykrywać `document.modelContext?.registerTool` dopiero po hydratacji. |
| Rejestracja | `registerTool(tool, options)` zwraca `Promise` i może odrzucić rejestrację m.in. dla duplikatu nazwy, braku uprawnień lub niespełnionych wymagań bezpieczeństwa. | Rejestrować i oczekiwać oba narzędzia; każde odrzucenie oznacza niedostępny cały kontrakt katalogu. |
| Cleanup | `options.signal` wyrejestrowuje narzędzie po przerwaniu sygnału. | Jeden `AbortController` na zamontowany mostek; ten sam sygnał dla obu narzędzi; `abort()` przy wyjściu z route segmentu, remoncie Strict Mode i częściowej porażce. |
| Callback wykonania | Aktualny draft definiuje `execute(inputObject, { signal })`, ale lokalny runtime Codex In-app Browser sprawdzony 28 sierpnia 2026 nie przekazuje `signal` w opcjach callbacku. | Handler waliduje `unknown` przez Zod i obsługuje opcjonalny sygnał wykonania, gdy runtime go dostarcza; nie myli go z sygnałem lifecycle rejestracji. |
| Schemat wejścia | `inputSchema` jest obiektem JSON Schema; sam schemat reklamowany agentowi nie zastępuje walidacji aplikacyjnej. | Generować proste, ścisłe schematy obiektowe przez `z.toJSONSchema()`, z `additionalProperties: false`, bez konstrukcji niewspieranych przez JSON Schema. |
| Wynik | Wartość spełnionego callbacku jest serializowana do JSON; błąd callbacku lub wartość nieserializowalna powoduje błąd wykonania. | Zwracać wyłącznie zwykłe, stabilne koperty danych aplikacji; nie używać backendowego MCP `{ content: ... }`. |
| Adnotacje | Aktualny kontrakt udostępnia m.in. boolean `readOnlyHint`; oznacza on brak modyfikacji stanu. | Oba narzędzia katalogowe mają `annotations: { readOnlyHint: true }`. Lokalny, walidowany katalog nie wymaga `untrustedContentHint`. |
| Typowanie | Normatywny kontrakt jest opisany przez Web IDL; znalezione zewnętrzne paczki TypeScript nie są oficjalnym źródłem i mogą pozostawać za draftem. | Utrzymywać wąskie typy tylko przy adapterze WebMCP, bez globalnego rozszerzania `Document`. |
| Bezpieczeństwo | API wymaga secure context, origin-keyed agent cluster i polityki uprawnień `tools`; domyślny allowlist to `'self'`. | Faza 4 nie dodaje ekspozycji cross-origin ani specjalnych nagłówków. Odrzucona rejestracja daje nieblokujący fallback UI. |
| Zakres faz | Kontrakt standardu nie dowodzi dostępności w konkretnym środowisku jurora ani poprawnej konfiguracji publicznego originu. | Faza 4 testuje logikę lokalnie; faza 5 jest twardą bramą dla publicznego hostingu, discovery i realnego wywołania przez agenta. |

### Macierz weryfikacji i ograniczone niewiadome

| Właściciel | Eksperyment | Kryterium przejścia | Bezpieczny fallback |
|---|---|---|---|
| Faza 4 | Testy schematów, handlerów, serializacji, atomowej rejestracji, cleanupu i mostka React | Ścisłe wejścia oraz wszystkie planowane koperty są deterministyczne i serializowalne; niewspierana przeglądarka zachowuje ręczny katalog | Komunikat o niedostępności narzędzi bez wpływu na katalog |
| Faza 4 | Lokalny Chrome z aktualną flagą WebMCP: świeży load, bezpośredni detail route, nawigacja, remount i wywołania | Dokładnie dwa narzędzia, brak duplikatów, cleanup po wyjściu i poprawne wyniki | Nie zamykać fazy bez odnotowania brakującej próby runtime |
| Faza 5 | Publiczny secure origin i aktualne wymagania origin trial/nagłówków | Narzędzia rejestrują się bez `SecurityError`/`NotAllowedError` w środowisku docelowym | Skorygować konfigurację hostingu; nie tworzyć backendowego MCP jako obejścia |
| Faza 5 | Świeża sesja wspieranego Codex/ChatGPT: discovery, wyszukiwanie i details | Agent odkrywa narzędzia i poprawnie łączy `productId` z wyniku wyszukiwania z details | Zatrzymać dalsze fazy WebMCP i dostosować kontrakt do zweryfikowanego runtime |
| Faza 5 | Porównanie sygnatur callbacku `execute` i pomocniczego `executeTool()` w specyfikacji, Chrome oraz środowisku agenta | Wywołania działają zarówno w runtime przekazującym `{ signal }`, jak i w lokalnie zaobserwowanym runtime bez drugiego argumentu | Zachować opcjonalny adapter sygnału i nie używać `executeTool()` w kodzie produktu; helper służy wyłącznie do diagnostyki in-page |
| Fazy 8–12 | Puste/błędne stany projektu, sekwencja odczyt → wyszukiwanie → mutacja → walidacja → poprawka oraz evals | Pełny współdzielony scenariusz przechodzi w środowisku agenta | Nie rozszerzać read-only narzędzi katalogowych o przedwczesne mutacje |

Status implementacji, wersję Chrome, dostępne modele, origin trial i środowisko jurora trzeba
odświeżyć ponownie bezpośrednio przed nagraniem filmu i submission. Są to twierdzenia czasowe, a
nie trwałe założenia architektury.
