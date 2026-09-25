# Werkinstructies

## Project

Dit project is een Google Apps Script-library voor het uitlezen van vluchtgegevens uit boekingsmails. De runtime is Apps Script V8; bestanden delen een globale scope en gebruiken geen imports of exports.

- `flight-email-parser-service.js`: publiek toegangspunt `FlightEmailParserService.parse(rawText)` en selectie van de eerste passende parser.
- `_base-flight-email-parser.js`: gedeelde tekstverwerking, normalisatie, validatie en deduplicatie.
- `config.js`: registratie van parsers via factories.
- `*-flight-email-parser.js`: maatschappijgebonden herkenning en extractie voor KLM, Transavia, ITA Airways, Brussels Airlines, easyJet, Ryanair en Eurowings.
- `flight-parser-error.js`: specifieke fout voor parsing zonder gevonden vluchten.
- `test/integration/flight-email-parser-service-tests.js`: handmatige integratiecontrole met Gmail-berichten onder het label `Flights/Inbox`.
- `test/unit/` en `test/helpers/`: lokale unit-tests met synthetische mailfragmenten en gedeelde assertions.
- `scripts/unit-test-suites.cjs`: expliciete testselectie en laadvolgorde voor de centrale testrunner.
- `package.json` en `package-lock.json`: lokale development dependency op `../mqt-test-runner` en het commando `npm run test:unit`.
- `appsscript.json` en `.clasp.json`: runtime- en deploymentconfiguratie.

## Aanpak

- Lees de betrokken parser en de gedeelde basis voordat je wijzigingen maakt.
- Houd wijzigingen gericht op de opdracht. Voer geen brede refactor of gedragswijziging uit zonder aanleiding.
- Behoud Apps Script-compatibiliteit. Introduceer geen Node.js-afhankelijkheden, module-exports of buildstap in productiecode zonder expliciete noodzaak.
- Ga er niet vanuit dat Node.js- of browser-API's beschikbaar zijn in Apps Script. Mappen vormen geen JavaScript-namespaces; voorkom conflicterende globale namen.
- Volg de bestaande stijl: twee spaties inspringing, enkele aanhalingstekens en Nederlandse JSDoc-toelichting waar die helpt.
- Beschrijf in JSDoc de parameters, uitvoer en relevante foutvoorwaarden. Houd voor publieke entrypoints zoals `FlightEmailParserService.parse` ook de geretourneerde velden en mogelijke fouten actueel.
- Houd maatschappijgebonden patronen in de betreffende parser; plaats algemeen bruikbare normalisatie in de basisklasse.
- Behandel verschillen tussen parsers niet automatisch als fouten: mailformaten verschillen per maatschappij. Deel logica alleen wanneer het bedoelde gedrag daadwerkelijk overeenkomt.
- Registreer nieuwe parsers in `CONFIG.flightEmailParsers`. Controleer daarbij het effect van de volgorde: de dispatcher kiest momenteel de eerste match.
- Controleer bij niet-triviale wijzigingen ook callers, configuratie, tests en externe effecten. Baseer conclusies op de implementatie, niet uitsluitend op comments.
- Beschrijf bij grotere wijzigingen vooraf kort de kleinste passende aanpak en de impact op publieke contracten, parserselectie, normalisatie en deduplicatie waar relevant. Dit introduceert geen extra goedkeuringsstap voor al opgedragen werk.
- Behoud publieke en globale namen. Controleer vóór hernoemen ook stringreferenties en externe aanroepers.
- Gebruik Engelse identifiers, `camelCase` voor functies en variabelen, `PascalCase` voor klassen en een afsluitende `_` voor interne helpers waar de bestaande code dit doet. Vermijd formatting-only wijzigingen buiten de taak.

## Git en clasp

De lokale repository is de bron voor wijzigingen. Gebruik `clasp` voor synchronisatie met Google Apps Script. Controleer vóór Git- en clasp-operaties de werkboom en houd bestaande wijzigingen van de gebruiker intact.

- Voer `git commit`, `git push`, `clasp push`, `clasp deploy`, `clasp redeploy` en andere remote wijzigingen alleen uit wanneer de gebruiker die expliciet heeft opgedragen of toegestaan.
- Werk eerst lokaal, voer relevante controles uit en beschrijf de diff. Als toestemming voor de gewenste operatie al is gegeven, vraag die niet opnieuw.
- Gebruik `clasp pull` niet automatisch bij niet-gecommitte lokale wijzigingen; controleer eerst of deze kunnen worden overschreven.
- Controleer vóór een toegestane `clasp push` het doelproject en de uploadselectie. `.clasp.json` neemt submappen mee en heeft een lege `filePushOrder`; controleer bij nieuwe test- of toolingbestanden of de uploadselectie moet worden aangepast.
- Wijzig de projectkoppeling, runtimeconfiguratie of deploymentconfiguratie alleen als de taak dat vereist en beschrijf de impact.

