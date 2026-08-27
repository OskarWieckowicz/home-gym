# WebMCP — źródła i dokumentacja techniczna

> Stan informacji: 27 sierpnia 2026. WebMCP jest eksperymentalnym i rozwijającym się standardem. Przed wdrożeniem oraz nagraniem filmu należy ponownie sprawdzić specyfikację, status implementacji i zachowanie obsługiwanych przeglądarek.

## Trzy główne źródła

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

### 2. Repozytorium i specyfikacja WebMCP

**Repozytorium:** [github.com/webmachinelearning/webmcp](https://github.com/webmachinelearning/webmcp)

**Renderowana specyfikacja:** [webmachinelearning.github.io/webmcp](https://webmachinelearning.github.io/webmcp/)

Repozytorium jest głównym źródłem wiedzy o projektowanym standardzie. Zawiera specyfikację, explainery, status implementacji, kwestie bezpieczeństwa i aktywne dyskusje.

Najważniejsze dokumenty:

- [README / główny explainer](https://github.com/webmachinelearning/webmcp/blob/main/README.md)
- [Implementation status](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md)
- [Declarative API explainer](https://github.com/webmachinelearning/webmcp/blob/main/declarative-api-explainer.md)
- [Security and privacy questionnaire](https://github.com/webmachinelearning/webmcp/blob/main/security-privacy-questionnaire.md)
- [Otwarte issues](https://github.com/webmachinelearning/webmcp/issues)
- [TypeScript types — `webmcp-types`](https://www.npmjs.com/package/webmcp-types)

Repozytorium należy sprawdzać, gdy potrzebujemy odpowiedzi na pytania dotyczące:

- dokładnego kontraktu API,
- `document.modelContext`,
- rejestracji i wyrejestrowywania narzędzi,
- struktury definicji narzędzia,
- `inputSchema`,
- funkcji `execute`,
- dynamicznych zmian dostępnego zestawu narzędzi,
- uprawnień i iframe'ów,
- planowanych, ale jeszcze niedostępnych możliwości.

### 3. Dokumentacja WebMCP dla Chrome

**Polska wersja:** [developer.chrome.com/docs/ai/webmcp?hl=pl](https://developer.chrome.com/docs/ai/webmcp?hl=pl)

**Angielska wersja:** [developer.chrome.com/docs/ai/webmcp](https://developer.chrome.com/docs/ai/webmcp)

Dokumentacja Chrome opisuje praktyczną implementację WebMCP w przeglądarce, lokalne uruchamianie, dostępne API, ograniczenia oraz wymagania dotyczące bezpieczeństwa.

Powiązane dokumenty:

- [Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Declarative API](https://developer.chrome.com/docs/ai/webmcp/declarative-api)
- [Best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices)
- [Tool security](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [Origin trial](https://developer.chrome.com/origintrials/#/view_trial/4365061253447380993)

Dokumentację Chrome należy sprawdzać podczas:

- lokalnej konfiguracji przeglądarki,
- implementowania narzędzi,
- debugowania rejestracji,
- testowania schematów wejściowych,
- weryfikowania ograniczeń aktualnej wersji Chrome,
- przygotowania aplikacji do origin trial lub publicznego hostingu.

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

1. repozytorium i specyfikacja WebMCP,
2. dokumentacja Imperative API Chrome,
3. dokumentacja bezpieczeństwa,
4. status implementacji.

### Podczas developmentu i debugowania

1. dokumentacja Chrome dla aktualnie używanej wersji,
2. `implementation-status.md`,
3. otwarte issues WebMCP,
4. przykładowe aplikacje i ich publiczne implementacje, jeśli są dostępne.

### Przed submission

1. oficjalny regulamin challenge'u,
2. aktualna dokumentacja OpenAI Docs dotycząca site tools,
3. dokumentacja Chrome i wymagania origin trial,
4. test w świeżej sesji ChatGPT/Codex,
5. test w świeżej sesji Chrome.

## Powiązane dokumenty projektu

- [Koncepcja produktu](./PRODUCT_CONCEPT.md)
- [Wymagania hackathonu](./HACKATHON_REQUIREMENTS.md)

## Lista rzeczy do zbadania podczas implementacji

- [ ] Sprawdzić aktualny status Imperative API w docelowym Chrome.
- [ ] Zweryfikować dostępne pola `annotations`.
- [ ] Ustalić dokładny format odpowiedzi narzędzi w ChatGPT i Chrome.
- [ ] Sprawdzić obsługiwany zakres JSON Schema.
- [ ] Zweryfikować sposób dynamicznego rejestrowania i wyrejestrowywania narzędzi.
- [ ] Sprawdzić zachowanie narzędzi po nawigacji i przeładowaniu strony.
- [ ] Ustalić wymagane nagłówki origin isolation dla hostingu.
- [ ] Sprawdzić aktualne wymagania origin trial.
- [ ] Przetestować zachowanie narzędzi w błędnym i pustym stanie projektu.
- [ ] Przetestować długą sekwencję: odczyt → wyszukiwanie → mutacja → walidacja → poprawka.
- [ ] Porównać zachowanie tej samej aplikacji w ChatGPT i Chrome.
