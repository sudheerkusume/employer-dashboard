// app/page.js
'use client';

import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Check, ChevronsUpDown, } from 'lucide-react';
import { Combobox } from '@headlessui/react';

// ======================
// Date Picker Dropdown Component
// ======================
const DatePickerDropdown = memo(({ currentDate, onSelect, onClose }) => {
    const [selectedDate, setSelectedDate] = useState(currentDate ? new Date(currentDate) : new Date());
    const [viewMonth, setViewMonth] = useState(currentDate ? new Date(currentDate) : new Date());
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        return { daysInMonth, startingDayOfWeek };
    };

    const handleDateSelect = (day) => {
        const newDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
        setSelectedDate(newDate);
        onSelect(newDate);
    };

    const handlePrevMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
    const handleNextMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
    const handlePrevYear = () => setViewMonth(new Date(viewMonth.getFullYear() - 1, viewMonth.getMonth(), 1));
    const handleNextYear = () => setViewMonth(new Date(viewMonth.getFullYear() + 1, viewMonth.getMonth(), 1));

    const isToday = (day) => {
        const today = new Date();
        return day === today.getDate() &&
            viewMonth.getMonth() === today.getMonth() &&
            viewMonth.getFullYear() === today.getFullYear();
    };

    const isSelected = (day) => {
        return selectedDate &&
            day === selectedDate.getDate() &&
            viewMonth.getMonth() === selectedDate.getMonth() &&
            viewMonth.getFullYear() === selectedDate.getFullYear();
    };

    const renderCalendar = () => {
        const { daysInMonth, startingDayOfWeek } = getDaysInMonth(viewMonth);
        const days = [];
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="h-10"></div>);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const isTodayDate = isToday(day);
            const isSelectedDate = isSelected(day);
            days.push(
                <button
                    key={day}
                    onClick={() => handleDateSelect(day)}
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
    };

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return (
        <div ref={dropdownRef} className="absolute w-full top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-80">
            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">Select Date of Birth</h3>
                    <div className="w-6"></div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1"><X size={18} /></button>
                </div>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-1">
                        <button onClick={handlePrevYear} className="p-1.5 hover:bg-gray-100 rounded transition"><ChevronsLeft size={16} /></button>
                        <button onClick={handlePrevMonth} className="p-1.5 hover:bg-gray-100 rounded transition"><ChevronLeft size={16} /></button>
                    </div>
                    <div className="text-center"><span className="text-sm font-semibold">{monthNames[viewMonth.getMonth()]} {viewMonth.getFullYear()}</span></div>
                    <div className="flex gap-1">
                        <button onClick={handleNextMonth} className="p-1.5 hover:bg-gray-100 rounded transition"><ChevronRight size={16} /></button>
                        <button onClick={handleNextYear} className="p-1.5 hover:bg-gray-100 rounded transition"><ChevronsRight size={16} /></button>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
                <div className="mt-4 pt-4 border-t flex gap-2">
                    <button onClick={() => { const today = new Date(); setSelectedDate(today); onSelect(today); }} className="flex-1 px-2 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Today</button>
                    <button onClick={() => { const date = new Date(); date.setFullYear(date.getFullYear() - 18); setSelectedDate(date); onSelect(date); }} className="flex-1 px-2 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Set 18 Years</button>
                    <button onClick={() => { const date = new Date(); date.setFullYear(date.getFullYear() - 60); setSelectedDate(date); onSelect(date); }} className="flex-1 px-2 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Set 60 Years</button>
                </div>
            </div>
        </div>
    );
});
DatePickerDropdown.displayName = 'DatePickerDropdown';

// ======================
// InputField Component
// ======================
const InputField = memo(({ label, name, type = 'text', required = false, placeholder = '', value, onChange, validation = 'none', maxLength, pattern, errorMessage }) => {
    const [error, setError] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [touched, setTouched] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    const validateField = (val) => {
        // Only required validation for fullName (name field)
        if (required && !val && touched) {
            setError(`${label} is required`);
            return false;
        }
        // Format validations only if value provided
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
                        <input type="text" id={name} name={name} value={formatDisplayDate(value)} onFocus={toggleDatePicker} onChange={() => { }} onBlur={handleBlur} required={required} placeholder={placeholder || 'DD/MM/YYYY'} readOnly
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors outline-none cursor-pointer bg-white pr-10 ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                        <button type="button" onClick={toggleDatePicker} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"><Calendar size={18} /></button>
                    </div>
                    {showDatePicker && <DatePickerDropdown currentDate={value} onSelect={handleDateSelect} onClose={() => setShowDatePicker(false)} />}
                </div>
            ) : (
                <input type={type} id={name} name={name} value={value} onChange={handleChange} onBlur={handleBlur} onFocus={handleFocus} required={required} placeholder={placeholder} maxLength={maxLength} pattern={pattern}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors outline-none ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
            )}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
});
InputField.displayName = 'InputField';

