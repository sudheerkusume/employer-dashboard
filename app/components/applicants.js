// app/page.js (or your component file)
'use client';

import { useState, useEffect, useCallback, useMemo, memo, useRef, forwardRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit, Eye, Trash, X, CheckCircle, XCircle, Clock, ChevronsUpDown, Check, Download, Upload, ChevronDownIcon, Minus } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Listbox, Combobox } from '@headlessui/react';
import Papa from 'papaparse';

// ======================
// Date Picker Dropdown Component (unchanged)
// ======================
const DatePickerDropdown = memo(({ currentDate, onSelect, onClose, inputRef }) => {
    const [viewMonth, setViewMonth] = useState(() => {
        return currentDate ? new Date(currentDate) : new Date();
    });
    const dropdownRef = useRef(null);

    const selectedDate = useMemo(() => {
        return currentDate ? new Date(currentDate) : null;
    }, [currentDate]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const getDaysInMonth = useCallback((date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        return { daysInMonth, startingDayOfWeek };
    }, []);

    const handleDateSelect = useCallback((day) => {
        const newDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
        onSelect(newDate);
        if (inputRef && inputRef.current) {
            inputRef.current.focus();
        }
    }, [viewMonth, onSelect, inputRef]);

    const handlePrevMonth = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }, []);

    const handleNextMonth = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }, []);

    const handlePrevYear = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setViewMonth(prev => new Date(prev.getFullYear() - 1, prev.getMonth(), 1));
    }, []);

    const handleNextYear = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setViewMonth(prev => new Date(prev.getFullYear() + 1, prev.getMonth(), 1));
    }, []);

    const isToday = useCallback((day) => {
        const today = new Date();
        return day === today.getDate() &&
            viewMonth.getMonth() === today.getMonth() &&
            viewMonth.getFullYear() === today.getFullYear();
    }, [viewMonth]);

    const isSelected = useCallback((day) => {
        return selectedDate &&
            day === selectedDate.getDate() &&
            viewMonth.getMonth() === selectedDate.getMonth() &&
            viewMonth.getFullYear() === selectedDate.getFullYear();
    }, [selectedDate, viewMonth]);

    const handleTodayClick = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        const today = new Date();
        onSelect(today);
    }, [onSelect]);

    const handleSet18Years = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        const date = new Date();
        date.setFullYear(date.getFullYear() - 18);
        onSelect(date);
    }, [onSelect]);

    const handleSet60Years = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        const date = new Date();
        date.setFullYear(date.getFullYear() - 60);
        onSelect(date);
    }, [onSelect]);

    const renderCalendar = useMemo(() => {
        const { daysInMonth, startingDayOfWeek } = getDaysInMonth(viewMonth);
        const days = [];
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="h-10"></div>);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const isTodayDate = isToday(day);
            const isSelectedDate = isSelected(day);
            const currentDay = day;
            days.push(
                <button
                    key={day}
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDateSelect(currentDay);
                    }}
                    className={`h-10 w-full rounded-lg transition-colors text-sm ${isSelectedDate
                        ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                        : isTodayDate
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'hover:bg-gray-100'
                        }`}
                >
                    {day}
                </button>
            );
        }
        return days;
    }, [viewMonth, getDaysInMonth, isToday, isSelected, handleDateSelect]);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return (
        <div
            ref={dropdownRef}
            className="absolute w-full top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-80"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">Select Date of Birth</h3>
                    <div className="w-6"></div>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onClose();
                        }}
                        className="text-gray-400 hover:text-gray-600 transition p-1"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-1">
                        <button
                            type="button"
                            onClick={handlePrevYear}
                            className="p-1.5 hover:bg-gray-100 rounded transition"
                        >
                            <ChevronsLeft size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-1.5 hover:bg-gray-100 rounded transition"
                        >
                            <ChevronLeft size={16} />
                        </button>
                    </div>
                    <div className="text-center">
                        <span className="text-sm font-semibold">
                            {monthNames[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                        </span>
                    </div>
                    <div className="flex gap-1">
                        <button
                            type="button"
                            onClick={handleNextMonth}
                            className="p-1.5 hover:bg-gray-100 rounded transition"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={handleNextYear}
                            className="p-1.5 hover:bg-gray-100 rounded transition"
                        >
                            <ChevronsRight size={16} />
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">{renderCalendar}</div>
                <div className="mt-4 pt-4 border-t flex gap-2">
                    <button
                        type="button"
                        onClick={handleTodayClick}
                        className="flex-1 px-2 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                        Today
                    </button>
                    <button
                        type="button"
                        onClick={handleSet18Years}
                        className="flex-1 px-2 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                        Set 18 Years
                    </button>
                    <button
                        type="button"
                        onClick={handleSet60Years}
                        className="flex-1 px-2 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                        Set 60 Years
                    </button>
                </div>
            </div>
        </div>
    );
});
DatePickerDropdown.displayName = 'DatePickerDropdown';

// ======================
// InputField Component (unchanged)
// ======================
const InputField = memo(({ label, name, type = 'text', required = false, placeholder = '', value, onChange, validation = 'none', maxLength, pattern, errorMessage }) => {
    const [error, setError] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [touched, setTouched] = useState(false);
    const [hasValue, setHasValue] = useState(false);
    const inputRef = useRef(null);

    const validateField = (val) => {
        if (required && !val && touched) {
            setError(`${label} is required`);
            return false;
        }
        if (val && val.length > 0) {
            switch (validation) {
                case 'mobile':
                    if (!/^[0-9]{10}$/.test(val)) { setError('Please enter a valid 10-digit mobile number'); return false; }
                    break;
                case 'email':
                    if (!/^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(val)) { setError('Please enter a valid email address'); return false; }
                    break;
                case 'name':
                    if (!/^[A-Za-z\s\-]+$/.test(val)) { setError('Name should only contain letters, spaces, and hyphens'); return false; }
                    if (val.length < 2) { setError('Name must be at least 2 characters'); return false; }
                    break;
                case 'pincode':
                    if (!/^[0-9]{6}$/.test(val)) { setError('Please enter a valid 6-digit pincode'); return false; }
                    break;
                case 'ifsc':
                    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(val)) { setError('Please enter a valid IFSC code (e.g., SBIN0012345)'); return false; }
                    break;
                case 'accountNo':
                    if (!/^[0-9]{9,18}$/.test(val)) { setError('Account number should be 9-18 digits only'); return false; }
                    break;
                case 'aadhar':
                    if (!/^[0-9]{12}$/.test(val)) { setError('Please enter a valid 12-digit Aadhar number'); return false; }
                    break;
                case 'pan':
                    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val.toUpperCase())) { setError('Please enter a valid PAN card number (e.g., ABCDE1234F)'); return false; }
                    break;
                case 'dob':
                    if (val) {
                        const dobDate = new Date(val);
                        const today = new Date();
                        let age = today.getFullYear() - dobDate.getFullYear();
                        const monthDiff = today.getMonth() - dobDate.getMonth();
                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) age--;
                        if (age < 18) { setError('Age must be 18 years or above'); return false; }
                    }
                    break;
                default: break;
            }
            setError('');
            return true;
        }
        setError('');
        return true;
    };

    const handleChange = (e) => {
        let newValue = e.target.value;
        switch (validation) {
            case 'mobile': case 'pincode': case 'accountNo': case 'aadhar':
                newValue = newValue.replace(/[^0-9]/g, '');
                if (maxLength && newValue.length > maxLength) newValue = newValue.slice(0, maxLength);
                break;
            case 'ifsc': case 'pan':
                newValue = newValue.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (maxLength && newValue.length > maxLength) newValue = newValue.slice(0, maxLength);
                break;
            case 'name':
                newValue = newValue.replace(/[^A-Za-z\s\-]/g, '');
                break;
            default: break;
        }
        const syntheticEvent = { target: { name, value: newValue, type: e.target.type, checked: e.target.checked } };
        onChange(syntheticEvent);
        setHasValue(newValue.length > 0);
        if (touched && newValue.length > 0) validateField(newValue);
        else if (touched && required && newValue.length === 0) setError(`${label} is required`);
        else if (!touched) setError('');
    };

    const handleDateSelect = (date) => {
        const formattedDate = date.toISOString().split('T')[0];
        const syntheticEvent = { target: { name, value: formattedDate, type: 'date' } };
        onChange(syntheticEvent);
        setHasValue(true);
        setTouched(true);
        validateField(formattedDate);
        setShowDatePicker(false);
    };

    const handleBlur = () => {
        setTouched(true);
        if (required && !value) setError(`${label} is required`);
        else if (value && value.length > 0) validateField(value);
        else if (required && !value) setError(`${label} is required`);
        else setError('');
    };

    const handleFocus = () => setTouched(true);
    const toggleDatePicker = () => { setShowDatePicker(!showDatePicker); if (!showDatePicker) setTouched(true); };
    const formatDisplayDate = (dateValue) => {
        if (!dateValue) return '';
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return dateValue;
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div className="mb-4">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">{label} {required && <span className="text-red-500">*</span>}</label>
            {validation === 'dob' ? (
                <div className="relative">
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            id={name}
                            name={name}
                            value={formatDisplayDate(value)}
                            onFocus={toggleDatePicker}
                            onChange={() => { }}
                            onBlur={handleBlur}
                            required={required}
                            placeholder={placeholder || 'DD/MM/YYYY'}
                            readOnly
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-colors outline-none cursor-pointer bg-white pr-10 ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                        />
                        <button type="button" onClick={toggleDatePicker} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                            <Calendar size={18} />
                        </button>
                    </div>
                    {showDatePicker && (
                        <DatePickerDropdown
                            currentDate={value}
                            onSelect={handleDateSelect}
                            onClose={() => setShowDatePicker(false)}
                            inputRef={inputRef}
                        />
                    )}
                </div>
            ) : (
                <input
                    type={type}
                    id={name}
                    name={name}
                    value={value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    required={required}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    pattern={pattern}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-colors outline-none ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
            )}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
});
InputField.displayName = 'InputField';

