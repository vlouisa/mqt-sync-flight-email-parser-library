const CONFIG = {
  flightEmailParsers: [
    () => new KlmFlightEmailParser(),
    () => new TransaviaFlightEmailParser(),
    () => new ItaAirwaysFlightEmailParser(),
    () => new BrusselsAirlinesFlightEmailParser(),
    () => new EasyJetFlightEmailParser(),
    () => new RyanAirFlightEmailParser(),
    () => new EurowingsFlightEmailParser()
  ]
}