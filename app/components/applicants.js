// app/page.js
'use client';

import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';

import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from 'lucide-react';

// Date Picker Dropdown Component
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

    const handlePrevMonth = () => {
        setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
    };

    const handlePrevYear = () => {
        setViewMonth(new Date(viewMonth.getFullYear() - 1, viewMonth.getMonth(), 1));
    };

    const handleNextYear = () => {
        setViewMonth(new Date(viewMonth.getFullYear() + 1, viewMonth.getMonth(), 1));
    };

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

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <div ref={dropdownRef} className="absolute w-full top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-80">
            <div className="p-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">Select Date of Birth</h3>
                    <div className="w-6"></div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition p-1"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Year and Month Navigation */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-1">
                        <button
                            onClick={handlePrevYear}
                            className="p-1.5 hover:bg-gray-100 rounded transition"
                            title="Previous Year"
                        >
                            <ChevronsLeft size={16} />
                        </button>
                        <button
                            onClick={handlePrevMonth}
                            className="p-1.5 hover:bg-gray-100 rounded transition"
                            title="Previous Month"
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
                            onClick={handleNextMonth}
                            className="p-1.5 hover:bg-gray-100 rounded transition"
                            title="Next Month"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            onClick={handleNextYear}
                            className="p-1.5 hover:bg-gray-100 rounded transition"
                            title="Next Year"
                        >
                            <ChevronsRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {renderCalendar()}
                </div>

                {/* Quick Actions */}
                <div className="mt-4 pt-4 border-t flex gap-2">
                    <button
                        onClick={() => {
                            const today = new Date();
                            setSelectedDate(today);
                            onSelect(today);
                        }}
                        className="flex-1 px-2 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => {
                            const date = new Date();
                            date.setFullYear(date.getFullYear() - 18);
                            setSelectedDate(date);
                            onSelect(date);
                        }}
                        className="flex-1 px-2 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                    >
                        Set 18 Years
                    </button>
                    <button
                        onClick={() => {
                            const date = new Date();
                            date.setFullYear(date.getFullYear() - 60);
                            setSelectedDate(date);
                            onSelect(date);
                        }}
                        className="flex-1 px-2 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                    >
                        Set 60 Years
                    </button>
                </div>
            </div>
        </div>
    );
});

DatePickerDropdown.displayName = 'DatePickerDropdown';