// ======================
// Radio Group Component (unchanged)
// ======================
const RadioGroup = memo(({ label, name, options, value, onChange, required = false }) => {
    const [error, setError] = useState('');

    const handleChange = (selectedValue) => {
        const syntheticEvent = { target: { name, value: selectedValue, type: 'radio' } };
        onChange(syntheticEvent);
        if (required && !selectedValue) {
            setError(`${label} is required`);
        } else {
            setError('');
        }
    };

    const handleBlur = () => {
        if (required && !value) {
            setError(`${label} is required`);
        }
    };

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div
                className="flex gap-4"
                role="radiogroup"
                onBlur={handleBlur}
            >
                {options.map(option => {
                    const isChecked = value === option.value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={isChecked}
                            onClick={() => handleChange(option.value)}
                            className="flex items-center space-x-2 focus:outline-none rounded"
                        >
                            <div
                                className={`
                                    w-5 h-5 rounded-full border-2 flex items-center justify-center
                                    transition-all duration-200
                                    ${isChecked
                                        ? 'border-yellow-500'
                                        : 'border-gray-300 hover:border-gray-400'
                                    }
                                `}
                            >
                                {isChecked && (
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                )}
                            </div>
                            <span className="text-sm text-gray-700">{option.label}</span>
                        </button>
                    );
                })}
            </div>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
});
RadioGroup.displayName = 'RadioGroup';

// ======================
// TextArea Component (unchanged)
// ======================
const TextArea = memo(forwardRef(({ label, name, value, onChange, required = false, placeholder = '', rows = 4 }, ref) => {
    const [error, setError] = useState('');
    const handleChange = (e) => {
        const syntheticEvent = { target: { name, value: e.target.value, type: 'textarea' } };
        onChange(syntheticEvent);
        if (required && !e.target.value) setError(`${label} is required`);
        else setError('');
    };
    const handleBlur = () => { if (required && !value) setError(`${label} is required`); };
    return (
        <div className="mb-4">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">{label} {required && <span className="text-red-500">*</span>}</label>
            <textarea
                ref={ref}
                id={name}
                name={name}
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                rows={rows}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-colors outline-none ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}));
TextArea.displayName = 'TextArea';

// ======================
// Checkbox Component (unchanged)
// ======================
const Checkbox = memo(({ label, name, checked, onChange, required = false, description = '' }) => {
    const [error, setError] = useState('');

    const handleToggle = () => {
        const newChecked = !checked;
        const syntheticEvent = { target: { name, checked: newChecked, type: 'checkbox' } };
        onChange(syntheticEvent);
        if (required && !newChecked) {
            setError(`${label} is required`);
        } else {
            setError('');
        }
    };

    const handleBlur = () => {
        if (required && !checked) setError(`${label} is required`);
    };

    return (
        <div className="mb-4">
            <label className="flex items-start space-x-3 cursor-pointer">
                <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={handleToggle}
                    onBlur={handleBlur}
                    className={`
                        w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center
                        transition-all duration-200 cursor-pointer focus:outline-none
                        ${checked
                            ? 'bg-yellow-500 border-yellow-500 text-white'
                            : 'bg-white border-gray-300 hover:border-gray-400 text-transparent'
                        }
                    `}
                >
                    <Check size={14} className="stroke-[3]" />
                </button>
                <div className="flex-1">
                    <span className="text-gray-700 text-sm">
                        {label} {required && <span className="text-red-500">*</span>}
                    </span>
                    {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
                </div>
            </label>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
});
Checkbox.displayName = 'Checkbox';

// ======================
// Digital Signature Component (unchanged)
// ======================
const DigitalSignature = memo(({ label, name, value, onChange, required = false }) => {
    const [signatureMethod, setSignatureMethod] = useState('draw');
    const [isDrawing, setIsDrawing] = useState(false);
    const [error, setError] = useState('');
    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (signatureMethod === 'draw' && canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = canvas.offsetWidth;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#000000';
            ctxRef.current = ctx;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            if (value && value.startsWith('data:image')) {
                const img = new Image();
                img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                img.src = value;
            }
        }
    }, [signatureMethod, value]);

    const startDrawing = (e) => { if (!canvasRef.current) return; e.preventDefault(); setIsDrawing(true); const { offsetX, offsetY } = getCoordinates(e); ctxRef.current.beginPath(); ctxRef.current.moveTo(offsetX, offsetY); };
    const draw = (e) => { if (!isDrawing || !canvasRef.current) return; e.preventDefault(); const { offsetX, offsetY } = getCoordinates(e); ctxRef.current.lineTo(offsetX, offsetY); ctxRef.current.stroke(); };
    const stopDrawing = () => { if (!canvasRef.current) return; setIsDrawing(false); ctxRef.current.beginPath(); const canvasData = canvasRef.current.toDataURL(); const syntheticEvent = { target: { name, value: canvasData, type: 'signature' } }; onChange(syntheticEvent); };
    const getCoordinates = (e) => {
        const canvas = canvasRef.current; if (!canvas) return { offsetX: 0, offsetY: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        let clientX, clientY;
        if (e.touches) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; } else { clientX = e.clientX; clientY = e.clientY; }
        const offsetX = (clientX - rect.left) * scaleX;
        const offsetY = (clientY - rect.top) * scaleY;
        return { offsetX: Math.max(0, Math.min(offsetX, canvas.width)), offsetY: Math.max(0, Math.min(offsetY, canvas.height)) };
    };
    const clearSignature = () => {
        if (signatureMethod === 'draw' && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            const syntheticEvent = { target: { name, value: '', type: 'signature' } };
            onChange(syntheticEvent);
        } else if (signatureMethod === 'upload') {
            if (fileInputRef.current) fileInputRef.current.value = '';
            const syntheticEvent = { target: { name, value: '', type: 'signature' } };
            onChange(syntheticEvent);
        }
        setError('');
    };
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { setError('File size should be less than 2MB'); return; }
            if (!file.type.startsWith('image/')) { setError('Please upload an image file'); return; }
            const reader = new FileReader();
            reader.onload = (event) => {
                const syntheticEvent = { target: { name, value: event.target.result, type: 'signature' } };
                onChange(syntheticEvent);
                setError('');
            };
            reader.onerror = () => setError('Failed to read file');
            reader.readAsDataURL(file);
        }
    };
    const handleMethodToggle = (method) => { if (method === 'draw') setSignatureMethod('draw'); else setSignatureMethod('upload'); };
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{label} {required && <span className="text-red-500">*</span>}</label>
            <div className="flex gap-4 mb-3">
                <button type="button" onClick={() => handleMethodToggle('draw')} className={`px-4 py-2 text-sm font-medium rounded-lg transition ${signatureMethod === 'draw' ? 'bg-yellow-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>✍️ Draw Signature</button>
                <button type="button" onClick={() => handleMethodToggle('upload')} className={`px-4 py-2 text-sm font-medium rounded-lg transition ${signatureMethod === 'upload' ? 'bg-yellow-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>📁 Upload Signature</button>
            </div>
            {signatureMethod === 'draw' ? (
                <div>
                    <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-inner">
                        <canvas ref={canvasRef} className="w-full cursor-crosshair" style={{ height: '200px', width: '100%' }} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
                    </div>
                    <div className="flex gap-2 mt-3">
                        <button type="button" onClick={clearSignature} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition">🗑️ Clear</button>
                        <p className="text-xs text-gray-500 self-center ml-2">Draw your signature using mouse or touch</p>
                    </div>
                </div>
            ) : (
                <div>
                    <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileUpload} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-yellow-500 hover:bg-yellow-50 transition text-center">📂 Click to upload signature image</button>
                    {value && value.startsWith('data:image') && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 mb-2">Signature Preview:</p>
                            <img src={value} alt="Signature preview" className="max-h-32 border rounded shadow-sm" />
                            <button type="button" onClick={clearSignature} className="mt-2 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition">Remove</button>
                        </div>
                    )}
                    {!value && <p className="text-xs text-gray-500 mt-2">Upload a clear image of your signature (JPG, PNG, max 2MB)</p>}
                </div>
            )}
            {error && <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">⚠️ {error}</p>}
        </div>
    );
});
DigitalSignature.displayName = 'DigitalSignature';

