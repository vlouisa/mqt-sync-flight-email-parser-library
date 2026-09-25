class FlightParserError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'FlightParserError';
    this.details = details;
  }
}