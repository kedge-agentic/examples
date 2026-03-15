const API_BASE = '/api';

export async function fetchConfig() {
  const response = await fetch(API_BASE + '/config');
  if (!response.ok) {
    throw new Error('Failed to fetch config');
  }
  return response.json();
}

export async function fetchSubjects() {
  const response = await fetch(API_BASE + '/subjects');
  if (!response.ok) {
    throw new Error('Failed to fetch subjects');
  }
  return response.json();
}

export async function fetchProblems(tenantId = 'default') {
  const response = await fetch(API_BASE + '/problems', {
    headers: { 'X-Tenant-ID': tenantId },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch problems');
  }
  return response.json();
}

export async function createProblem(
  data: {
    content: string;
    subject: string;
    gradeLevel: string;
    imageUrl?: string;
    problemType?: string;
  },
  tenantId = 'default'
) {
  const response = await fetch(API_BASE + '/problems', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create problem');
  }
  return response.json();
}

export async function updateProblem(id: string, data: Record<string, unknown>) {
  const response = await fetch(API_BASE + '/problems/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update problem');
  }
  return response.json();
}

export async function getOrCreateExplanation(problemId: string) {
  const response = await fetch(API_BASE + '/explanations/problem/' + problemId, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to get/create explanation');
  }
  return response.json();
}

export async function updateExplanationField(
  explanationId: string,
  field: string,
  value: unknown
) {
  const response = await fetch(API_BASE + '/explanations/' + explanationId + '/field', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ field, value }),
  });
  if (!response.ok) {
    throw new Error('Failed to update explanation field');
  }
  return response.json();
}

export async function fetchSessionMessages(sessionId: string, includeToolEvents = false) {
  const url = API_BASE + '/sessions/' + sessionId + '/messages' +
    (includeToolEvents ? '?includeToolEvents=true' : '');
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }
  return response.json();
}
