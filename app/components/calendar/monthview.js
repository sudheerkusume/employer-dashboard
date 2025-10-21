'use client';
import React, { useRef, useMemo } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, isSameMonth, format, isToday
} from 'date-fns';

export default function MonthView({ date, events, categoryColors }) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarRef = useRef(null);
  const rows = [];
  let days = [];
  let day = startDate;

  // Helper: Calculate working hours in decimal
  const calculateWorkingHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const [inH, inM] = checkIn.split(':').map(Number);
    const [outH, outM] = checkOut.split(':').map(Number);
    const diff = (outH + outM / 60) - (inH + inM / 60);
    return diff > 0 ? diff : 0;
  };

  // Helper: Determine status
  const determineStatus = (checkIn, checkOut) => {
    const fullDayHrs = 8.75; // 8 hrs 45 mins
    const halfDayHrs = 4.25; // 4 hrs 15 mins
    const workingHours = calculateWorkingHours(checkIn, checkOut);

    if (checkIn && checkOut) {
      if (workingHours >= fullDayHrs) return 'present';
      if (workingHours >= halfDayHrs) return 'halfDay';
      return 'absent';
    }
    if (checkIn && !checkOut) return 'firstHalf';
    if (!checkIn && checkOut) return 'secondHalf';
    return 'absent';
  };

  // Map attendance events by date
  const attendanceMap = useMemo(() => {
    const map = {};
    if (!events) return map;

    Object.keys(events).forEach(monthName => {
      const monthData = events[monthName];
      if (Array.isArray(monthData)) {
        monthData.forEach(att => {
          if (att.date) {
            const workingHours = calculateWorkingHours(att.checkIn, att.checkOut);
            const status = determineStatus(att.checkIn, att.checkOut);
            map[att.date] = { ...att, workingHours, status };
          }
        });
      }
    });

    return map;
  }, [events]);

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const formattedDate = format(day, 'yyyy-MM-dd');
      const att = attendanceMap[formattedDate];
      const status = att?.status || null;
      const isCurrentMonth = isSameMonth(day, monthStart);
      const isTodayDate = isToday(day);

      // Background color
      let bgColor = '#ffffff';
      if (isTodayDate) bgColor = '#d1d5db';
      else if (status) bgColor = categoryColors[status] || '#9ca3af';

      const textColor = (isTodayDate || status) ? '#ffffff' : '#374151';

      // Tooltip
      const title = att
        ? `Check-in: ${att.checkIn || '-'} | Check-out: ${att.checkOut || '-'} | Hours: ${att.workingHours.toFixed(2) || '-'} | Status: ${att.status}`
        : '';

      days.push(
        <div
          key={formattedDate}
          className={`border border-gray-200 p-1 h-28 text-xs align-top relative flex flex-col cursor-pointer ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}`}
          style={{ backgroundColor: bgColor, color: textColor }}
          title={title}
        >
          <div className={`font-semibold text-right pr-1 ${isCurrentMonth ? 'text-gray-700' : 'text-gray-400'}`}>
            {format(day, 'd')}
          </div>

          <div className="space-y-1 mt-1 overflow-hidden flex-grow">
            {att && (
              <>
                {att.checkIn && <div>In: {att.checkIn}</div>}
                {att.checkOut && <div>Out: {att.checkOut}</div>}
                <div
                  className="truncate rounded px-1 py-0.5 w-full text-sm h-full"
                  style={{
                    backgroundColor: hexToRgba(categoryColors[att.status], 0.15),
                    color: categoryColors[att.status]
                  }}
                >
                  {att.status} ({att.workingHours.toFixed(2)} hrs)
                </div>
              </>
            )}
          </div>
        </div>
      );

      day = addDays(day, 1);
    }
    rows.push(<div className="grid grid-cols-7 border-b border-gray-200 last:border-b-0" key={format(day, 'yyyy-MM-dd')}>{days}</div>);
    days = [];
  }

  return (
    <div ref={calendarRef} className="border border-gray-200 mt-5 overflow-hidden relative">
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
