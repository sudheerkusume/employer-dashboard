
'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';

const Calendar = dynamic(() => import('react-big-calendar').then(mod => mod.Calendar), { ssr: false });
import moment from 'moment';
import { momentLocalizer } from 'react-big-calendar';
import LeaveModal from '@/app/components/LeaveModal';
import ApproveModal from '@/app/components/ApproveModal';
import StatusLegend from '@/app/components/StatusLegend';
const localizer = momentLocalizer(moment);

const fetcher = (url) => fetch(url).then(res => res.json());

export default function LeavePage() {
  const { data: leaves = [], mutate } = useSWR('/api/leaves', fetcher);
  const [showApply, setShowApply] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [role, setRole] = useState('employee'); // For demo; in app use session to set role

  useEffect(() => {
    // For demo show role dropdown (in real app, derive from session)
    fetch('/api/me').then(r => r.json()).then(d => {
      if (d?.user?.role) setRole(d.user.role);
    }).catch(() => { });
  }, []);

  const events = (leaves || []).map(l => ({
    id: l._id || l.id,
    title: l.status === 'Present' ? 'Present' : l.status === 'Absent' ? 'Absent' : (l.employee?.name || 'You') + ' - ' + l.status,
    start: new Date(l.start),
    end: new Date(l.end),
    allDay: true,
    status: l.status,
    employee: l.employee,
    raw: l,
  }));

  const eventStyleGetter = (event) => {
    let bg = '#60a5fa'; // default blue - present
    if (event.status === 'Pending' || event.status === 'Leave' || event.status === 'Pending') bg = '#f59e0b'; // yellow
    if (event.status === 'Approved') bg = '#10b981'; // green
    if (event.status === 'Rejected') bg = '#ef4444'; // red
    if (event.status === 'Absent') bg = '#f97316'; // orange
    if (event.status === 'Holiday') bg = '#8b5cf6'; // purple
    return { style: { backgroundColor: bg, color: 'white', borderRadius: '6px' } };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        <div className="bg-white p-4 rounded-2xl shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Leave & Attendance Calendar</h2>
            <div className="flex items-center gap-3">
              <select value={role} onChange={(e) => setRole(e.target.value)} className="border p-2 rounded-md">
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">HR (Admin)</option>
              </select>
              <button className="bg-primary text-white px-4 py-2 rounded-md" onClick={() => setShowApply(true)}>+ Apply Leave</button>
            </div>
          </div>

          <div style={{ height: 600 }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              selectable
              onSelectEvent={(ev) => setSelectedEvent(ev)}
              onSelectSlot={(slotInfo) => {
                // prefill apply modal for selected slot
                setShowApply({ start: slotInfo.start, end: slotInfo.end });
              }}
              eventPropGetter={eventStyleGetter}
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white p-4 rounded-2xl shadow">
          <h3 className="font-semibold mb-2">Legend</h3>
          <StatusLegend />
        </div>

        <div className="bg-white p-4 rounded-2xl shadow">
          <h3 className="font-semibold mb-2">Filters</h3>
          <p className="text-sm text-gray-500">Filter by status or employee (coming soon)</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow">
          <h3 className="font-semibold mb-2">Quick Info</h3>
          <p className="text-sm text-gray-500">Present / Absent / Leave / Holiday are displayed on the calendar.</p>
        </div>
      </div>

      {showApply && (
        <LeaveModal
          initialSlot={showApply}
          onClose={() => { setShowApply(false); mutate(); setShowApply(false); }}
          onSubmitted={() => { mutate(); setShowApply(false); }}
        />
      )}

      {selectedEvent && (
        <ApproveModal
          event={selectedEvent}
          role={role}
          onClose={() => { setSelectedEvent(null); mutate(); }}
          onAction={() => { mutate(); setSelectedEvent(null); }}
        />
      )}
    </div>
  );
}
