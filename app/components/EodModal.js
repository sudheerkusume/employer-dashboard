import React, { useState, useEffect } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import {
    Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Undo, Redo, Eraser,
    X, CheckCircle2, Clock, AlertCircle, Strikethrough, CheckSquare
} from "lucide-react";

export default function EodModal({
    type, isOpen, onClose, onSubmit, todayPlan
}) {
    const [plan, setPlan] = useState('<ol><li><p></p></li></ol>');
    const [additionalUpdate, setAdditionalUpdate] = useState('');
    const [blockers, setBlockers] = useState('');
    const [tasks, setTasks] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showHolidayConfirm, setShowHolidayConfirm] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TaskList,
            TaskItem.configure({ nested: true })
        ],
        content: plan,
        editorProps: {
            attributes: {
                class: 'focus:outline-none px-4 py-3 leading-relaxed',
            },
        },
        onUpdate: ({ editor }) => {
            setPlan(editor.getHTML());
        },
    });

    const btn = (active, onClick, title, icon, disabled) => (
        <button
            type="button"
            title={title}
            onClick={onClick}
            disabled={disabled}
            className={`p-2 sm:p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${active ? 'bg-[#1F5C52]/10 text-[#1F5C52]' : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'}`}
        >
            {icon}
        </button>
    );

    // Update editor content when plan state changes from outside (e.g. initial load)
    useEffect(() => {
        if (editor && plan && editor.getHTML() !== plan) {
            editor.commands.setContent(plan);
        }
    }, [plan, editor]);

    useEffect(() => {
        if (isOpen && type === 'evening' && todayPlan?.morningPlan) {
            let eveningText = todayPlan.eveningUpdate || '';
            const getSectionText = (startMarker, nextMarkers) => {
                const startIdx = eveningText.indexOf(startMarker);
                if (startIdx === -1) return '';
                let endIdx = eveningText.length;
                for (const marker of nextMarkers) {
                    const idx = eveningText.indexOf(marker);
                    if (idx !== -1 && idx > startIdx && idx < endIdx) {
                        endIdx = idx;
                    }
                }
                return eveningText.substring(startIdx, endIdx);
            };

            const completedSection = getSectionText('Completed Today:', ['In Progress:', 'Blocked:', 'Additional Accomplishments:']);
            const inProgressSection = getSectionText('In Progress:', ['Blocked:', 'Additional Accomplishments:']);
            const blockedSection = getSectionText('Blocked:', ['Additional Accomplishments:']);

            let taskHtml = todayPlan.morningPlan || '';
            let taskText = taskHtml;
            if (taskHtml.includes('<')) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(taskHtml, 'text/html');
                taskText = (doc.body.textContent || "").trim();
            } else {
                taskText = taskHtml.trim();
            }

            let status = 'Pending';
            if (taskText && completedSection.includes(taskText)) status = 'Done';
            else if (taskText && inProgressSection.includes(taskText)) status = 'In Progress';
            else if (taskText && blockedSection.includes(taskText)) status = 'Blocked';

            let initialTasks = [];
            if (taskText || taskHtml) {
                initialTasks = [{ id: 0, text: taskText, html: taskHtml, status }];
            }
            setTasks(initialTasks);

            // Extract additional accomplishments
            const additionalMatch = eveningText.match(/Additional Accomplishments:\n([\s\S]*?)$/);
            if (additionalMatch) {
                setAdditionalUpdate(additionalMatch[1].trim());
            }
            if (todayPlan.blockers) {
                setBlockers(todayPlan.blockers);
            }
        }
    }, [isOpen, type, todayPlan]);

    if (!isOpen) return null;

    const handleTaskStatusChange = (id, status) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    };

    const handleSubmit = async () => {
        if (isSunday && type === 'morning') {
            setShowHolidayConfirm(true);
            return;
        }
        proceedHandleSubmit();
    };

    const proceedHandleSubmit = async () => {
        setShowHolidayConfirm(false);

        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            if (type === 'morning') {
                await onSubmit({ action: 'morning_plan', content: plan });
            } else {
                const doneTasks = tasks.filter(t => t.status === 'Done');
                const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
                const blockedTasks = tasks.filter(t => t.status === 'Blocked');

                let combinedUpdate = '';
                if (doneTasks.length > 0) combinedUpdate += "Completed Today:\n" + doneTasks.map(t => "- " + t.text).join('\n') + "\n\n";
                if (inProgressTasks.length > 0) combinedUpdate += "In Progress:\n" + inProgressTasks.map(t => "- " + t.text).join('\n') + "\n\n";
                if (blockedTasks.length > 0) combinedUpdate += "Blocked:\n" + blockedTasks.map(t => "- " + t.text).join('\n') + "\n\n";

                if (additionalUpdate.trim()) {
                    combinedUpdate += "Additional Accomplishments:\n" + additionalUpdate.trim();
                }

                await onSubmit({ action: 'evening_update', content: { update: combinedUpdate.trim(), blockers } });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const reviewedCount = tasks.filter(t => t.status !== 'Pending').length;
    const progressPct = tasks.length > 0 ? Math.round((reviewedCount / tasks.length) * 100) : 0;

    const statusOptions = [
        { key: 'Done', label: 'Done', icon: CheckCircle2, active: '#1F5C52' },
        { key: 'In Progress', label: 'In Progress', icon: Clock, active: '#B8862B' },
        { key: 'Blocked', label: 'Not Yet Picked', icon: AlertCircle, active: '#B23A2E' },
    ];

    const isSunday = new Date().getDay() === 0;

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
            onClick={onClose}
        >
            <style>{`
                @keyframes eod-sheet-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                @keyframes eod-fade-scale {
                    from { opacity: 0; transform: scale(0.97) translateY(8px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .eod-modal-anim {
                    animation: eod-sheet-up 0.28s cubic-bezier(0.32, 0.72, 0, 1);
                }
                @media (min-width: 640px) {
                    .eod-modal-anim {
                        animation: eod-fade-scale 0.2s ease-out;
                    }
                }
            `}</style>

            <div
                className="eod-modal-anim rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col"
                style={{ background: '#FFFFFF', borderColor: '#E4E0D4', borderWidth: '1px' }}
                onClick={(e) => e.stopPropagation()}
            >
                {isSunday && (
                    <div className="bg-amber-100 border-b border-amber-200 px-6 py-3 rounded-t-2xl flex items-center gap-3 shrink-0">
                        <AlertCircle className="text-amber-600 shrink-0" size={20} />
                        <p className="text-sm font-semibold text-amber-800">
                            Today is a holiday, Take some rest! (You can still submit if needed.)
                        </p>
                    </div>
                )}

                {/* Mobile drag handle */}
                <div className="flex justify-center pt-2.5 pb-1 sm:hidden shrink-0">
                    <span className="h-1 w-9 rounded-full" style={{ background: '#E4E0D4' }} />
                </div>

                <div className="px-5 sm:px-6 pt-3 sm:pt-6 pb-4 border-b shrink-0 flex items-start justify-between gap-3" style={{ borderColor: '#E4E0D4' }}>
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold leading-tight" style={{ color: '#1B1B18' }}>
                            {type === 'morning' ? "Morning Check-in" : "End of Day Report"}
                        </h2>
                        <p className="text-[13px] mt-0.5" style={{ color: '#6E6A5F' }}>
                            {type === 'morning'
                                ? "What are you focusing on today?"
                                : tasks.length > 0
                                    ? `${reviewedCount} of ${tasks.length} tasks reviewed`
                                    : "Wrap up your day"}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        title="Close"
                        className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {type === 'evening' && tasks.length > 0 && (
                    <div className="px-5 sm:px-6 pt-3 shrink-0">
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#EFEDE4' }}>
                            <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${progressPct}%`, background: '#1F5C52' }}
                            />
                        </div>
                    </div>
                )}

                <div className="overflow-y-auto flex-1 min-h-0 px-5 sm:px-6 py-4">
                    {type === 'morning' ? (
                        <div className="mb-2">
                            <label className="block text-sm font-medium mb-2" style={{ color: '#1B1B18' }}>What is your plan for today?</label>

                            <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col bg-white focus-within:ring-2 focus-within:ring-[#1F5C52]/30 transition-shadow">
                                {/* Toolbar */}
                                <div className="flex flex-wrap items-center gap-0.5 sm:gap-1 border-b border-gray-100 px-1.5 sm:px-2 py-1.5 bg-white">
                                    {btn(editor?.isActive('bold'), () => editor?.chain().focus().toggleBold().run(), "Bold", <Bold size={15} />)}
                                    {btn(editor?.isActive('italic'), () => editor?.chain().focus().toggleItalic().run(), "Italic", <Italic size={15} />)}
                                    {btn(editor?.isActive('underline'), () => editor?.chain().focus().toggleUnderline().run(), "Underline", <UnderlineIcon size={15} />)}
                                    {btn(editor?.isActive('strike'), () => editor?.chain().focus().toggleStrike().run(), "Strikethrough", <Strikethrough size={15} />)}
                                    <span className="w-px h-5 bg-gray-200 mx-0.5 sm:mx-1" />
                                    {btn(editor?.isActive('bulletList'), () => editor?.chain().focus().toggleBulletList().run(), "Bulleted list", <List size={15} />)}
                                    {btn(editor?.isActive('orderedList'), () => editor?.chain().focus().toggleOrderedList().run(), "Numbered list", <ListOrdered size={15} />)}
                                    {btn(editor?.isActive('taskList'), () => editor?.chain().focus().toggleTaskList().run(), "Task List", <CheckSquare size={15} />)}
                                    <span className="w-px h-5 bg-gray-200 mx-0.5 sm:mx-1" />
                                    {btn(false, () => editor?.chain().focus().unsetAllMarks().clearNodes().run(), "Clear formatting", <Eraser size={15} />)}
                                    <span className="ml-auto" />
                                    {btn(false, () => editor?.chain().focus().undo().run(), "Undo", <Undo size={15} />, !editor?.can().undo())}
                                    {btn(false, () => editor?.chain().focus().redo().run(), "Redo", <Redo size={15} />, !editor?.can().redo())}
                                </div>
                                {/* Editor */}
                                <div className="overflow-y-auto tiptap-content text-[14px]" style={{ minHeight: '280px', maxHeight: '60vh', color: '#1B1B18' }}>
                                    <EditorContent editor={editor} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6">
                                <label className="block text-sm font-semibold mb-3" style={{ color: '#1B1B18' }}>Today's Task Review</label>
                                {tasks.length > 0 ? (
                                    <div className="space-y-2.5 mb-2">
                                        {tasks.map((task, index) => (
                                            <div key={task.id} className="p-3.5 sm:p-4 border rounded-xl transition-colors" style={{ borderColor: '#E4E0D4', background: '#FBFAF6' }}>
                                                <div className="text-[14px] font-medium mb-3" style={{ color: '#1B1B18' }}>
                                                    <span className="opacity-70 mr-1 font-semibold">Today's Plan:</span>
                                                    {task.html ? (
                                                        <div className="tiptap-content inline-block align-top mt-1 w-full" dangerouslySetInnerHTML={{ __html: task.html }} />
                                                    ) : (
                                                        <span>{task.text}</span>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
                                                    {statusOptions.map(({ key, label, icon: Icon, active }) => {
                                                        const isActive = task.status === key;
                                                        return (
                                                            <button
                                                                key={key}
                                                                onClick={() => handleTaskStatusChange(task.id, key)}
                                                                className="flex items-center justify-center gap-1 text-[11px] sm:text-[12px] px-2 py-2 sm:py-1.5 rounded-md font-medium transition-colors border"
                                                                style={isActive
                                                                    ? { background: active, color: '#FFFFFF', borderColor: 'transparent' }
                                                                    : { background: '#F5F4EF', borderColor: '#E4E0D4', color: '#6E6A5F' }}
                                                            >
                                                                <Icon size={13} className="shrink-0" />
                                                                <span className="truncate">{label}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 border rounded-xl text-center mb-4" style={{ borderColor: '#E4E0D4', background: '#FAFAFA' }}>
                                        <p className="text-sm" style={{ color: '#6E6A5F' }}>No tasks found for today.</p>
                                    </div>
                                )}
                            </div>

                            <div className="mb-5">
                                <label className="block text-sm font-semibold mb-2" style={{ color: '#1B1B18' }}>Additional Accomplishments</label>
                                <textarea
                                    className="w-full border rounded-xl p-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1F5C52]/30 transition-shadow" rows="2" placeholder="Did anything else today?"
                                    style={{ borderColor: '#E4E0D4', background: '#FAFAFA', color: '#1B1B18' }}
                                    value={additionalUpdate}
                                    onChange={(e) => setAdditionalUpdate(e.target.value)}
                                />
                            </div>

                            <div className="mb-2">
                                <label className="block text-sm font-semibold mb-2" style={{ color: '#1B1B18' }}>Any Challenges / Issues?</label>
                                <textarea
                                    className="w-full border rounded-xl p-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1F5C52]/30 transition-shadow" rows="2" placeholder="Explain any issues or challenges you faced..."
                                    style={{ borderColor: '#E4E0D4', background: '#FAFAFA', color: '#1B1B18' }}
                                    value={blockers}
                                    onChange={(e) => setBlockers(e.target.value)}
                                />
                            </div>
                        </>
                    )}
                </div>

                <div
                    className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 p-5 sm:p-6 pt-4 border-t shrink-0"
                    style={{ borderColor: '#E4E0D4', paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
                >
                    <button onClick={onClose} disabled={isSubmitting} className={`px-5 py-2.5 sm:py-2 text-[13px] font-medium rounded-lg transition-colors border w-full sm:w-auto ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`} style={{ borderColor: '#E4E0D4', color: '#6E6A5F', background: '#FAFAFA' }}>Skip</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className={`px-5 py-2.5 sm:py-2 text-[13px] font-medium rounded-lg transition-colors w-full sm:w-auto flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`} style={{ background: '#1B1B18', color: '#FFFFFF' }}>
                        {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                </div>
            </div>
            {/* Holiday Confirm Modal */}
            {showHolidayConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="text-amber-600" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Holiday Alert!</h3>
                            <p className="text-sm text-gray-600 mb-6">
                                Today is a holiday ! Are you sure you want to work and add a day plan?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowHolidayConfirm(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={proceedHandleSubmit}
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
    )
}