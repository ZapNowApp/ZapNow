/*
  Approval Policy Engine
  Purpose: isolated approval rule framework.
*/
(function () {
  const policies = [];

  function registerApprovalPolicy(policy) {
    policies.push(policy);
    return policy;
  }

  function checkApprovalRequirement(context) {
    const match = policies.find(policy => policy.condition && policy.condition(context));
    return match
      ? { required: true, reason: match.reason, policy: match }
      : { required: false, reason: 'No approval policy matched.', policy: null };
  }

  function getApprovalPolicies() {
    return policies;
  }

  window.ApprovalPolicyEngine = { registerApprovalPolicy, checkApprovalRequirement, getApprovalPolicies };
})();
