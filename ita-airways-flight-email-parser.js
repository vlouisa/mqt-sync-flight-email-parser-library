/**
 * Parser voor ITA Airways flight e-mails.
 *
 * Ondersteunt:
 * - ITA Airways boekingsmails met AZ-vluchtnummer;
 * - ITA Airways mails met route/tijd als fallback.
 */
class ItaAirwaysFlightEmailParser extends BaseFlightEmailParser {
  /**
   * Controleert of deze parser geschikt is voor de e-mailtekst.
   *
   * @param {string} rawText Plain-text e-mailinhoud.
   * @returns {boolean} True als dit een ITA Airways e-mail lijkt.
   */
  canParse(rawText) {
    const text = this.normalizeText(rawText);

    return /ITA Airways|ita-airways\.com|\bAZ\s?\d{2,4}\b/i.test(text);
  }

  /**
   * Parseert ITA Airways e-mails naar flight candidates.
   *
   * @param {string} rawText Plain-text e-mailinhoud.
   * @returns {Object[]} Parsed flight candidates.
   */
  parse(rawText) {
    const text = this.normalizeText(rawText);
    const flights = [];

    this.parseFlightNumberCandidates_(text, flights);
    this.parseRouteTimeCandidates_(text, flights);

    return this.dedupeFlights(flights).slice(0, 3);
  }

  /**
   * Parseert ITA Airways blokken met vluchtnummer.
   *
   * Voorbeeld:
   * 06.06.2026 - 11:55
   * AZ107
   * Vluchtnummer AZ107
   *
   * @param {string} text Genormaliseerde e-mailtekst.
   * @param {Object[]} flights Output array.
   * @returns {void}
   */
  parseFlightNumberCandidates_(text, flights) {
    const regex =
      /(\d{1,2}\.\d{1,2}\.\d{4})\s*-\s*(\d{1,2}:\d{2})[\s\S]{0,180}?\b(AZ\s?\d{2,4})\b/gi;

    let match;

    while ((match = regex.exec(text)) !== null) {
      flights.push({
        flightNumber: this.normalizeFlightNumber(match[3]),
        departureDate: this.normalizeDate(match[1]),
        departureTime: this.normalizeTime(match[2]),
        lookupStrategy: 'FLIGHT_NUMBER'
      });
    }
  }

  /**
   * Parseert ITA Airways blokken zonder bruikbaar vluchtnummer, maar met route en tijd.
   *
   * Voorbeeld:
   * Vertrekdatum 06.06.2026 Vertrektijd 11:55
   * IATA-code vertrek AMS
   * IATA code aankomstluchthaven FCO
   *
   * @param {string} text Genormaliseerde e-mailtekst.
   * @param {Object[]} flights Output array.
   * @returns {void}
   */
  parseRouteTimeCandidates_(text, flights) {
    const dateTimeMatch = text.match(
      /Vertrekdatum\s+(\d{1,2}\.\d{1,2}\.\d{4})\s+Vertrektijd\s+(\d{1,2}:\d{2})/i
    );

    if (!dateTimeMatch) {
      return;
    }

    const departureAirport = this.extractDepartureAirport_(text);
    const arrivalAirport = this.extractArrivalAirport_(text);

    if (!departureAirport || !arrivalAirport) {
      return;
    }

    flights.push({
      departureDate: this.normalizeDate(dateTimeMatch[1]),
      departureTime: this.normalizeTime(dateTimeMatch[2]),
      departureAirport,
      arrivalAirport,
      departureCity: this.extractDepartureCity_(text),
      arrivalCity: this.extractArrivalCity_(text),
      lookupStrategy: 'ROUTE_TIME'
    });
  }

  /**
   * Haalt de vertrek IATA-code uit de e-mail.
   *
   * @param {string} text Genormaliseerde e-mailtekst.
   * @returns {string} IATA-code.
   */
  extractDepartureAirport_(text) {
    const match = text.match(/IATA-code vertrek\s+([A-Z]{3})/i);

    if (!match) {
      return '';
    }

    return this.normalizeAirportCode(match[1]);
  }

  /**
   * Haalt de aankomst IATA-code uit de e-mail.
   *
   * @param {string} text Genormaliseerde e-mailtekst.
   * @returns {string} IATA-code.
   */
  extractArrivalAirport_(text) {
    const match = text.match(/IATA code aankomstluchthaven\s+([A-Z]{3})/i);

    if (!match) {
      return '';
    }

    return this.normalizeAirportCode(match[1]);
  }

  /**
   * Haalt vertrekstad uit de e-mail.
   *
   * @param {string} text Genormaliseerde e-mailtekst.
   * @returns {string} Stadnaam.
   */
  extractDepartureCity_(text) {
    const match = text.match(/Plaats van vertrek\s+([^\n]+)/i);

    if (!match) {
      return '';
    }

    return String(match[1]).trim();
  }

  /**
   * Haalt aankomststad uit de e-mail.
   *
   * @param {string} text Genormaliseerde e-mailtekst.
   * @returns {string} Stadnaam.
   */
  extractArrivalCity_(text) {
    const match = text.match(/Stad van aankomst\s+([^\n]+)/i);

    if (!match) {
      return '';
    }

    return String(match[1]).trim();
  }
}