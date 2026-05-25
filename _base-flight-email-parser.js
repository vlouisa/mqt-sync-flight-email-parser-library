/**
 * Base parser voor vluchtbevestigingen.
 *
 * Subclasses implementeren:
 * - canParse(rawText)
 * - parse(rawText)
 *
 * Output van parse() moet altijd een array zijn:
 *
 * [
 *   {
 *     flightNumber: 'HV6036',
 *     departureDate: '2025-12-20'
 *   }
 * ]
 */
class BaseFlightEmailParser {
  canParse(rawText) {
    return false;
  }

  parse(rawText) {
    throw new Error('parse() moet worden geïmplementeerd door subclass.');
  }

  normalizeText(text) {
    return String(text || '')
      .replace(/\r/g, '\n')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{2,}/g, '\n')
      .trim();
  }

  normalizeFlightNumber(value) {
    return String(value || '')
      .replace(/\s+/g, '')
      .toUpperCase();
  }

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

  pad(value) {
    return String(value).padStart(2, '0');
  }

  dedupeFlights(flights) {
    const seen = {};
    const result = [];

    flights.forEach(flight => {
      const flightNumber = this.normalizeFlightNumber(flight.flightNumber);
      const departureDate = this.normalizeDate(flight.departureDate);

      if (!flightNumber || !departureDate) {
        return;
      }

      const key = `${flightNumber}_${departureDate}`;

      if (seen[key]) {
        return;
      }

      seen[key] = true;

      result.push({
        flightNumber,
        departureDate
      });
    });

    return result;
  }
}