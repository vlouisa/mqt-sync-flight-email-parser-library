// Expliciete laadvolgorde; test/integration/ met echte Gmail-toegang wordt niet geladen.
const sources = [
  '_base-flight-email-parser.js',
  'klm-flight-email-parser.js',
  'transavia-flight-email-parser.js',
  'ita-airways-flight-email-parser.js',
  'brussels-airlines-flight-email-parser.js',
  'easy-jet-flight-email-parser.js',
  'ryanair-flight-email-parser.js',
  'euro-wings-flight-email-parser.js',
  'flight-parser-error.js',
  'config.js',
  'flight-email-parser-service.js',
  'test/helpers/assert-util.js',
  'test/unit/flight-parser-tests.js'
];

module.exports = [{
  name: 'flight-email-parser',
  sources,
  tests: [
    'testKlmFlight',
    'testTransaviaFlight',
    'testItaFlight',
    'testBrusselsFlight',
    'testEasyJetFlight',
    'testRyanairReturnAndDuplicates',
    'testEurowingsFlight',
    'testItaRouteFallback',
    'testBrusselsRouteFallback',
    'testUnknownMailThrows',
    'testRecognizedMailWithoutFlightThrows',
    'testIncompleteRouteThrows',
    'testDateFormats',
    'testMissingCandidateFields'
  ]
}];