### Korte releaseopdrachten

| Opdracht van de gebruiker | Uitvoering |
| --- | --- |
| `git commit` | Controleer de diff en staging area, stage en commit alleen wijzigingen van de huidige taak. Voer geen clasp-operatie of `git push` uit. |
| `clasp push` | Push de gereviewde lokale Apps Script-code. Maak geen Git-commit en voer geen nieuwe inhoudelijke codewijzigingen uit. |
| `git commit + clasp push` | Commit de taakwijzigingen en voer uitsluitend na een succesvolle commit `clasp push` uit. Stop als de commit mislukt. |

Deze opdrachten gelden als expliciete toestemming voor de beschreven operaties. Ze geven geen toestemming voor `git push`, `clasp deploy`, `clasp redeploy` of andere remote operaties.

Commitberichten zijn kort, in het Nederlands en gebruiken `<onderwerp>: <message>`. Schrijf beide delen in kleine letters, behalve waar hoofdletters inhoudelijk noodzakelijk zijn. Gebruik bijvoorbeeld `feat`, `fix`, `test`, `docs`, `refactor` of `chore` als onderwerp.

Voorbeelden:

- `docs: leg werkafspraken voor git en clasp vast`
- `fix: herken de juiste luchthavencodes in klm-mails`
- `test: voeg voorbeelden voor meerdere vluchtsegmenten toe`

Rapporteer na uitvoering de gebruikte commit message en het resultaat van de commit en/of push.

### Authenticatie en secrets

- Lees, toon, kopieer of wijzig `.clasprc.json` niet. Neem OAuth-tokens, API-keys of andere credentials nooit op in code, logs, fixtures, commits of documentatie.
- Rapporteer clasp-authenticatiefouten. Laat de gebruiker indien nodig interactief `clasp login` uitvoeren en de Google OAuth-flow zelf afronden.
- Probeer ontbrekende authenticatie niet te herstellen met alternatieve credentials.

## Parsercontract

- Iedere parser implementeert `canParse(rawText)` en `parse(rawText)`.
- `parse` geeft een array van flight candidates terug. De service gooit een fout als geen parser past of geen vluchten gevonden worden.
- De gedeelde normalisatie levert `flightNumber`, `departureDate`, `departureTime`, `departureAirport`, `arrivalAirport`, `departureCity`, `arrivalCity` en `lookupStrategy`.
- Datums gebruiken `yyyy-MM-dd`, tijden `HH:mm` en vluchtnummers hoofdletters zonder spaties. Onbekende tekstvelden zijn doorgaans lege strings.
- Een kandidaat is momenteel bruikbaar bij een vluchtnummer plus vertrekdatum, of bij vertrekdatum, vertrektijd en beide luchthavencodes.
- Houd bestaande veldnamen en lookupstrategieën (`FLIGHT_NUMBER`, `ROUTE_TIME`) compatibel met aanroepers. Beschrijf bewuste wijzigingen aan het contract.

## Samenwerking met Gig Sync

- `../mqt-gig-sync-app` gebruikt deze library via `Flight.FlightEmailParserService.parse(rawText)`. Inspecteer bij contractwijzigingen de actuele callers en het manifest van die repository wanneer beschikbaar.
- Houd mailparsing in deze library. Gmail-import, providerlookups, Sheets- en Calendar-verwerking horen bij de aanroepende applicatie.
- Controleer bij wijzigingen aan velden, foutafhandeling, normalisatie of duplicaatdetectie ook de aannames van de aanroepende applicatie. Wijzig die applicatie niet automatisch als onderdeel van een librarywijziging.
- Benoem expliciet welke aannames over externe aanroepers niet konden worden geverifieerd, bijvoorbeeld als de Gig Sync-repository ontbreekt. Presenteer compatibiliteit dan niet als gecontroleerd.
- Controleer bij publicatie of de aanroepende applicatie de library in development mode gebruikt; een push kan dan direct invloed hebben op die applicatie. Beschrijf die impact bij de release.
- Behandel vertrekdatum en vertrektijd als de kalenderdatum en kloktijd uit de mail. Introduceer geen impliciete UTC-conversie of nieuwe tijdzonestrategie in een niet-gerelateerde wijziging.

## Verificatie

