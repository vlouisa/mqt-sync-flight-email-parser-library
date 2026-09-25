/** Vergelijkt JSON-compatibele testwaarden en gooit bij een afwijking. */
function assertEqual(actual, expected) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Verwacht ${JSON.stringify(expected)}, ontvangen ${JSON.stringify(actual)}`);
  }
}

/** Controleert zowel het fouttype als de foutmelding. */
function assertThrows(callback, name, message) {
  try {
    callback();
  } catch (error) {
    assertEqual(error.name, name);
    assertEqual(error.message, message);
    return;
  }
  throw new Error(`Verwacht een fout van type ${name}`);
}

/** Vult onbekende velden van een expliciet verwacht vluchtresultaat aan. */
function expectedFlight(fields) {
  return Object.assign({
    flightNumber: '',
    departureDate: '',
    departureTime: '',
    departureAirport: '',
    arrivalAirport: '',
    departureCity: '',
    arrivalCity: '',
    lookupStrategy: 'FLIGHT_NUMBER'
  }, fields);
}
