const SLA_HOURS = {
  Urgent: 2,
  High: 8,
  Medium: 24,
  Low: 48,
};

function normalizeDate(dateString) {
  return /(?:Z|[+-]\d{2}:?\d{2})$/i.test(dateString)
    ? dateString
    : `${dateString}Z`;
}

export function formatDate(dateString) {
  return new Date(normalizeDate(dateString)).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

export function getSlaDueDate(ticket) {
  if (ticket.sla_due_at) return new Date(normalizeDate(ticket.sla_due_at));

  const createdAt = new Date(normalizeDate(ticket.created_at));
  return new Date(createdAt.getTime() + SLA_HOURS[ticket.priority] * 60 * 60 * 1000);
}

function formatDuration(milliseconds) {
  const totalMinutes = Math.max(1, Math.round(Math.abs(milliseconds) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function getSlaStatus(ticket, now = new Date()) {
  if (ticket.status === "Closed") {
    return { label: "Resolved", tone: "resolved", overdue: false };
  }

  const difference = getSlaDueDate(ticket).getTime() - now.getTime();
  if (difference <= 0) {
    return { label: `Overdue by ${formatDuration(difference)}`, tone: "overdue", overdue: true };
  }

  return { label: `Due in ${formatDuration(difference)}`, tone: "due", overdue: false };
}
