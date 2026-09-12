// Priority badge with visually distinct colors for each level.
// Colors chosen to be professional and easily distinguishable at a glance.
const PRIORITY_STYLES = {
  Low: "bg-slate-100 text-slate-600 ring-slate-200",
  Medium: "bg-blue-50 text-blue-700 ring-blue-200",
  High: "bg-orange-50 text-orange-700 ring-orange-200",
  Urgent: "bg-red-50 text-red-700 ring-red-200",
};

export default function PriorityBadge({ priority }) {
  const styles = PRIORITY_STYLES[priority] || PRIORITY_STYLES.Medium;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${styles}`}
    >
      {priority?.toUpperCase()}
    </span>
  );
}
