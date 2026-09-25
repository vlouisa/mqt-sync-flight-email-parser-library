# MQT Flight Email Parser

Google Apps Script-library voor het uitlezen van vluchtgegevens uit boekingsmails. Ondersteunt specifieke mailformaten van KLM, Transavia, ITA Airways, Brussels Airlines, easyJet, Ryanair en Eurowings.

De library levert vluchtkandidaten uit de berichttekst. De aanroepende applicatie, zoals MQT Gig Sync, gebruikt die kandidaten om volledige vluchtgegevens via een vlucht-API op te halen en te verwerken.

## Gebruik

Voeg het Apps Script-project toe als library met identifier `Flight`. De projectkoppeling staat in `.clasp.json`. Geef bij voorkeur de plain-text berichtinhoud door, bijvoorbeeld afkomstig van `GmailMessage.getPlainBody()`.

```javascript
const mailText = `KLM
zaterdag 9 mei 2026 - 12:45
Rome (FCO)
KL1604
15:10
Amsterdam (AMS)`;

const flights = Flight.FlightEmailParserService.parse(mailText);
```

Binnen het libraryproject zelf gebruik je `FlightEmailParserService.parse(mailText)` zonder het voorvoegsel `Flight`.

Het voorbeeld levert:

```json
[
  {
    "flightNumber": "KL1604",
    "departureDate": "2026-05-09",
    "departureTime": "12:45",
    "departureAirport": "FCO",
    "arrivalAirport": "AMS",
    "departureCity": "",
    "arrivalCity": "",
    "lookupStrategy": "FLIGHT_NUMBER"
  }
]
```

## Uitvoer en fouten

`parse` retourneert een array van genormaliseerde, gededupliceerde kandidaten. Welke velden beschikbaar zijn, hangt af van de maatschappij en het mailformaat.

| Veld | Betekenis |
| --- | --- |
| `flightNumber` | Vluchtnummer in hoofdletters, zonder spaties. |
| `departureDate` | Vertrekdatum uit de mail, als `yyyy-MM-dd`. |
| `departureTime` | Vertrektijd uit de mail, als `HH:mm`. |
| `departureAirport`, `arrivalAirport` | IATA-luchthavencodes. |
| `departureCity`, `arrivalCity` | Plaatsnamen indien uitgelezen. |
| `lookupStrategy` | `FLIGHT_NUMBER` of `ROUTE_TIME`. |

Onbekende gegevens zijn lege strings. Datums en tijden worden niet naar UTC omgerekend. Aankomstdatum en aankomsttijd maken momenteel geen deel uit van de genormaliseerde uitvoer.

Een kandidaat moet een vluchtnummer en vertrekdatum bevatten, of een vertrekdatum, vertrektijd en beide luchthavencodes. `FLIGHT_NUMBER` geeft zoeken op vluchtnummer en datum aan; `ROUTE_TIME` geeft zoeken op route, datum en tijd aan. Gig Sync gebruikt deze strategie om de vluchtlookup te kiezen.

| Situatie | Fout |
| --- | --- |
| Geen parser herkent de tekst | `Error`: `Geen geschikte flight email parser gevonden.` |
| De geselecteerde parser vindt geen bruikbare kandidaten | `FlightParserError`: `Geen vluchtnummer(s) en vertrekdatum(s) gevonden.` |

De service kiest de eerste passende parser uit `src/config.js`. Hij probeert na een leeg resultaat geen volgende parser.

## Projectstructuur

```text
src/
  config.js                         Registratie van parsers
  flight-email-parser-service.js    Publiek toegangspunt
  flight-parser-error.js            Specifiek fouttype
  parsers/
    _base-flight-email-parser.js    Gedeelde verwerking
    …                              Maatschappijparsers
scripts/
  unit-test-suites.cjs              Testselectie en fixture-invoer
test/
  unit/                            Geïsoleerde tests en regressietests
  helpers/                         Assertions
  fixtures/                        Geanonimiseerde mailvoorbeelden
  integration/                     Handmatige Gmail-controle
appsscript.json                     Apps Script V8-configuratie
```

