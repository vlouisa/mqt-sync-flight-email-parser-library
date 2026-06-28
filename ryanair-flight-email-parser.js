/**
 * Parser voor Ryanair flight e-mails.
 *
 * Ondersteunt Ryanair reisoverzichten met o.a.:
 * - FR-vluchtnummer;
 * - route;
 * - datum;
 * - departure/arrival time.
 */
class RyanAirFlightEmailParser extends BaseFlightEmailParser {
  /**
   * Controleert of deze parser geschikt is voor de e-mailtekst.
   *
   * @param {string} rawText Plain-text e-mailinhoud.
   * @returns {boolean} True als dit een Ryanair e-mail lijkt.
   */
  canParse(rawText) {
    const text = this.prepareText(rawText);

    return /Ryanair|itinerary@ryanair\.com|\bFR\s?\d{3,4}\b/i.test(text);
  }

  /**
   * Parseert Ryanair e-mails naar flight candidates.
   *
   * @param {string} rawText Plain-text e-mailinhoud.
   * @returns {Object[]} Parsed flight candidates.
   */
  parse(rawText) {
    const text = this.prepareText(rawText);
    const flights = [];

    this.parseFlightNumberCandidates_(text, flights);

    return this.dedupeFlights(flights).slice(0, 2);
  }

  /**
   * Parseert Ryanair blokken met vluchtnummer en vertrekdatum.
   *
   * Ondersteunt o.a.:
   * To Rome (Fiumicino) FR5815
   * Eindhoven - Rome (Fiumicino)
   * Sun, 12 Jul 26
   *
   * @param {string} text Genormaliseerde e-mailtekst.
   * @param {Object[]} flights Output array.
   * @returns {void}
   */
  parseFlightNumberCandidates_(text, flights) {
    const regex =
      /\b(FR\s?\d{3,4})\b[\s\S]{0,180}?([A-Z][a-z]{2},\s*\d{1,2}\s+[A-Z][a-z]{2}\s+\d{2,4})/gi;

    let match;

    while ((match = regex.exec(text)) !== null) {
      flights.push({
        flightNumber: this.normalizeFlightNumber(match[1]),
        departureDate: this.normalizeRyanairDate_(match[2]),
        lookupStrategy: 'FLIGHT_NUMBER'
      });
    }
  }

  /**
   * Normaliseert een Ryanair datum naar yyyy-MM-dd.
   *
   * Voorbeeld:
   * Sun, 12 Jul 26 -> 2026-07-12
   *
   * @param {string} value Ryanair datumwaarde.
   * @returns {string} Datum in yyyy-MM-dd formaat.
   */
  normalizeRyanairDate_(value) {
    const match = String(value || '').match(
      /(?:[A-Z][a-z]{2},\s*)?(\d{1,2})\s+([A-Z][a-z]{2})\s+(\d{2,4})/
    );

    if (!match) {
      return '';
    }

    const day = match[1].padStart(2, '0');
    const month = this.monthNameToNumber_(match[2]);
    const year = this.normalizeYear_(match[3]);

    if (!month || !year) {
      return '';
    }

    return `${year}-${month}-${day}`;
  }

  /**
   * Zet een Engelse maandafkorting om naar maandnummer.
   *
   * @param {string} monthName Engelse maandafkorting.
   * @returns {string} Maandnummer.
   */
  monthNameToNumber_(monthName) {
    const months = {
      jan: '01',
      feb: '02',
      mar: '03',
      apr: '04',
      may: '05',
      jun: '06',
      jul: '07',
      aug: '08',
      sep: '09',
      oct: '10',
      nov: '11',
      dec: '12'
    };

    return months[String(monthName || '').toLowerCase()] || '';
  }

  /**
   * Normaliseert een twee- of viercijferig jaar.
   *
   * @param {string} value Jaarwaarde.
   * @returns {string} Viercijferig jaar.
   */
  normalizeYear_(value) {
    const year = String(value || '').trim();

    if (/^\d{4}$/.test(year)) {
      return year;
    }

    if (/^\d{2}$/.test(year)) {
      return `20${year}`;
    }

    return '';
  }
}