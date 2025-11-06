'use client';
import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { Listbox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

const categoryColors = {
    birthday: '#dc2626',
    training: '#e0193a',
    meeting: '#facc15',
    holiday: '#4ade80',
    general: '#38bdf8',
};

export default function EventDrawer({ mode, profile, mutated, show, onClose, editData, categories }) {
    const [form, setForm] = useState({
        employeeId: profile._id,
        title: '',
        description: '',
        date: '',
        type: '',
    });
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const allCategories = categories.filter(cat => cat !== 'view all');

    // Convert ISO date to YYYY-MM-DD
    const formatDateForInput = (isoString) => {
        if (!isoString) return '';
        try {
            const d = new Date(isoString);
            if (isNaN(d)) return '';
            return d.toISOString().split('T')[0];
        } catch {
            return '';
        }
    };

    useEffect(() => {
        if (editData) {
            setForm({
                title: editData.title || '',
                description: editData.description || '',
                date: formatDateForInput(editData.date),
                type: editData.type || '',
                employeeId: profile._d,
            });
        }
    }, [editData, profile._d]);

    const handleChange = (field) => (e) => {
        const value = e?.target?.value ?? e;
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.date || !form.type) {
            setError(true);
            return;
        }

        setError(false);
        setLoading(true);

        try {
            const method = mode === "update" ? 'PUT' : 'POST';
            const url = `/api/events`;
            if (mode === "update") { form.eventId = editData._id }
            form.employeeId = profile._id
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save event');
            mutated()
            alert(mode === "update" ? 'Event updated successfully!' : 'Event created successfully!');
            onClose();
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={`fixed top-0 right-0 h-full w-96 bg-white shadow-lg transition-transform duration-300 z-50 ${show ? 'translate-x-0' : 'translate-x-full'
                }`}
        >
            <div className="flex items-center justify-between px-4 py-3 border-b">
                <h2 className="text-lg font-semibold">{mode === "update" ? 'Edit Event' : 'Add Event'}</h2>
                <button
                    onClick={onClose}
                    className="text-gray-600 hover:text-black hover:bg-gray-200 h-7 w-7 rounded-full text-xl"
                >
                    <XMarkIcon className="h-5 w-5 pl-1.5" />
                </button>
            </div>

            <form
                onSubmit={handleSubmit}
                className="p-4 space-y-4 overflow-y-auto h-[calc(100%-60px)]"
            >
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium">Title</label>
                    <input
                        type="text"
                        value={form.title}
                        onChange={handleChange('title')}
                        className={`w-full mt-1 p-2 border rounded text-sm ${error && !form.title ? 'border-red-500' : ''
                            }`}
                        placeholder="e.g., Diwali Celebration"
                    />
                </div>

                {/* Date */}
                <div>
                    <label className="block text-sm font-medium">Date</label>
                    <input
                        type="date"
                        value={form.date}
                        onChange={handleChange('date')}
                        className={`w-full mt-1 p-2 border rounded text-sm ${error && !form.date ? 'border-red-500' : ''
                            }`}
                    />
                </div>

                {/* Type */}
                <div>
                    <Listbox value={form.type} onChange={handleChange('type')}>
                        {({ open }) => (
                            <div className="relative">
                                <Listbox.Label className="block text-sm font-medium text-gray-500">
                                    Label
                                </Listbox.Label>
                                <div className="relative mt-1">
                                    <Listbox.Button
                                        className={`relative w-full cursor-default rounded border bg-white py-2 pl-3 pr-10 text-left text-sm shadow-sm focus:outline-none ${error && !form.type ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    >
                                        <span className="flex items-center">
                                            {form.type && (
                                                <span
                                                    className="w-2 h-2 rounded-full mr-2"
                                                    style={{ backgroundColor: categoryColors[form.type] }}
                                                />
                                            )}
                                            {form.type || 'Select Event Label'}
                                        </span>
                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                            <ChevronUpDownIcon
                                                className="h-5 w-5 text-gray-400"
                                                aria-hidden="true"
                                            />
                                        </span>
                                    </Listbox.Button>

                                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white text-sm shadow-lg ring-1 ring-gray-50 ring-opacity-5 focus:outline-none">
                                        {allCategories.map((cat, idx) => (
                                            <Listbox.Option
                                                key={idx}
                                                value={cat}
                                                className={({ active }) =>
                                                    `relative cursor-pointer items-center select-none py-2 pl-10 pr-4 ${active ? 'bg-yellow-100 text-yellow-900' : 'text-gray-900'
                                                    }`
                                                }
                                            >
                                                {({ selected }) => (
                                                    <p className="items-center">
                                                        <span
                                                            className="absolute left-2 top-2 h-3 w-3 rounded-full"
                                                            style={{ backgroundColor: categoryColors[cat] }}
                                                        />
                                                        <span className={selected ? 'font-medium' : 'font-normal'}>
                                                            {cat}
                                                        </span>
                                                        {selected && (
                                                            <span className="absolute inset-y-0 right-2 flex items-center pl-3 text-yellow-600">
                                                                <CheckIcon className="h-5 w-5" />
                                                            </span>
                                                        )}
                                                    </p>
                                                )}
                                            </Listbox.Option>
                                        ))}
                                    </Listbox.Options>
                                </div>
                                {error && !form.type && (
                                    <p className="text-red-500 text-xs mt-1">This field is required</p>
                                )}
                            </div>
                        )}
                    </Listbox>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium">Description</label>
                    <textarea
                        rows={3}
                        value={form.description}
                        onChange={handleChange('description')}
                        className="w-full mt-1 p-2 border rounded text-sm"
                        placeholder="Event details..."
                    />
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-2 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded"
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="border border-gray-300 text-gray-700 px-3 py-1 rounded"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
