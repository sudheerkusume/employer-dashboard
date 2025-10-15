
'use client';
import { useState } from 'react';

export default function LeaveModal({ initialSlot, onClose, onSubmitted }) {
  const [start, setStart] = useState(initialSlot?.start ? formatDate(initialSlot.start) : '');
  const [end, setEnd] = useState(initialSlot?.end ? formatDate(initialSlot.end) : '');
  const [reason, setReason] = useState('');

  function formatDate(d) {
    if (!d) return '';
    const x = new Date(d);
    return x.toISOString().split('T')[0];
  }

  async function submit(e) {
    e.preventDefault();
    await fetch('/api/leaves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start, end, reason })
    });
    if (onSubmitted) onSubmitted();
    if (onClose) onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl w-96 shadow">
        <h3 className="text-lg font-semibold mb-3">Apply for Leave</h3>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-sm">Start</label>
            <input type="date" value={start} onChange={(e)=>setStart(e.target.value)} className="w-full border rounded p-2" required />
          </div>
          <div>
            <label className="text-sm">End</label>
            <input type="date" value={end} onChange={(e)=>setEnd(e.target.value)} className="w-full border rounded p-2" required />
          </div>
          <div>
            <label className="text-sm">Reason</label>
            <textarea value={reason} onChange={(e)=>setReason(e.target.value)} className="w-full border rounded p-2" rows={3} required />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="px-3 py-1 rounded border" onClick={onClose}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded">Apply</button>
          </div>
        </form>
      </div>
    </div>
  );
}
