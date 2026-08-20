/*
  Development Event Logger
  Purpose: local memory event tracking for AI development workflow only.
  Not connected to production logging.
*/

(function () {
  const developmentEvents = [];

  function logDevelopmentEvent(type, message, metadata) {
    const event = {
      type,
      message,
      timestamp: new Date().toISOString(),
      metadata: metadata || {}
    };

    developmentEvents.push(event);
    return event;
  }

  function getDevelopmentEvents() {
    return [...developmentEvents];
  }

  function clearDevelopmentEvents() {
    developmentEvents.length = 0;
    return true;
  }

  window.DevelopmentEventLogger = {
    logDevelopmentEvent,
    getDevelopmentEvents,
    clearDevelopmentEvents
  };
})();
