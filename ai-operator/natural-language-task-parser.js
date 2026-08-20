// AI Operator Foundation - Natural Language Task Parser
// Isolated module. No external AI API or network communication.

function parseNaturalLanguageTask(input) {
  const text = String(input || '').trim();

  return {
    rawTask: text,
    intent: detectIntent(text),
    objectives: extractObjectives(text),
    constraints: extractConstraints(text),
    createdAt: new Date().toISOString()
  };
}

function detectIntent(text) {
  if (/build|create|implement/i.test(text)) return 'implementation';
  if (/fix|debug|repair/i.test(text)) return 'maintenance';
  if (/review|inspect|analyze/i.test(text)) return 'analysis';
  return 'general';
}

function extractObjectives(text) {
  return text ? [text] : [];
}

function extractConstraints(text) {
  const constraints = [];
  if (/firebase/i.test(text)) constraints.push('firebase-awareness');
  if (/do not modify/i.test(text)) constraints.push('protected-change');
  return constraints;
}
