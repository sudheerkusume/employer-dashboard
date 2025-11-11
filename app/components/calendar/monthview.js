'use client';
import React, { useRef, useMemo } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, isSameMonth, format, isToday, isAfter, getDay, isBefore
} from 'date-fns';

export default function MonthView({
  date,
  events,
  profile,
  setEditData,
  setShowDrawer,
  setMode,
  categoryColors = {
    present: "#A8DCAB",
    firstHalf: "#A8DCAB",
    secondHalf: "#A8DCAB",
    halfDay: "#A8DCAB",
    absent: "#ff6a6a",
    "Checked In": "#2563eb",
    leaveApproved: "#e8d15dff",
    holiday: "#CBC3E3",
    sunday: "#d5d7d9ff",
    today: "#48a84dff",
    presentLate: "#A8DCAB",
  }
}) {
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
    setMode("update");
  };

  const attendance = profile.attendance || {};
  const department = profile.department?.toLowerCase() || '';
  const joiningDate = new Date(profile.dateOfJoining);

  // Helper function to check if date is Sunday
  const isSundayHoliday = (date) => {
    return getDay(date) === 0;
  };

  // Function to determine status based on your logic
  const determineStatus = (checkIn, checkOut, leaveType, leaveStatus, date, workingHoursStr) => {
    // Check if it's Sunday (holiday) - return 'sunday' for Sundays
    if (date && isSundayHoliday(new Date(date))) {
      return 'sunday';
    }

    const today = new Date();
    const currentDate = date ? new Date(date) : null;
    const isFutureDate = currentDate && currentDate > today;

    // Extract numeric working hours from string like "9.03 hrs" or "8.50"
    const getNumericWorkingHours = (hoursStr) => {
      if (!hoursStr) return 0;
      // Remove "hrs" and any non-numeric characters except decimal point
      const numericStr = hoursStr.toString().replace('hrs', '').trim();
      return parseFloat(numericStr) || 0;
    };

    const workingHours = getNumericWorkingHours(workingHoursStr);

    // Handle approved leaves first - check both leaveStatus and status fields
    if (leaveStatus === 'approved' || leaveStatus === 'firstHalfApproved' || leaveStatus === 'secondHalfApproved') {
      if (leaveType === 'full' || leaveType === 'casual') {
        return 'leaveApproved'; // Full day leave
      }

      if (leaveType === 'first half' || leaveStatus === 'firstHalfApproved') {
        // For future dates with first half approved, just show the leave without absent/present
        if (isFutureDate) {
          return 'firstHalfApproved'; // Just show first half leave for future dates
        }
        // First half approved - check if second half is present based on working hours
        if (workingHours >= 4) {
          return 'firstHalfApproved_present'; // First half leave (yellow), second half present (green)
        } else {
          return 'firstHalfApproved_absent'; // First half leave (yellow), second half absent (red)
        }
      }

      if (leaveType === 'second half' || leaveStatus === 'secondHalfApproved') {
        // For future dates with second half approved, just show the leave without absent/present
        if (isFutureDate) {
          return 'secondHalfApproved'; // Just show second half leave for future dates
        }
        // Second half approved - check if first half is present based on working hours
        if (workingHours >= 4) {
          return 'secondHalfApproved_present'; // Second half leave (yellow), first half present (green)
        } else {
          return 'secondHalfApproved_absent'; // Second half leave (yellow), first half absent (red)
        }
      }
    }

    // Handle present status (including presentLate)
    if ((workingHours >= 8.45 || leaveStatus === 'present') || leaveStatus === 'presentLate') {
      return 'present';
    }

    // If no status but working hours are 8.45+ and check-in/check-out exist, mark as present
    if ((!leaveStatus || leaveStatus === 'Checked In') && checkIn && checkOut && workingHours >= 8.45) {
      return 'present';
    }

    // Condition: no check-in and check-out times
    if (!checkIn && !checkOut) {
      // For future dates without data, return null to show transparent
      if (isFutureDate) {
        return null;
      }
      return 'absent';
    }

    // Condition: present with 8+ working hours
    if (workingHours >= 8.45) {
      return 'present';
    }

    // Handle half days based on working hours
    if (workingHours >= 4) {
      // Determine which half based on check-in time
      if (checkIn) {
        const checkInTime = checkIn.split(':').map(Number);
        const checkInHour = checkInTime[0] + (checkInTime[1] / 60);

        if (checkInHour <= 12.0) { // Check-in before 12:00 = first half
          return 'firstHalfp';
        } else { // Check-in after 12:00 = second half
          return 'secondhalfp';
        }
      }
    }

    // Default case - for future dates return null, for past dates return absent
    return isFutureDate ? null : 'absent';
  };

  // Function to calculate working hours from check-in and check-out
  const calculateWorkingHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return null;

    try {
      const [inHour, inMinute] = checkIn.split(':').map(Number);
      const [outHour, outMinute] = checkOut.split(':').map(Number);

      const checkInTime = new Date(2000, 0, 1, inHour, inMinute);
      const checkOutTime = new Date(2000, 0, 1, outHour, outMinute);

      const diffMs = checkOutTime - checkInTime;
      const diffHours = diffMs / (1000 * 60 * 60);

      return Math.round(diffHours * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      return null;
    }
  };

  // ---- ATTENDANCE MAP ----
  const attendanceMap = useMemo(() => {
    const map = {};
    Object.keys(attendance).forEach((monthName) => {
      const monthData = attendance[monthName];
      if (Array.isArray(monthData)) {
        monthData.forEach((att) => {
          const attDate = new Date(att.date);
          if (attDate <= today && attDate >= joiningDate) {
            // Calculate working hours if not provided
            if (!att.workingHours && att.checkIn && att.checkOut) {
              att.workingHours = calculateWorkingHours(att.checkIn, att.checkOut);
            }
            map[att.date] = att;
          }
        });
      }
    });
    return map;
  }, [attendance, todayStr, joiningDate]);

  // ---- EVENT MAP ----
  const eventMap = useMemo(() => {
    const map = {};
    if (!events) return map;
    events.forEach((evt) => {
      const evtDate = new Date(evt.date);
      if (evtDate >= joiningDate) {
        const key = format(evtDate, 'yyyy-MM-dd');
        if (!map[key]) map[key] = [];
        map[key].push(evt);
      }
    });
    return map;
  }, [events, joiningDate]);

  // ---- RENDER CALENDAR ----
  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const formattedDate = format(day, 'yyyy-MM-dd');
      const isCurrentMonth = isSameMonth(day, monthStart);
      const isTodayDate = isToday(day);
      const weekday = getDay(day);
      const beforeJoining = isBefore(day, joiningDate);
      const isFutureDate = isAfter(day, today);

      let att = attendanceMap[formattedDate];
      const evts = eventMap[formattedDate] || [];

      // Check for holidays and Sundays for the selected month
      const isHoliday = evts.some(e => e.type === "holiday");
      const isSunday = weekday === 0;
      const isTechOffDay = department === "tech" && weekday === 2; // Tuesday is off for tech (2 = Tuesday)

      // FOR TECH DEPARTMENT: Always show "Off" on Tuesdays regardless of attendance data
      if (department === "tech" && isTechOffDay && isCurrentMonth && !beforeJoining) {
        att = {
          date: formattedDate,
          status: 'sunday', // Use sunday status for consistent coloring
          checkIn: '',
          checkOut: '',
          workingHours: '',
          isOffDay: true // Flag to indicate it's an off day
        };
      }
      // For future dates in current month, only show leaves and off days
      else if (isFutureDate && isCurrentMonth) {
        let futureStatus = null;

        // Check if there's a leave application for this future date
        if (att && (att.leaveStatus === 'approved' || att.leaveStatus === 'firstHalfApproved' || att.leaveStatus === 'secondHalfApproved')) {
          futureStatus = determineStatus(null, null, att.leaveType, att.leaveStatus, formattedDate, null);
        }
        // Check for Sunday
        else if (isSunday) {
          futureStatus = 'sunday';
        }
        // Check for tech off day (Tuesday)
        else if (isTechOffDay) {
          futureStatus = 'sunday'; // Use same color as Sunday for tech off days
        }
        // Check for holiday
        else if (isHoliday) {
          futureStatus = 'holiday';
        }

        if (futureStatus) {
          att = {
            date: formattedDate,
            status: futureStatus,
            checkIn: '',
            checkOut: '',
            workingHours: '',
            ...att // Keep existing att data if any
          };
        }
      } else if (isCurrentMonth && !beforeJoining && !isFutureDate) {
        // For current month past dates, determine status normally
        const determinedStatus = determineStatus(
          att?.checkIn,
          att?.checkOut,
          att?.leaveType,
          att?.status || att?.leaveStatus,
          formattedDate,
          att?.workingHours
        );

        // Override status with determined status
        if (att && determinedStatus) {
          att = { ...att, status: determinedStatus };
        } else if (!att && determinedStatus) {
          att = {
            date: formattedDate,
            status: determinedStatus,
            checkIn: '',
            checkOut: '',
            workingHours: '',
          };
        }
      }

      // ---- AUTO STATUS for current month past dates ----
      if (isCurrentMonth && !beforeJoining && !isFutureDate && !att) {
        let autoStatus = '';
        if (department === 'tech') {
          if (weekday === 0 || weekday === 2) autoStatus = 'sunday'; // Sunday and Tuesday off for tech
        } else {
          if (weekday === 0) autoStatus = 'sunday'; // Only Sunday off for others
        }

        if (isHoliday) {
          autoStatus = 'holiday';
        }

        if (autoStatus) {
          att = {
            date: formattedDate,
            status: autoStatus,
            checkIn: '',
            checkOut: '',
            workingHours: '',
          };
        }
      }

      // ---- CELL BACKGROUND COLORS ----
      let bgColor = "#ffffff";

      if (!isCurrentMonth) {
        // Disable previous and future months
        bgColor = "#f9f9f9";
      } else if (beforeJoining) {
        bgColor = "#f0f0f0";
      } else if (isSunday) {
        bgColor = categoryColors.sunday || "#d5d7d9ff";
      } else if (isTechOffDay) {
        bgColor = categoryColors.sunday || "#d5d7d9ff"; // Same as Sunday for tech off days (Tuesday)
      } else if (isHoliday) {
        bgColor = categoryColors.holiday || "#CBC3E3";
      } else if (att?.status === "absent") {
        bgColor = categoryColors.absent || "#ff6a6a";
      } else if (
        att?.status === "present" ||
        att?.status === "presentLate" ||
        att?.status === "halfDay" ||
        att?.status === "firstHalf" ||
        att?.status === "secondHalf" ||
        att?.status === "firstHalfp" ||
        att?.status === "secondhalfp" ||
        att?.status === "secondHalfApproved_present" // Second half leave + first half present
      ) {
        bgColor = categoryColors.present || "#A8DCAB";
      } else if (
        att?.status === "leaveApproved" ||
        att?.status === "firstHalfApproved" ||
        att?.status === "secondHalfApproved" ||
        att?.status === "firstHalfApproved_present" ||
        att?.status === "firstHalfApproved_absent" ||
        att?.status === "secondHalfApproved_absent"
      ) {
        bgColor = categoryColors.leaveApproved || "#e8d15dff";
      } else if (att?.status === "Checked In") {
        bgColor = categoryColors["Checked In"] || "#2563eb";
      }

      // Today highlight (only for current month working days)
      if (
        isTodayDate &&
        isCurrentMonth &&
        !isSunday &&
        !isTechOffDay &&
        !isHoliday
      ) {
        bgColor = categoryColors.today || "#48a84dff";
      }

      // Format display text for attendance badge
      const getAttendanceDisplayText = (attendance, isTechOff) => {
        if (!attendance) return '';

        // FOR TECH DEPARTMENT: Always show "Off" on Tuesdays
        if (isTechOff) {
          return 'Off';
        }

        const status = attendance.status;
        let displayText = status;

        // Handle special cases for half leave + half present
        if (status === 'secondHalfApproved_present') {
          displayText = 'Second Half Leave';
        } else if (status === 'firstHalfApproved_present') {
          displayText = 'First Half Leave';
        }
        // For present and presentLate, show working hours in brackets
        else if ((status === 'present' || status === 'presentLate') && attendance.workingHours) {
          displayText = `${status} (${attendance.workingHours}${typeof attendance.workingHours === 'number' ? 'h' : ''})`;
        }
        // For current day with check-in but no checkout, show check-in time
        else if (isTodayDate && attendance.checkIn && !attendance.checkOut) {
          displayText = `Checked In (${attendance.checkIn})`;
        }
        // For other cases with working hours, show working hours
        else if (attendance.workingHours && !isFutureDate) {
          displayText = `${status} (${attendance.workingHours}${typeof attendance.workingHours === 'number' ? 'h' : ''})`;
        }
        // For check-in only cases
        else if (attendance.checkIn && !isFutureDate) {
          displayText = `${status} (${attendance.checkIn})`;
        }
        // For future leaves, show simplified text
        else if (isFutureDate) {
          if (status === 'firstHalfApproved') displayText = 'First Half Leave';
          else if (status === 'secondHalfApproved') displayText = 'Second Half Leave';
          else if (status === 'leaveApproved') displayText = 'Full Day Leave';
          else if (status === 'sunday' && isTechOffDay) displayText = 'Off';
          else if (status === 'sunday') displayText = 'Sunday';
          else if (status === 'holiday') displayText = 'Holiday';
        }
        // For off days
        else if (status === 'sunday' && isTechOffDay) {
          displayText = 'Off';
        } else if (status === 'sunday') {
          displayText = 'Sunday';
        }

        return displayText;
      };

      days.push(
        <div
          key={formattedDate}
          className={`border border-gray-200 p-1 h-28 text-xs relative flex flex-col ${isCurrentMonth ? 'cursor-pointer' : 'cursor-not-allowed'
            }`}
          style={{
            backgroundColor: bgColor,
            opacity: !isCurrentMonth || beforeJoining ? 0.5 : 1
          }}
        >
          {/* DATE NUMBER */}
          <div
            className="font-semibold text-right pr-1"
            style={{
              color: isTodayDate && isCurrentMonth ? categoryColors.today || "#48a84dff" : "#4b5563",
            }}
          >
            {format(day, 'd')}
            {!isCurrentMonth && (
              <span className="text-xs text-gray-400 ml-1">
                {format(day, 'MMM')}
              </span>
            )}
          </div>

          {/* ATTENDANCE BADGE - Only for current month and valid dates */}
          {isCurrentMonth && !beforeJoining && att && (
            <div
              className="mt-1 text-[11px] px-1 py-0.5 rounded capitalize"
              style={{
                backgroundColor: hexToRgba(
                  categoryColors[att.status] ||
                  (att.status === 'presentLate' ? categoryColors.present : "#A8DCAB"),
                  0.25
                ),
                color: categoryColors[att.status] ||
                  (att.status === 'presentLate' ? categoryColors.present : "#2563eb"),
              }}
            >
              {getAttendanceDisplayText(att, department === "tech" && isTechOffDay)}
            </div>
          )}

          {/* EVENTS - Only for current month and valid dates */}
          {isCurrentMonth && !beforeJoining && evts.length > 0 && (
            <div className="mt-1 space-y-1 overflow-hidden">
              {evts.map((e, idx) => (
                <div
                  key={idx}
                  onClick={() => isCurrentMonth && editEvent(e)}
                  className={`truncate rounded px-1 py-0.5 text-semibold text-[11px] ${isCurrentMonth ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'
                    }`}
                  style={{
                    backgroundColor: hexToRgba(categoryColors[e.type] || "#CBC3E3", 0.25),
                    color: "#2a2a2aff",
                  }}
                >
                  📅 {e.title}
                </div>
              ))}
            </div>
          )}

          {/* Disabled overlay for non-current month */}
          {!isCurrentMonth && (
            <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center">
              <span className="text-gray-400 text-xs rotate-45 opacity-60">
                {format(day, 'MMM')}
              </span>
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
    <div
      ref={calendarRef}
      className="border border-gray-200 mt-5 overflow-hidden relative rounded-lg shadow-sm"
    >
      <div className="grid grid-cols-7 bg-gray-100 text-gray-700 font-semibold text-sm border-b border-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => (
          <div key={dayName} className="text-center py-2">
            {dayName}
          </div>
        ))}
      </div>
      {rows}
    </div>
  );
}

// Convert hex to RGBA
const hexToRgba = (hex, alpha = 1) => {
  if (!hex) return `rgba(0, 0, 0, ${alpha})`;

  let r = 0, g = 0, b = 0;
  let cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;

  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};