// ======================
// Radio Group Component
// ======================
const RadioGroup = memo(({ label, name, options, value, onChange, required = false }) => {
    const [error, setError] = useState('');
    const handleChange = (e) => {
        const syntheticEvent = { target: { name, value: e.target.value, type: 'radio' } };
        onChange(syntheticEvent);
        if (required && !e.target.value) setError(`${label} is required`);
        else setError('');
    };
    return (
        <div className="mb-4 flex gap-5 items-center">
            <label className="block text-sm font-medium text-gray-700">{label} {required && <span className="text-red-500">*</span>}</label>
            <div className="flex gap-4">
                {options.map(option => (
                    <label key={option.value} className="flex gap-2 items-center">
                        <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={handleChange} className="w-4 h-4 text-yellow-600 focus:ring-yellow-500" />
                        <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                ))}
            </div>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
});
RadioGroup.displayName = 'RadioGroup';

// ======================
// TextArea Component
// ======================
const TextArea = memo(({ label, name, value, onChange, required = false, placeholder = '', rows = 4 }) => {
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
            <textarea id={name} name={name} value={value} onChange={handleChange} onBlur={handleBlur} placeholder={placeholder} rows={rows}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors outline-none ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
});
TextArea.displayName = 'TextArea';

// ======================
// Checkbox Component
// ======================
const Checkbox = memo(({ label, name, checked, onChange, required = false, description = '' }) => {
    const [error, setError] = useState('');
    const handleChange = (e) => {
        const syntheticEvent = { target: { name, checked: e.target.checked, type: 'checkbox' } };
        onChange(syntheticEvent);
        if (required && !e.target.checked) setError(`${label} is required`);
        else setError('');
    };
    const handleBlur = () => { if (required && !checked) setError(`${label} is required`); };
    return (
        <div className="mb-4">
            <label className="flex items-start space-x-3 cursor-pointer">
                <input type="checkbox" name={name} checked={checked} onChange={handleChange} onBlur={handleBlur} required={required} className="mt-1 w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500" />
                <div className="flex-1">
                    <span className="text-gray-700 text-sm">{label} {required && <span className="text-red-500">*</span>}</span>
                    {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
                </div>
            </label>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
});
Checkbox.displayName = 'Checkbox';

// ======================
// Digital Signature Component
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
// Emergency Contact Component
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
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [activeTab, setActiveTab] = useState('personal');
    const [showPreview, setShowPreview] = useState(false);
    const [tabErrors, setTabErrors] = useState({});

    const tabs = ['personal', 'emergency', 'employment', 'bank', 'signatures', 'declaration'];
    const currentTabIndex = tabs.indexOf(activeTab);
    const isLastTab = currentTabIndex === tabs.length - 1;
    const [usersList, setUsersList] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
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
        referredBy: "",
        status: 'pending',
    });

    useEffect(() => {
        fetchUsers();
    }, []);

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

    const UserSelect = ({ users, value, onChange, loading, required = true, label = "Referred By" }) => {
        const [query, setQuery] = useState('');

        const filteredUsers = query === ''
            ? users
            : users.filter(user =>
                user.fullName.toLowerCase().includes(query.toLowerCase()) ||
                user.userCode.toLowerCase().includes(query.toLowerCase())
            );

        const selectedUser = users.find(user => user.userCode === value) || null;

        const handleChange = (user) => {
            onChange({ target: { name: 'referredBy', value: user ? user.userCode : '', type: 'select-one' } });
            setFormData(prev => ({ ...prev, referredBy: user.applicationId || user.userCode }));
        };

        // Optional: Clear selection button
        const handleClear = (e) => {
            e.stopPropagation();
            handleChange(null);
            setQuery('');
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
                            <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-300 focus-within:ring-2 focus-within:ring-yellow-500 focus-within:border-yellow-500">
                                <Combobox.Input
                                    className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 outline-none"
                                    displayValue={(user) => {
                                        if (!user) return '';
                                        const base = user.fullName;
                                        const code = user.userCode || user.mlmUserCode;
                                        return code ? `${base} (${code})` : base;
                                    }}
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
                                            key={user.userCode}
                                            className={({ active }) =>
                                                `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-yellow-100 text-yellow-900' : 'text-gray-900'
                                                }`
                                            }
                                            value={user}
                                        >
                                            {({ selected, active }) => (
                                                <>
                                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                        {`${user.fullName} ${user.userCode && `(${user.userCode})`}`}
                                                    </span>
                                                    {selected && (
                                                        <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-yellow-600' : 'text-yellow-600'}`}>
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

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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

    // Validation functions (only fullName required)
    const validatePersonalTab = useCallback(() => {
        const errors = {};
        if (!formData.fullName) errors.fullName = 'Full Name is required';
        // Format validations only if value exists
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
        // No required fields – only format checks on provided values
        formData.emergencyContacts.forEach((contact, idx) => {
            if (contact.phone && !/^[0-9]{10}$/.test(contact.phone)) errors[`emergencyPhone_${idx}`] = 'Please enter a valid 10-digit phone number';
        });
        return errors;
    }, [formData.emergencyContacts]);

    const validateEmploymentTab = useCallback(() => {
        const errors = {};
        // No required fields
        return errors;
    }, []);

    const validateBankTab = useCallback(() => {
        const errors = {};
        if (formData.accountNo && !/^[0-9]{9,18}$/.test(formData.accountNo)) errors.accountNo = 'Account number should be 9-18 digits only';
        if (formData.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.toUpperCase())) errors.ifscCode = 'Please enter a valid IFSC code';
        return errors;
    }, [formData.accountNo, formData.ifscCode]);

    const validateSignaturesTab = useCallback(() => {
        const errors = {};
        // No required fields
        return errors;
    }, []);

    const validateDeclarationTab = useCallback(() => {
        const errors = {};
        // No required fields
        return errors;
    }, []);

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
        setTabErrors(prev => {
            const currentErrors = prev[activeTab] || {};
            if (JSON.stringify(currentErrors) !== JSON.stringify(errors)) return { ...prev, [activeTab]: errors };
            return prev;
        });
    }, [getCurrentTabErrors, activeTab]);

    const isCurrentTabValid = useCallback(() => {
        // Only personal tab has required field (fullName), others are always valid (no required fields)
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

    const handleShowPreview = () => {
        // No validation – preview is always allowed
        setShowPreview(true);
    };

    const handleClosePreview = () => setShowPreview(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Only require fullName
        if (!formData.fullName) {
            showNotification('error', 'Full Name is required');
            return;
        }
        // No other required checks

        setIsLoading(true);
        try {
            const url = '/api/application';
            const method = 'POST';
            const body = { ...formData };
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const data = await response.json();
            if (data.success) {
                showNotification('success', 'Register Successfully!');
                setShowPreview(false);
                resetForm();
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


    const resetForm = () => {
        setFormData({
            applicationId: '', fullName: '', dob: '', fatherName: '', bloodGroup: '', address: '', contactNo: '', email: '', pinCode: '', panNumber: '', aadharNumber: '',
            emergencyContacts: [{ name: '', location: '', phone: '', relationship: '' }],
            previousCompany: '', previousDesignation: '', educationalQualification: '', legalCasesPending: '',
            nameAsPerBank: '', bankName: '', accountNo: '', ifscCode: '', branch: '', bankCity: '',
            declarationNote: '', declaration: false, referrerSignature: '', applicantSignature: '', referredBy: '', status: 'pending',
        });
        setActiveTab('personal');
        setShowPreview(false);
    };


    const PreviewSection = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white text-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center rounded-t-lg">
                    <h2 className="text-xl font-bold text-gray-900">Application Preview</h2>
                    <button onClick={handleClosePreview} className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"><X size={24} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {/* Personal Details */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Personal Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <p><strong>Application ID:</strong> {formData.applicationId || 'Not provided'}</p>
                            <p><strong>Referred By:</strong> {formData.referredBy || 'Not provided'}</p>
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
                    {/* Emergency Contacts */}
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
                    {/* Previous Employment */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Previous Employment Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <p><strong>Company Name:</strong> {formData.previousCompany || 'Not provided'}</p>
                            <p><strong>Designation:</strong> {formData.previousDesignation || 'Not provided'}</p>
                            <p><strong>Educational Qualification:</strong> {formData.educationalQualification || 'Not provided'}</p>
                        </div>
                    </div>
                    {/* Legal Cases */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Legal Cases</h3>
                        <p><strong>Any Legal Cases Pending:</strong> {formData.legalCasesPending === 'yes' ? 'Yes' : formData.legalCasesPending === 'no' ? 'No' : 'Not provided'}</p>
                    </div>
                    {/* Bank Details */}
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
                    {/* Declaration */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Declaration</h3>
                        <p><strong>Note:</strong> {formData.declarationNote || 'Not provided'}</p>
                        <p className="mt-2"><strong>Declaration Accepted:</strong> {formData.declaration ? 'Yes' : 'No'}</p>
                    </div>
                    {/* Signatures */}
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

    // ======================
    // Form View
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
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-gray-900">{'Register Here'}</h1>
                    </div>
                </div>
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
                        {/* Personal Tab */}
                        {activeTab === 'personal' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField label="Application ID" name="applicationId" placeholder="Application ID" value={formData.applicationId} onChange={handleChange} required={false} />
                                    <UserSelect
                                        users={usersList}
                                        value={formData.referredBy}
                                        onChange={handleChange}
                                        loading={loadingUsers}
                                        required={true}
                                        label="Referred By"
                                    />
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
                        {/* Emergency Tab */}
                        {activeTab === 'emergency' && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Emergency Contact Details</h3>
                                    {formData.emergencyContacts.length < 5 && <button type="button" onClick={addEmergencyContact} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm">+ Add</button>}
                                </div>
                                <p className="text-sm text-gray-500 mb-4">You can add up to 5 contacts (optional).</p>
                                {formData.emergencyContacts.map((contact, index) => (
                                    <EmergencyContact key={index} index={index} contact={contact} onChange={handleEmergencyContactChange} onRemove={removeEmergencyContact} canRemove={formData.emergencyContacts.length > 1} />
                                ))}
                            </div>
                        )}
                        {/* Employment Tab */}
                        {activeTab === 'employment' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Employment Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField label="Company Name" name="previousCompany" placeholder="Previous company name" value={formData.previousCompany} onChange={handleChange} required={false} />
                                    <InputField label="Designation" name="previousDesignation" placeholder="Job title/designation" value={formData.previousDesignation} onChange={handleChange} required={false} />
                                    <InputField label="Educational Qualification" name="educationalQualification" placeholder="Highest educational qualification" value={formData.educationalQualification} onChange={handleChange} required={false} />
                                </div>
                                <div className="mt-6">
                                    <RadioGroup label="Any Legal Cases Pending Till Date" name="legalCasesPending" options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} value={formData.legalCasesPending} onChange={handleChange} required={false} />
                                </div>
                            </div>
                        )}
                        {/* Bank Tab */}
                        {activeTab === 'bank' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Account Details</h3>
                                <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                                    <p className="text-sm text-yellow-800"><span className="font-semibold">Note:</span> Please ensure all bank details are correct. Payments will be processed to the provided bank account.</p>
                                </div>
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
                        {/* Signatures Tab */}
                        {activeTab === 'signatures' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Digital Signatures</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <DigitalSignature label="Applicant Signature" name="applicantSignature" value={formData.applicantSignature} onChange={handleChange} required={false} />
                                    <DigitalSignature label="Referrer Signature" name="referrerSignature" value={formData.referrerSignature} onChange={handleChange} required={false} />
                                </div>
                            </div>
                        )}
                        {/* Declaration Tab */}
                        {activeTab === 'declaration' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Declaration</h3>
                                <TextArea label="Declaration Note" name="declarationNote" placeholder="Enter any additional declaration notes here..." value={formData.declarationNote} onChange={handleChange} required={false} rows={5} />
                                <Checkbox label="I hereby declare that the above mentioned information is correct to my knowledge and I bear the responsibility for the correctness of the above mentioned information." name="declaration" checked={formData.declaration} onChange={handleChange} required={false} description="(Optional) Please read and accept the declaration." />
                            </div>
                        )}
                        {/* Navigation Buttons */}
                        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between">
                            <button type="button" onClick={handlePreviousTab} disabled={currentTabIndex === 0} className={`px-6 py-2 rounded-lg transition ${currentTabIndex === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-600 text-white hover:bg-gray-700'}`}>
                                Previous
                            </button>
                            <div className="flex gap-4">
                                {!isLastTab ? (
                                    <button type="button" onClick={handleNextTab} disabled={!isCurrentTabValid()} className={`px-6 py-2 rounded-lg transition ${!isCurrentTabValid() ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-yellow-600 text-white hover:bg-yellow-700'}`}>
                                        Next
                                    </button>
                                ) : (
                                    <>
                                        <button type="button" onClick={handleShowPreview} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                                            Show Preview
                                        </button>
                                        <button type="submit" disabled={isLoading} className={`px-6 py-2 bg-yellow-600 text-white rounded-lg transition ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-yellow-700'}`}>
                                            {isLoading ? 'Saving...' : 'Save'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
                {showPreview && <PreviewSection />}
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