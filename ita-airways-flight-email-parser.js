/**
 * Parser voor ITA Airways mails.
 *
 * Ondersteunt o.a.:
 *
 * 03 MAY 2024
 * Rome (FCO) Amsterdam (AMS)
 * AZ 108
 */
class ItaAirwaysFlightEmailParser extends BaseFlightEmailParser {
  canParse(rawText) {
    const text = this.normalizeText(rawText);

    return /ITA Airways|AZ\s?\d{2,4}|Booking reference/i.test(text);
  }

  parse(rawText) {
    const text = this.normalizeText(rawText);
    const flights = [];

    /**
     * Voorbeeld:
     *
     * 03 MAY 2024
     * Rome (FCO) Amsterdam (AMS)
     * AZ 108
     */
    const regex =
      /(\d{2}\s+[A-Z]{3}\s+\d{4})[\s\S]{0,200}?\b(AZ\s?\d{2,4})\b/gi;

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