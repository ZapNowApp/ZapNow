/*
  AI Workflow Validation Rule Engine
  Purpose: isolated validation framework.
*/

(function () {
  const rules = [];
  const results = [];

  function registerValidationRule(rule) {
    rules.push(rule);
    return rule;
  }

  function runValidation(context) {
    const validationResults = rules.map(rule => ({
      name: rule.name,
      passed: !!rule.validate(context),
      message: rule.message || '',
      timestamp: new Date().toISOString()
    }));

    results.push(...validationResults);
    return validationResults;
  }

  function getValidationResult() {
    return results;
  }

  window.AIWorkflowValidationEngine = {
    registerValidationRule,
    runValidation,
    getValidationResult
  };
})();
