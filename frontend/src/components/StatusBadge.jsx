const STATUS_STYLES = {
  Open: "bg-green-50 text-green-700 ring-green-200",
  "In Progress": "bg-yellow-50 text-yellow-700 ring-yellow-200",
  Closed: "bg-slate-100 text-slate-500 ring-slate-200",
};

export default function StatusBadge({ status }) {
  const styles = STATUS_STYLES[status] || STATUS_STYLES.Open;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${styles}`}
    >
      {status}
    </span>
  );
}
