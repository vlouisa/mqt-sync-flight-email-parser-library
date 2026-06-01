/**
 * Base parser voor vluchtbevestigingen.
 *
 * Subclasses implementeren:
 * - canParse(rawText)
 * - parse(rawText)
 *
 * Output van parse() is een array met flight candidates.
 *
 * Bestaande functionaliteit blijft ondersteund:
 *
 * [
 *   {
 *     flightNumber: 'HV6036',
 *     departureDate: '2025-12-20'
 *   }
 * ]
 *
 * Nieuwe route/time fallback wordt ook ondersteund:
 *
 * [
 *   {
 *     departureDate: '2026-06-05',
 *     departureTime: '10:10',
 *     departureAirport: 'FCO',
 *     arrivalAirport: 'BRU'
 *   }
 * ]
 */
class BaseFlightEmailParser {
  /**
   * Controleert of deze parser geschikt is voor de e-mailtekst.
   *
   * @param {string} rawText Plain-text e-mailinhoud.
   * @returns {boolean} True als deze parser de tekst kan verwerken.
   */
  canParse(rawText) {
    return false;
  }

  /**
   * Parseert een e-mailtekst naar flight candidates.
   *
   * @param {string} rawText Plain-text e-mailinhoud.
   * @returns {Object[]} Flight candidates.
   */
  parse(rawText) {
    throw new Error('parse() moet worden geïmplementeerd door subclass.');
  }

