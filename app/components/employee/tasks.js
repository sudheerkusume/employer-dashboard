import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sun, Moon, Check, Pencil, Trash2, Plus, TriangleAlert, X, Send, ChevronDown, ChevronUp, Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Undo, Redo, Eraser, Strikethrough, CheckSquare } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';


const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');
`;

const DEFAULT_PLAN = {
  status: 'In progress',
  morningPlan: '',
  eveningUpdate: '',
  blockers: '',
};

const extractSubtasksFromDoc = (doc) => {
  const listItems = doc.querySelectorAll('body > ul > li, body > ol > li');
  let subtasks = [];
  if (listItems.length > 0) {
    subtasks = Array.from(listItems).map((li, i) => ({
      id: i,
      text: li.textContent.trim(),
      status: 'Pending'
    }));
  } else {
    const paragraphs = doc.querySelectorAll('p');
    if (paragraphs.length > 0) {
      subtasks = Array.from(paragraphs)
        .map(p => p.textContent.trim())
        .filter(t => t)
        .map((text, i) => ({ id: i, text, status: 'Pending' }));
    } else if (doc.body.textContent.trim()) {
      subtasks = [{ id: 0, text: doc.body.textContent.trim(), status: 'Pending' }];
    }
  }
  return subtasks;
};

export default function Tasks({ todayPlan = DEFAULT_PLAN }) {
  const [tasks, setTasks] = useState([]);
  const [hasWarnedHoliday, setHasWarnedHoliday] = useState(false);
  const [showHolidayConfirm, setShowHolidayConfirm] = useState(false);
  const [pendingEvent, setPendingEvent] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [newTask, setNewTask] = useState('<ol><li><p></p></li></ol>');
  const [pendingDelete, setPendingDelete] = useState(null); // { id, text }
  const [monthlyReports, setMonthlyReports] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [openReasonIndices, setOpenReasonIndices] = useState({});

  const editEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TaskList,
      TaskItem.configure({ nested: true })
    ],
    content: editValue,
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[96px] max-h-[40vh] p-3 text-[14px] leading-relaxed',
      },
    },
    onUpdate: ({ editor }) => {
      setEditValue(editor.getHTML());
    },
  });

  const newTaskEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TaskList,
      TaskItem.configure({ nested: true })
    ],
    content: newTask,
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[80px] max-h-[30vh] p-3 text-[14px] leading-relaxed',
      },
    },
    onUpdate: ({ editor }) => {
      setNewTask(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editingTask !== null && editEditor) {
      const task = tasks.find(t => t.id === editingTask);
      const content = task ? (task.html || task.text) : '';
      if (editEditor.getHTML() !== content) {
        editEditor.commands.setContent(content);
      }
    }
  }, [editingTask, tasks, editEditor]);

  const btn = (active, onClick, title, icon, disabled = false) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${active ? 'bg-[#1B1B18]/10 text-[#1B1B18]' : 'text-gray-500 hover:bg-gray-100'}`}
    >
      {icon}
    </button>
  );

  // Evening update edit state
  const [isEditingUpdate, setIsEditingUpdate] = useState(false);
  const [editedUpdate, setEditedUpdate] = useState('');
  const [localEveningUpdate, setLocalEveningUpdate] = useState('');

  useEffect(() => {
    setLocalEveningUpdate(todayPlan?.eveningUpdate || '');
  }, [todayPlan?.eveningUpdate]);

  // Fetch monthly history
  useEffect(() => {
    const fetchHistory = async () => {
      const user_details = JSON.parse(localStorage.getItem('user_details') || '{}');
      const employeeId = user_details?._id || user_details?.userId || user_details?.userCode;
      if (!employeeId) return;

      try {
        const res = await fetch(`/api/eod?role=employee&id=${employeeId}`);
        const data = await res.json();
        if (data.success && data.reports) {
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          const thisMonthReports = data.reports.filter(report => {
            const reportDate = new Date(report.date); // format YYYY-MM-DD
            return reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear;
          });
          // Sort descending by date
          thisMonthReports.sort((a, b) => new Date(b.date) - new Date(a.date));
          setMonthlyReports(thisMonthReports);
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
      }
    };
    fetchHistory();
  }, []);

  const modalRef = useRef(null);
  const undoTimer = useRef(null);

  useEffect(() => {
    if (todayPlan?.morningPlan) {
      let completedSection = '';
      let inProgressSection = '';
      let blockedSection = '';
      if (todayPlan.eveningUpdate) {
        const updateText = todayPlan.eveningUpdate;

        const getSectionText = (startMarker, nextMarkers) => {
          const startIdx = updateText.indexOf(startMarker);
          if (startIdx === -1) return '';
          let endIdx = updateText.length;
          for (const marker of nextMarkers) {
            const idx = updateText.indexOf(marker);
            if (idx !== -1 && idx > startIdx && idx < endIdx) {
              endIdx = idx;
            }
          }
          return updateText.substring(startIdx, endIdx);
        };

        completedSection = getSectionText('Completed Today:', ['In Progress:', 'Not Yet Picked / Unplanned Tasks:', 'Additional Accomplishments:']);
        inProgressSection = getSectionText('In Progress:', ['Not Yet Picked / Unplanned Tasks:', 'Additional Accomplishments:']);
        blockedSection = getSectionText('Not Yet Picked / Unplanned Tasks:', ['Additional Accomplishments:']);
      }

      const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const parseMorningPlanHTML = (html) => {
        if (!html || html.trim() === '') return [];

        if (!html.includes('<')) {
          return html.split('\n').filter(l => l.trim()).map(line => ({ text: line.trim(), html: null, subtasks: [] }));
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const subtasks = extractSubtasksFromDoc(doc);
        return [{ text: doc.body.textContent.trim(), html: html, subtasks }];
      };

      const rawTasks = parseMorningPlanHTML(todayPlan.morningPlan);

      const extractParsedTasks = (sectionText) => {
        const parsed = [];
        const lines = sectionText.split('\n');
        for (let line of lines) {
          line = line.trim();
          if (line.startsWith('- ')) {
            const content = line.substring(2);
            const match = content.match(/^(.*?)\s*\(Reason:\s*(.*?)\)$/);
            if (match) parsed.push({ text: match[1].trim(), reason: match[2].trim() });
            else parsed.push({ text: content.trim(), reason: '' });
          }
        }
        return parsed;
      };

      const parsedCompleted = extractParsedTasks(completedSection);
      const parsedInProgress = extractParsedTasks(inProgressSection);
      const parsedBlocked = extractParsedTasks(blockedSection);

      const findAndConsumeStatus = (taskText) => {
        let idx = parsedCompleted.findIndex(x => x.text === taskText);
        if (idx !== -1) { parsedCompleted.splice(idx, 1); return { status: 'Done', reason: '' }; }

        idx = parsedInProgress.findIndex(x => x.text === taskText);
        if (idx !== -1) { const reason = parsedInProgress[idx].reason; parsedInProgress.splice(idx, 1); return { status: 'In Progress', reason }; }

        idx = parsedBlocked.findIndex(x => x.text === taskText);
        if (idx !== -1) { const reason = parsedBlocked[idx].reason; parsedBlocked.splice(idx, 1); return { status: 'Not Picked Yet', reason }; }

        return { status: 'Pending', reason: '' };
      };

      const initial = rawTasks
        .map((t, idx) => {
          let cleanText = t.text;
          let cleanHtml = t.html;
          let isRollover = false;

          if (cleanText.startsWith('[ROLLOVER] ')) {
            isRollover = true;
            cleanText = cleanText.substring(11).trim();
            if (cleanHtml) {
              cleanHtml = cleanHtml.replace(/^(\<strong\>)?\[ROLLOVER\](\<\/strong\>)?\s*/i, '').trim();
            }
          }

          let mainStatus = 'Pending';
          let mainReason = '';

          const updatedSubtasks = (t.subtasks || []).map(st => {
            const { status, reason } = findAndConsumeStatus(st.text);
            return { ...st, status, reason };
          });

          if (updatedSubtasks.length === 0) {
            const { status, reason } = findAndConsumeStatus(cleanText);
            mainStatus = status;
            mainReason = reason;
          } else {
            if (updatedSubtasks.every(st => st.status === 'Done')) mainStatus = 'Done';
          }

          return {
            id: idx,
            text: cleanText,
            html: cleanHtml,
            status: mainStatus,
            reason: mainReason,
            isRollover,
            completed: mainStatus === 'Done',
            subtasks: updatedSubtasks
          };
        });
      setTasks(initial);
    }
  }, [todayPlan]);



  // --- DB Sync --------------------------------------------------------
  const syncTasksWithDB = async (updatedTasks) => {
    const user_details = JSON.parse(localStorage.getItem('user_details') || '{}');
    const employeeId = user_details?._id || user_details?.userId || user_details?.userCode;
    if (!employeeId) return;

    try {
      let updatedMorningPlan = '';
      const hasHtml = updatedTasks.some(t => t.html);
      if (hasHtml) {
        updatedMorningPlan = updatedTasks.map(t => {
          let content = t.html || t.text;
          if (t.isRollover) {
            if (content.startsWith('<p>')) {
              content = content.replace(/^<p>/, '<p><strong>[ROLLOVER]</strong> ');
            } else {
              content = `<strong>[ROLLOVER]</strong> ${content}`;
            }
          }
          return content;
        }).join('');
      } else {
        updatedMorningPlan = updatedTasks.map(t => (t.isRollover ? `[ROLLOVER] ${t.text}` : t.text)).join('\n');
      }

      await fetch('/api/eod', {
        method: 'PUT',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_morning_plan',
          employeeId: employeeId,
          content: updatedMorningPlan
        })
      });
    } catch (error) {
      console.error("Failed to save tasks:", error);
    }
  };

  const syncEveningUpdate = async (currentTasks) => {
    const allItems = [];
    currentTasks.forEach(t => {
      if (t.subtasks && t.subtasks.length > 0) {
        allItems.push(...t.subtasks);
      } else {
        allItems.push(t);
      }
    });

    const doneTasks = allItems.filter(t => t.status === 'Done');
    const inProgressTasks = allItems.filter(t => t.status === 'In Progress');
    const blockedTasks = allItems.filter(t => t.status === 'Blocked' || t.status === 'Not Picked Yet');

    let combinedUpdate = '';
    if (doneTasks.length > 0) combinedUpdate += "Completed Today:\n" + doneTasks.map(t => "- " + t.text).join('\n') + "\n\n";
    if (inProgressTasks.length > 0) combinedUpdate += "In Progress:\n" + inProgressTasks.map(t => t.reason ? `- ${t.text} (Reason: ${t.reason})` : `- ${t.text}`).join('\n') + "\n\n";
    if (blockedTasks.length > 0) combinedUpdate += "Not Yet Picked / Unplanned Tasks:\n" + blockedTasks.map(t => t.reason ? `- ${t.text} (Reason: ${t.reason})` : `- ${t.text}`).join('\n') + "\n\n";

    // Preserve additional accomplishments from the current local state
    let additional = '';
    if (localEveningUpdate) {
      const match = localEveningUpdate.match(/Additional Accomplishments:\n([\s\S]*?)$/);
      if (match) additional = "\nAdditional Accomplishments:\n" + match[1].trim();
    }

    const finalUpdate = (combinedUpdate + additional).trim();

    const user_details = JSON.parse(localStorage.getItem('user_details') || '{}');
    const employeeId = user_details?._id || user_details?.userId || user_details?.userCode;
    if (!employeeId) return;

    try {
      await fetch('/api/eod', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evening_update',
          employeeId: employeeId,
          content: { update: finalUpdate, blockers: todayPlan?.blockers || '' }
        })
      });
      setLocalEveningUpdate(finalUpdate);
    } catch (error) {
      console.error("Failed to sync evening update:", error);
    }
  };

  // --- task ops -------------------------------------------------------
  const updateTaskStatus = (id, newStatus) => {
    const newTasks = tasks.map((task) =>
      task.id === id ? { ...task, status: newStatus, completed: newStatus === 'Done', reason: task.status === newStatus ? task.reason : '' } : task
    );
    setTasks(newTasks);
    syncTasksWithDB(newTasks);
    syncEveningUpdate(newTasks);
  };

  const updateTaskReason = (id, newReason) => {
    const newTasks = tasks.map((task) =>
      task.id === id ? { ...task, reason: newReason } : task
    );
    setTasks(newTasks);
    syncEveningUpdate(newTasks);
  };

  const saveEveningUpdate = async () => {
    const user_details = JSON.parse(localStorage.getItem('user_details') || '{}');
    const employeeId = user_details?._id || user_details?.userId || user_details?.userCode;
    if (!employeeId) return;

    try {
      await fetch('/api/eod', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evening_update',
          employeeId: employeeId,
          content: { update: editedUpdate, blockers: todayPlan?.blockers || '' }
        })
      });
      setLocalEveningUpdate(editedUpdate);
      setIsEditingUpdate(false);
    } catch (error) {
      console.error("Failed to save update:", error);
    }
  };

  const deleteEveningUpdate = async () => {
    const user_details = JSON.parse(localStorage.getItem('user_details') || '{}');
    const employeeId = user_details?._id || user_details?.userId || user_details?.userCode;
    if (!employeeId) return;

    try {
      await fetch('/api/eod', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evening_update',
          employeeId: employeeId,
          content: { update: '', blockers: todayPlan?.blockers || '' }
        })
      });
      setLocalEveningUpdate('');
    } catch (error) {
      console.error("Failed to delete update:", error);
    }
  };

  const startEdit = (id) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      setEditingTask(id);
      setEditValue(task.html || task.text);
    }
  };

  const saveEdit = () => {
    if (editingTask !== null) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(editValue, 'text/html');

      const newSubtasks = extractSubtasksFromDoc(doc);

      let plainText = (doc.body.textContent || "").trim();

      const updatedTasks = tasks.map((t) => {
        if (t.id === editingTask) {
          const oldSubtasks = t.subtasks || [];
          const mergedSubtasks = newSubtasks.map((newSub, idx) => {
            const existing = oldSubtasks[idx] || oldSubtasks.find(oldSub => oldSub.text === newSub.text);
            return existing ? { ...newSub, status: existing.status, reason: existing.reason } : newSub;
          });
          return { ...t, text: plainText || t.text, html: editValue, subtasks: mergedSubtasks };
        }
        return t;
      });

      setTasks(updatedTasks);
      setEditingTask(null);
      syncTasksWithDB(updatedTasks);
      syncEveningUpdate(updatedTasks);
    }
    setEditingTask(null);
  };

  const closeEdit = () => {
    setEditingTask(null);
    setEditValue('');
  };

  const requestDelete = (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const updatedTasks = tasks.filter((x) => x.id !== id);
    setTasks(updatedTasks);
    syncTasksWithDB(updatedTasks);
    syncEveningUpdate(updatedTasks);

    setPendingDelete({ id, text: task.text, status: task.status });
    clearTimeout(undoTimer.current);

    undoTimer.current = setTimeout(() => {
      setPendingDelete(null);
    }, 5000);
  };

  const undoDelete = () => {
    if (!pendingDelete) return;

    const updatedTasks = [...tasks, { id: pendingDelete.id, text: pendingDelete.text, status: pendingDelete.status, completed: pendingDelete.status === 'Done' }].sort((a, b) => a.id - b.id);
    setTasks(updatedTasks);
    syncTasksWithDB(updatedTasks);
    syncEveningUpdate(updatedTasks);

    setPendingDelete(null);
    clearTimeout(undoTimer.current);
  };

  const addTask = (e) => {
    if (e) e.preventDefault();

    if (new Date().getDay() === 0 && !hasWarnedHoliday) {
      setShowHolidayConfirm(true);
      return;
    }

    proceedAddTask();
  };

  const proceedAddTask = () => {
    setHasWarnedHoliday(true);
    setShowHolidayConfirm(false);

    const parser = new DOMParser();
    const doc = parser.parseFromString(newTask, 'text/html');

    const subtasks = extractSubtasksFromDoc(doc);

    let plainText = (doc.body.textContent || "").trim();
    if (plainText === '') return;

    const nextId = tasks.length ? Math.max(...tasks.map((t) => t.id)) + 1 : 0;
    const updatedTasks = [...tasks, { id: nextId, text: plainText, html: newTask, completed: false, status: 'Pending', subtasks }];

    setTasks(updatedTasks);
    setNewTask('<ol><li><p></p></li></ol>');
    if (newTaskEditor) {
      newTaskEditor.commands.setContent('<ol><li><p></p></li></ol>');
    }
    syncTasksWithDB(updatedTasks);
  };

  // --- modal accessibility --------------------------------------------
  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') closeEdit();
    },
    []
  );

  useEffect(() => {
    if (editingTask !== null) {
      document.addEventListener('keydown', onKeyDown);
      modalRef.current?.querySelector('textarea')?.focus();
      return () => document.removeEventListener('keydown', onKeyDown);
    }
  }, [editingTask, onKeyDown]);

  const doneCount = tasks.filter((t) => t.completed).length;
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  const getRenderHtml = (task) => {
    if (!task.html || !task.subtasks || task.subtasks.length === 0) return task.html;
    if (typeof window === 'undefined') return task.html;

    const parser = new DOMParser();
    const doc = parser.parseFromString(task.html, 'text/html');

    let itemsToProcess = doc.querySelectorAll('body > ul > li, body > ol > li');
    if (itemsToProcess.length === 0) {
      itemsToProcess = doc.querySelectorAll('p');
    }

    if (itemsToProcess.length > 0) {
      itemsToProcess.forEach((li) => {
        const text = li.textContent.trim();
        if (!text) return;
        const subtask = task.subtasks.find(st => st.text === text);
        if (subtask && subtask.status !== 'Pending') {
          const span = doc.createElement('span');
          span.style.marginLeft = '8px';
          span.style.fontSize = '11px';
          span.style.fontWeight = '600';
          span.style.padding = '2px 8px';
          span.style.borderRadius = '12px';
          span.style.display = 'inline-block';
          span.style.verticalAlign = 'middle';
          span.style.fontFamily = "'Inter', sans-serif";

          if (subtask.status === 'Done') {
            span.style.backgroundColor = '#E8F5E9';
            span.style.color = '#1B5E20';
          } else if (subtask.status === 'In Progress') {
            span.style.backgroundColor = '#FFF8E1';
            span.style.color = '#F57F17';
          } else {
            span.style.backgroundColor = '#FFEBEE';
            span.style.color = '#B71C1C';
          }

          span.textContent = subtask.reason ? `${subtask.status}: ${subtask.reason}` : subtask.status;
          li.appendChild(span);
        }
      });
    } else {
      // Handle the case where it's just raw text without p tags (fallback)
      const text = doc.body.textContent.trim();
      if (text) {
        const subtask = task.subtasks.find(st => st.text === text);
        if (subtask && subtask.status !== 'Pending') {
          const span = doc.createElement('span');
          span.style.marginLeft = '8px';
          span.style.fontSize = '11px';
          span.style.fontWeight = '600';
          span.style.padding = '2px 8px';
          span.style.borderRadius = '12px';
          span.style.display = 'inline-block';
          span.style.verticalAlign = 'middle';
          span.style.fontFamily = "'Inter', sans-serif";

          if (subtask.status === 'Done') {
            span.style.backgroundColor = '#E8F5E9';
            span.style.color = '#1B5E20';
          } else if (subtask.status === 'In Progress') {
            span.style.backgroundColor = '#FFF8E1';
            span.style.color = '#F57F17';
          } else {
            span.style.backgroundColor = '#FFEBEE';
            span.style.color = '#B71C1C';
          }

          span.textContent = subtask.reason ? `${subtask.status}: ${subtask.reason}` : subtask.status;
          doc.body.appendChild(span);
        }
      }
    }
    return doc.body.innerHTML;
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#F7F5EF', minHeight: '100%' }} className="px-2 py-2 sm:p-8">
      <style>{FONT_IMPORT}</style>
      <div className="max-w-2xl mx-auto rounded-2xl border" style={{ borderColor: '#E4E0D4', background: '#FFFFFF' }}>
        <div className="flex items-center gap-4 px-4 sm:px-8 pt-5 sm:pt-6 pb-4 sm:pb-6">
          <div className="flex-1 min-w-0">
            <h2 style={{ fontWeight: 600, color: '#1B1B18' }} className="text-[26px] leading-tight tracking-tight">
              Today's goals
            </h2>
          </div>
          {tasks.length > 0 && todayPlan?.status === 'Submitted' && (
            <span
              className="text-[11px] font-medium px-3 py-1.5 rounded-full shrink-0"
              style={{ background: '#EFEAD9', color: '#1B1B18', fontFamily: "'IBM Plex Mono', monospace" }}
            >
              submitted
            </span>
          )}
        </div>

        <div className="px-4 sm:px-8">
          {/* <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#EFEAD9' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: pct === 100 ? '#1F5C52' : '#B8862B' }}
            />
          </div> */}
        </div>

        <div className="px-6 sm:px-8 py-5 sm:py-6 space-y-2.5">
          {tasks.length > 0 ? (
            <div className="border rounded-xl overflow-hidden" style={{ borderColor: '#E4E0D4' }}>
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  className="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-3.5 transition-colors border-b last:border-b-0"
                  style={{ borderColor: '#E4E0D4', background: task.completed ? '#FBFAF6' : '#FFFFFF' }}
                >
                  <div className="flex-1 min-w-0">
                    <span
                      className="block text-[14px] sm:text-[15px] whitespace-pre-wrap break-words mb-2 flex items-center gap-2"
                      style={{ color: task.completed ? '#A9A497' : '#1B1B18', textDecoration: 'none', paddingTop: '2px' }}
                    >
                      <div className="flex items-center">
                        {task.html ? <div className="tiptap-content inline-block align-top" dangerouslySetInnerHTML={{ __html: getRenderHtml(task) }} /> : task.text}
                      </div>
                      {task.isRollover && !task.completed && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wider uppercase bg-[#FDE8E8] text-[#9B1C1C]">
                          🔴 Rollover
                        </span>
                      )}
                    </span>
                    {/* Main status buttons hidden by request */}

                    {/* Reason Input */}
                    {/* {(task.status === 'In Progress' || task.status === 'Blocked') && (
                    <div className="mt-3 flex gap-2">
                      <input
                        key={`input-${task.id}-${task.status}`}
                        type="text"
                        placeholder={task.status === 'Blocked' ? "What unplanned task took your time? (or reason for delay)..." : "Add a progress update..."}
                        className="flex-1 text-[13px] px-3 py-1.5 rounded-lg border focus:outline-none transition-colors"
                        style={{ borderColor: '#E4E0D4', background: '#FAFAFA', color: '#1B1B18' }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = e.currentTarget.value;
                            if (!val.trim()) return;
                            updateTaskReason(task.id, val);
                            e.currentTarget.value = '';
                            const btn = e.currentTarget.nextElementSibling;
                            btn.textContent = 'Saved!';
                            btn.style.background = '#1F5C52';
                            setTimeout(() => {
                              if (btn) {
                                btn.textContent = 'Submit';
                                btn.style.background = '#1B1B18';
                              }
                            }, 1500);
                          }
                        }}
                      />
                      <button
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling;
                          const val = input.value;
                          if (!val.trim()) return;
                          updateTaskReason(task.id, val);
                          input.value = '';
                          const btn = e.currentTarget;
                          btn.textContent = 'Saved!';
                          btn.style.background = '#1F5C52';
                          setTimeout(() => {
                            if (btn) {
                              btn.textContent = 'Submit';
                              btn.style.background = '#1B1B18';
                            }
                          }, 1500);
                        }}
                        className="shrink-0 px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors active:scale-95"
                        style={{ background: '#1B1B18', color: '#FFFFFF' }}
                      >
                        Submit
                      </button>
                    </div>
                  )} */}
                  </div>

                  <div className="flex flex-col items-center gap-2 shrink-0 self-start">
                    <button
                      onClick={() => startEdit(task.id)}
                      aria-label={`Edit "${task.text}"`}
                      className="p-2 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2"
                      style={{ color: '#6E6A5F', outlineColor: '#B8862B' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#EFEAD9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => requestDelete(task.id)}
                      aria-label={`Delete "${task.text}"`}
                      className="p-2 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2"
                      style={{ color: '#B23A2E', outlineColor: '#B8862B' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#FBEAE8')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center rounded-xl border border-dashed" style={{ borderColor: '#E4E0D4' }}>
              <p className="text-sm" style={{ color: '#6E6A5F' }}>No goals yet — add your first one below.</p>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <div className="border border-gray-200 rounded-xl overflow-hidden flex flex-col bg-white focus-within:ring-2 focus-within:ring-[#1F5C52]/30 transition-shadow">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-0.5 sm:gap-1 border-b border-gray-100 px-1.5 sm:px-2 py-1.5 bg-white shrink-0">
                {btn(newTaskEditor?.isActive('bold'), () => newTaskEditor?.chain().focus().toggleBold().run(), "Bold", <Bold size={15} />)}
                {btn(newTaskEditor?.isActive('italic'), () => newTaskEditor?.chain().focus().toggleItalic().run(), "Italic", <Italic size={15} />)}
                {btn(newTaskEditor?.isActive('underline'), () => newTaskEditor?.chain().focus().toggleUnderline().run(), "Underline", <UnderlineIcon size={15} />)}
                {btn(newTaskEditor?.isActive('strike'), () => newTaskEditor?.chain().focus().toggleStrike().run(), "Strikethrough", <Strikethrough size={15} />)}
                <span className="w-px h-5 bg-gray-200 mx-0.5 sm:mx-1" />
                {btn(newTaskEditor?.isActive('bulletList'), () => newTaskEditor?.chain().focus().toggleBulletList().run(), "Bulleted list", <List size={15} />)}
                {btn(newTaskEditor?.isActive('orderedList'), () => newTaskEditor?.chain().focus().toggleOrderedList().run(), "Numbered list", <ListOrdered size={15} />)}
                {btn(newTaskEditor?.isActive('taskList'), () => newTaskEditor?.chain().focus().toggleTaskList().run(), "Task List", <CheckSquare size={15} />)}
                <span className="w-px h-5 bg-gray-200 mx-0.5 sm:mx-1" />
                {btn(false, () => newTaskEditor?.chain().focus().unsetAllMarks().clearNodes().run(), "Clear formatting", <Eraser size={15} />)}
                <span className="ml-auto" />
                {btn(false, () => newTaskEditor?.chain().focus().undo().run(), "Undo", <Undo size={15} />, !newTaskEditor?.can().undo())}
                {btn(false, () => newTaskEditor?.chain().focus().redo().run(), "Redo", <Redo size={15} />, !newTaskEditor?.can().redo())}
              </div>
              {/* Editor */}
              <div className="overflow-y-auto tiptap-content" style={{ color: '#1B1B18' }}>
                <EditorContent editor={newTaskEditor} />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={addTask}
                aria-label="Add goal"
                className="shrink-0 px-4 h-[42px] rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 text-[14px] font-medium"
                style={{ background: '#1B1B18', color: '#FFFFFF' }}
              >
                <span>Add Task</span>
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Evening update */}
        {localEveningUpdate && (
          <div className="px-4 sm:px-8 pb-5 sm:pb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-widest font-medium" style={{ color: '#6E6A5F', fontFamily: "'IBM Plex Mono', monospace" }}>
                update
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditedUpdate(localEveningUpdate);
                    setIsEditingUpdate(true);
                  }}
                  className="p-1.5 rounded-lg transition-colors hover:bg-gray-100 text-gray-500 hover:text-gray-900"
                  title="Edit Update"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={deleteEveningUpdate}
                  className="p-1.5 rounded-lg transition-colors hover:bg-red-50 text-gray-400 hover:text-red-600"
                  title="Delete Update"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {isEditingUpdate ? (
              <div className="rounded-xl border p-2" style={{ borderColor: '#E4E0D4', background: '#FFFFFF' }}>
                <textarea
                  className="w-full p-3 text-[14.5px] leading-relaxed bg-transparent focus:outline-none resize-none custom-scrollbar"
                  rows="4"
                  value={editedUpdate}
                  onChange={(e) => {
                    setEditedUpdate(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  style={{ color: '#1B1B18' }}
                />
                <div className="flex justify-end gap-2 px-2 pb-2">
                  <button onClick={() => setIsEditingUpdate(false)} className="px-3 py-1.5 text-[13px] font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                  <button onClick={saveEveningUpdate} className="px-3 py-1.5 text-[13px] font-medium bg-[#1B1B18] text-white rounded-lg transition-colors">Save</button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border px-5 py-4" style={{ borderColor: '#E4E0D4', background: '#F9F8F3' }}>
                <p className="text-[14.5px] leading-relaxed whitespace-pre-line" style={{ color: '#1B1B18' }}>
                  {localEveningUpdate}
                </p>
              </div>
            )}
          </div>
        )}

        {todayPlan?.blockers && (
          <div className="px-4 sm:px-8 pb-5 sm:pb-6">
            <div className="rounded-xl border px-5 py-4 flex gap-3" style={{ borderColor: '#F5C2C7', background: '#FFF5F5' }}>
              <TriangleAlert size={18} color="#D93025" className="shrink-0 mt-0.5" />
              <div>
                <span className="block text-[11px] uppercase tracking-widest font-semibold mb-1" style={{ color: '#D93025', fontFamily: "'IBM Plex Mono', monospace" }}>
                  blocker
                </span>
                <p className="text-[14.5px] leading-relaxed" style={{ color: '#5C1E16' }}>
                  {todayPlan.blockers}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Monthly History Section */}
      {monthlyReports.length > 0 && (
        <div className="max-w-2xl mx-auto mt-8 rounded-2xl border overflow-hidden" style={{ borderColor: '#E4E0D4', background: '#FFFFFF' }}>
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="w-full text-left px-4 sm:px-8 py-5 transition-colors focus:outline-none flex justify-between items-center group"
            style={{ background: isHistoryOpen ? '#FDFCF9' : '#FFFFFF' }}
          >
            <div>
              <h2 style={{ fontWeight: 600, color: '#1B1B18' }} className="text-[18px] leading-tight tracking-tight group-hover:text-blue-700 transition-colors">
                This Month's History
              </h2>
              <p className="text-[13px] mt-1" style={{ color: '#6E6A5F' }}>
                A record of your daily plans and updates for the current month.
              </p>
            </div>
            <div className="shrink-0 ml-4 w-8 h-8 rounded-full border flex items-center justify-center transition-colors group-hover:bg-gray-50" style={{ borderColor: '#E4E0D4' }}>
              {isHistoryOpen ? <ChevronUp size={18} color="#6E6A5F" /> : <ChevronDown size={18} color="#6E6A5F" />}
            </div>
          </button>

          {isHistoryOpen && (
            <div className="overflow-x-auto border-t" style={{ borderColor: '#E4E0D4' }}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F9F8F3] border-b" style={{ borderColor: '#E4E0D4' }}>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Date</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>DAY Plan</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>EOD Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ divideColor: '#E4E0D4' }}>
                  {monthlyReports.map((report, idx) => (
                    <tr key={idx} className="hover:bg-[#FDFCF9] transition-colors">
                      <td className="px-6 py-5 align-top whitespace-nowrap">
                        <span className="text-[14px] font-medium text-gray-900">
                          {new Date(report.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-6 py-5 align-top min-w-[220px]">
                        <div className="text-[14px] text-gray-700 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto pr-2 custom-scrollbar tiptap-content">
                          {report.morningPlan ? (
                            report.morningPlan.includes('<') ? (
                              <div dangerouslySetInnerHTML={{ __html: report.morningPlan }} />
                            ) : (
                              report.morningPlan
                            )
                          ) : (
                            <span className="italic text-gray-400">No plan submitted</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top min-w-[220px]">
                        <div className="text-[14px] text-gray-700 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                          {report.eveningUpdate || <span className="italic text-gray-400">No update submitted</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}


      {/* Edit modal */}
      {editingTask !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          style={{ background: 'rgba(27,27,24,0.45)' }}
          onMouseDown={(e) => e.target === e.currentTarget && closeEdit()}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Edit goal"
            className="w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col h-[92vh] sm:h-auto sm:max-h-[90vh]"
            style={{ background: '#FFFFFF' }}
          >
            {/* Header — sticky so it stays visible while scrolling */}
            <div className="flex items-center justify-between px-5 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-gray-100 shrink-0 sticky top-0 bg-white z-10">
              <h3 style={{ fontWeight: 600, color: '#1B1B18' }} className="text-base sm:text-lg">
                Edit goal
              </h3>
              <button
                onClick={closeEdit}
                aria-label="Close"
                className="p-2 -mr-2 rounded-lg hover:bg-gray-100 active:scale-95 transition"
                style={{ color: '#6E6A5F' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1">
              <div className="border border-gray-200 rounded-xl overflow-hidden flex flex-col bg-white focus-within:ring-2 focus-within:ring-[#1F5C52]/30 transition-shadow">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-0.5 sm:gap-1 border-b border-gray-100 px-1.5 sm:px-2 py-2 bg-white shrink-0">
                  {btn(editEditor?.isActive('bold'), () => editEditor?.chain().focus().toggleBold().run(), "Bold", <Bold size={15} />)}
                  {btn(editEditor?.isActive('italic'), () => editEditor?.chain().focus().toggleItalic().run(), "Italic", <Italic size={15} />)}
                  {btn(editEditor?.isActive('underline'), () => editEditor?.chain().focus().toggleUnderline().run(), "Underline", <UnderlineIcon size={15} />)}
                  {btn(editEditor?.isActive('strike'), () => editEditor?.chain().focus().toggleStrike().run(), "Strikethrough", <Strikethrough size={15} />)}
                  <span className="w-px h-5 bg-gray-200 mx-0.5 sm:mx-1" />
                  {btn(editEditor?.isActive('bulletList'), () => editEditor?.chain().focus().toggleBulletList().run(), "Bulleted list", <List size={15} />)}
                  {btn(editEditor?.isActive('orderedList'), () => editEditor?.chain().focus().toggleOrderedList().run(), "Numbered list", <ListOrdered size={15} />)}
                  {btn(editEditor?.isActive('taskList'), () => editEditor?.chain().focus().toggleTaskList().run(), "Task List", <CheckSquare size={15} />)}
                  <span className="w-px h-5 bg-gray-200 mx-0.5 sm:mx-1" />
                  {btn(false, () => editEditor?.chain().focus().unsetAllMarks().clearNodes().run(), "Clear formatting", <Eraser size={15} />)}
                  <span className="ml-auto hidden sm:block" />
                  {btn(false, () => editEditor?.chain().focus().undo().run(), "Undo", <Undo size={15} />, !editEditor?.can().undo())}
                  {btn(false, () => editEditor?.chain().focus().redo().run(), "Redo", <Redo size={15} />, !editEditor?.can().redo())}
                </div>
                {/* Editor */}
                <div className="overflow-y-auto tiptap-content min-h-[100px] max-h-[35vh] px-1" style={{ color: '#1B1B18' }}>
                  <EditorContent editor={editEditor} />
                </div>
              </div>

              {(() => {
                const currentTask = tasks.find(t => t.id === editingTask);
                if (currentTask && currentTask.subtasks && currentTask.subtasks.length > 0) {
                  const doneCount = currentTask.subtasks.filter(s => s.status === 'Done').length;
                  return (
                    <div className="mt-5 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700">Task status</h4>
                        <span className="text-[11px] text-gray-400">{doneCount}/{currentTask.subtasks.length} done</span>
                      </div>
                      <div className="space-y-2.5">
                        {currentTask.subtasks.map((st, sidx) => {
                          const taskIndex = tasks.findIndex(t => t.id === editingTask);
                          const reasonKey = `${taskIndex}-${sidx}`;
                          const accent =
                            st.status === 'Done' ? '#1F5C52' :
                              st.status === 'In Progress' ? '#B8862B' :
                                st.status === 'Blocked' ? '#B23A2E' : '#D1D5DB';
                          return (
                            <div key={sidx} className="rounded-lg bg-gray-50 border border-gray-100 overflow-hidden">
                              <div className="flex items-start gap-2 p-2.5" style={{ borderLeft: `3px solid ${accent}` }}>
                                <div className="text-sm text-gray-800 flex-1 min-w-0 break-words leading-snug pt-1">
                                  {st.text}
                                </div>
                              </div>

                              {/* Segmented control — equal width on mobile, compact on desktop */}
                              <div className="flex px-2.5 pb-2.5 gap-1.5">
                                <button onClick={() => {
                                  const newTasks = [...tasks];
                                  newTasks[taskIndex].subtasks[sidx].status = 'Done';
                                  setTasks(newTasks); syncTasksWithDB(newTasks); syncEveningUpdate(newTasks);
                                  setOpenReasonIndices(prev => ({ ...prev, [reasonKey]: false }));
                                }} className={`flex-1 sm:flex-none text-[11px] px-2.5 py-1.5 rounded-md transition-colors font-medium active:scale-95 ${st.status === 'Done' ? 'bg-[#1F5C52] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                                  Done
                                </button>
                                <button onClick={() => {
                                  const newTasks = [...tasks];
                                  newTasks[taskIndex].subtasks[sidx].status = 'In Progress';
                                  setTasks(newTasks); syncTasksWithDB(newTasks); syncEveningUpdate(newTasks);
                                  setOpenReasonIndices(prev => ({ ...prev, [reasonKey]: true }));
                                }} className={`flex-1 sm:flex-none text-[11px] px-2.5 py-1.5 rounded-md transition-colors font-medium active:scale-95 ${st.status === 'In Progress' ? 'bg-[#B8862B] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                                  In Progress
                                </button>
                                <button onClick={() => {
                                  const newTasks = [...tasks];
                                  newTasks[taskIndex].subtasks[sidx].status = 'Blocked';
                                  setTasks(newTasks); syncTasksWithDB(newTasks); syncEveningUpdate(newTasks);
                                  setOpenReasonIndices(prev => ({ ...prev, [reasonKey]: true }));
                                }} className={`flex-1 sm:flex-none text-[11px] px-2.5 py-1.5 rounded-md transition-colors font-medium active:scale-95 ${st.status === 'Blocked' ? 'bg-[#B23A2E] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                                  Not picked yet
                                </button>
                              </div>

                              {st.reason && (st.status === 'In Progress' || st.status === 'Blocked') && !openReasonIndices[reasonKey] && (
                                <div className="flex items-start justify-between gap-2 mx-2.5 mb-2.5 p-2 rounded-md bg-white border border-gray-100">
                                  <div className="text-xs text-gray-600 italic break-words">
                                    <span className="not-italic text-gray-400">Reason: </span>
                                    <span className="font-medium text-gray-800">{st.reason}</span>
                                  </div>
                                  <button
                                    onClick={() => setOpenReasonIndices(prev => ({ ...prev, [reasonKey]: true }))}
                                    className="text-[10px] flex items-center gap-1 shrink-0 text-gray-500 hover:text-[#1F5C52] transition-colors bg-gray-100 hover:bg-gray-200 px-1.5 py-0.5 rounded"
                                  >
                                    <Pencil size={10} /> Edit
                                  </button>
                                </div>
                              )}

                              {(st.status === 'In Progress' || st.status === 'Blocked') && (openReasonIndices[reasonKey] || !st.reason) && (
                                <div className="flex flex-col gap-2 mx-2.5 mb-2.5">
                                  <textarea
                                    defaultValue={st.reason || ""}
                                    rows={2}
                                    placeholder={st.status === 'Blocked' ? "Reason for not picking... (e.g. unassigned work)" : "Progress update..."}
                                    className="w-full text-[13px] px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#1F5C52] bg-white resize-none transition-colors"
                                    style={{ color: '#1B1B18' }}
                                  />
                                  <div className="flex justify-end gap-2">
                                    {st.reason && (
                                      <button
                                        onClick={() => setOpenReasonIndices(prev => ({ ...prev, [reasonKey]: false }))}
                                        className="text-[11px] px-3 py-1.5 rounded-md bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors font-medium active:scale-95"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        const ta = e.currentTarget.parentElement.previousElementSibling;
                                        const val = ta.value.trim();
                                        if (!val) return;

                                        const newTasks = [...tasks];
                                        newTasks[taskIndex].subtasks[sidx].reason = val;
                                        setTasks(newTasks);
                                        syncTasksWithDB(newTasks); syncEveningUpdate(newTasks);

                                        setOpenReasonIndices(prev => ({ ...prev, [reasonKey]: false }));
                                      }}
                                      className="text-[11px] px-3 py-1.5 rounded-md bg-[#1F5C52] text-white hover:bg-[#16423b] transition-colors font-medium active:scale-95"
                                    >
                                      Save reason
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Footer — sticky, stacks full-width on mobile, primary action reachable by thumb */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2.5 px-5 sm:px-6 py-4 border-t border-gray-100 shrink-0 bg-white">
              <button
                onClick={closeEdit}
                className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium rounded-xl transition-colors hover:bg-gray-100 active:scale-95"
                style={{ color: '#6E6A5F' }}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold rounded-xl text-white active:scale-95"
                style={{ background: '#1B1B18' }}
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}      {/* Holiday Confirm Modal */}
      {showHolidayConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TriangleAlert className="text-amber-600" size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Holiday Alert!</h3>
              <p className="text-sm text-gray-600 mb-6">
                Today is a holiday! Are you sure you want to work and add a day plan?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowHolidayConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={proceedAddTask}
                  className="flex-1 px-4 py-2 bg-[#1F5C52] hover:bg-[#16413a] text-white font-bold rounded-xl transition-colors"
                >
                  Yes, I'm working
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