Productiecode gebruikt de gedeelde globale scope van Apps Script, zonder imports, exports of buildstap. Mappen veranderen de publieke aanroep niet.

## Lokaal testen

De centrale testrunner moet naast deze repository staan:

```text
mqt/
  mqt-test-runner/
  mqt-sync-flight-email-parser-library/
```

Gebruik een Node.js-versie die voldoet aan `engines.node` in `package.json`: Node 20 vanaf 20.19, Node 22 vanaf 22.12, of Node 23 en hoger. Node 24 voldoet aan deze eis.

```sh
npm ci
npm run test:unit
npm run test:coverage
```

De runner voert expliciet geselecteerde synchrone tests uit in afzonderlijke VM-contexten, zonder echte Google-services. De lokale npm-link gebruikt direct de broncode van `../mqt-test-runner`.

Coverage wordt via c8 gemeten over `src/**/*.js`. Het HTML-rapport staat in `coverage/index.html`; daarnaast verschijnen terminal- en JSON-rapporten. Coverage meet welke code wordt uitgevoerd, niet of alle mailvarianten correct worden verwerkt.

De KLM-regressietests gebruiken tekstfixtures. Zie [de fixturebeschrijving](test/fixtures/README.md) voor anonimisering, omzetting van de bronmails en verwachte vluchtgegevens. Nieuwe tests moeten expliciet worden geregistreerd in `scripts/unit-test-suites.cjs`.

## Handmatige Gmail-integratiecontrole

Voer in Apps Script desgewenst `testFlightEmailParserServiceForFoundThreadIds()` uit. Deze functie staat in `test/integration/flight-email-parser-service-tests.js` en leest alle berichten uit threads met het Gmail-label `Flights/Inbox`.

De controle logt berichtmetadata, gevonden vluchten en fouten. De uitvoer kan persoonsgegevens bevatten. Er zijn geen assertions op verwachte vluchtgegevens: een parse zonder exception geldt als succes. Deze functie wordt niet door de lokale unit-tests uitgevoerd.

## Synchronisatie met Apps Script

De lokale bestanden zijn de bron voor wijzigingen. Controleer het gekoppelde project in `.clasp.json` en de uploadselectie met:

```sh
clasp status
```

Na review en expliciete opdracht kan `clasp push` de code synchroniseren. `.claspignore` sluit npm-bestanden, tooling, unit-tests, fixtures en coverage uit. Productiecode, het manifest en de handmatige integratiecontrole worden wel meegenomen.

Gig Sync gebruikt deze library momenteel in development mode. Een push kan daardoor direct effect hebben op die applicatie. Controleer de actuele libraryconfiguratie van de aanroeper bij publicatie.

Git-commits, Git-pushes en clasp-operaties zijn afzonderlijke acties. Zie [AGENTS.md](AGENTS.md) voor werkafspraken. Gebruik `clasp pull` niet zonder eerst te controleren of lokale wijzigingen kunnen worden overschreven. Rond benodigde authenticatie interactief af met `clasp login`; neem credentials nooit op in de repository.

## Beperkingen

- Ondersteuning geldt voor de geïmplementeerde mailformaten, niet voor iedere taal of template van een maatschappij.
- HTML- en MIME-verwerking verschillen per parser en vormen geen algemene MIME-decoder. Plain-text invoer heeft de voorkeur.
- Parsers begrenzen het aantal resultaten momenteel tot twee, drie of vier kandidaten, afhankelijk van de maatschappij.
- Datum- en tijdnormalisatie controleren niet volledig of kalenderdatums en kloktijden geldig zijn.
- Route/tijdherkenning bij ITA en Brussels verwerkt alleen de eerste match en kan overlappen met vluchtnummerherkenning.
