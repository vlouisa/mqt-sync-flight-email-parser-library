/**
 * Parser voor Ryanair vluchtmails.
 *
 * Ondersteunt o.a.:
 *
 * Naar Eindhoven FR5814
 * 08/08/2025
 *
 * Naar Rome (Fiumicino) FR5815
 * 09/08/2025
 */
class RyanAirFlightEmailParser extends BaseFlightEmailParser {
  canParse(rawText) {
    const text = this.normalizeText(rawText);

    return /Ryanair|RyanAir|FR\s?\d{3,4}/i.test(text);
  }

  parse(rawText) {
    const text = this.normalizeText(rawText);
    const flights = [];

    /**
     * Layout:
     * Naar Eindhoven FR5814
     * ...
     * 08/08/2025
     */
    const regex =
      /\bFR\s?\d{3,4}\b[\s\S]{0,200}?(\d{1,2}\/\d{1,2}\/\d{4})/gi;

    let match;

    while ((match = regex.exec(text)) !== null) {
      const flightNumberMatch = match[0].match(/\bFR\s?\d{3,4}\b/i);

      flights.push({
        flightNumber: this.normalizeFlightNumber(flightNumberMatch[0]),
        departureDate: this.normalizeDate(match[1])
      });
    }

    return this.dedupeFlights(flights).slice(0, 2);
  }
}