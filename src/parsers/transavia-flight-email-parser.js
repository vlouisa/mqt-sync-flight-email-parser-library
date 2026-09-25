/**
 * Parser voor Transavia flight e-mails.
 */
class TransaviaFlightEmailParser extends BaseFlightEmailParser {
  /**
   * Controleert of deze parser geschikt is voor de e-mailtekst.
   *
   * @param {string} rawText Plain-text of HTML e-mailinhoud.
   * @returns {boolean} True als dit een Transavia e-mail lijkt.
   */
  canParse(rawText) {
    const text = this.prepareTransaviaText_(rawText);

    return /Transavia|transavia\.com|\bHV\s?\d{3,4}\b/i.test(text);
  }

  /**
   * Parseert Transavia e-mails naar flight candidates.
   *
   * @param {string} rawText Plain-text of HTML e-mailinhoud.
   * @returns {Object[]} Parsed flight candidates.
   */
  parse(rawText) {
    const text = this.prepareTransaviaText_(rawText);
    const flights = [];

    this.parseFlightBlocks_(text, flights);

    return this.dedupeFlights(flights).slice(0, 4);
  }

  /**
   * Maakt Transavia tekst parsebaar.
   *
   * @param {string} rawText Ruwe e-mailtekst.
   * @returns {string} Genormaliseerde tekst.
   */
  prepareTransaviaText_(rawText) {
    return this.prepareText(rawText)
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\s*:\s*/g, ':');
  }

  /**
   * Parseert Transavia vluchtblokken.
   *
   * @param {string} text Genormaliseerde e-mailtekst.
   * @param {Object[]} flights Output array.
   * @returns {void}
   */
  parseFlightBlocks_(text, flights) {
    const regex =
      /(?:maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)\s+(\d{1,2}[-/]\d{1,2}[-/]\d{4})[\s\S]{0,200}?\b(HV\s?\d{3,4})\b[\s\S]{0,300}?(\d{1,2}:\d{2})[\s\S]{0,200}?(\d{1,2}:\d{2})/gi;

    let match;

    while ((match = regex.exec(text)) !== null) {
      flights.push({
        flightNumber: this.normalizeFlightNumber(match[2]),
        departureDate: this.normalizeDate(match[1]),
        departureTime: this.normalizeTime(match[3]),
        lookupStrategy: 'FLIGHT_NUMBER'
      });
    }
  }
}