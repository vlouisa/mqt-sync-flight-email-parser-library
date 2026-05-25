/**
 * Dispatcher voor vluchtmail-parsers.
 *
 * Kiest automatisch de juiste parser op basis van de mailtekst.
 */
var FlightEmailParserService = {
  getParsers() {
    return CONFIG.flightEmailParsers.map(factory => factory());
  },

  /**
   * Parse vluchtgegevens uit een e-mailtekst.
   *
   * @param {string} rawText Plain text of HTML-stripped mail body.
   * @returns {{flightNumber: string, departureDate: string}[]} Gevonden vluchten.
   */
  parse(rawText) {
    const text = String(rawText || '');

    const parser = this.getParsers().find(parser => parser.canParse(text));

    if (!parser) {
      throw new Error('Geen geschikte flight email parser gevonden.');
    }

    const flights = parser.parse(text);

    if (!flights.length) {
      throw new FlightParserError('Geen vluchtnummer(s) en vertrekdatum(s) gevonden.');
    }

    return flights;
  }
};