// Memoized InputField component with validation and date picker
const InputField = memo(({
    label,
    name,
    type = 'text',
    required = true,
    placeholder = '',
    value,
    onChange,
    validation = 'none',
    maxLength,
    pattern,
    errorMessage
}) => {
    const [error, setError] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);

    const validateField = (value) => {
        if (!required && !value) {
            setError('');
            return true;
        }

        if (required && !value) {
            setError(`${label} is required`);
            return false;
        }

        switch (validation) {
            case 'mobile':
                const mobileRegex = /^[0-9]{10}$/;
                if (!mobileRegex.test(value)) {
                    setError('Please enter a valid 10-digit mobile number');
                    return false;
                }
                setError('');
                return true;

            case 'email':
                const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    setError('Please enter a valid email address');
                    return false;
                }
                setError('');
                return true;

            case 'name':
                const nameRegex = /^[A-Za-z\s\-]+$/;
                if (!nameRegex.test(value)) {
                    setError('Name should only contain letters, spaces, and hyphens');
                    return false;
                }
                if (value.length < 2) {
                    setError('Name must be at least 2 characters');
                    return false;
                }
                setError('');
                return true;

            case 'pincode':
                const pincodeRegex = /^[0-9]{6}$/;
                if (!pincodeRegex.test(value)) {
                    setError('Please enter a valid 6-digit pincode');
                    return false;
                }
                setError('');
                return true;

            case 'ifsc':
                const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
                if (!ifscRegex.test(value)) {
                    setError('Please enter a valid IFSC code (e.g., SBIN0012345)');
                    return false;
                }
                setError('');
                return true;

            case 'accountNo':
                const accountRegex = /^[0-9]{9,18}$/;
                if (!accountRegex.test(value)) {
                    setError('Account number should be 9-18 digits only');
                    return false;
                }
                setError('');
                return true;

            case 'aadhar':
                const aadharRegex = /^[0-9]{12}$/;
                if (!aadharRegex.test(value)) {
                    setError('Please enter a valid 12-digit Aadhar number');
                    return false;
                }
                setError('');
                return true;

            case 'pan':
                const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
                if (!panRegex.test(value)) {
                    setError('Please enter a valid PAN card number (e.g., ABCDE1234F)');
                    return false;
                }
                setError('');
                return true;

            case 'dob':
                if (value) {
                    const dobDate = new Date(value);
                    const today = new Date();
                    let age = today.getFullYear() - dobDate.getFullYear();
                    const monthDiff = today.getMonth() - dobDate.getMonth();
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
                        age--;
                    }
                    if (age < 18) {
                        setError('Age must be 18 years or above');
                        return false;
                    }
                }
                setError('');
                return true;

            default:
                setError('');
                return true;
        }
    };

    const handleChange = (e) => {
        let newValue = e.target.value;

        switch (validation) {
            case 'mobile':
            case 'pincode':
            case 'accountNo':
            case 'aadhar':
                newValue = newValue.replace(/[^0-9]/g, '');
                if (maxLength && newValue.length > maxLength) newValue = newValue.slice(0, maxLength);
                break;

            case 'ifsc':
                newValue = newValue.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (maxLength && newValue.length > maxLength) newValue = newValue.slice(0, maxLength);
                break;

            case 'pan':
                newValue = newValue.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (maxLength && newValue.length > maxLength) newValue = newValue.slice(0, maxLength);
                break;

            case 'name':
                newValue = newValue.replace(/[^A-Za-z\s\-]/g, '');
                break;
        }

        const syntheticEvent = {
            target: {
                name,
                value: newValue,
                type: e.target.type,
                checked: e.target.checked
            }
        };

        onChange(syntheticEvent);

        if (required || newValue) {
            validateField(newValue);
        }
    };

    const handleDateSelect = (date) => {
        const formattedDate = date.toISOString().split('T')[0];
        const syntheticEvent = {
            target: {
                name,
                value: formattedDate,
                type: 'date'
            }
        };
        onChange(syntheticEvent);
        validateField(formattedDate);
        setShowDatePicker(false);
    };

    const handleBlur = (e) => {
        if (required && !value) {
            setError(`${label} is required`);
        } else if (value) {
            validateField(value);
        }
    };

    const toggleDatePicker = () => {
        setShowDatePicker(!showDatePicker);
    };

    // Format date for display
    const formatDisplayDate = (dateValue) => {
        if (!dateValue) return '';
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return dateValue;
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="mb-4">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            {validation === 'dob' ? (
                <div className="relative">
                    <div className="relative">
                        <input
                            type="text"
                            id={name}
                            name={name}
                            value={formatDisplayDate(value)}
                            onFocus={toggleDatePicker}
                            onChange={() => { }} // Read-only, handled by date picker
                            onBlur={handleBlur}
                            required={required}
                            placeholder={placeholder || 'DD/MM/YYYY'}
                            readOnly
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors outline-none cursor-pointer bg-white pr-10
                                ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                        />
                        <button
                            type="button"
                            onClick={toggleDatePicker}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                        >
                            <Calendar size={18} />
                        </button>
                    </div>

                    {showDatePicker && (
                        <DatePickerDropdown
                            currentDate={value}
                            onSelect={handleDateSelect}
                            onClose={() => setShowDatePicker(false)}
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
                    required={required}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    pattern={pattern}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors outline-none
                        ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
            )}

            {error && (
                <p className="mt-1 text-xs text-red-600">{error}</p>
            )}
        </div>
    );
});

InputField.displayName = 'InputField';

// Radio Button Component
const RadioGroup = memo(({ label, name, options, value, onChange, required = true }) => {
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const syntheticEvent = {
            target: {
                name,
                value: e.target.value,
                type: 'radio'
            }
        };
        onChange(syntheticEvent);
        if (required && !e.target.value) {
            setError(`${label} is required`);
        } else {
            setError('');
        }
    };

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex gap-4">
                {options.map((option) => (
                    <label key={option.value} className="flex items-center space-x-2">
                        <input
                            type="radio"
                            name={name}
                            value={option.value}
                            checked={value === option.value}
                            onChange={handleChange}
                            className="w-4 h-4 text-yellow-600 focus:ring-yellow-500"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                ))}
            </div>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
});

RadioGroup.displayName = 'RadioGroup';

// TextArea Component
const TextArea = memo(({ label, name, value, onChange, required = false, placeholder = '', rows = 4 }) => {
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const syntheticEvent = {
            target: {
                name,
                value: e.target.value,
                type: 'textarea'
            }
        };
        onChange(syntheticEvent);

        if (required && !e.target.value) {
            setError(`${label} is required`);
        } else {
            setError('');
        }
    };

    const handleBlur = (e) => {
        if (required && !value) {
            setError(`${label} is required`);
        }
    };

    return (
        <div className="mb-4">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <textarea
                id={name}
                name={name}
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                rows={rows}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors outline-none
                    ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
});

TextArea.displayName = 'TextArea';

