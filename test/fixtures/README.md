# KLM-fixtures

Deze twee tekstfixtures zijn afgeleid van echte berichten. De oorspronkelijke invoer was een ruwe MIME-mail met quoted-printable HTML. De fixtures bevatten gedecodeerde, ingekorte berichttekst; ze testen geen MIME-decoding en zijn geen exacte export van Gmail `getPlainBody()`.

## Anonimisering

- Beide berichten: naam en aanhef vervangen door `Test Reiziger`; boekingscodes vervangen door `TEST01` en `TEST02`.
- Bericht 2: ticketnummer vervangen door 13 nullen, frequentflyernummer door 12 nullen en stoelnummer door `12A`.
- Verwijderd: alle transport- en afzender/ontvangerheaders, e-mailadressen, IP-adressen, bericht- en trackingidentificaties, handtekeningen en MIME-boundaries.
- Verwijderd: HTML/CSS, afbeeldingen, persoonlijke boekingslinks, trackinglinks en pixels, betalingsgegevens, bedragen, miles, uitgiftegegevens, marketing, contactsecties, veelgestelde vragen en juridische voorwaarden.

Vluchtnummers, datums, tijden, routes en de interpunctie van luchthavenvermeldingen zijn behouden. De vluchtblokken behouden hun tekstvolgorde; HTML-opmaak en witruimte zijn naar leesbare tekstregels omgezet. Daarmee blijven reisdetails herkenbaar, maar zijn directe persoonsgegevens en boekingsidentificaties verwijderd.

## Verwachte vluchtgegevens

| Fixture | Vlucht | Vertrekdatum | Vertrektijd | Van | Naar | Aankomsttijd |
| --- | --- | --- | --- | --- | --- | --- |
| klm-booking-1.txt | KL1604 | 2026-06-27 | 12:45 | FCO | AMS | 15:10 |
| klm-booking-1.txt | KL1603 | 2026-06-28 | 09:30 | AMS | FCO | 11:45 |
| klm-booking-2.txt | KL1602 | 2026-07-11 | 10:35 | FCO | AMS | 13:10 |

Deze gegevens zijn uit de berichtinhoud afgeleid, niet uit de huidige parseruitvoer. `arrivalTime` maakt momenteel geen deel uit van het genormaliseerde uitvoercontract.

De fixtures worden door `scripts/unit-test-suites.cjs` als tekst ingelezen en aan de geïsoleerde testcontext doorgegeven. De twee tests staan in `test/unit/klm-flight-email-parser-tests.js` en draaien mee met `npm run test:unit` en `npm run test:coverage`.
