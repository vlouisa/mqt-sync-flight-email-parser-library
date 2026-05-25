/**
 * Parser voor KLM vluchtbevestigingen.
 *
 * Probeert vluchtnummer(s) en vertrekdatum(s) uit KLM mailtekst te halen.
 */
class KlmFlightEmailParser extends BaseFlightEmailParser {
  canParse(rawText) {
    const text = this.normalizeText(rawText);

    return /KLM|Royal Dutch Airlines|klm\.com/i.test(text);
  }

  parse(rawText) {
    const text = this.normalizeText(rawText);

    const flights = [];

    /**
     * Matcht complete vluchtblokken.
     *
     * Voorbeeld:
     *
     * zaterdag 9 mei 2026 - 12:45
     * Rome, Fiumicino Airport (FCO)
     *
     * KL1604 | Uitgevoerd door KLM
     */
    const blockRegex =
      /(?:maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)\s+(\d{1,2}\s+[a-zA-Zé]+\s+\d{4})[\s\S]{0,200}?\b(KL\s?\d{3,4})\b/gi;

    let match;

    while ((match = blockRegex.exec(text)) !== null) {
      const departureDate = this.normalizeDate(match[1]);
      const flightNumber = this.normalizeFlightNumber(match[2]);

      flights.push({
        flightNumber,
        departureDate
      });
    }

    return this.dedupeFlights(flights).slice(0, 2);
  }
  
  findBestDateInContext(context) {
    const datePatterns = [
      /\b(\d{1,2}\s+(?:jan|januari|feb|februari|mrt|mar|maart|apr|april|mei|may|jun|juni|jul|juli|aug|augustus|sep|sept|okt|oct|nov|dec|december|january|february|march|june|july|august|september|october|november)\s+\d{4})\b/i,
      /\b(\d{1,2}[-/]\d{1,2}[-/]\d{4})\b/i
    ];

    for (const pattern of datePatterns) {
      const match = context.match(pattern);

      if (match) {
        return this.normalizeDate(match[1]);
      }
    }

    return '';
  }
}