// Reusable Checkbox Component
const Checkbox = memo(({ label, name, checked, onChange, required = false, description = '' }) => {
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const syntheticEvent = {
            target: {
                name,
                checked: e.target.checked,
                type: 'checkbox'
            }
        };
        onChange(syntheticEvent);

        if (required && !e.target.checked) {
            setError(`${label} is required`);
        } else {
            setError('');
        }
    };

    const handleBlur = () => {
        if (required && !checked) {
            setError(`${label} is required`);
        }
    };

    return (
        <div className="mb-4">
            <label className="flex items-start space-x-3 cursor-pointer">
                <input
                    type="checkbox"
                    name={name}
                    checked={checked}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required={required}
                    className="mt-1 w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                />
                <div className="flex-1">
                    <span className="text-gray-700 text-sm">
                        {label} {required && <span className="text-red-500">*</span>}
                    </span>
                    {description && (
                        <p className="text-xs text-gray-500 mt-1">{description}</p>
                    )}
                </div>
            </label>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
});

Checkbox.displayName = 'Checkbox';

// Digital Signature Component
const DigitalSignature = memo(({ label, name, value, onChange, required = false }) => {
    const [signatureMethod, setSignatureMethod] = useState('draw');
    const [isDrawing, setIsDrawing] = useState(false);
    const [error, setError] = useState('');
    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const fileInputRef = useRef(null);

    // Initialize canvas when in draw mode
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

            // Clear canvas
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // If there's existing signature data from upload mode, load it
            if (value && value.startsWith('data:image')) {
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                };
                img.src = value;
            }
        }
    }, [signatureMethod, value]);

    const startDrawing = (e) => {
        if (!canvasRef.current) return;
        e.preventDefault();
        setIsDrawing(true);
        const { offsetX, offsetY } = getCoordinates(e);
        ctxRef.current.beginPath();
        ctxRef.current.moveTo(offsetX, offsetY);
    };

    const draw = (e) => {
        if (!isDrawing || !canvasRef.current) return;
        e.preventDefault();
        const { offsetX, offsetY } = getCoordinates(e);
        ctxRef.current.lineTo(offsetX, offsetY);
        ctxRef.current.stroke();
    };

    const stopDrawing = () => {
        if (!canvasRef.current) return;
        setIsDrawing(false);
        ctxRef.current.beginPath();
        // Save canvas data
        const canvasData = canvasRef.current.toDataURL();
        const syntheticEvent = {
            target: {
                name,
                value: canvasData,
                type: 'signature'
            }
        };
        onChange(syntheticEvent);
    };

    const getCoordinates = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { offsetX: 0, offsetY: 0 };

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        let clientX, clientY;

        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const offsetX = (clientX - rect.left) * scaleX;
        const offsetY = (clientY - rect.top) * scaleY;

        // Clamp values to canvas boundaries
        return {
            offsetX: Math.max(0, Math.min(offsetX, canvas.width)),
            offsetY: Math.max(0, Math.min(offsetY, canvas.height))
        };
    };

    const clearSignature = () => {
        if (signatureMethod === 'draw' && canvasRef.current) {
            // Clear canvas
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();

            // Clear the value in form data
            const syntheticEvent = {
                target: {
                    name,
                    value: '',
                    type: 'signature'
                }
            };
            onChange(syntheticEvent);
        } else if (signatureMethod === 'upload') {
            // Clear uploaded file
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            const syntheticEvent = {
                target: {
                    name,
                    value: '',
                    type: 'signature'
                }
            };
            onChange(syntheticEvent);
        }
        setError('');
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                setError('File size should be less than 2MB');
                return;
            }

            // Check file type
            if (!file.type.startsWith('image/')) {
                setError('Please upload an image file');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const syntheticEvent = {
                    target: {
                        name,
                        value: event.target.result,
                        type: 'signature'
                    }
                };
                onChange(syntheticEvent);
                setError('');
            };
            reader.onerror = () => {
                setError('Failed to read file');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleMethodToggle = (method) => {
        if (method === 'draw') {
            setSignatureMethod('draw');
            // If there's existing uploaded signature, keep it in state but canvas will load it
        } else if (method === 'upload') {
            setSignatureMethod('upload');
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

            <div className="flex gap-4 mb-3">
                <button
                    type="button"
                    onClick={() => handleMethodToggle('draw')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition ${signatureMethod === 'draw'
                        ? 'bg-yellow-600 text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    ✍️ Draw Signature
                </button>
                <button
                    type="button"
                    onClick={() => handleMethodToggle('upload')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition ${signatureMethod === 'upload'
                        ? 'bg-yellow-600 text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    📁 Upload Signature
                </button>
            </div>

            {signatureMethod === 'draw' ? (
                <div>
                    <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-inner">
                        <canvas
                            ref={canvasRef}
                            className="w-full cursor-crosshair"
                            style={{ height: '200px', width: '100%' }}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        />
                    </div>
                    <div className="flex gap-2 mt-3">
                        <button
                            type="button"
                            onClick={clearSignature}
                            className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition shadow-sm"
                        >
                            🗑️ Clear
                        </button>
                        <p className="text-xs text-gray-500 self-center ml-2">
                            Draw your signature using mouse or touch
                        </p>
                    </div>
                </div>
            ) : (
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-yellow-500 hover:bg-yellow-50 transition text-center"
                    >
                        📂 Click to upload signature image
                    </button>
                    {value && value.startsWith('data:image') && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 mb-2">Signature Preview:</p>
                            <img src={value} alt="Signature preview" className="max-h-32 border rounded shadow-sm" />
                            <button
                                type="button"
                                onClick={clearSignature}
                                className="mt-2 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
                            >
                                Remove
                            </button>
                        </div>
                    )}
                    {!value && (
                        <p className="text-xs text-gray-500 mt-2">
                            Upload a clear image of your signature (JPG, PNG, max 2MB)
                        </p>
                    )}
                </div>
            )}
            {error && (
                <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                    ⚠️ {error}
                </p>
            )}
        </div>
    );
});

DigitalSignature.displayName = 'DigitalSignature';

// Emergency Contact Component
const EmergencyContact = memo(({ index, contact, onChange, onRemove, canRemove }) => {
    return (
        <div className="border border-gray-200 rounded-lg p-4 mb-4 relative">
            {canRemove && (
                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
            <h4 className="text-md font-semibold text-gray-800 mb-3">Emergency Contact {index + 1}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                    label="Name"
                    name={`emergencyName_${index}`}
                    placeholder="Emergency contact person name"
                    value={contact.name}
                    onChange={(e) => onChange(index, 'name', e.target.value)}
                    validation="name"
                    required={index === 0}
                />
                <InputField
                    label="Location"
                    name={`emergencyLocation_${index}`}
                    placeholder="City/Area"
                    value={contact.location}
                    onChange={(e) => onChange(index, 'location', e.target.value)}
                    required={index === 0}
                />
                <InputField
                    label="Phone Number"
                    name={`emergencyPhone_${index}`}
                    type="tel"
                    placeholder="9876543210"
                    value={contact.phone}
                    onChange={(e) => onChange(index, 'phone', e.target.value)}
                    validation="mobile"
                    required={index === 0}
                    maxLength={10}
                />
                <InputField
                    label="Relationship"
                    name={`emergencyRelationship_${index}`}
                    placeholder="e.g., Father, Mother, Spouse"
                    value={contact.relationship}
                    onChange={(e) => onChange(index, 'relationship', e.target.value)}
                    required={index === 0}
                />
            </div>
        </div>
    );
});

EmergencyContact.displayName = 'EmergencyContact';

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

    const [formData, setFormData] = useState({
        // Personal Details
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

        // Emergency Contact Details (Array)
        emergencyContacts: [
            {
                name: '',
                location: '',
                phone: '',
                relationship: ''
            }
        ],

        // Previous Employment Details
        previousCompany: '',
        previousDesignation: '',
        educationalQualification: '',

        // Legal Cases
        legalCasesPending: '',

        // Bank Account Details
        nameAsPerBank: '',
        bankName: '',
        accountNo: '',
        ifscCode: '',
        branch: '',
        bankCity: '',

        // Declaration
        declarationNote: '',
        declaration: false,

        // Digital Signatures
        referrerSignature: '',
        applicantSignature: '',

        // Status
        status: 'pending',
    });

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/application');
            const data = await response.json();
            if (data.success) {
                setApplications(data.applications);
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
            showNotification('error', 'Failed to fetch applications');
        } finally {
            setIsLoading(false);
        }
    };

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }, []);

    const handleEmergencyContactChange = (index, field, value) => {
        setFormData(prev => {
            const updatedContacts = [...prev.emergencyContacts];
            updatedContacts[index] = {
                ...updatedContacts[index],
                [field]: value
            };
            return {
                ...prev,
                emergencyContacts: updatedContacts
            };
        });
    };

    const addEmergencyContact = () => {
        if (formData.emergencyContacts.length < 5) {
            setFormData(prev => ({
                ...prev,
                emergencyContacts: [
                    ...prev.emergencyContacts,
                    {
                        name: '',
                        location: '',
                        phone: '',
                        relationship: ''
                    }
                ]
            }));
        } else {
            showNotification('error', 'Maximum 5 emergency contacts allowed');
        }
    };

    const removeEmergencyContact = (index) => {
        if (formData.emergencyContacts.length > 1) {
            setFormData(prev => ({
                ...prev,
                emergencyContacts: prev.emergencyContacts.filter((_, i) => i !== index)
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all required fields before submission
        const requiredFields = [
            { field: 'fullName', label: 'Full Name' },
            { field: 'dob', label: 'Date of Birth' },
            { field: 'fatherName', label: "Father's/Husband's Name" },
            { field: 'address', label: 'Address' },
            { field: 'contactNo', label: 'Contact Number' },
            { field: 'email', label: 'Email ID' },
            { field: 'pinCode', label: 'Pin Code' },
            { field: 'panNumber', label: 'PAN Number' },
            { field: 'aadharNumber', label: 'Aadhar Number' },
            { field: 'nameAsPerBank', label: 'Name as per Bank' },
            { field: 'bankName', label: 'Bank Name' },
            { field: 'accountNo', label: 'Account Number' },
            { field: 'ifscCode', label: 'IFSC Code' },
        ];

        for (const req of requiredFields) {
            if (!formData[req.field]) {
                showNotification('error', `${req.label} is required`);
                return;
            }
        }

        // Validate at least one emergency contact with required fields
        const hasValidEmergencyContact = formData.emergencyContacts.some(contact =>
            contact.name && contact.location && contact.phone && contact.relationship
        );

        if (!hasValidEmergencyContact) {
            showNotification('error', 'At least one complete emergency contact is required');
            return;
        }

        // Validate legal cases radio button
        if (!formData.legalCasesPending) {
            showNotification('error', 'Please select if any legal cases are pending');
            return;
        }

        // Validate declaration
        if (!formData.declaration) {
            showNotification('error', 'Please accept the declaration');
            return;
        }

        // Validate signatures
        if (!formData.applicantSignature) {
            showNotification('error', 'Applicant signature is required');
            return;
        }

        if (!formData.referrerSignature) {
            showNotification('error', 'Referrer signature is required');
            return;
        }

        setIsLoading(true);

        try {
            let url = '/api/application';
            let method = 'POST';
            let body = { ...formData };

            if (currentView === 'edit' && currentApplication) {
                method = 'PUT';
                body = {
                    applicationId: currentApplication._id,
                    ...formData,
                };
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (data.success) {
                showNotification('success', currentView === 'edit' ? 'Application updated successfully!' : 'Application submitted successfully!');
                setCurrentView('list');
                setShowPreview(false);
                resetForm();
                fetchApplications();
            } else {
                showNotification('error', data.error || 'Something went wrong');
            }
        } catch (error) {
            console.error('Error submitting application:', error);
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
                    emergencyContacts: app.emergencyContacts && app.emergencyContacts.length > 0
                        ? app.emergencyContacts
                        : [{ name: '', location: '', phone: '', relationship: '' }],
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
            console.error('Error fetching application details:', error);
            showNotification('error', 'Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (applicationId) => {
        if (!confirm('Are you sure you want to delete this application?')) return;

        try {
            const response = await fetch(`/api/application?id=${applicationId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (data.success) {
                showNotification('success', 'Application deleted successfully!');
                fetchApplications();
            } else {
                showNotification('error', data.error || 'Failed to delete application');
            }
        } catch (error) {
            console.error('Error deleting application:', error);
            showNotification('error', 'Network error. Please try again.');
        }
    };

    const handleUpdateStatus = async (applicationId, newStatus) => {
        try {
            const response = await fetch('/api/application', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    applicationId,
                    status: newStatus,
                }),
            });

            const data = await response.json();

            if (data.success) {
                showNotification('success', `Application ${newStatus} successfully!`);
                fetchApplications();
            } else {
                showNotification('error', data.error || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            showNotification('error', 'Network error. Please try again.');
        }
    };

    const resetForm = () => {
        setFormData({
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
            status: 'pending',
        });
        setCurrentApplication(null);
        setActiveTab('personal');
        setShowPreview(false);
    };

    const filteredApplications = useMemo(() => {
        let filtered = applications;

        if (filter !== 'all') {
            filtered = filtered.filter(app => app.status === filter);
        }

        if (searchTerm) {
            filtered = filtered.filter(app =>
                app.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.contactNo?.includes(searchTerm)
            );
        }

        return filtered;
    }, [applications, filter, searchTerm]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'text-green-600 bg-green-100';
            case 'pending': return 'text-yellow-600 bg-yellow-100';
            case 'rejected': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    // Preview Component
    const PreviewSection = () => (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Application Preview</h3>

            {/* Personal Details */}
            <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Personal Details</h4>
                <div className="grid grid-cols-2 gap-4">
                    <p><strong>Application ID:</strong> {formData.applicationId || 'Not provided'}</p>
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

            {/* Emergency Contact Details */}
            <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Emergency Contact Details</h4>
                {formData.emergencyContacts.map((contact, idx) => (
                    contact.name && contact.location && contact.phone && (
                        <div key={idx} className="mb-4 p-3 bg-white rounded border border-gray-200">
                            <p className="font-semibold">Contact {idx + 1}</p>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <p><strong>Name:</strong> {contact.name}</p>
                                <p><strong>Location:</strong> {contact.location}</p>
                                <p><strong>Phone:</strong> {contact.phone}</p>
                                <p><strong>Relationship:</strong> {contact.relationship}</p>
                            </div>
                        </div>
                    )
                ))}
            </div>

            {/* Previous Employment Details */}
            <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Previous Employment Details</h4>
                <div className="grid grid-cols-2 gap-4">
                    <p><strong>Company Name:</strong> {formData.previousCompany || 'Not provided'}</p>
                    <p><strong>Designation:</strong> {formData.previousDesignation || 'Not provided'}</p>
                    <p><strong>Educational Qualification:</strong> {formData.educationalQualification || 'Not provided'}</p>
                </div>
            </div>

            {/* Legal Cases */}
            <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Legal Cases</h4>
                <p><strong>Any Legal Cases Pending:</strong> {formData.legalCasesPending === 'yes' ? 'Yes' : formData.legalCasesPending === 'no' ? 'No' : 'Not provided'}</p>
            </div>

            {/* Bank Account Details */}
            <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Bank Account Details</h4>
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
                <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Declaration</h4>
                <p><strong>Note:</strong> {formData.declarationNote || 'Not provided'}</p>
                <p className="mt-2"><strong>Declaration Accepted:</strong> {formData.declaration ? 'Yes' : 'No'}</p>
            </div>

            {/* Digital Signatures */}
            <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Digital Signatures</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p><strong>Applicant Signature:</strong></p>
                        {formData.applicantSignature ? (
                            <img src={formData.applicantSignature} alt="Applicant Signature" className="mt-2 max-h-24 border rounded" />
                        ) : (
                            <p className="text-gray-500">Not provided</p>
                        )}
                    </div>
                    <div>
                        <p><strong>Referrer Signature:</strong></p>
                        {formData.referrerSignature ? (
                            <img src={formData.referrerSignature} alt="Referrer Signature" className="mt-2 max-h-24 border rounded" />
                        ) : (
                            <p className="text-gray-500">Not provided</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    // List View Screen
    if (currentView === 'list') {
        return (
            <div className="min-h-screen bg-gray-50 text-gray-900">
                {/* Notification */}
                {notification && (
                    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                        } text-white animate-slide-in`}>
                        {notification.message}
                    </div>
                )}

                <div className="w-full sm:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
                            <p className="text-gray-600 mt-1">Admin &gt; Marketing Applications</p>
                        </div>
                        <button
                            onClick={() => {
                                resetForm();
                                setCurrentView('add');
                            }}
                            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition shadow-sm hover:shadow-md"
                        >
                            + Add Applicant
                        </button>
                    </div>

                    {/* Search and Filter */}
                    <div className="mb-6 flex gap-4">
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                        />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    {/* Applications Table */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">APPLICANT</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CONTACT</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BANK</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">APPLIED DATE</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                                Loading...
                                            </td>
                                        </tr>
                                    ) : filteredApplications.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                                No applications found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredApplications.map((app) => (
                                            <tr key={app._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {app.fullName}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            ID: {app._id?.slice(-6)}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">{app.email}</div>
                                                    <div className="text-sm text-gray-500">{app.contactNo}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">{app.bankName}</div>
                                                    <div className="text-sm text-gray-500">XXXX{app.accountNo?.slice(-4)}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(app.status)}`}>
                                                            {app.status?.toUpperCase()}
                                                        </span>
                                                        {app.status === 'pending' && (
                                                            <div className="relative group">
                                                                <button className="text-gray-400 hover:text-gray-600">▼</button>
                                                                <div className="absolute hidden group-hover:block bg-white shadow-lg rounded-lg mt-1 z-10 min-w-[120px]">
                                                                    <button
                                                                        onClick={() => handleUpdateStatus(app._id, 'approved')}
                                                                        className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-100"
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleUpdateStatus(app._id, 'rejected')}
                                                                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {new Date(app.appliedAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <button
                                                        onClick={() => handleEdit(app)}
                                                        className="text-yellow-600 hover:text-yellow-800 mr-3"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(app._id)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    @keyframes slide-in {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                    .animate-slide-in {
                        animation: slide-in 0.3s ease-out;
                    }
                `}</style>
            </div>
        );
    }

    // Add/Edit Form Screen
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                    } text-white animate-slide-in`}>
                    {notification.message}
                </div>
            )}

            <div className="w-full sm:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header with Back Button */}
                <div className="mb-6">
                    <button
                        onClick={() => {
                            setCurrentView('list');
                            resetForm();
                        }}
                        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Applications
                    </button>

                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {currentView === 'add' ? 'Add New Applicant' : 'Edit Application'}
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Admin &gt; Applications &gt; {currentView === 'add' ? 'New' : `#${currentApplication?._id?.slice(-6)}`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Status Display for Edit Mode */}
                {currentView === 'edit' && (
                    <div className="mb-6 p-4 bg-gray-100 text-gray-800 rounded-lg">
                        <span className="font-semibold">Status: </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(formData.status)} ml-2`}>
                            {formData.status?.toUpperCase()}
                        </span>
                    </div>
                )}

                {/* Form with Tabs */}
                <div className="bg-white text-gray-800 rounded-lg shadow-sm overflow-hidden">
                    {/* Tabs */}
                    <div className="border-b border-gray-200 bg-gray-50">
                        <nav className="flex gap-1 px-6 overflow-x-auto">
                            {['personal', 'emergency', 'employment', 'bank', 'signatures', 'declaration'].map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-3 text-sm font-medium transition border-b-2 whitespace-nowrap ${activeTab === tab
                                        ? 'border-yellow-600 text-yellow-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab === 'personal' && 'Personal Details'}
                                    {tab === 'emergency' && 'Emergency Contact'}
                                    {tab === 'employment' && 'Employment Details'}
                                    {tab === 'bank' && 'Bank Details'}
                                    {tab === 'signatures' && 'Signatures'}
                                    {tab === 'declaration' && 'Declaration'}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <form id="application-form" onSubmit={handleSubmit} className="p-6">
                        {/* Personal Information Tab */}
                        {activeTab === 'personal' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField
                                        label="Application ID"
                                        name="applicationId"
                                        placeholder="Auto-generated or manual ID"
                                        value={formData.applicationId}
                                        onChange={handleChange}
                                        required={false}
                                    />
                                    <InputField
                                        label="Full Name"
                                        name="fullName"
                                        placeholder="Enter full name"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        validation="name"
                                        required={true}
                                        maxLength={100}
                                    />
                                    <InputField
                                        label="Date of Birth"
                                        name="dob"
                                        type="date"
                                        value={formData.dob}
                                        onChange={handleChange}
                                        validation="dob"
                                        required={true}
                                    />
                                    <InputField
                                        label="Father's/Husband's Name"
                                        name="fatherName"
                                        placeholder="Father's or husband's name"
                                        value={formData.fatherName}
                                        onChange={handleChange}
                                        validation="name"
                                        required={true}
                                    />
                                    <InputField
                                        label="Blood Group"
                                        name="bloodGroup"
                                        placeholder="e.g., A+, B+, O+"
                                        value={formData.bloodGroup}
                                        onChange={handleChange}
                                        required={false}
                                    />
                                    <InputField
                                        label="Address"
                                        name="address"
                                        placeholder="Complete address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        required={true}
                                        maxLength={200}
                                    />
                                    <InputField
                                        label="Contact Number"
                                        name="contactNo"
                                        type="tel"
                                        placeholder="9876543210"
                                        value={formData.contactNo}
                                        onChange={handleChange}
                                        validation="mobile"
                                        required={true}
                                        maxLength={10}
                                    />
                                    <InputField
                                        label="Email ID"
                                        name="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        validation="email"
                                        required={true}
                                    />
                                    <InputField
                                        label="Pin Code"
                                        name="pinCode"
                                        placeholder="Pincode"
                                        value={formData.pinCode}
                                        onChange={handleChange}
                                        validation="pincode"
                                        required={true}
                                        maxLength={6}
                                    />
                                    <InputField
                                        label="PAN Number"
                                        name="panNumber"
                                        placeholder="ABCDE1234F"
                                        value={formData.panNumber}
                                        onChange={handleChange}
                                        validation="pan"
                                        required={true}
                                        maxLength={10}
                                    />
                                    <InputField
                                        label="Aadhar Number"
                                        name="aadharNumber"
                                        placeholder="123456789012"
                                        value={formData.aadharNumber}
                                        onChange={handleChange}
                                        validation="aadhar"
                                        required={true}
                                        maxLength={12}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Emergency Contact Tab */}
                        {activeTab === 'emergency' && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Emergency Contact Details</h3>
                                    {formData.emergencyContacts.length < 5 && (
                                        <button
                                            type="button"
                                            onClick={addEmergencyContact}
                                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                        >
                                            + Add More Contact
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mb-4">At least one complete emergency contact is required. You can add up to 5 contacts.</p>

                                {formData.emergencyContacts.map((contact, index) => (
                                    <EmergencyContact
                                        key={index}
                                        index={index}
                                        contact={contact}
                                        onChange={handleEmergencyContactChange}
                                        onRemove={removeEmergencyContact}
                                        canRemove={formData.emergencyContacts.length > 1}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Employment Details Tab */}
                        {activeTab === 'employment' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Employment Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField
                                        label="Company Name"
                                        name="previousCompany"
                                        placeholder="Previous company name"
                                        value={formData.previousCompany}
                                        onChange={handleChange}
                                        required={false}
                                    />
                                    <InputField
                                        label="Designation"
                                        name="previousDesignation"
                                        placeholder="Job title/designation"
                                        value={formData.previousDesignation}
                                        onChange={handleChange}
                                        required={false}
                                    />
                                    <InputField
                                        label="Educational Qualification"
                                        name="educationalQualification"
                                        placeholder="Highest educational qualification"
                                        value={formData.educationalQualification}
                                        onChange={handleChange}
                                        required={false}
                                    />
                                </div>

                                <div className="mt-6">
                                    <RadioGroup
                                        label="Any Legal Cases Pending Till Date"
                                        name="legalCasesPending"
                                        options={[
                                            { value: 'yes', label: 'Yes' },
                                            { value: 'no', label: 'No' }
                                        ]}
                                        value={formData.legalCasesPending}
                                        onChange={handleChange}
                                        required={true}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Bank Details Tab */}
                        {activeTab === 'bank' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Account Details</h3>
                                <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                                    <p className="text-sm text-yellow-800">
                                        <span className="font-semibold">Note:</span> Please ensure all bank details are correct. Payments will be processed to the provided bank account.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField
                                        label="Name as per Bank"
                                        name="nameAsPerBank"
                                        placeholder="Name exactly as in bank account"
                                        value={formData.nameAsPerBank}
                                        onChange={handleChange}
                                        validation="name"
                                        required={true}
                                    />
                                    <InputField
                                        label="Bank Name"
                                        name="bankName"
                                        placeholder="Name of the bank"
                                        value={formData.bankName}
                                        onChange={handleChange}
                                        required={true}
                                    />
                                    <InputField
                                        label="Account Number"
                                        name="accountNo"
                                        placeholder="Bank account number"
                                        value={formData.accountNo}
                                        onChange={handleChange}
                                        validation="accountNo"
                                        required={true}
                                        maxLength={18}
                                    />
                                    <InputField
                                        label="IFSC Code"
                                        name="ifscCode"
                                        placeholder="IFSC code (e.g., SBIN0012345)"
                                        value={formData.ifscCode}
                                        onChange={handleChange}
                                        validation="ifsc"
                                        required={true}
                                        maxLength={11}
                                    />
                                    <InputField
                                        label="Branch"
                                        name="branch"
                                        placeholder="Bank branch name"
                                        value={formData.branch}
                                        onChange={handleChange}
                                        required={true}
                                    />
                                    <InputField
                                        label="City"
                                        name="bankCity"
                                        placeholder="Bank branch city"
                                        value={formData.bankCity}
                                        onChange={handleChange}
                                        validation="name"
                                        required={true}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Signatures Tab */}
                        {activeTab === 'signatures' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Digital Signatures</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <DigitalSignature
                                        label="Applicant Signature"
                                        name="applicantSignature"
                                        value={formData.applicantSignature}
                                        onChange={handleChange}
                                        required={true}
                                    />
                                    <DigitalSignature
                                        label="Referrer Signature"
                                        name="referrerSignature"
                                        value={formData.referrerSignature}
                                        onChange={handleChange}
                                        required={true}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Declaration Tab - Last */}
                        {activeTab === 'declaration' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Declaration</h3>
                                <TextArea
                                    label="Declaration Note"
                                    name="declarationNote"
                                    placeholder="Enter any additional declaration notes here..."
                                    value={formData.declarationNote}
                                    onChange={handleChange}
                                    required={false}
                                    rows={5}
                                />
                                <Checkbox
                                    label="I hereby declare that the above mentioned information is correct to my knowledge and I bear the responsibility for the correctness of the above mentioned information."
                                    name="declaration"
                                    checked={formData.declaration}
                                    onChange={handleChange}
                                    required={true}
                                    description="Please read and accept the declaration to proceed."
                                />

                                {/* Buttons at the bottom of Declaration tab only */}
                                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between">
                                    <button
                                        type="button"
                                        onClick={() => setShowPreview(!showPreview)}
                                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                                    >
                                        {showPreview ? 'Hide Preview' : 'Show Preview'}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`px-6 py-2 bg-yellow-600 text-white rounded-lg transition ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-yellow-700'
                                            }`}
                                    >
                                        {isLoading ? 'Saving...' : currentView === 'add' ? 'Create Application' : 'Update Application'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Preview Section - Shows only when showPreview is true */}
                {showPreview && <PreviewSection />}
            </div>

            <style jsx>{`
                @keyframes slide-in {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}