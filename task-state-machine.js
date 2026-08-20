/*
  AI Task State Machine
  Purpose: isolated workflow task lifecycle controller.
*/

(function () {
  const tasks = {};

  const transitions = {
    CREATED: ['PLANNING'],
    PLANNING: ['IMPLEMENTING'],
    IMPLEMENTING: ['VALIDATING'],
    VALIDATING: ['COMPLETED'],
    COMPLETED: [],
    FAILED: []
  };

  function createStateMachine(task) {
    const id = task.id || 'STATE_TASK_' + Date.now();
    tasks[id] = {
      id,
      task,
      state: 'CREATED'
    };
    return tasks[id];
  }

  function validateStateTransition(currentState, newState) {
    return !!(transitions[currentState] && transitions[currentState].includes(newState));
  }

  function transitionTaskState(taskId, newState) {
    const task = tasks[taskId];
    if (!task) return { success: false, message: 'Task not found' };

    if (newState === 'FAILED') {
      task.state = newState;
      return { success: true, task };
    }

    if (!validateStateTransition(task.state, newState)) {
      return { success: false, message: 'Invalid state transition' };
    }

    task.state = newState;
    return { success: true, task };
  }

  function getTaskState(taskId) {
    return tasks[taskId] || null;
  }

  window.AITaskStateMachine = {
    createStateMachine,
    transitionTaskState,
    getTaskState,
    validateStateTransition
  };
})();
