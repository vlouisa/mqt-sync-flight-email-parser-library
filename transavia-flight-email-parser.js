/**
 * Parser voor Transavia vluchtbevestigingen.
 *
 * Probeert vluchtnummer(s) en vertrekdatum(s) uit Transavia mailtekst te halen.
 */
class TransaviaFlightEmailParser extends BaseFlightEmailParser {
  canParse(rawText) {
    const text = this.normalizeText(rawText);
    return /Transavia|transavia\.com|Je vluchtgegevens/i.test(text);
  }

  parse(rawText) {
    const text = this.normalizeText(rawText);
    const flights = [];

    /**
     * Layout 1:
     * Zondag 23-11-2025 ... HV6035
     */
    const compactBlockRegex =
      /\b(?:maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)\s+(\d{1,2}[-/]\d{1,2}[-/]\d{4})[\s\S]{0,120}?\b(HV\s?\d{3,4})\b/gi;

    let match;

    while ((match = compactBlockRegex.exec(text)) !== null) {
      flights.push({
        flightNumber: this.normalizeFlightNumber(match[2]),
        departureDate: this.normalizeDate(match[1])
      });
    }

    /**
     * Layout 2:
     * vrijdag 19 september 2025
     * ...
     * Vluchtnummer: HV6036
     */
    const visualBlockRegex =
      /\b(?:maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)\s+(\d{1,2}\s+[a-zA-ZéÉ]+\s+\d{4})[\s\S]{0,500}?Vluchtnummer:\s*(HV\s?\d{3,4})\b/gi;

    while ((match = visualBlockRegex.exec(text)) !== null) {
      flights.push({
        flightNumber: this.normalizeFlightNumber(match[2]),
        departureDate: this.normalizeDate(match[1])
      });
    }

    return this.dedupeFlights(flights).slice(0, 2);
  }
}