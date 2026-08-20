/*
  AI Workflow Task Manager
  Purpose: isolated in-memory task state storage for AI workflow experiments.
  No Firebase, database, or UI dependency.
*/

(function () {
  const workflowTasks = {};

  function createWorkflowTask(task) {
    const id = 'TASK_' + Date.now();
    const now = new Date().toISOString();

    workflowTasks[id] = {
      id,
      task,
      status: 'CREATED',
      createdAt: now,
      updatedAt: now,
      result: null
    };

    return workflowTasks[id];
  }

  function getWorkflowTask(taskId) {
    return workflowTasks[taskId] || null;
  }

  function updateWorkflowTaskStatus(taskId, status) {
    const task = workflowTasks[taskId];
    if (!task) return null;

    task.status = status;
    task.updatedAt = new Date().toISOString();
    return task;
  }

  function completeWorkflowTask(taskId, result) {
    const task = workflowTasks[taskId];
    if (!task) return null;

    task.status = 'COMPLETED';
    task.result = result;
    task.updatedAt = new Date().toISOString();
    return task;
  }

  function listWorkflowTasks() {
    return Object.values(workflowTasks);
  }

  window.WorkflowTaskManager = {
    createWorkflowTask,
    getWorkflowTask,
    updateWorkflowTaskStatus,
    completeWorkflowTask,
    listWorkflowTasks
  };
})();
