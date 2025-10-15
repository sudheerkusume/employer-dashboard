
'use client';
import { useState } from 'react';

export default function ApproveModal({ event, role, onClose, onAction }) {
  const [loading, setLoading] = useState(false);

  async function takeAction(status) {
    setLoading(true);
    await fetch('/api/leaves', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: event.id, status })
    });
    setLoading(false);
    if (onAction) onAction();
    if (onClose) onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl w-96 shadow">
        <h3 className="text-lg font-semibold mb-2">Leave Details</h3>
        <p><b>Employee:</b> {event.employee?.name || 'Unknown'}</p>
        <p><b>From:</b> {new Date(event.start).toISOString().split('T')[0]}</p>
        <p><b>To:</b> {new Date(event.end).toISOString().split('T')[0]}</p>
        <p className="mt-2"><b>Reason:</b> {event.raw?.reason || '—'}</p>

        <div className="flex justify-end gap-2 mt-4">
          {role !== 'employee' && <button className="px-3 py-1 rounded border" onClick={()=>takeAction('Rejected')} disabled={loading}>Reject</button>}
          {role !== 'employee' && <button className="px-3 py-2 bg-green-500 text-white rounded" onClick={()=>takeAction('Approved')} disabled={loading}>Approve</button>}
          <button className="px-3 py-1 rounded border" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
