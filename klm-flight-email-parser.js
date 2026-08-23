/**
 * Parser voor KLM flight e-mails.
 *
 * Ondersteunt KLM mails met blokken zoals:
 * - zaterdag 9 mei 2026 - 12:45
 * - Rome, Fiumicino Airport (FCO)
 * - KL1604 | Uitgevoerd door KLM
 * - 15:10
 * - Amsterdam, Schiphol Airport (AMS)
 */
class KlmFlightEmailParser extends BaseFlightEmailParser {
  /**
   * Controleert of deze parser geschikt is voor de e-mailtekst.
   *
   * @param {string} rawText Plain-text of HTML e-mailinhoud.
   * @returns {boolean} True als dit een KLM e-mail lijkt.
   */
  canParse(rawText) {
    const text = this.prepareText(rawText);

    return /KLM|klm\.com|\bKL\s?\d{3,4}\b/i.test(text);
  }

  /**
   * Parseert KLM e-mails naar flight candidates.
   *
   * @param {string} rawText Plain-text of HTML e-mailinhoud.
   * @returns {Object[]} Parsed flight candidates.
   */
  parse(rawText) {
    const text = this.prepareText(rawText);
    const flights = [];

    this.parseFlightBlocks_(text, flights);

    return this.dedupeFlights(flights).slice(0, 4);
  }

  /**
   * Parseert KLM vluchtblokken.
   *
   * @param {string} text Genormaliseerde e-mailtekst.
   * @param {Object[]} flights Output array.
   * @returns {void}
   */
  parseFlightBlocks_(text, flights) {
    const regex =
      /(?:maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)\s+(\d{1,2})\s+([a-z]+)\s+(\d{4})\s*-\s*(\d{1,2}:\d{2})[\s\S]{0,300}?(?:\(|,\s*)([A-Z]{3})\)?[\s\S]{0,200}?\b(KL\s?\d{3,4})\b[\s\S]{0,400}?(\d{1,2}:\d{2})[\s\S]{0,200}?(?:\(|,\s*)([A-Z]{3})\)?/gi;

    let match;

    while ((match = regex.exec(text)) !== null) {
      flights.push({
        flightNumber: this.normalizeFlightNumber(match[6]),
        departureDate: this.normalizeKlmDate_(match[1], match[2], match[3]),
        departureTime: this.normalizeTime(match[4]),
        departureAirport: this.normalizeAirportCode(match[5]),
        arrivalTime: this.normalizeTime(match[7]),
        arrivalAirport: this.normalizeAirportCode(match[8]),
        lookupStrategy: 'FLIGHT_NUMBER'
      });
    }
  }

  /**
   * Normaliseert KLM datumdelen naar yyyy-MM-dd.
   *
   * @param {string} day Dag.
   * @param {string} monthName Nederlandse maandnaam.
   * @param {string} year Jaar.
   * @returns {string} Datum in yyyy-MM-dd formaat.
   */
  normalizeKlmDate_(day, monthName, year) {
    const month = this.monthNameToNumber(monthName);

    if (!month) {
      return '';
    }

    return `${year}-${this.pad(month)}-${this.pad(day)}`;
  }
}