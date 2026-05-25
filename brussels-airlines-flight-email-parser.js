/**
 * Parser voor Brussels Airlines vluchtmails.
 *
 * Ondersteunt o.a.:
 *
 * 15.05.2026 - 10:10
 * SN3176
 * FCO → BRU
 */
class BrusselsAirlinesFlightEmailParser extends BaseFlightEmailParser {
  canParse(rawText) {
    const text = this.normalizeText(rawText);

    return /Brussels Airlines|brusselsairlines\.com|\bSN\s?\d{3,4}\b/i.test(text);
  }

  parse(rawText) {
    const text = this.normalizeText(rawText);
    const flights = [];

    /**
     * Layout:
     * 15.05.2026 - 10:10 ... SN3176
     */
    const regex =
      /(\d{1,2}\.\d{1,2}\.\d{4})\s*-\s*\d{1,2}:\d{2}[\s\S]{0,120}?\b(SN\s?\d{3,4})\b/gi;

    let match;

    while ((match = regex.exec(text)) !== null) {
      flights.push({
        flightNumber: this.normalizeFlightNumber(match[2]),
        departureDate: this.normalizeDate(match[1])
      });
    }

    return this.dedupeFlights(flights).slice(0, 2);
  }
}