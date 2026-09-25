/**
 * Parser voor Brussels Airlines flight e-mails.
 *
 * Ondersteunt:
 * - Brussels Airlines mails met SN-vluchtnummer;
 * - Brussels Airlines mails zonder vluchtnummer, maar met route/tijd.
 */
class BrusselsAirlinesFlightEmailParser extends BaseFlightEmailParser {
  /**
   * Controleert of deze parser geschikt is voor de e-mailtekst.
   *
   * @param {string} rawText Plain-text e-mailinhoud.
   * @returns {boolean} True als dit een Brussels Airlines e-mail lijkt.
   */
  canParse(rawText) {
    const text = this.normalizeText(rawText);

    return /Brussels Airlines|brusselsairlines\.com|\bSN\s?\d{3,4}\b/i.test(text);
  }

  /**
   * Parseert Brussels Airlines e-mails naar flight candidates.
   *
   * @param {string} rawText Plain-text e-mailinhoud.
   * @returns {Object[]} Parsed flight candidates.
   */
  parse(rawText) {
    const text = this.normalizeText(rawText);
    const flights = [];

    this.parseFlightNumberCandidates_(text, flights);
    this.parseRouteTimeCandidates_(text, flights);

    return this.dedupeFlights(flights).slice(0, 2);
  }

  /**
   * Parseert Brussels Airlines blokken met vluchtnummer.
   *
   * @param {string} text Genormaliseerde e-mailtekst.
   * @param {Object[]} flights Output array.
   * @returns {void}
   */
  parseFlightNumberCandidates_(text, flights) {
    const regex =
      /(\d{1,2}\.\d{1,2}\.\d{4})\s*-\s*\d{1,2}:\d{2}[\s\S]{0,160}?\b(SN\s?\d{3,4})\b/gi;

    let match;

    while ((match = regex.exec(text)) !== null) {
      flights.push({
        flightNumber: this.normalizeFlightNumber(match[2]),
        departureDate: this.normalizeDate(match[1]),
        lookupStrategy: 'FLIGHT_NUMBER'
      });
    }
  }

  /**
   * Parseert Brussels Airlines blokken zonder vluchtnummer, maar met route en tijd.
   *
   * Voorbeeld:
   * Departure Date 05.06.2026 Departure Time 10:10
   * Departure IATA Code FCO
   * Arrival IATA Code BRU
   *
   * @param {string} text Genormaliseerde e-mailtekst.
   * @param {Object[]} flights Output array.
   * @returns {void}
   */
  parseRouteTimeCandidates_(text, flights) {
    const dateTimeMatch = text.match(
      /Departure Date\s+(\d{1,2}\.\d{1,2}\.\d{4})\s+Departure Time\s+(\d{1,2}:\d{2})/i
    );

    if (!dateTimeMatch) {
      return;
    }

    const departureAirport = this.extractIataCode_(text, 'Departure');
    const arrivalAirport = this.extractIataCode_(text, 'Arrival');

    if (!departureAirport || !arrivalAirport) {
      return;
    }

    flights.push({
      departureDate: this.normalizeDate(dateTimeMatch[1]),
      departureTime: this.normalizeTime(dateTimeMatch[2]),
      departureAirport,
      arrivalAirport,
      departureCity: this.extractCity_(text, 'Departure'),
      arrivalCity: this.extractCity_(text, 'Arrival'),
      lookupStrategy: 'ROUTE_TIME'
    });
  }

  /**
   * Haalt een IATA-code uit de e-mail.
   *
   * @param {string} text Genormaliseerde e-mailtekst.
   * @param {'Departure'|'Arrival'} type Type luchthavenveld.
   * @returns {string} IATA-code.
   */
  extractIataCode_(text, type) {
    const regex = new RegExp(`${type}\\s+IATA\\s+Code\\s+([A-Z]{3})`, 'i');
    const match = text.match(regex);

    if (!match) {
      return '';
    }

    return this.normalizeAirportCode(match[1]);
  }

  /**
   * Haalt een stadnaam uit de e-mail.
   *
   * @param {string} text Genormaliseerde e-mailtekst.
   * @param {'Departure'|'Arrival'} type Type stadveld.
   * @returns {string} Stadnaam.
   */
  extractCity_(text, type) {
    const regex = new RegExp(`${type}\\s+City\\s+([^\\n]+)`, 'i');
    const match = text.match(regex);

    if (!match) {
      return '';
    }

    return String(match[1]).trim();
  }
}