// ======================
// Emergency Contact Component (unchanged)
// ======================
const EmergencyContact = memo(({ index, contact, onChange, onRemove, canRemove }) => {
    return (
        <div className="border border-gray-200 rounded-lg p-4 mb-4 relative">
            {canRemove && <button type="button" onClick={() => onRemove(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>}
            <h4 className="text-md font-semibold text-gray-800 mb-3">Emergency Contact {index + 1}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Name" name={`emergencyName_${index}`} placeholder="Emergency contact person name" value={contact.name} onChange={(e) => onChange(index, 'name', e.target.value)} validation="name" required={false} />
                <InputField label="Location" name={`emergencyLocation_${index}`} placeholder="City/Area" value={contact.location} onChange={(e) => onChange(index, 'location', e.target.value)} required={false} />
                <InputField label="Phone Number" name={`emergencyPhone_${index}`} type="tel" placeholder="9876543210" value={contact.phone} onChange={(e) => onChange(index, 'phone', e.target.value)} validation="mobile" required={false} maxLength={10} />
                <InputField label="Relationship" name={`emergencyRelationship_${index}`} placeholder="e.g., Father, Mother, Spouse" value={contact.relationship} onChange={(e) => onChange(index, 'relationship', e.target.value)} required={false} />
            </div>
        </div>
    );
});
EmergencyContact.displayName = 'EmergencyContact';

// ======================
// Main Application Component
// ======================
export default function ApplicationManagement() {
    const [applications, setApplications] = useState([]);
    const [currentView, setCurrentView] = useState('list');
    const [currentApplication, setCurrentApplication] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [activeTab, setActiveTab] = useState('personal');
    const [showPreview, setShowPreview] = useState(false);
    const [tabErrors, setTabErrors] = useState({});
    const [isImporting, setIsImporting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusUpdateApp, setStatusUpdateApp] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteApp, setDeleteApp] = useState(null);
    const [loadingAction, setLoadingAction] = useState(null);
    const [usersList, setUsersList] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);

    // UNIFIED selection state for bulk actions (DELETE, APPROVE, REJECT)
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
    const [bulkStatusAction, setBulkStatusAction] = useState(null); // 'approved' or 'rejected'
    const [bulkRemarks, setBulkRemarks] = useState('');

    const [importMethod, setImportMethod] = useState('local');
    const [urlInput, setUrlInput] = useState('');
    const [isImportingFromUrl, setIsImportingFromUrl] = useState(false);
    const importOptions = [
        { value: 'local', label: 'Local File' },
        { value: 'url', label: 'URL' }
    ];

    const statuses = [
        { id: 'all', name: 'All Status' },
        { id: 'pending', name: 'Pending' },
        { id: 'approved', name: 'Approved' },
        { id: 'rejected', name: 'Rejected' },
    ];
    const selectedStatus = statuses.find((status) => status.id === filter) || statuses[0];

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrev, setHasPrev] = useState(false);
    const [limit] = useState(10);

    const tabs = ['personal', 'emergency', 'employment', 'bank', 'signatures', 'declaration'];
    const currentTabIndex = tabs.indexOf(activeTab);
    const isLastTab = currentTabIndex === tabs.length - 1;
    const [formData, setFormData] = useState({
        applicationId: '',
        fullName: '',
        dob: '',
        fatherName: '',
        bloodGroup: '',
        address: '',
        contactNo: '',
        email: '',
        pinCode: '',
        panNumber: '',
        aadharNumber: '',
        emergencyContacts: [{ name: '', location: '', phone: '', relationship: '' }],
        previousCompany: '',
        previousDesignation: '',
        educationalQualification: '',
        legalCasesPending: '',
        nameAsPerBank: '',
        bankName: '',
        accountNo: '',
        ifscCode: '',
        branch: '',
        bankCity: '',
        declarationNote: '',
        declaration: false,
        referrerSignature: '',
        applicantSignature: '',
        referredById: "",
        referredByName: "",
        status: 'pending',
        level: "ME",
        dateOfApplication: ""
    });

    const fetchApplications = async (page = 1) => {
        setTableLoading(true);
        try {
            let url = `/api/application?page=${page}&limit=${limit}`;
            if (filter !== 'all') url += `&status=${filter}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setApplications(data.applications);
                setCurrentPage(data.pagination.currentPage);
                setTotalPages(data.pagination.totalPages);
                setTotalRecords(data.pagination.totalRecords);
                setHasNext(data.pagination.hasNext);
                setHasPrev(data.pagination.hasPrev);
            } else {
                showNotification('error', data.error || 'Failed to fetch applications');
            }
        } catch (error) {
            console.log('Error fetching applications:', error);
            showNotification('error', 'Failed to fetch applications');
        } finally {
            setTableLoading(false);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
        fetchApplications(1);
    }, [filter]);

    useEffect(() => {
        fetchApplications(1);
    }, []);

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleChange = useCallback((e) => {
        const { name, value, type, checked, userName } = e.target;
        if (userName) {
            setFormData(prev => ({ ...prev, referredByName: userName, referredById: value }));
        } else {
            setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    }, []);

    const handleEmergencyContactChange = (index, field, value) => {
        setFormData(prev => {
            const updatedContacts = [...prev.emergencyContacts];
            updatedContacts[index] = { ...updatedContacts[index], [field]: value };
            return { ...prev, emergencyContacts: updatedContacts };
        });
    };

    const addEmergencyContact = () => {
        if (formData.emergencyContacts.length < 5) {
            setFormData(prev => ({ ...prev, emergencyContacts: [...prev.emergencyContacts, { name: '', location: '', phone: '', relationship: '' }] }));
        } else {
            showNotification('error', 'Maximum 5 emergency contacts allowed');
        }
    };

    const removeEmergencyContact = (index) => {
        if (formData.emergencyContacts.length > 1) {
            setFormData(prev => ({ ...prev, emergencyContacts: prev.emergencyContacts.filter((_, i) => i !== index) }));
        }
    };

    const validatePersonalTab = useCallback(() => {
        const errors = {};
        if (!formData.fullName) errors.fullName = 'Full Name is required';
        if (formData.email && !/^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(formData.email)) errors.email = 'Please enter a valid email address';
        if (formData.contactNo && !/^[0-9]{10}$/.test(formData.contactNo)) errors.contactNo = 'Please enter a valid 10-digit mobile number';
        if (formData.pinCode && !/^[0-9]{6}$/.test(formData.pinCode)) errors.pinCode = 'Please enter a valid 6-digit pincode';
        if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.toUpperCase())) errors.panNumber = 'Please enter a valid PAN card number';
        if (formData.aadharNumber && !/^[0-9]{12}$/.test(formData.aadharNumber)) errors.aadharNumber = 'Please enter a valid 12-digit Aadhar number';
        if (formData.dob) {
            const dobDate = new Date(formData.dob);
            const today = new Date();
            let age = today.getFullYear() - dobDate.getFullYear();
            const monthDiff = today.getMonth() - dobDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) age--;
            if (age < 18) errors.dob = 'Age must be 18 years or above';
        }
        return errors;
    }, [formData.fullName, formData.email, formData.contactNo, formData.pinCode, formData.panNumber, formData.aadharNumber, formData.dob]);

    const validateEmergencyTab = useCallback(() => {
        const errors = {};
        formData.emergencyContacts.forEach((contact, idx) => {
            if (contact.phone && !/^[0-9]{10}$/.test(contact.phone)) errors[`emergencyPhone_${idx}`] = 'Please enter a valid 10-digit phone number';
        });
        return errors;
    }, [formData.emergencyContacts]);

    const validateEmploymentTab = useCallback(() => ({}), []);
    const validateBankTab = useCallback(() => {
        const errors = {};
        if (formData.accountNo && !/^[0-9]{9,18}$/.test(formData.accountNo)) errors.accountNo = 'Account number should be 9-18 digits only';
        if (formData.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.toUpperCase())) errors.ifscCode = 'Please enter a valid IFSC code';
        return errors;
    }, [formData.accountNo, formData.ifscCode]);
    const validateSignaturesTab = useCallback(() => ({}), []);
    const validateDeclarationTab = useCallback(() => ({}), []);

    const getCurrentTabErrors = useCallback(() => {
        switch (activeTab) {
            case 'personal': return validatePersonalTab();
            case 'emergency': return validateEmergencyTab();
            case 'employment': return validateEmploymentTab();
            case 'bank': return validateBankTab();
            case 'signatures': return validateSignaturesTab();
            case 'declaration': return validateDeclarationTab();
            default: return {};
        }
    }, [activeTab, validatePersonalTab, validateEmergencyTab, validateEmploymentTab, validateBankTab, validateSignaturesTab, validateDeclarationTab]);

    useEffect(() => {
        const errors = getCurrentTabErrors();
        setTabErrors(prev => ({ ...prev, [activeTab]: errors }));
    }, [getCurrentTabErrors, activeTab]);

    const isCurrentTabValid = useCallback(() => {
        if (activeTab === 'personal') {
            const errors = getCurrentTabErrors();
            return Object.keys(errors).length === 0;
        }
        return true;
    }, [activeTab, getCurrentTabErrors]);

    const handleNextTab = () => {
        if (isCurrentTabValid() && currentTabIndex < tabs.length - 1) {
            setActiveTab(tabs[currentTabIndex + 1]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePreviousTab = () => {
        if (currentTabIndex > 0) {
            setActiveTab(tabs[currentTabIndex - 1]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleShowPreview = () => setShowPreview(true);
    const handleClosePreview = () => setShowPreview(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.fullName) {
            showNotification('error', 'Full Name is required');
            return;
        }
        setIsLoading(true);
        try {
            const url = '/api/application';
            const method = currentView === 'edit' ? 'PUT' : 'POST';
            const body = currentView === 'edit' ? { id: currentApplication._id, ...formData } : { ...formData };
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const data = await response.json();
            if (data.success) {
                showNotification('success', currentView === 'edit' ? 'Application updated!' : 'Application submitted!');
                setCurrentView('list');
                setShowPreview(false);
                resetForm();
                fetchApplications(currentPage);
            } else {
                showNotification('error', data.error || 'Something went wrong');
            }
        } catch (error) {
            console.log(error);
            showNotification('error', 'Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = async (application) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/application?id=${application._id}`);
            const data = await response.json();
            if (data.success) {
                const app = data.application;
                setCurrentApplication(app);
                setFormData({
                    applicationId: app.applicationId || '',
                    dateOfApplication: app.dateOfApplication || "",
                    fullName: app.fullName || '',
                    dob: app.dob ? app.dob.split('T')[0] : '',
                    fatherName: app.fatherName || '',
                    bloodGroup: app.bloodGroup || '',
                    address: app.address || '',
                    contactNo: app.contactNo || '',
                    email: app.email || '',
                    pinCode: app.pinCode || '',
                    panNumber: app.panNumber || '',
                    aadharNumber: app.aadharNumber || '',
                    emergencyContacts: app.emergencyContacts?.length ? app.emergencyContacts.map(item => ({ name: item.name || "", location: item.location || '', phone: item.phone || '', relationship: item.relationship || '' })) : [{ name: '', location: '', phone: '', relationship: '' }],
                    previousCompany: app.previousCompany || '',
                    previousDesignation: app.previousDesignation || '',
                    educationalQualification: app.educationalQualification || '',
                    legalCasesPending: app.legalCasesPending || '',
                    nameAsPerBank: app.nameAsPerBank || '',
                    bankName: app.bankName || '',
                    accountNo: app.accountNo || '',
                    ifscCode: app.ifscCode || '',
                    branch: app.branch || '',
                    bankCity: app.bankCity || '',
                    referredById: app.referredById || 'SB-000000',
                    referredByName: app.referredByName || 'K Srinivas',
                    declarationNote: app.declarationNote || '',
                    declaration: app.declaration || false,
                    referrerSignature: app.referrerSignature || '',
                    applicantSignature: app.applicantSignature || '',
                    status: app.status || 'pending',
                });
                setCurrentView('edit');
                setActiveTab('personal');
                setShowPreview(false);
            } else {
                showNotification('error', 'Failed to load application details');
            }
        } catch (error) {
            console.log(error);
            showNotification('error', 'Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = (app) => {
        setDeleteApp(app);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteApp) return;
        setActionLoading(true);
        try {
            const response = await fetch(`/api/application?id=${deleteApp._id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                showNotification('success', 'Application deleted successfully');
                setShowDeleteModal(false);
                setDeleteApp(null);
                if (applications.length === 1 && currentPage > 1) {
                    fetchApplications(currentPage - 1);
                } else {
                    fetchApplications(currentPage);
                }
            } else {
                showNotification('error', data.error || 'Failed to delete');
            }
        } catch (error) {
            console.log(error);
            showNotification('error', 'Network error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleStatusUpdate = (app) => {
        setStatusUpdateApp(app);
        setRemarks('');
        setShowStatusModal(true);
    };

    const updateStatus = async (status) => {
        if (!statusUpdateApp) return;
        setLoadingAction(status);
        try {
            const response = await fetch('/api/application', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: statusUpdateApp._id,
                    status,
                    remarks,
                    applicationId: statusUpdateApp.applicationId || ""
                }),
            });
            const data = await response.json();
            if (data.success) {
                showNotification('success', `Application ${status} successfully`);
                setShowStatusModal(false);
                setStatusUpdateApp(null);
                fetchApplications(currentPage);
            } else {
                showNotification('error', data.error || 'Failed to update status');
            }
        } catch (error) {
            console.log(error);
            showNotification('error', 'Network error');
        } finally {
            setLoadingAction(null);
        }
    };

    // ======================
    // BULK STATUS UPDATE (using unified selectedIds)
    // ======================
    const handleBulkStatusClick = (status) => {
        if (selectedIds.length === 0) {
            showNotification('error', 'No applications selected');
            return;
        }
        setBulkStatusAction(status);
        setBulkRemarks('');
        setShowBulkStatusModal(true);
    };

    const confirmBulkStatusUpdate = async () => {
        if (!bulkStatusAction) return;
        setActionLoading(true);
        try {
            const response = await fetch('/api/application', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ids: selectedIds,
                    status: bulkStatusAction,
                    remarks: bulkRemarks,
                }),
            });
            const data = await response.json();
            if (data.success) {
                showNotification('success', `${data.results?.length || selectedIds.length} application(s) ${bulkStatusAction}`);
                // Clear selection and refresh
                setSelectedIds([]);
                setSelectAll(false);
                setShowBulkStatusModal(false);
                fetchApplications(currentPage);
            } else {
                showNotification('error', data.error || 'Bulk status update failed');
            }
        } catch (error) {
            console.error('Bulk status update error:', error);
            showNotification('error', 'Network error. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            applicationId: '', dateOfApplication: '', fullName: '', dob: '', fatherName: '', bloodGroup: '', address: '', contactNo: '', email: '', pinCode: '', panNumber: '', aadharNumber: '',
            emergencyContacts: [{ name: '', location: '', phone: '', relationship: '' }],
            previousCompany: '', previousDesignation: '', educationalQualification: '', legalCasesPending: '',
            nameAsPerBank: '', bankName: '', accountNo: '', ifscCode: '', branch: '', bankCity: '',
            declarationNote: '', declaration: false, referrerSignature: '', applicantSignature: '', referredById: 'SB-000000', referredByName: "K srinivas", status: 'pending',
        });
        setCurrentApplication(null);
        setActiveTab('personal');
        setShowPreview(false);
    };

    const MAX_EMERGENCY_CONTACTS = 2;

    const handleExportExcel = async () => {
        if (applications.length === 0) {
            showNotification('error', 'No applications to export');
            return;
        }
        setIsExporting(true);
        try {
            const exportData = applications.map(app => {
                const base = {
                    'Application ID': app.applicationId || '',
                    'User Code': app.userCode || '',
                    'Full Name': app.fullName || '',
                    'UTR No / Cash': app.modeOfPayment || '',
                    'Date Of Payment': app.dateOfPayment || '',
                    'Kit Delivered': app.kit_delivered || '',
                    'Date of Birth': app.dob ? new Date(app.dob).toLocaleDateString() : '',
                    'Father Name': app.fatherName || '',
                    'Blood Group': app.bloodGroup || '',
                    'Address': app.address || '',
                    'Contact No': app.contactNo || '',
                    'Email': app.email || '',
                    'Pin Code': app.pinCode || '',
                    'PAN Number': app.panNumber || '',
                    'Aadhar Number': app.aadharNumber || '',
                    'Previous Company': app.previousCompany || '',
                    'Previous Designation': app.previousDesignation || '',
                    'Educational Qualification': app.educationalQualification || '',
                    'Legal Cases Pending': app.legalCasesPending || '',
                    'Name as per Bank': app.nameAsPerBank || '',
                    'Bank Name': app.bankName || '',
                    'Account No': app.accountNo || '',
                    'IFSC Code': app.ifscCode || '',
                    'Branch': app.branch || '',
                    'Bank City': app.bankCity || '',
                    'Declaration Note': app.declarationNote || '',
                    'Declaration': app.declaration ? 'Yes' : 'No',
                    'Referred By Id': app.referredById || '',
                    'Referred By Name': app.referredByName || '',
                    'Level': app.level || '',
                    'Status': app.status || '',
                    'Applied At': app.appliedAt ? new Date(app.appliedAt).toLocaleString() : '',
                };
                const contacts = app.emergencyContacts || [];
                for (let i = 0; i < MAX_EMERGENCY_CONTACTS; i++) {
                    const contact = contacts[i] || {};
                    base[`Emergency Contact ${i + 1} Name`] = contact.name || '';
                    base[`Emergency Contact ${i + 1} Phone`] = contact.phone || '';
                    base[`Emergency Contact ${i + 1} Location`] = contact.location || '';
                    base[`Emergency Contact ${i + 1} Relationship`] = contact.relationship || '';
                }
                return base;
            });
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Applications');
            XLSX.writeFile(wb, `applications_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`);
            showNotification('success', 'Applications exported successfully');
        } catch (error) {
            console.error(error);
            showNotification('error', 'Failed to export applications');
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportExcel = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls, .csv';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            setIsImporting(true);
            try {
                const data = await readExcelFile(file);
                if (!data || data.length === 0) {
                    showNotification('error', 'No data found in file');
                    setIsImporting(false);
                    return;
                }
                const mappedData = data.map(row => mapExcelRowToFormData(row)).filter(row => row.fullName);
                const results = await Promise.allSettled(
                    mappedData.map(async (appData, idx) => {
                        if (!appData.fullName) throw new Error(`Row ${idx + 1}: Full Name is required`);
                        const response = await fetch('/api/application', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(appData) });
                        const result = await response.json();
                        if (!result.success) throw new Error(result.error || 'Submission failed');
                        return result;
                    })
                );
                const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
                const failed = results.filter(r => r.status === 'rejected');
                if (successful > 0) showNotification('success', `Successfully imported ${successful} applications`);
                if (failed.length > 0) showNotification('error', `Failed to import ${failed.length} applications: ${failed.map(f => f.reason.message).join('; ')}`);
                fetchApplications(currentPage);
            } catch (error) {
                console.log(error);
                showNotification('error', 'Failed to import Excel file');
            } finally { setIsImporting(false); }
        };
        input.click();
    };

    const handleImportFromUrl = async () => {
        if (!urlInput.trim()) {
            showNotification('error', 'Please enter a URL');
            return;
        }
        setIsImportingFromUrl(true);
        try {
            let data = null;
            const sheetIdMatch = urlInput.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (sheetIdMatch) {
                const sheetId = sheetIdMatch[1];
                const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
                const response = await fetch(csvUrl);
                if (!response.ok) throw new Error('Failed to fetch Google Sheet data');
                const csvText = await response.text();
                const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
                data = parsed.data;
            } else {
                const response = await fetch(urlInput);
                if (!response.ok) throw new Error('Failed to fetch file');
                const blob = await response.blob();
                const fileName = urlInput.split('/').pop() || 'file';
                const file = new File([blob], fileName, { type: blob.type });
                data = await readExcelFile(file);
            }
            if (!data || data.length === 0) {
                showNotification('error', 'No data found in the source');
                return;
            }
            const mappedData = data.map(row => mapExcelRowToFormData(row)).filter(row => row.fullName);
            const results = await Promise.allSettled(
                mappedData.map(async (appData, idx) => {
                    if (!appData.fullName) throw new Error(`Row ${idx + 1}: Full Name is required`);
                    const response = await fetch('/api/application', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(appData)
                    });
                    const result = await response.json();
                    if (result.success) { setUrlInput("") }
                    if (!result.success) throw new Error(result.error || 'Submission failed');
                    return result;
                })
            );
            const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
            const failed = results.filter(r => r.status === 'rejected');
            if (successful > 0) showNotification('success', `Successfully imported ${successful} applications`);
            if (failed.length > 0) showNotification('error', `Failed to import ${failed.length} applications: ${failed.map(f => f.reason.message).join('; ')}`);
            fetchApplications(currentPage);
        } catch (error) {
            console.error(error);
            showNotification('error', error.message || 'Failed to import from URL');
        } finally {
            setIsImportingFromUrl(false);
        }
    };

    const readExcelFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                    resolve(jsonData);
                } catch (err) { reject(err); }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    };

    const parseDate = (dateStr) => {
        if (!dateStr) return '';
        let date;
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            date = new Date(dateStr);
        } else if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
            const [day, month, year] = dateStr.split('-');
            date = new Date(`${year}-${month}-${day}`);
        } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
            const [day, month, year] = dateStr.split('/');
            date = new Date(`${year}-${month}-${day}`);
        } else {
            date = new Date(dateStr);
        }
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    };

    const mapExcelRowToFormData = (row) => {
        const getStr = (key) => (row[key] ? String(row[key]).trim() : '');
        let emergencyContacts = [];
        const MAX_CONTACTS = 3;
        for (let i = 1; i <= MAX_CONTACTS; i++) {
            const name = getStr(`Emergency Contact ${i} Name`);
            if (name && name !== '') {
                emergencyContacts.push({
                    name: name,
                    phone: getStr(`Emergency Contact ${i} Phone`),
                    location: getStr(`Emergency Contact ${i} Location`),
                    relationship: getStr(`Emergency Contact ${i} Relationship`)
                });
            }
        }
        if (emergencyContacts.length === 0 && row['Emergency Contacts']) {
            const contactsStr = getStr('Emergency Contacts');
            if (contactsStr) {
                const contacts = contactsStr.split(';').map(contact => {
                    const match = contact.match(/(.+?)\s*\((.+?)\)\s*-\s*(.+?),\s*(.+)/);
                    if (match) return {
                        name: match[1].trim(),
                        relationship: match[2].trim(),
                        phone: match[3].trim(),
                        location: match[4].trim()
                    };
                    return null;
                }).filter(c => c && c.name);
                if (contacts.length) emergencyContacts = contacts;
            }
        }
        if (emergencyContacts.length === 0) {
            emergencyContacts = [{ name: '', location: '', phone: '', relationship: '' }];
        }
        return {
            applicationId: getStr('Application ID'),
            dateOfApplication: getStr('Date Of Application'),
            modeOfPayment: getStr('UTR No / Cash'),
            dateOfPayment: getStr('Date Of Payment'),
            kit_delivered: getStr('Kit Delivered'),
            fullName: getStr('Full Name'),
            dob: parseDate(getStr('Date of Birth')),
            fatherName: getStr("Father's/Husband's Name"),
            bloodGroup: getStr('Blood Group'),
            address: getStr('Address'),
            contactNo: getStr('Contact Number'),
            email: getStr('Email ID'),
            pinCode: getStr('Pin Code'),
            panNumber: getStr('PAN Number'),
            aadharNumber: getStr('Aadhar Number'),
            emergencyContacts,
            previousCompany: getStr('Previous Company'),
            previousDesignation: getStr('Previous Designation'),
            educationalQualification: getStr('Educational Qualification'),
            legalCasesPending: getStr('Legal Cases Pending') === 'Yes' ? 'yes' : getStr('Legal Cases Pending') === 'No' ? 'no' : '',
            nameAsPerBank: getStr('Name as per Bank'),
            bankName: getStr('Bank Name'),
            accountNo: getStr('Account Number'),
            ifscCode: getStr('IFSC Code'),
            branch: getStr('Branch'),
            bankCity: getStr('Bank City'),
            declarationNote: getStr('Declaration Note'),
            declaration: getStr('Declaration Accepted') === 'Yes',
            referrerSignature: '',
            applicantSignature: '',
            referredById: getStr('Referred By Id') || 'SB-000000',
            referredByName: getStr('Referred By Name') || 'K Srinivas',
            status: getStr('Status') || 'pending',
        };
    };

    const handleDownloadTemplate = () => {
        const templateData = [{
            'Application ID': 'SB-000000',
            'Date Of Application': "30-03-2026",
            'Date Of Payment': "31-03-2026",
            'Kit Delivered': 'Yes',
            'UTR No / Cash': "Cash",
            'Referred By Name': 'K Srinivas',
            'Referred By Id': 'SB-000000',
            'userCode': 'ME-001',
            'mlmUserCode': 'ME-001',
            'Full Name': 'Bheema',
            'Date of Birth': '1995-01-12',
            "Father's/Husband's Name": 'Megya',
            'Blood Group': 'B+',
            'Address': '123 Main Street, Hyderabad',
            'Contact Number': '9876543210',
            'Email ID': 'bheema@gmail.com',
            'Pin Code': '123456',
            'PAN Number': 'ABCDE1234F',
            'Aadhar Number': '123456789012',
            'Emergency Contact 1 Name': 'Vinod',
            'Emergency Contact 1 Phone': '9876543211',
            'Emergency Contact 1 Location': 'Hyderabad',
            'Emergency Contact 1 Relationship': 'Brother',
            'Emergency Contact 2 Name': 'Sita',
            'Emergency Contact 2 Phone': '9876543212',
            'Emergency Contact 2 Location': 'Secunderabad',
            'Emergency Contact 2 Relationship': 'Friend',
            'Educational Qualification': 'Graduate',
            'Previous Company': 'BMax Projects Pvt Ltd',
            'Previous Designation': 'Manager',
            'Legal Cases Pending': 'No',
            'Name as per Bank': 'Bheema',
            'Bank Name': 'State Bank of India',
            'Account Number': '123456789012',
            'IFSC Code': 'SBIN0012345',
            'Branch': 'Hyderabad Branch',
            'Bank City': 'Hyderarab',
            'Declaration Note': 'I confirm that all information is correct.',
            'Declaration Accepted': 'Yes',
            'Applicant Signature': '',
            'Referrer Signature': '',
            'Status': 'pending',
        }];
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Application_Template');
        XLSX.writeFile(wb, 'application_template.xlsx');
        showNotification('success', 'Template downloaded');
    };

    const filteredApplications = useMemo(() => {
        let filtered = applications;
        if (searchTerm) filtered = filtered.filter(app =>
            app.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.contactNo?.includes(searchTerm)
        );
        return filtered;
    }, [applications, searchTerm]);

    useEffect(() => {
        if (filteredApplications.length === 0) {
            setSelectAll(false);
        } else {
            const allSelected = filteredApplications.every(app => selectedIds.includes(app._id));
            setSelectAll(allSelected);
        }
    }, [filteredApplications, selectedIds]);

    // Row selection handler
    const handleSelectRow = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (checked) => {
        setSelectAll(checked);
        if (checked) {
            setSelectedIds(filteredApplications.map(app => app._id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        setActionLoading(true);
        try {
            const response = await fetch('/api/application', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds }),
            });
            const data = await response.json();
            if (data.success) {
                showNotification('success', `Deleted ${data.deleted} application${data.deleted > 1 ? 's' : ''}`);
                setSelectedIds([]);
                setSelectAll(false);
                setShowBulkDeleteModal(false);
                fetchApplications(currentPage);
            } else {
                showNotification('error', data.error || 'Failed to delete applications');
            }
        } catch (error) {
            console.error('Bulk delete error:', error);
            showNotification('error', 'Network error. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'text-green-600 bg-green-100';
            case 'pending': return 'text-yellow-600 bg-yellow-100';
            case 'rejected': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved': return <CheckCircle size={16} className="inline mr-1" />;
            case 'pending': return <Clock size={16} className="inline mr-1" />;
            case 'rejected': return <XCircle size={16} className="inline mr-1" />;
            default: return null;
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchApplications(newPage);
        }
    };

    const handleViewDetails = (app) => {
        setSelectedApplication(app);
        setShowDetailsModal(true);
    };

    // CustomCheckbox (reusable)
    const CustomCheckbox = ({ checked, indeterminate = false, top = false, onChange, className = '' }) => {
        return (
            <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`
                w-5 h-5 rounded-md border-2 flex items-center justify-center
                transition-all duration-200 cursor-pointer
                ${checked || indeterminate || (top && selectedIds.length > 0)
                        ? 'bg-yellow-500 border-yellow-500 text-white'
                        : 'bg-white border-gray-300 hover:border-yellow-400'
                    }
                ${className}
            `}
            >
                {checked && <Check size={14} className="stroke-[3]" />}
                {(top && selectedIds.length > 0) && <p className='p-1 text-sm'>{selectedIds.length}</p>}
                {!checked && indeterminate && <Minus size={14} className="stroke-[3]" />}
            </button>
        );
    };

    // ======================
    // Modals
    // ======================
    const DetailsModal = ({ application, onClose }) => {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white text-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                    <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center rounded-t-lg">
                        <h2 className="text-xl font-bold text-gray-900">Application Details</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"><X size={24} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Personal Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <p><strong>Application ID:</strong> {application.applicationId || 'Not provided'}</p>
                                <p><strong>Date Of Application:</strong> {application.dateOfApplication || 'Not provided'}</p>
                                <p><strong>Referred By Name:</strong> {application.referredByName || 'Not provided'}</p>
                                <p><strong>Referred By Id:</strong> {application.referredById || 'Not provided'}</p>
                                <p><strong>Full Name:</strong> {application.fullName || 'Not provided'}</p>
                                <p><strong>Date of Birth:</strong> {application.dob ? new Date(application.dob).toLocaleDateString() : 'Not provided'}</p>
                                <p><strong>Father's/Husband's Name:</strong> {application.fatherName || 'Not provided'}</p>
                                <p><strong>Blood Group:</strong> {application.bloodGroup || 'Not provided'}</p>
                                <p><strong>Address:</strong> {application.address || 'Not provided'}</p>
                                <p><strong>Contact Number:</strong> {application.contactNo || 'Not provided'}</p>
                                <p><strong>Email ID:</strong> {application.email || 'Not provided'}</p>
                                <p><strong>Pin Code:</strong> {application.pinCode || 'Not provided'}</p>
                                <p><strong>PAN Number:</strong> {application.panNumber || 'Not provided'}</p>
                                <p><strong>Aadhar Number:</strong> {application.aadharNumber || 'Not provided'}</p>
                            </div>
                        </div>
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Emergency Contact Details</h3>
                            {application.emergencyContacts && application.emergencyContacts.map((contact, idx) => (
                                <div key={idx} className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                                    <p className="font-semibold">Contact {idx + 1}</p>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <p><strong>Name:</strong> {contact.name}</p>
                                        <p><strong>Location:</strong> {contact.location}</p>
                                        <p><strong>Phone:</strong> {contact.phone}</p>
                                        <p><strong>Relationship:</strong> {contact.relationship}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Previous Employment Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <p><strong>Company Name:</strong> {application.previousCompany || 'Not provided'}</p>
                                <p><strong>Designation:</strong> {application.previousDesignation || 'Not provided'}</p>
                                <p><strong>Educational Qualification:</strong> {application.educationalQualification || 'Not provided'}</p>
                            </div>
                        </div>
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Legal Cases</h3>
                            <p><strong>Any Legal Cases Pending:</strong> {application.legalCasesPending === 'yes' ? 'Yes' : application.legalCasesPending === 'no' ? 'No' : 'Not provided'}</p>
                        </div>
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Bank Account Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <p><strong>Name as per Bank:</strong> {application.nameAsPerBank || 'Not provided'}</p>
                                <p><strong>Bank Name:</strong> {application.bankName || 'Not provided'}</p>
                                <p><strong>Account Number:</strong> {application.accountNo ? `XXXX${application.accountNo.slice(-4)}` : 'Not provided'}</p>
                                <p><strong>IFSC Code:</strong> {application.ifscCode || 'Not provided'}</p>
                                <p><strong>Branch:</strong> {application.branch || 'Not provided'}</p>
                                <p><strong>City:</strong> {application.bankCity || 'Not provided'}</p>
                            </div>
                        </div>
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Declaration</h3>
                            <p><strong>Note:</strong> {application.declarationNote || 'Not provided'}</p>
                            <p className="mt-2"><strong>Declaration Accepted:</strong> {application.declaration ? 'Yes' : 'No'}</p>
                        </div>
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Digital Signatures</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p><strong>Applicant Signature:</strong></p>
                                    {application.applicantSignature && application.applicantSignature !== '[SIGNATURE]' ? (
                                        <img src={application.applicantSignature} alt="Applicant Signature" className="mt-2 max-h-24 border rounded shadow-sm" />
                                    ) : (
                                        <p className="text-gray-500">Not provided</p>
                                    )}
                                </div>
                                <div>
                                    <p><strong>Referrer Signature:</strong></p>
                                    {application.referrerSignature && application.referrerSignature !== '[SIGNATURE]' ? (
                                        <img src={application.referrerSignature} alt="Referrer Signature" className="mt-2 max-h-24 border rounded shadow-sm" />
                                    ) : (
                                        <p className="text-gray-500">Not provided</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const StatusModal = memo(({ show, onClose, application, onUpdate, loadingAction, remarks, setRemarks }) => {
        const textareaRef = useRef(null);
        useEffect(() => {
            if (show && textareaRef.current) {
                textareaRef.current.focus();
                const length = textareaRef.current.value.length;
                textareaRef.current.setSelectionRange(length, length);
            }
        }, [show]);
        if (!show || !application) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-lg max-w-md w-full p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Update Application Status</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                    </div>
                    <div className="mb-4">
                        <p className="text-gray-700"><strong>Applicant:</strong><span className='capitalize'> {application.fullName}</span></p>
                        <p className="text-gray-700"><strong>Application ID:</strong> {application.applicationId}</p>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-2">Remarks (optional)</label>
                        <textarea
                            ref={textareaRef}
                            id="remarks"
                            name="remarks"
                            placeholder="Add remarks for this status change..."
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-colors outline-none"
                        />
                    </div>
                    <div className="flex justify-end space-x-3 mt-4">
                        <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button onClick={() => onUpdate('rejected')} disabled={loadingAction === 'reject'} className={`px-4 py-2 rounded-md text-white transition ${loadingAction === 'reject' ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}>{loadingAction === 'reject' ? 'Rejecting...' : 'Reject'}</button>
                        <button onClick={() => onUpdate('approved')} disabled={loadingAction === 'approve'} className={`px-4 py-2 rounded-md text-white transition ${loadingAction === 'approve' ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>{loadingAction === 'approve' ? 'Approving...' : 'Approve'}</button>
                    </div>
                </div>
            </div>
        );
    });
    StatusModal.displayName = 'StatusModal';

    const DeleteConfirmationModal = () => {
        if (!deleteApp) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-lg max-w-md w-full p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Confirm Deletion</h2>
                        <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                    </div>
                    <div className="mb-4">
                        <p className="text-gray-700">Are you sure you want to delete this application?</p>
                        <p className="text-gray-700 mt-2 capitalize"><strong>Applicant:</strong> <span className='capitalize'>{deleteApp.fullName}</span></p>
                        <p className="text-gray-700"><strong>Application ID:</strong> {deleteApp.applicationId}</p>
                        <p className="text-red-600 text-sm mt-3">This action cannot be undone.</p>
                    </div>
                    <div className="flex justify-end space-x-3 mt-4">
                        <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button onClick={confirmDelete} disabled={actionLoading} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50">{actionLoading ? 'Deleting...' : 'Delete'}</button>
                    </div>
                </div>
            </div>
        );
    };

    const BulkDeleteConfirmationModal = () => {
        if (!showBulkDeleteModal) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-lg max-w-md w-full p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Confirm Bulk Deletion</h2>
                        <button onClick={() => setShowBulkDeleteModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                    </div>
                    <div className="mb-4">
                        <p className="text-gray-700">Are you sure you want to delete <strong>{selectedIds.length}</strong> application{selectedIds.length > 1 ? 's' : ''}?</p>
                        <p className="text-red-600 text-sm mt-3">This action cannot be undone.</p>
                    </div>
                    <div className="flex justify-end space-x-3 mt-4">
                        <button onClick={() => setShowBulkDeleteModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button onClick={handleBulkDelete} disabled={actionLoading} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50">{actionLoading ? 'Deleting...' : 'Delete All'}</button>
                    </div>
                </div>
            </div>
        );
    };


    const BulkStatusModal = () => {
        const textareaRef = useRef(null);

        // Auto-focus and set cursor at the end of the text (only when modal opens)
        useEffect(() => {
            if (showBulkStatusModal && textareaRef.current) {
                setTimeout(() => {
                    const textarea = textareaRef.current;
                    if (textarea) {
                        textarea.focus();
                        const length = textarea.value.length;
                        textarea.setSelectionRange(length, length);
                    }
                }, 50);
            }
        }, [showBulkStatusModal]); // ✅ No bulkRemarks here, so it won't re-run on typing

        if (!showBulkStatusModal) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-lg max-w-md w-full p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Bulk Status Update</h2>
                        <button
                            onClick={() => setShowBulkStatusModal(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <div className="mb-4">
                        <p className="text-gray-700">
                            You are about to <strong>{bulkStatusAction}</strong> <strong>{selectedIds.length}</strong> selected application{selectedIds.length > 1 ? 's' : ''}.
                        </p>
                        <p className="text-gray-700 mt-2">Remarks (optional):</p>
                        <textarea
                            ref={textareaRef}
                            value={bulkRemarks}
                            onChange={(e) => setBulkRemarks(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-colors outline-none"
                            placeholder="Add a common remark for all selected applications..."
                        />
                    </div>
                    <div className="flex justify-end space-x-3 mt-4">
                        <button
                            onClick={() => setShowBulkStatusModal(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmBulkStatusUpdate}
                            disabled={actionLoading}
                            className={`px-4 py-2 rounded-md text-white transition ${bulkStatusAction === 'approved'
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-red-600 hover:bg-red-700'
                                } disabled:opacity-50`}
                        >
                            {actionLoading ? 'Updating...' : `Confirm ${bulkStatusAction === 'approved' ? 'Approve' : 'Reject'}`}
                        </button>
                    </div>
                </div>
            </div>
        );
    };



    const PreviewSection = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white text-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center rounded-t-lg">
                    <h2 className="text-xl font-bold text-gray-900">Application Preview</h2>
                    <button onClick={handleClosePreview} className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"><X size={24} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Personal Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <p><strong>Application ID:</strong> {formData.applicationId || 'Not provided'}</p>
                            <p><strong>Date Of Application:</strong> {formData.dateOfApplication || 'Not provided'}</p>
                            <p><strong>Referred By Name:</strong> {formData.referredByName || 'Not provided'}</p>
                            <p><strong>Referred By Id:</strong> {formData.referredById || 'Not provided'}</p>
                            <p><strong>Full Name:</strong> {formData.fullName || 'Not provided'}</p>
                            <p><strong>Date of Birth:</strong> {formData.dob || 'Not provided'}</p>
                            <p><strong>Father's/Husband's Name:</strong> {formData.fatherName || 'Not provided'}</p>
                            <p><strong>Blood Group:</strong> {formData.bloodGroup || 'Not provided'}</p>
                            <p><strong>Address:</strong> {formData.address || 'Not provided'}</p>
                            <p><strong>Contact No:</strong> {formData.contactNo || 'Not provided'}</p>
                            <p><strong>Email ID:</strong> {formData.email || 'Not provided'}</p>
                            <p><strong>Pin Code:</strong> {formData.pinCode || 'Not provided'}</p>
                            <p><strong>PAN Number:</strong> {formData.panNumber || 'Not provided'}</p>
                            <p><strong>Aadhar Number:</strong> {formData.aadharNumber || 'Not provided'}</p>
                        </div>
                    </div>
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Emergency Contact Details</h3>
                        {formData.emergencyContacts.map((contact, idx) => contact.name && contact.location && contact.phone && (
                            <div key={idx} className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                                <p className="font-semibold">Contact {idx + 1}</p>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <p><strong>Name:</strong> {contact.name}</p>
                                    <p><strong>Location:</strong> {contact.location}</p>
                                    <p><strong>Phone:</strong> {contact.phone}</p>
                                    <p><strong>Relationship:</strong> {contact.relationship}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Previous Employment Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <p><strong>Company Name:</strong> {formData.previousCompany || 'Not provided'}</p>
                            <p><strong>Designation:</strong> {formData.previousDesignation || 'Not provided'}</p>
                            <p><strong>Educational Qualification:</strong> {formData.educationalQualification || 'Not provided'}</p>
                        </div>
                    </div>
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Legal Cases</h3>
                        <p><strong>Any Legal Cases Pending:</strong> {formData.legalCasesPending === 'yes' ? 'Yes' : formData.legalCasesPending === 'no' ? 'No' : 'Not provided'}</p>
                    </div>
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Bank Account Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <p><strong>Name as per Bank:</strong> {formData.nameAsPerBank || 'Not provided'}</p>
                            <p><strong>Bank Name:</strong> {formData.bankName || 'Not provided'}</p>
                            <p><strong>Account Number:</strong> {formData.accountNo ? `XXXX${formData.accountNo.slice(-4)}` : 'Not provided'}</p>
                            <p><strong>IFSC Code:</strong> {formData.ifscCode || 'Not provided'}</p>
                            <p><strong>Branch:</strong> {formData.branch || 'Not provided'}</p>
                            <p><strong>City:</strong> {formData.bankCity || 'Not provided'}</p>
                        </div>
                    </div>
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Declaration</h3>
                        <p><strong>Note:</strong> {formData.declarationNote || 'Not provided'}</p>
                        <p className="mt-2"><strong>Declaration Accepted:</strong> {formData.declaration ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Digital Signatures</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div><p><strong>Applicant Signature:</strong></p>{formData.applicantSignature ? <img src={formData.applicantSignature} alt="Applicant Signature" className="mt-2 max-h-24 border rounded shadow-sm" /> : <p className="text-gray-500">Not provided</p>}</div>
                            <div><p><strong>Referrer Signature:</strong></p>{formData.referrerSignature ? <img src={formData.referrerSignature} alt="Referrer Signature" className="mt-2 max-h-24 border rounded shadow-sm" /> : <p className="text-gray-500">Not provided</p>}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await fetch('/api/mlm/users');
            const data = await res.json();
            if (data.success) {
                setUsersList(data.users);
            } else {
                console.log('Failed to fetch users');
            }
        } catch (err) {
            console.log('Error fetching users:', err);
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [currentView]);

    const UserSelect = ({ users, value = '', onChange, loading, required = true, label = 'Referred By' }) => {
        const [query, setQuery] = useState('');

        // Trim the incoming value
        const trimmedValue = typeof value === 'string' ? value.trim() : value;

        // Find selected user by applicationId or userCode or mlmUserCode
        const selectedUser = users.find(user =>
            user?.applicationId === trimmedValue ||
            user?.userCode === trimmedValue ||
            user?.mlmUserCode === trimmedValue
        );

        const filteredUsers = query === ''
            ? users
            : users.filter(user =>
                (user?.fullName || '').toLowerCase().includes(query.toLowerCase()) ||
                (user?.applicationId || '').toLowerCase().includes(query.toLowerCase()) ||
                (user?.userCode || '').toLowerCase().includes(query.toLowerCase())
            );

        const handleChange = (user) => {
            // Pass trimmed value to parent
            onChange({
                target: {
                    name: 'referredById',
                    value: user ? user.applicationId.trim() : '',
                    type: 'select-one',
                    userName: user ? user.fullName : ''
                }
            });
        };

        const handleClear = (e) => {
            e.stopPropagation();
            handleChange(null);
            setQuery('');
        };

        const displayValue = (user) => {
            if (!user) return '';
            const base = user?.fullName || '';
            const code = user?.userCode || user?.mlmUserCode;
            return code ? `${base} (${code})` : base;
        };

        return (
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                {loading ? (
                    <div className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-500">
                        Loading referrers...
                    </div>
                ) : (
                    <Combobox value={selectedUser} onChange={handleChange}>
                        <div className="relative mt-1">
                            <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-300 focus-within:ring-1 focus-within:ring-yellow-500 focus-within:border-yellow-500">
                                <Combobox.Input
                                    className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 outline-none"
                                    displayValue={displayValue}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Search or select a referrer"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
                                    {selectedUser && (
                                        <button
                                            onClick={handleClear}
                                            className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                            aria-label="Clear selection"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                    <Combobox.Button className="flex items-center">
                                        <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                    </Combobox.Button>
                                </div>
                            </div>
                            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                {filteredUsers.length === 0 && query !== '' ? (
                                    <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                        No referrers found.
                                    </div>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <Combobox.Option
                                            key={user?.userCode || user?.applicationId}
                                            className={({ active }) =>
                                                `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-yellow-100 text-yellow-900' : 'text-gray-900'
                                                }`
                                            }
                                            value={user}
                                        >
                                            {({ selected, active }) => (
                                                <>
                                                    <span
                                                        className={`block truncate ${selected ? 'font-medium' : 'font-normal'
                                                            }`}
                                                    >
                                                        {`${user?.fullName || ''}${(user?.userCode || user?.mlmUserCode)
                                                            ? ` (${user?.userCode || user?.mlmUserCode})`
                                                            : ''
                                                            }`}
                                                    </span>
                                                    {selected && (
                                                        <span
                                                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-yellow-600' : 'text-yellow-600'
                                                                }`}
                                                        >
                                                            <Check className="h-5 w-5" aria-hidden="true" />
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </Combobox.Option>
                                    ))
                                )}
                            </Combobox.Options>
                        </div>
                    </Combobox>
                )}
                <p className="text-xs text-gray-500 mt-1">
                    This member will be placed under your selected referrer
                </p>
            </div>
        );
    };


    const isAllSelected = filteredApplications.length > 0 &&
        selectedIds.length === filteredApplications.length;
    const isIndeterminate = selectedIds.length > 0 &&
        selectedIds.length < filteredApplications.length;

    // ======================
    // LIST VIEW (Gmail-like checkbox column + bulk actions)
    // ======================
    if (currentView === 'list') {
        // Compute pagination range text
        const startItem = (currentPage - 1) * limit + 1;
        const endItem = Math.min(currentPage * limit, totalRecords);
        const rangeText = `${startItem}-${endItem} of ${totalRecords}`;

        return (
            <div className="min-h-screen bg-gray-50 text-gray-900">
                {notification && (
                    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white animate-slide-in`}>
                        {notification.message}
                    </div>
                )}

                <div className="w-full sm:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
                            <p className="text-gray-600 mt-1">Admin &gt; Marketing Applications</p>
                        </div>
                        <button
                            onClick={() => { resetForm(); setCurrentView('add'); }}
                            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition shadow-sm hover:shadow-md"
                        >
                            + Add Applicant
                        </button>
                    </div>

                    {/* Search, Filter, Import/Export Toolbar */}
                    <div className="mb-4 flex flex-wrap gap-4 items-center">
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                        />
                        <Listbox value={filter} onChange={(value) => setFilter(value)}>
                            <div className="relative">
                                <Listbox.Button className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none w-full text-left flex justify-between items-center">
                                    <span>{selectedStatus.name}</span>
                                    <ChevronDownIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
                                </Listbox.Button>
                                <Listbox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
                                    {statuses.map((status) => (
                                        <Listbox.Option key={status.id} value={status.id} className={({ active, selected }) =>
                                            `cursor-pointer select-none px-4 py-2 ${active ? 'bg-yellow-100 text-yellow-900' : 'text-gray-900'} ${selected ? 'font-medium bg-yellow-50' : ''}`
                                        }>
                                            {({ selected }) => (
                                                <span className={selected ? 'font-medium' : 'font-normal'}>{status.name}</span>
                                            )}
                                        </Listbox.Option>
                                    ))}
                                </Listbox.Options>
                            </div>
                        </Listbox>
                        <button onClick={handleDownloadTemplate} className="px-2 py-2 flex items-center gap-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                            <Download size={18} /> Template
                        </button>
                        <div className="flex gap-2 items-center">
                            {importOptions.map((option) => {
                                const isChecked = importMethod === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={isChecked}
                                        onClick={() => setImportMethod(option.value)}
                                        className="flex items-center space-x-2 focus:outline-none rounded"
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${isChecked ? 'border-yellow-500' : 'border-gray-300 hover:border-gray-400'}`}>
                                            {isChecked && <div className="w-3 h-3 rounded-full bg-yellow-500" />}
                                        </div>
                                        <span className="text-sm text-gray-700">{option.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {importMethod === 'local' ? (
                            <button onClick={handleImportExcel} disabled={isImporting} className="px-2 py-2 flex items-center gap-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50">
                                <Download size={18} /> {isImporting ? 'Importing...' : 'Import Excel'}
                            </button>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    placeholder="Google Sheet URL or direct file URL"
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                                />
                                <button onClick={handleImportFromUrl} disabled={isImportingFromUrl || !urlInput.trim()} className="px-2 py-2 flex items-center gap-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                                    <Download size={18} /> {isImportingFromUrl ? 'Importing...' : 'Import from URL'}
                                </button>
                            </>
                        )}
                        <button onClick={handleExportExcel} disabled={isExporting} className="px-2 py-2 flex items-center gap-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                            <Upload size={18} /> {isExporting ? 'Exporting...' : 'Export Excel'}
                        </button>
                    </div>

                    {/* Bulk Actions Toolbar (appears when any row is selected) */}
                    {(selectedIds.length > 0 || totalPages > 1) && (
                        <div className={`p-2 bg-white border border-gray-200 rounded-t-lg shadow-sm flex flex-wrap items-center justify-between gap-3`}>
                            <div className='pl-2 flex gap-3 items-center'>
                                <div className="flex items-center gap-3">
                                    <CustomCheckbox
                                        checked={isAllSelected}
                                        top={true}
                                        onChange={() => handleSelectAll(!isAllSelected)}
                                    />
                                </div>
                                {selectedIds.length > 0 && <div className="flex gap-3 items-center">
                                    <div className="relative group inline-block">
                                        <button
                                            type="button"
                                            onClick={() => handleBulkStatusClick('rejected')}
                                            className="text-orange-600 hover:text-orange-800 transition p-1"
                                        >
                                            <XCircle size={18} />
                                        </button>
                                        <span className="z-50 absolute top-8 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow-md">
                                            Reject
                                        </span>
                                    </div>
                                    <div className="relative group inline-block">
                                        <button
                                            type="button"
                                            onClick={() => handleBulkStatusClick('approved')}
                                            className="text-green-600 hover:text-green-800 transition p-1"
                                        >
                                            <CheckCircle size={18} />
                                        </button>
                                        <span className="z-50 absolute top-8 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow-md">
                                            Approve
                                        </span>
                                    </div>
                                    <div className="relative group inline-block">
                                        <button
                                            type="button"
                                            onClick={() => setShowBulkDeleteModal(true)}
                                            className="text-red-600 hover:text-red-800 transition p-1"
                                        >
                                            <Trash size={18} />
                                        </button>
                                        <span className="z-50 absolute top-8 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow-md">
                                            Delete
                                        </span>
                                    </div>
                                </div>}
                            </div>
                            {totalPages > 1 && (
                                <div className="flex items-center justify-end gap-4 text-sm text-gray-600">
                                    <span>{rangeText}</span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={!hasPrev}
                                            className={`p-1 rounded-md ${hasPrev ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'
                                                }`}
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={!hasNext}
                                            className={`p-1 rounded-md ${hasNext ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'
                                                }`}
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Gmail‑style Table */}
                    <div className="bg-white rounded-b-lg shadow-sm overflow-hidden relative">
                        {tableLoading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
                            </div>
                        ) : (
                            <>
                                {filteredApplications.length >= 1 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="border-b border-gray-200">
                                                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    <th className="w-8 px-4 py-3">
                                                        <CustomCheckbox
                                                            checked={isAllSelected}
                                                            indeterminate={isIndeterminate}
                                                            onChange={() => handleSelectAll(!isAllSelected)}
                                                        />
                                                    </th>
                                                    <th className="px-4 py-3">APPLICANT NAME</th>
                                                    <th className="px-4 py-3">CONTACT</th>
                                                    <th className="px-4 py-3">BANK</th>
                                                    <th className="px-4 py-3">DATE OF APPLICATION</th>
                                                    <th className="px-4 py-3">DATE OF PAYMENT</th>
                                                    <th className="px-4 py-3">KIT DELIVERED</th>
                                                    <th className="px-4 py-3">STATUS</th>
                                                    <th className="px-4 py-3 w-20">ACTIONS</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredApplications.map((app) => (
                                                    <tr
                                                        key={app._id}
                                                        className={`group ${selectedIds.includes(app._id)
                                                            ? 'bg-yellow-50'
                                                            : 'hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <td className="px-4 py-2.5">
                                                            <CustomCheckbox
                                                                checked={selectedIds.includes(app._id)}
                                                                onChange={() => handleSelectRow(app._id)}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <div className="text-sm font-medium text-gray-900">{app.fullName}</div>
                                                            <div className="text-xs text-gray-500">
                                                                ID: {app.applicationId || app._id?.slice(-6)}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-sm text-gray-700">
                                                            {app.email || '-'}<br />
                                                            <span className="text-xs text-gray-500">{app.contactNo || '-'}</span>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-sm text-gray-700">
                                                            {app.bankName || '-'}<br />
                                                            <span className="text-xs text-gray-500">
                                                                XXXX{app.accountNo?.slice(-4) || ''}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-sm text-gray-600">{app.dateOfApplication || '-'}</td>
                                                        <td className="px-4 py-2.5 text-sm text-gray-600">{app.dateOfPayment || '-'}</td>
                                                        <td className="px-4 py-2.5 text-sm text-gray-600">{app.kit_delivered || '-'}</td>
                                                        <td className="px-4 py-2.5">
                                                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                                                                {getStatusIcon(app.status)} {app.status.toUpperCase()}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={() => handleViewDetails(app)} className="text-blue-600 hover:text-blue-800">
                                                                    <Eye size={16} />
                                                                </button>
                                                                <button onClick={() => handleEdit(app)} className="text-yellow-600 hover:text-yellow-800">
                                                                    <Edit size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="px-6 py-4 text-center text-gray-500">No applications found</div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <style jsx>{`
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #c1c1c1 #f1f1f1; }
      `}</style>

                {showDetailsModal && <DetailsModal application={selectedApplication} onClose={() => setShowDetailsModal(false)} />}
                {showStatusModal && (
                    <StatusModal
                        key={statusUpdateApp?._id}
                        show={showStatusModal}
                        onClose={() => setShowStatusModal(false)}
                        application={statusUpdateApp}
                        onUpdate={updateStatus}
                        loadingAction={loadingAction}
                        remarks={remarks}
                        setRemarks={setRemarks}
                    />
                )}
                {showDeleteModal && <DeleteConfirmationModal />}
                {showBulkDeleteModal && <BulkDeleteConfirmationModal />}
                {showBulkStatusModal && <BulkStatusModal />}
            </div>
        );
    }

    // ======================
    // Add/Edit Form View (unchanged)
    // ======================
    return (
        <div className="min-h-screen bg-gray-50">
            {notification && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white animate-slide-in`}>
                    {notification.message}
                </div>
            )}
            <div className="w-full sm:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <button onClick={() => { setCurrentView('list'); resetForm(); }} className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back to Applications
                    </button>
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{currentView === 'add' ? 'Add New Applicant' : 'Edit Application'}</h1>
                            <p className="text-gray-600 mt-1">Admin &gt; Applications &gt; {currentView === 'add' ? 'New' : `#${currentApplication.applicationId || currentApplication?._id?.slice(-6)}`}</p>
                        </div>
                    </div>
                </div>
                {currentView === 'edit' && (
                    <div className="mb-6 p-4 bg-gray-100 text-gray-800 rounded-lg">
                        <span className="font-semibold">Status: </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(formData.status)} ml-2`}>{formData.status?.toUpperCase()}</span>
                    </div>
                )}
                <div className="bg-white text-gray-800 rounded-lg shadow-sm overflow-hidden">
                    <div className="border-b border-gray-200 bg-gray-50">
                        <nav className="flex gap-1 px-6 overflow-x-auto hide-scrollbar">
                            {tabs.map((tab) => {
                                const hasError = tabErrors[tab] && Object.keys(tabErrors[tab]).length > 0;
                                return (
                                    <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`px-4 py-3 text-sm font-medium transition border-b-2 whitespace-nowrap ${activeTab === tab ? 'border-yellow-600 text-yellow-600' : hasError ? 'border-red-500 text-red-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                        {tab === 'personal' && 'Personal Details'}
                                        {tab === 'emergency' && 'Emergency Contact'}
                                        {tab === 'employment' && 'Employment Details'}
                                        {tab === 'bank' && 'Bank Details'}
                                        {tab === 'signatures' && 'Signatures'}
                                        {tab === 'declaration' && 'Declaration'}
                                        {hasError && <span className="ml-1 text-red-500">⚠️</span>}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6">
                        {activeTab === 'personal' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField label="Application ID" name="applicationId" placeholder="Application ID" value={formData.applicationId} onChange={handleChange} required={false} />
                                    <UserSelect users={usersList} value={(formData.referredById || "").trim()} onChange={handleChange} loading={loadingUsers} required={true} label="Referred By" />
                                    <InputField label="Full Name" name="fullName" placeholder="Enter full name" value={formData.fullName} onChange={handleChange} validation="name" required maxLength={100} />
                                    <InputField label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} validation="dob" required={false} />
                                    <InputField label="Father's/Husband's Name" name="fatherName" placeholder="Father's or husband's name" value={formData.fatherName} onChange={handleChange} validation="name" required={false} />
                                    <InputField label="Blood Group" name="bloodGroup" placeholder="e.g., A+, B+, O+" value={formData.bloodGroup} onChange={handleChange} required={false} />
                                    <InputField label="Address" name="address" placeholder="Complete address" value={formData.address} onChange={handleChange} required={false} maxLength={200} />
                                    <InputField label="Contact Number" name="contactNo" type="tel" placeholder="9876543210" value={formData.contactNo} onChange={handleChange} validation="mobile" required={false} maxLength={10} />
                                    <InputField label="Email ID" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} validation="email" required={false} />
                                    <InputField label="Pin Code" name="pinCode" placeholder="Pincode" value={formData.pinCode} onChange={handleChange} validation="pincode" required={false} maxLength={6} />
                                    <InputField label="PAN Number" name="panNumber" placeholder="ABCDE1234F" value={formData.panNumber} onChange={handleChange} validation="pan" required={false} maxLength={10} />
                                    <InputField label="Aadhar Number" name="aadharNumber" placeholder="123456789012" value={formData.aadharNumber} onChange={handleChange} validation="aadhar" required={false} maxLength={12} />
                                </div>
                            </div>
                        )}
                        {activeTab === 'emergency' && (
                            <div>
                                <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-gray-900">Emergency Contact Details</h3>{formData.emergencyContacts.length < 5 && <button type="button" onClick={addEmergencyContact} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm">+ Add More Contact</button>}</div>
                                <p className="text-sm text-gray-500 mb-4">You can add up to 5 contacts (optional).</p>
                                {formData.emergencyContacts.map((contact, index) => (<EmergencyContact key={index} index={index} contact={contact} onChange={handleEmergencyContactChange} onRemove={removeEmergencyContact} canRemove={formData.emergencyContacts.length > 1} />))}
                            </div>
                        )}
                        {activeTab === 'employment' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Employment Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField label="Company Name" name="previousCompany" placeholder="Previous company name" value={formData.previousCompany} onChange={handleChange} required={false} />
                                    <InputField label="Designation" name="previousDesignation" placeholder="Job title/designation" value={formData.previousDesignation} onChange={handleChange} required={false} />
                                    <InputField label="Educational Qualification" name="educationalQualification" placeholder="Highest educational qualification" value={formData.educationalQualification} onChange={handleChange} required={false} />
                                </div>
                                <div className="mt-6"><RadioGroup label="Any Legal Cases Pending Till Date" name="legalCasesPending" options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} value={formData.legalCasesPending} onChange={handleChange} required={false} /></div>
                            </div>
                        )}
                        {activeTab === 'bank' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Account Details</h3>
                                <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded"><p className="text-sm text-yellow-800"><span className="font-semibold">Note:</span> Please ensure all bank details are correct. Payments will be processed to the provided bank account.</p></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField label="Name as per Bank" name="nameAsPerBank" placeholder="Name exactly as in bank account" value={formData.nameAsPerBank} onChange={handleChange} validation="name" required={false} />
                                    <InputField label="Bank Name" name="bankName" placeholder="Name of the bank" value={formData.bankName} onChange={handleChange} required={false} />
                                    <InputField label="Account Number" name="accountNo" placeholder="Bank account number" value={formData.accountNo} onChange={handleChange} validation="accountNo" required={false} maxLength={18} />
                                    <InputField label="IFSC Code" name="ifscCode" placeholder="IFSC code (e.g., SBIN0012345)" value={formData.ifscCode} onChange={handleChange} validation="ifsc" required={false} maxLength={11} />
                                    <InputField label="Branch" name="branch" placeholder="Bank branch name" value={formData.branch} onChange={handleChange} required={false} />
                                    <InputField label="City" name="bankCity" placeholder="Bank branch city" value={formData.bankCity} onChange={handleChange} validation="name" required={false} />
                                </div>
                            </div>
                        )}
                        {activeTab === 'signatures' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Digital Signatures</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <DigitalSignature label="Applicant Signature" name="applicantSignature" value={formData.applicantSignature} onChange={handleChange} required={false} />
                                    <DigitalSignature label="Referrer Signature" name="referrerSignature" value={formData.referrerSignature} onChange={handleChange} required={false} />
                                </div>
                            </div>
                        )}
                        {activeTab === 'declaration' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Declaration</h3>
                                <TextArea label="Declaration Note" name="declarationNote" placeholder="Enter any additional declaration notes here..." value={formData.declarationNote} onChange={handleChange} required={false} rows={5} />
                                <Checkbox label="I hereby declare that the above mentioned information is correct to my knowledge and I bear the responsibility for the correctness of the above mentioned information." name="declaration" checked={formData.declaration} onChange={handleChange} required={false} description="Please read and accept the declaration." />
                            </div>
                        )}
                        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between">
                            <button type="button" onClick={handlePreviousTab} disabled={currentTabIndex === 0} className={`px-6 py-2 rounded-lg transition ${currentTabIndex === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-600 text-white hover:bg-gray-700'}`}>Previous</button>
                            <div className="flex gap-4">
                                {!isLastTab ? (
                                    <button type="button" onClick={handleNextTab} disabled={!isCurrentTabValid()} className={`px-6 py-2 rounded-lg transition ${!isCurrentTabValid() ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-yellow-600 text-white hover:bg-yellow-700'}`}>Next</button>
                                ) : (
                                    <>
                                        <button type="button" onClick={handleShowPreview} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">Show Preview</button>
                                        <button type="submit" disabled={isLoading} className={`px-6 py-2 bg-yellow-600 text-white rounded-lg transition ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-yellow-700'}`}>{isLoading ? 'Saving...' : currentView === 'add' ? 'Create Application' : 'Update Application'}</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
                {showPreview && <PreviewSection />}
                {showDeleteModal && <DeleteConfirmationModal />}
            </div>
            <style jsx>{`
                @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                .animate-slide-in { animation: slide-in 0.3s ease-out; }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
                .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #c1c1c1 #f1f1f1; }
            `}</style>
        </div>
    );
}