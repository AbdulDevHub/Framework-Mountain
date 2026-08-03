const statusStyles: Record<string, string> = {
  saved: "bg-slate-100 text-slate-700 ring-slate-600/20",
  applied: "bg-sky-50 text-sky-700 ring-sky-600/20",
  interviewing: "bg-violet-50 text-violet-700 ring-violet-600/20",
  offer: "bg-amber-50 text-amber-700 ring-amber-600/20",
  accepted: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
  withdrawn: "bg-stone-100 text-stone-600 ring-stone-500/20",
  // Reminder statuses
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  sent: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  failed: "bg-rose-50 text-rose-700 ring-rose-600/20",
  cancelled: "bg-stone-100 text-stone-500 ring-stone-500/20",
};

export function StatusBadge({ status }: { status: string }) {
  const classes = statusStyles[status] ?? "bg-slate-100 text-slate-700 ring-slate-600/20";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${classes}`}
    >
      {status}
    </span>
  );
}