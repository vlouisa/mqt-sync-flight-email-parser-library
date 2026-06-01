/**
 * Test de FlightEmailParserService op alle gevonden vlucht-thread IDs.
 *
 * @returns {Object[]} Testresultaten per e-mailbericht.
 */
function testFlightEmailParserServiceForFoundThreadIds() {
  const threadIds = getThreadIdsForAllLabels();
  const results = [];

  threadIds.forEach(threadId => {
    const thread = GmailApp.getThreadById(threadId);

    if (!thread) {
      const item = {
        threadId: threadId,
        success: false,
        error: 'Thread niet gevonden.'
      };

      results.push(item);
      console.log(JSON.stringify(item, null, 2));
      return;
    }

    thread.getMessages().forEach(message => {
      const rawText = [
        message.getSubject(),
        message.getPlainBody()
      ].join('\n\n');

      const item = {
        threadId: threadId,
        messageId: message.getId(),
        from: message.getFrom(),
        subject: message.getSubject(),
        date: message.getDate(),
        success: false,
        flights: null,
        error: null
      };

      try {
        item.flights = FlightEmailParserService.parse(rawText);
        item.success = true;
      } catch (error) {
        item.error = error && error.message ? error.message : String(error);
      }

      results.push(item);
      console.log(JSON.stringify(item, null, 2));
    });
  });

  console.log(`Parsed ${results.filter(item => item.success).length}/${results.length} vlucht emails succesvol.`);

  return results;
}



/**
 * Geeft alle unieke Gmail thread IDs terug voor opgegegeven labels".
 *
 * @returns {string[]} Unieke Gmail thread IDs.
 */
function getThreadIdsForAllLabels() {
  const labelNames = [
    'Flights/Inbox',
  ];

  const threadIds = {};
  const result = [];

  labelNames.forEach(labelName => {
    const label = GmailApp.getUserLabelByName(labelName);

    if (!label) {
      return;
    }

    label.getThreads().forEach(thread => {
      const threadId = thread.getId();

      if (!threadIds[threadId]) {
        threadIds[threadId] = true;
        result.push(threadId);
      }
    });
  });

  console.log(JSON.stringify(result, null, 2));

  return result;
}