'use client';
import React, { useRef, useMemo } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, isSameMonth, format, isToday, isAfter, getDay
} from 'date-fns';

export default function MonthView({ date, events, profile, setEditData, setShowDrawer, setMode, categoryColors }) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarRef = useRef(null);
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const editEvent = (item) => {
    setShowDrawer(true);
    setEditData(item);
    setMode("update")
  };

  const attendance = profile.attendance || {};
  const department = profile.department?.toLowerCase() || '';

  // --- Attendance only till current date ---
  const attendanceMap = useMemo(() => {
    const map = {};
    Object.keys(attendance).forEach((monthName) => {
      const monthData = attendance[monthName];
      if (Array.isArray(monthData)) {
        monthData.forEach((att) => {
          if (att.date <= todayStr) {
            map[att.date] = att;
          }
        });
      }
    });
    return map;
  }, [attendance, todayStr]);

  // --- Events: show all dates ---
  const eventMap = useMemo(() => {
    const map = {};
    if (!events) return map;
    events.forEach((evt) => {
      if (evt.date) {
        const key = format(new Date(evt.date), 'yyyy-MM-dd');
        if (!map[key]) map[key] = [];
        map[key].push(evt);
      }
    });
    return map;
  }, [events]);

  // --- Build calendar days ---
  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const formattedDate = format(day, 'yyyy-MM-dd');
      const isCurrentMonth = isSameMonth(day, monthStart);
      const isTodayDate = isToday(day);
      const weekday = getDay(day); // 0 = Sunday

      let att = attendanceMap[formattedDate];
      const evts = eventMap[formattedDate] || [];

      // --- Auto-mark attendance logic ---
      let autoStatus = '';
      if (department === 'tech') {
        if (weekday === 0 || weekday === 2) autoStatus = 'off'; // Sunday & Tuesday
      } else {
        if (weekday === 0) autoStatus = 'off'; // Only Sunday
      }

      if (!isAfter(day, today)) {
        if (!att) {
          att = { date: formattedDate, status: autoStatus || 'absent', checkIn: '', checkOut: '', workingHours: '' };
        } else {
          if (!att.checkIn && !att.checkOut && !autoStatus) att.status = 'absent';
          else if (autoStatus) att.status = autoStatus;
        }
      }

      // --- Background color logic ---
      let bgColor = '#ffffff';
      if (!isCurrentMonth) bgColor = '#f5f5f5';
      if (weekday === 0) bgColor = '#ffeaea'; // Sunday light red
      if (att?.status === 'absent') bgColor = '#ffc9c9'; // Absent red
      if (isTodayDate) bgColor = '#d9fdd3'; // Today green highlight

      days.push(
        <div
          key={formattedDate}
          className={`border border-gray-200 p-1 h-28 text-xs relative flex flex-col cursor-pointer`}
          style={{ backgroundColor: bgColor }}
        >
          {/* Date number */}
          <div className="font-semibold text-right pr-1 text-gray-700">
            {format(day, 'd')}
          </div>

          {/* Attendance (only if date <= today) */}
          {!isAfter(day, today) && att && (
            <div
              className="mt-1 text-[11px] px-1 py-0.5 rounded capitalize"
              style={{
                backgroundColor: hexToRgba(categoryColors[att.status] || '#ef4444', 0.15),
                color: categoryColors[att.status] || '#b91c1c',
              }}
            >
              {att.status} {att.workingHours && `(${att.workingHours})`}
            </div>
          )}

          {/* Events (all dates) */}
          {evts.length > 0 && (
            <div className="mt-1 space-y-1 overflow-hidden">
              {evts.map((e, idx) => (
                <div
                  key={idx}
                  onClick={() => editEvent(e)}
                  className="truncate rounded px-1 py-0.5 text-[11px]"
                  style={{
                    backgroundColor: hexToRgba(categoryColors[e.type] || '#f59e0b', 0.2),
                    color: categoryColors[e.type] || '#92400e'
                  }}
                >
                  📅 {e.title}
                </div>
              ))}
            </div>
          )}
        </div>
      );

      day = addDays(day, 1);
    }

    rows.push(
      <div key={format(day, 'yyyy-MM-dd')} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0">
        {days}
      </div>
    );
    days = [];
  }

  return (
    <div ref={calendarRef} className="border border-gray-200 mt-5 overflow-hidden relative rounded-lg shadow-sm">
      <div className="grid grid-cols-7 bg-gray-100 text-gray-700 font-semibold text-sm border-b border-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => (
          <div key={dayName} className="text-center py-2">{dayName}</div>
        ))}
      </div>
      {rows}
    </div>
  );
}

// Convert hex to RGBA
const hexToRgba = (hex, alpha = 1) => {
  let r = 0, g = 0, b = 0;
  if (hex.startsWith('#')) hex = hex.slice(1);
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
