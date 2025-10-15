
export default function StatusLegend() {
  const items = [
    { label: 'Present', color: '#60a5fa' },
    { label: 'Absent', color: '#f97316' },
    { label: 'Leave (Pending)', color: '#f59e0b' },
    { label: 'Leave (Approved)', color: '#10b981' },
    { label: 'Holiday', color: '#8b5cf6' },
  ];
  return (
    <div className="space-y-2">
      {items.map(it => (
        <div key={it.label} className="flex items-center gap-3">
          <div style={{ background: it.color }} className="w-6 h-6 rounded"></div>
          <div className="text-sm">{it.label}</div>
        </div>
      ))}
    </div>
  );
}
