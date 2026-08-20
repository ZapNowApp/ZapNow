/*
  AI Execution Context Manager
  Purpose: isolated context storage for AI workflow execution.
*/

(function () {
  let executionContext = null;

  function createExecutionContext() {
    executionContext = {
      project: null,
      phase: null,
      task: null,
      files: [],
      status: null,
      notes: []
    };

    return executionContext;
  }

  function setContextValue(key, value) {
    if (!executionContext) {
      createExecutionContext();
    }

    executionContext[key] = value;
    return executionContext;
  }

  function getContextValue(key) {
    if (!executionContext) return null;
    return executionContext[key] ?? null;
  }

  function clearExecutionContext() {
    executionContext = null;
    return true;
  }

  window.AIExecutionContext = {
    createExecutionContext,
    setContextValue,
    getContextValue,
    clearExecutionContext
  };
})();
