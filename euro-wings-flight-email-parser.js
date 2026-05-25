/**
 * Parser voor Eurowings vluchtmails.
 *
 * Ondersteunt o.a.:
 *
 * Flight: 21.12.2024 | Flight Number EW 9883
 * Departure
 * DEP09:40 Rome Fiumicino
 *
 * Flight: 22.12.2024 | Flight Number EW 9882
 */
class EurowingsFlightEmailParser extends BaseFlightEmailParser {
  canParse(rawText) {
    const text = this.normalizeText(rawText);

    return /Eurowings|Eurowings Europe|\bEW\s?\d{3,4}\b/i.test(text);
  }

  parse(rawText) {
    const text = this.normalizeText(rawText);
    const flights = [];

    const regex =
      /Flight:\s*(\d{1,2}\.\d{1,2}\.\d{4})\s*\|\s*Flight Number\s*(EW\s?\d{3,4})\b/gi;

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