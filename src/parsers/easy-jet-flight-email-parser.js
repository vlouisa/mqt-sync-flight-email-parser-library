/**
 * Parser voor easyJet flight e-mails.
 *
 * Ondersteunt easyJet bevestigingsmails met blokken zoals:
 * - Passagier en vluchtgegevens 1 van 2
 * - Rome Fiumicino naar Hamburg
 * - EJU2990
 * - Vertrektijd: vr 17 jul. 2026 12:20
 */
class EasyJetFlightEmailParser extends BaseFlightEmailParser {
  /**
   * Controleert of deze parser geschikt is voor de e-mailtekst.
   *
   * @param {string} rawText Plain-text of HTML e-mailinhoud.
   * @returns {boolean} True als dit een easyJet e-mail lijkt.
   */
  canParse(rawText) {
    const text = this.prepareText(rawText);

    return /easyJet|easyjet\.com|\bEJU\s?\d{3,4}\b|\bEZY\s?\d{3,4}\b/i.test(text);
  }

  /**
   * Parseert easyJet e-mails naar flight candidates.
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
   * Parseert easyJet vluchtblokken.
   *
   * @param {string} text Genormaliseerde e-mailtekst.
   * @param {Object[]} flights Output array.
   * @returns {void}
   */
  parseFlightBlocks_(text, flights) {
    const regex =
      /(?:Passagier en vluchtgegevens\s+\d+\s+van\s+\d+)?[\s\S]{0,300}?\b(EJU\s?\d{3,4}|EZY\s?\d{3,4})\b[\s\S]{0,500}?Vertrektijd:\s*([a-z]{2})\s+(\d{1,2})\s+([a-z.]+)\s+(\d{4})\s+(\d{1,2}:\d{2})/gi;

    let match;

    while ((match = regex.exec(text)) !== null) {
      flights.push({
        flightNumber: this.normalizeFlightNumber(match[1]),
        departureDate: this.normalizeEasyJetDate_(match[3], match[4], match[5]),
        departureTime: this.normalizeTime(match[6]),
        lookupStrategy: 'FLIGHT_NUMBER'
      });
    }
  }

  /**
   * Normaliseert easyJet datumdelen naar yyyy-MM-dd.
   *
   * @param {string} day Dag.
   * @param {string} monthName Maandnaam of afkorting.
   * @param {string} year Jaar.
   * @returns {string} Datum in yyyy-MM-dd formaat.
   */
  normalizeEasyJetDate_(day, monthName, year) {
    const normalizedMonth = String(monthName || '')
      .replace('.', '')
      .toLowerCase();

    const month = this.monthNameToNumber(normalizedMonth);

    if (!month) {
      return '';
    }

    return `${year}-${this.pad(month)}-${this.pad(day)}`;
  }
}