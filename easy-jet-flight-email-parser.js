/**
 * Parser voor easyJet vluchtbevestigingen.
 *
 * Ondersteunt o.a. deze layout:
 *
 * Brussel Intl naar Rome Fiumicino (T1)
 * EJU2981
 * Vertrektijd: za 16 mei 2026 09:20
 */
class EasyJetFlightEmailParser extends BaseFlightEmailParser {
  canParse(rawText) {
    const text = this.normalizeText(rawText);

    return /easyJet|easyjet\.com|EJU?\s?\d{3,4}|U2\s?\d{3,4}/i.test(text);
  }

  parse(rawText) {
    const text = this.normalizeText(rawText);
    const flights = [];

    /**
     * Layout:
     * EJU2981
     * Vertrektijd: za 16 mei 2026 09:20
     */
    const regex =
      /\b((?:EJU|EZY|U2)\s?\d{3,4})\b[\s\S]{0,250}?Vertrektijd:\s*(?:ma|di|wo|do|vr|za|zo|maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)?\s*(\d{1,2}\s+[a-zA-ZéÉ]+\s+\d{4})/gi;

    let match;

    while ((match = regex.exec(text)) !== null) {
      flights.push({
        flightNumber: this.normalizeFlightNumber(match[1]),
        departureDate: this.normalizeDate(match[2])
      });
    }

    /**
     * Fallback:
     * Vertrektijd: za 16 mei 2026 09:20
     * ... EJU2981
     */
    const reverseRegex =
      /Vertrektijd:\s*(?:ma|di|wo|do|vr|za|zo|maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)?\s*(\d{1,2}\s+[a-zA-ZéÉ]+\s+\d{4})[\s\S]{0,250}?\b((?:EJU|EZY|U2)\s?\d{3,4})\b/gi;

    while ((match = reverseRegex.exec(text)) !== null) {
      flights.push({
        flightNumber: this.normalizeFlightNumber(match[2]),
        departureDate: this.normalizeDate(match[1])
      });
    }

    return this.dedupeFlights(flights).slice(0, 2);
  }
}