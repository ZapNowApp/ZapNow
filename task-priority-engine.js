/*
  AI Task Priority Engine
  Purpose: isolated in-memory task prioritization.
  No external dependency.
*/
(function () {
  const priorities = {};

  function calculateTaskPriority(task) {
    const urgency = Number(task.urgency || 0);
    const dependency = Number(task.dependency || 0);
    const risk = Number(task.risk || 0);
    const importance = Number(task.importance || 0);
    const score = urgency + dependency + risk + importance;

    let priority = 'LOW';
    if (score >= 16) priority = 'CRITICAL';
    else if (score >= 10) priority = 'HIGH';
    else if (score >= 5) priority = 'NORMAL';

    return {
      taskId: task.taskId,
      priority,
      score,
      reason: 'Calculated from urgency, dependency, risk, and importance factors.'
    };
  }

  function setTaskPriority(taskId, priority) {
    priorities[taskId] = priority;
    return { taskId, priority };
  }

  function getTaskPriority(taskId) {
    return priorities[taskId] || null;
  }

  function listPriorityTasks() {
    return Object.keys(priorities).map(taskId => ({ taskId, priority: priorities[taskId] }));
  }

  window.AITaskPriorityEngine = { calculateTaskPriority, setTaskPriority, getTaskPriority, listPriorityTasks };
})();
