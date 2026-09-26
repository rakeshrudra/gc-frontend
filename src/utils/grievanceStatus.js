export const GRIEVANCE_STATUSES = [
  'new',
  'assigned',
  'acknowledged',
  'in_progress',
  'waiting_for_requester',
  'escalated',
  'resolved',
  'closed',
  'reopened',
];

const LABELS = {
  new: 'New',
  assigned: 'Assigned',
  acknowledged: 'Acknowledged',
  in_progress: 'In Progress',
  waiting_for_requester: 'Waiting for Requester',
  escalated: 'Escalated',
  resolved: 'Resolved',
  closed: 'Closed',
  reopened: 'Reopened',
};

const COLORS = {
  new: { bg: '#eef2f7', fg: '#455a64' },
  assigned: { bg: '#e3f2fd', fg: '#1565c0' },
  acknowledged: { bg: '#e0f7fa', fg: '#00838f' },
  in_progress: { bg: '#fff8e1', fg: '#946200' },
  waiting_for_requester: { bg: '#fbe9e7', fg: '#bf360c' },
  escalated: { bg: '#fdecea', fg: '#c62828' },
  resolved: { bg: '#e8f5e9', fg: '#2e7d32' },
  closed: { bg: '#eceff1', fg: '#37474f' },
  reopened: { bg: '#f3e5f5', fg: '#6a1b9a' },
};

export function getGrievanceStatusLabel(status) {
  return LABELS[status] ?? status;
}

export function getGrievanceStatusColor(status) {
  return COLORS[status] ?? { bg: '#eceff1', fg: '#37474f' };
}
