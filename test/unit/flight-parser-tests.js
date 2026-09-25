// Synthetische mailfragmenten; geen mailbox, persoonsgegevens of externe services.
function testKlmFlight() {
  const mail = 'KLM\nzaterdag 9 mei 2026 - 12:45\nRome (FCO)\nKL1604\n15:10\nAmsterdam (AMS)';
  assertEqual(FlightEmailParserService.parse(mail), [expectedFlight({
    flightNumber: 'KL1604', departureDate: '2026-05-09', departureTime: '12:45',
    departureAirport: 'FCO', arrivalAirport: 'AMS'
  })]);
}

function testTransaviaFlight() {
  const mail = '<p>Transavia</p><p>vrijdag 17-07-2026 HV 1234 12 : 20 14:30</p>';
  assertEqual(FlightEmailParserService.parse(mail), [expectedFlight({
    flightNumber: 'HV1234', departureDate: '2026-07-17', departureTime: '12:20'
  })]);
}

function testItaFlight() {
  assertEqual(FlightEmailParserService.parse('ITA Airways\n06.06.2026 - 11:55\nAZ107'), [expectedFlight({
    flightNumber: 'AZ107', departureDate: '2026-06-06', departureTime: '11:55'
  })]);
}

function testBrusselsFlight() {
  assertEqual(FlightEmailParserService.parse('Brussels Airlines\n05.06.2026 - 10:10\nSN1234'), [expectedFlight({
    flightNumber: 'SN1234', departureDate: '2026-06-05'
  })]);
}

function testEasyJetFlight() {
  assertEqual(FlightEmailParserService.parse('easyJet EJU2990\nVertrektijd: vr 17 jul. 2026 12:20'), [expectedFlight({
    flightNumber: 'EJU2990', departureDate: '2026-07-17', departureTime: '12:20'
  })]);
}

function testRyanairReturnAndDuplicates() {
  const outbound = 'FR5815\nSun, 12 Jul 26';
  const inbound = 'FR5816\nSun, 19 Jul 2026';
  assertEqual(FlightEmailParserService.parse(`Ryanair\n${outbound}\n${outbound}\n${inbound}`), [
    expectedFlight({ flightNumber: 'FR5815', departureDate: '2026-07-12' }),
    expectedFlight({ flightNumber: 'FR5816', departureDate: '2026-07-19' })
  ]);
}

function testEurowingsFlight() {
  assertEqual(FlightEmailParserService.parse('Flight: 21.12.2026 | Flight Number EW 9883'), [expectedFlight({
    flightNumber: 'EW9883', departureDate: '2026-12-21'
  })]);
}

function testItaRouteFallback() {
  const mail = 'ITA Airways\nVertrekdatum 06.06.2026 Vertrektijd 11:55\nIATA-code vertrek AMS\nIATA code aankomstluchthaven FCO\nPlaats van vertrek Amsterdam\nStad van aankomst Rome';
  assertEqual(FlightEmailParserService.parse(mail), [expectedFlight({
    departureDate: '2026-06-06', departureTime: '11:55', departureAirport: 'AMS',
    arrivalAirport: 'FCO', departureCity: 'Amsterdam', arrivalCity: 'Rome', lookupStrategy: 'ROUTE_TIME'
  })]);
}

function testBrusselsRouteFallback() {
  const mail = 'Brussels Airlines\nDeparture Date 05.06.2026 Departure Time 10:10\nDeparture IATA Code FCO\nArrival IATA Code BRU\nDeparture City Rome\nArrival City Brussels';
  assertEqual(FlightEmailParserService.parse(mail), [expectedFlight({
    departureDate: '2026-06-05', departureTime: '10:10', departureAirport: 'FCO',
    arrivalAirport: 'BRU', departureCity: 'Rome', arrivalCity: 'Brussels', lookupStrategy: 'ROUTE_TIME'
  })]);
}

function testUnknownMailThrows() {
  ['', null, 'Dit is geen vluchtboeking.'].forEach(mail => {
    assertThrows(() => FlightEmailParserService.parse(mail), 'Error', 'Geen geschikte flight email parser gevonden.');
  });
}

function testRecognizedMailWithoutFlightThrows() {
  ['KLM', 'Transavia', 'ITA Airways', 'Brussels Airlines', 'easyJet', 'Ryanair', 'Eurowings'].forEach(mail => {
    assertThrows(() => FlightEmailParserService.parse(mail), 'FlightParserError', 'Geen vluchtnummer(s) en vertrekdatum(s) gevonden.');
  });
}

function testIncompleteRouteThrows() {
  const mail = 'Brussels Airlines\nDeparture Date 05.06.2026 Departure Time 10:10\nDeparture IATA Code FCO';
  assertThrows(() => FlightEmailParserService.parse(mail), 'FlightParserError', 'Geen vluchtnummer(s) en vertrekdatum(s) gevonden.');
}

function testDateFormats() {
  const parser = new BaseFlightEmailParser();
  ['9-5-2026', '9/5/2026', '9.5.2026', '2026-5-9', '9 mei 2026', '9 May 2026', 'Sat, 9 May 26'].forEach(value => {
    assertEqual(parser.normalizeDate(value), '2026-05-09');
  });
  assertEqual(parser.normalizeDate('onbekend'), '');
}

function testMissingCandidateFields() {
  assertEqual(new BaseFlightEmailParser().dedupeFlights([
    {}, { flightNumber: 'KL1604' }, { departureDate: '2026-05-09' },
    { departureDate: '2026-05-09', departureTime: '12:45', departureAirport: 'AMS' }
  ]), []);
}