  /**
   * Normaliseert ruwe e-mailtekst.
   *
   * @param {*} text Ruwe tekstwaarde.
   * @returns {string} Genormaliseerde tekst.
   */
  normalizeText(text) {
    return String(text || '')
      .replace(/\r/g, '\n')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{2,}/g, '\n')
      .trim();
  }

  /**
   * Normaliseert een vluchtnummer.
   *
   * @param {*} value Vluchtnummerwaarde.
   * @returns {string} Genormaliseerd vluchtnummer.
   */
  normalizeFlightNumber(value) {
    return String(value || '')
      .replace(/\s+/g, '')
      .toUpperCase();
  }

  /**
   * Normaliseert een datum naar yyyy-MM-dd.
   *
   * @param {*} value Datumwaarde.
   * @returns {string} Datum in yyyy-MM-dd formaat, of leeg als onbekend.
   */
  normalizeDate(value) {
    const raw = String(value || '').trim();

    if (!raw) {
      return '';
    }

    let match = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);

    if (match) {
      return `${match[3]}-${this.pad(match[2])}-${this.pad(match[1])}`;
    }

    match = raw.match(/^(\d{1,2})\s+([a-zA-ZéÉ]+)\s+(\d{4})$/i);

    if (match) {
      const month = this.monthNameToNumber(match[2]);

      if (month) {
        return `${match[3]}-${this.pad(month)}-${this.pad(match[1])}`;
      }
    }

    match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

    if (match) {
      return `${match[1]}-${this.pad(match[2])}-${this.pad(match[3])}`;
    }

    match = raw.match(/^(\d{1,2})\s+([A-Z]{3,})\s+(\d{4})$/i);

    if (match) {
      const month = this.monthNameToNumber(match[2]);

      if (month) {
        return `${match[3]}-${this.pad(month)}-${this.pad(match[1])}`;
      }
    }

    match = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);

    if (match) {
      return `${match[3]}-${this.pad(match[2])}-${this.pad(match[1])}`;
    }

    return '';
  }

  /**
   * Normaliseert een tijd naar HH:mm.
   *
   * @param {*} value Tijdwaarde.
   * @returns {string} Tijd in HH:mm formaat, of leeg als onbekend.
   */
  normalizeTime(value) {
    const raw = String(value || '').trim();
    const match = raw.match(/\b(\d{1,2}):(\d{2})\b/);

    if (!match) {
      return '';
    }

    return `${this.pad(match[1])}:${match[2]}`;
  }

  /**
   * Normaliseert een IATA airport code.
   *
   * @param {*} value Airportwaarde.
   * @returns {string} IATA-code, of leeg als onbekend.
   */
  normalizeAirportCode(value) {
    const match = String(value || '')
      .trim()
      .toUpperCase()
      .match(/\b[A-Z]{3}\b/);

    return match ? match[0] : '';
  }

  /**
   * Zet een maandnaam om naar een maandnummer.
   *
   * @param {*} value Maandnaam.
   * @returns {number|string} Maandnummer of lege string.
   */
  monthNameToNumber(value) {
    const key = String(value || '').toLowerCase();

    const months = {
      jan: 1,
      januari: 1,
      january: 1,

      feb: 2,
      februari: 2,
      february: 2,

      mrt: 3,
      mar: 3,
      maart: 3,
      march: 3,

      apr: 4,
      april: 4,

      mei: 5,
      may: 5,

      jun: 6,
      juni: 6,
      june: 6,

      jul: 7,
      juli: 7,
      july: 7,

      aug: 8,
      augustus: 8,
      august: 8,

      sep: 9,
      sept: 9,
      september: 9,

      okt: 10,
      oct: 10,
      oktober: 10,
      october: 10,

      nov: 11,
      november: 11,

      dec: 12,
      december: 12
    };

    return months[key] || '';
  }

  /**
   * Voegt een voorloopnul toe aan een numerieke waarde.
   *
   * @param {*} value Waarde.
   * @returns {string} Waarde met minimaal twee tekens.
   */
  pad(value) {
    return String(value).padStart(2, '0');
  }

  /**
   * Verwijdert dubbele flight candidates.
   *
   * Backwards compatible:
   * bestaande parsers die alleen flightNumber + departureDate teruggeven,
   * blijven exact werken.
   *
   * Ondersteunt daarnaast route/time candidates zonder vluchtnummer.
   *
   * @param {Object[]} flights Parsed flight candidates.
   * @returns {Object[]} Unieke en genormaliseerde flight candidates.
   */
  dedupeFlights(flights) {
    const seen = {};
    const result = [];

    flights.forEach(flight => {
      const normalizedFlight = this.normalizeFlightCandidate_(flight);

      if (!this.isValidFlightCandidate_(normalizedFlight)) {
        return;
      }

      const key = this.buildFlightCandidateKey_(normalizedFlight);

      if (seen[key]) {
        return;
      }

      seen[key] = true;
      result.push(normalizedFlight);
    });

    return result;
  }

  /**
   * Normaliseert een flight candidate.
   *
   * @param {Object} flight Flight candidate.
   * @returns {Object} Genormaliseerde flight candidate.
   */
  normalizeFlightCandidate_(flight) {
    const flightNumber = this.normalizeFlightNumber(flight.flightNumber);
    const departureDate = this.normalizeDate(flight.departureDate);
    const departureTime = this.normalizeTime(flight.departureTime);

    return {
      flightNumber,
      departureDate,
      departureTime,
      departureAirport: this.normalizeAirportCode(flight.departureAirport),
      arrivalAirport: this.normalizeAirportCode(flight.arrivalAirport),
      departureCity: String(flight.departureCity || '').trim(),
      arrivalCity: String(flight.arrivalCity || '').trim(),
      lookupStrategy: flight.lookupStrategy || (flightNumber ? 'FLIGHT_NUMBER' : 'ROUTE_TIME')
    };
  }

  /**
   * Controleert of een flight candidate bruikbaar is.
   *
   * Geldig wanneer:
   * - flightNumber + departureDate aanwezig zijn; of
   * - departureDate + departureTime + departureAirport + arrivalAirport aanwezig zijn.
   *
   * @param {Object} flight Genormaliseerde flight candidate.
   * @returns {boolean} True als de candidate bruikbaar is.
   */
  isValidFlightCandidate_(flight) {
    if (flight.flightNumber && flight.departureDate) {
      return true;
    }

    return Boolean(
      flight.departureDate &&
      flight.departureTime &&
      flight.departureAirport &&
      flight.arrivalAirport
    );
  }

  /**
   * Bouwt een dedupe-key voor een flight candidate.
   *
   * @param {Object} flight Genormaliseerde flight candidate.
   * @returns {string} Dedupe key.
   */
  buildFlightCandidateKey_(flight) {
    if (flight.flightNumber) {
      return `${flight.flightNumber}_${flight.departureDate}`;
    }

    return [
      flight.departureAirport,
      flight.arrivalAirport,
      flight.departureDate,
      flight.departureTime
    ].join('_');
  }
}