- Gebruik de centrale runner uit `../mqt-test-runner` via de lokale npm-development dependency. Zorg dat deze naastliggende map aanwezig is en een Node.js-versie beschikbaar is die voldoet aan `engines.node` in `package.json` (inclusief de eisen van c8); installeer met `npm ci` en voer tests uit met `npm run test:unit`. Er is geen CI-configuratie ingericht.
- Voer `npm run test:coverage` uit voor coverage via c8. De configuratie in `package.json` meet alle productie-JavaScriptbestanden in de projectroot en sluit tests en tooling uit. Het HTML-rapport staat in `coverage/index.html`; daarnaast verschijnen terminal- en JSON-rapporten. Coverage meet uitvoering, niet de correctheid of volledigheid van ondersteunde mailvarianten.
- Houd suites expliciet geselecteerd in `scripts/unit-test-suites.cjs`. Iedere synchrone test draait in een nieuwe VM-context zonder echte Google-services of Node-API's. Fixtures, assertions en eventuele mocks blijven in deze repository; de runner is geen beveiligingssandbox voor onbekende code.
- De tests controleren basisgevallen voor alle zeven maatschappijen, route/tijdherkenning, retourvluchten, deduplicatie, datumformaten en foutafhandeling. Dit is geen volledige regressiedekking van alle mailvarianten of bekende aandachtspunten.
- Laad `test/integration/` niet in de lokale suites. Houd `test/unit/`, `test/helpers/`, `scripts/`, npm-bestanden, `node_modules/` en coverage buiten clasp-uploads via `.claspignore`; controleer de selectie bij wijzigingen met `clasp status`. De handmatige controles onder `test/integration/` worden wel naar Apps Script meegenomen.
- De lokale npm-link gebruikt direct de gedeelde runnerbroncode. Wijzigingen aan die runner kunnen ook andere aangesloten projecten raken; behandel runnerwijzigingen als een aparte taak.
- `test/integration/flight-email-parser-service-tests.js` gebruikt `GmailApp` en echte mailboxinhoud. Deze controle rapporteert of parsing slaagt, maar vergelijkt de gevonden velden niet met verwachte waarden.
- Gebruik bij parserwijzigingen bij voorkeur kleine synthetische of geanonimiseerde fixtures met expliciete verwachte resultaten. Controleer ook relevante negatieve gevallen en meerdere vluchtsegmenten.
- Controleer bij wijzigingen aan de basisklasse de gevolgen voor alle betrokken maatschappijen.
- Een lokale JavaScript-controle vereist een beschikbare runtime en zo nodig stubs voor Apps Script-services zoals `Utilities`. Vermeld dat zo'n controle geen Apps Script-integratietest is.
- Rapporteer welke controles daadwerkelijk zijn uitgevoerd en welke niet konden worden uitgevoerd. Claim geen geslaagde test op basis van alleen code-inspectie.
- Vermeld bij afronding de gewijzigde bestanden en het gewijzigde gedrag, de uitgevoerde verificatie, resterende beperkingen en relevante risico's. Benoem eventuele nog benodigde handmatige verificatie; houd de rapportage passend bij de omvang van de wijziging.
- Gebruik geen echte persoonsgegevens of volledige boekingsmails in nieuwe fixtures, logs of documentatie.
- Inspecteer tests en diagnostische helpers vóór uitvoering op externe afhankelijkheden en side effects. Een naam met `test` garandeert niet dat een functie veilig is.
- Voer tests die echte gegevens of externe services wijzigen alleen uit met expliciete toestemming die deze effecten omvat. De huidige Gmail-controle leest berichten en logt metadata; behandel die uitvoer als persoonsgegevens.
- Wijzig assertions niet uitsluitend om foutief gedrag te laten slagen. Introduceer geen nieuw testframework als onderdeel van een niet-gerelateerde taak.

## Bekende aandachtspunten

Deze punten beschrijven de huidige implementatie; het zijn geen eisen om dit gedrag te behouden of om alles bij iedere opdracht te repareren.

- De KLM-regex kan de eerste drie letters van een luchthavennaam als IATA-code lezen, bijvoorbeeld `Fiu` uit `Fiumicino` in plaats van `FCO`.
- Brede maatschappijherkenning en selectie van de eerste match kunnen de verkeerde parser kiezen; de service probeert na een leeg resultaat geen volgende parser.
- Parsers kappen resultaten af met `slice`, waardoor extra segmenten zonder melding verdwijnen.
- Base64-verwerking selecteert geen MIME-inhoudstype en kan niet-gecodeerde mailtekst verdringen. Niet alle parsers gebruiken dezelfde tekstvoorbereiding.
- Datum- en tijdnormalisatie controleren geen volledige kalender- of klokgeldigheid.
- Route/tijdherkenning bij ITA en Brussels verwerkt alleen de eerste match en kan overlappen met vluchtnummerherkenning.
- KLM leest `arrivalTime` uit, maar de gedeelde normalisatie neemt dit veld niet op in de uitvoer.
