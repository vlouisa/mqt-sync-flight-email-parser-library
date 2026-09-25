/** Controleert beide trajecten uit de boekingsbevestiging, inclusief luchthavencodes. */
function testKlmBookingReturnFlights() {
  const parser = new KlmFlightEmailParser();
  assertEqual(parser.canParse(KLM_FIXTURES.booking), true);
  assertEqual(parser.parse(KLM_FIXTURES.booking), [
    expectedFlight({
      flightNumber: 'KL1604',
      departureDate: '2026-06-27',
      departureTime: '12:45',
      departureAirport: 'FCO',
      arrivalAirport: 'AMS'
    }),
    expectedFlight({
      flightNumber: 'KL1603',
      departureDate: '2026-06-28',
      departureTime: '09:30',
      departureAirport: 'AMS',
      arrivalAirport: 'FCO'
    })
  ]);
}

/** Controleert het e-ticket met codes na komma's en een afzonderlijke aankomstdatum. */
function testKlmTicketCommaSeparatedAirports() {
  const parser = new KlmFlightEmailParser();
  assertEqual(parser.canParse(KLM_FIXTURES.ticket), true);
  assertEqual(parser.parse(KLM_FIXTURES.ticket), [
    expectedFlight({
      flightNumber: 'KL1602',
      departureDate: '2026-07-11',
      departureTime: '10:35',
      departureAirport: 'FCO',
      arrivalAirport: 'AMS'
    })
  ]);
}
