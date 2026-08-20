// AI Operator Foundation - Human Approval Controller
// Human approval remains mandatory.

var approvalRegistry = {};

function requestApproval(task) {
  var id = 'approval-' + Date.now();
  approvalRegistry[id] = {
    id: id,
    task: task,
    status: 'WAITING'
  };
  return approvalRegistry[id];
}

function approveTask(id) {
  if (!approvalRegistry[id]) return null;
  approvalRegistry[id].status = 'APPROVED';
  return approvalRegistry[id];
}

function rejectTask(id) {
  if (!approvalRegistry[id]) return null;
  approvalRegistry[id].status = 'REJECTED';
  return approvalRegistry[id];
}

function getApprovalStatus(id) {
  return approvalRegistry[id] || null;
}

function requiresHumanApproval(task) {
  return /firebase|database|security|deployment/i.test(String(task || ''));
}
