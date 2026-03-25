// app/page.js
'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';

// Memoized InputField component with validation
const InputField = memo(({
    label,
    name,
    type = 'text',
    required = true,
    placeholder = '',
    value,
    onChange,
    validation = 'none', // 'none', 'mobile', 'email', 'name', 'pincode', 'ifsc', 'accountNo', 'city'
    maxLength,
    pattern,
    errorMessage
}) => {
    const [error, setError] = useState('');

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
                // Only 10 digits, no letters or special chars
                const mobileRegex = /^[0-9]{10}$/;
                if (!mobileRegex.test(value)) {
                    setError('Please enter a valid 10-digit mobile number');
                    return false;
                }
                setError('');
                return true;

            case 'email':
                // Standard email validation
                const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    setError('Please enter a valid email address');
                    return false;
                }
                setError('');
                return true;

            case 'name':
                // Only letters, spaces, and hyphens (no numbers or special chars except hyphen)
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
                // Exactly 6 digits
                const pincodeRegex = /^[0-9]{6}$/;
                if (!pincodeRegex.test(value)) {
                    setError('Please enter a valid 6-digit pincode');
                    return false;
                }
                setError('');
                return true;

            case 'ifsc':
                // IFSC format: 4 letters, 0, then 6 alphanumeric
                const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
                if (!ifscRegex.test(value)) {
                    setError('Please enter a valid IFSC code (e.g., SBIN0012345)');
                    return false;
                }
                setError('');
                return true;

            case 'accountNo':
                // 9-18 digits only
                const accountRegex = /^[0-9]{9,18}$/;
                if (!accountRegex.test(value)) {
                    setError('Account number should be 9-18 digits only');
                    return false;
                }
                setError('');
                return true;

            case 'city':
                // Letters, spaces, and hyphens only
                const cityRegex = /^[A-Za-z\s\-]+$/;
                if (!cityRegex.test(value)) {
                    setError('City name should only contain letters, spaces, and hyphens');
                    return false;
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

        // Apply input masking based on validation type
        switch (validation) {
            case 'mobile':
                // Only allow digits
                newValue = newValue.replace(/[^0-9]/g, '');
                if (maxLength && newValue.length > maxLength) newValue = newValue.slice(0, maxLength);
                break;

            case 'pincode':
                // Only allow digits
                newValue = newValue.replace(/[^0-9]/g, '');
                if (maxLength && newValue.length > maxLength) newValue = newValue.slice(0, maxLength);
                break;

            case 'accountNo':
                // Only allow digits
                newValue = newValue.replace(/[^0-9]/g, '');
                if (maxLength && newValue.length > maxLength) newValue = newValue.slice(0, maxLength);
                break;

            case 'ifsc':
                // Convert to uppercase and only allow alphanumeric
                newValue = newValue.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (maxLength && newValue.length > maxLength) newValue = newValue.slice(0, maxLength);
                break;

            case 'name':
            case 'city':
                // Only allow letters, spaces, and hyphens
                newValue = newValue.replace(/[^A-Za-z\s\-]/g, '');
                break;
        }

        // Create a synthetic event with the cleaned value
        const syntheticEvent = {
            target: {
                name,
                value: newValue,
                type: e.target.type,
                checked: e.target.checked
            }
        };

        onChange(syntheticEvent);

        // Validate on change
        if (required || newValue) {
            validateField(newValue);
        }
    };

    const handleBlur = (e) => {
        if (required && !value) {
            setError(`${label} is required`);
        } else if (value) {
            validateField(value);
        }
    };

    return (
        <div className="mb-4">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
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
            {error && (
                <p className="mt-1 text-xs text-red-600">{error}</p>
            )}
        </div>
    );
});

InputField.displayName = 'InputField';

export default function ApplicationManagement() {
    const [applications, setApplications] = useState([]);
    const [currentView, setCurrentView] = useState('list');
    const [currentApplication, setCurrentApplication] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [activeTab, setActiveTab] = useState('basic');

    const [formData, setFormData] = useState({
        // Personal Information
        fullName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',

        // Bank Account Details
        nameAsPerBank: '',
        bankName: '',
        accountNo: '',
        ifscCode: '',
        branch: '',
        bankCity: '',

        // Referrer Information
        referrerName: '',
        referrerSignature: '',

        // Declaration
        declaration: false,

        // Status
        status: 'pending',
    });

    // Fetch applications on component mount
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

    // Stable handleChange function that doesn't cause re-renders
    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all required fields before submission
        const requiredFields = [
            { field: 'fullName', label: 'Full Name' },
            { field: 'email', label: 'Email Address' },
            { field: 'phone', label: 'Phone Number' },
            { field: 'address', label: 'Address' },
            { field: 'city', label: 'City' },
            { field: 'state', label: 'State' },
            { field: 'pincode', label: 'Pincode' },
            { field: 'nameAsPerBank', label: 'Name as per Bank' },
            { field: 'bankName', label: 'Bank Name' },
            { field: 'accountNo', label: 'Account Number' },
            { field: 'ifscCode', label: 'IFSC Code' },
            { field: 'branch', label: 'Branch' },
            { field: 'bankCity', label: 'Bank City' },
        ];

        for (const req of requiredFields) {
            if (!formData[req.field]) {
                showNotification('error', `${req.label} is required`);
                return;
            }
        }

        // Validate declaration
        if (!formData.declaration) {
            showNotification('error', 'Please accept the declaration');
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
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    pincode: formData.pincode,
                    nameAsPerBank: formData.nameAsPerBank,
                    bankName: formData.bankName,
                    accountNo: formData.accountNo,
                    ifscCode: formData.ifscCode,
                    branch: formData.branch,
                    bankCity: formData.bankCity,
                    referrerName: formData.referrerName,
                    referrerSignature: formData.referrerSignature,
                    declaration: formData.declaration,
                    status: formData.status,
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
                    fullName: app.personalInfo?.fullName || '',
                    email: app.personalInfo?.email || '',
                    phone: app.personalInfo?.phone || '',
                    address: app.personalInfo?.address || '',
                    city: app.personalInfo?.city || '',
                    state: app.personalInfo?.state || '',
                    pincode: app.personalInfo?.pincode || '',
                    nameAsPerBank: app.bankDetails?.nameAsPerBank || '',
                    bankName: app.bankDetails?.bankName || '',
                    accountNo: app.bankDetails?.accountNo || '',
                    ifscCode: app.bankDetails?.ifscCode || '',
                    branch: app.bankDetails?.branch || '',
                    bankCity: app.bankDetails?.bankCity || '',
                    referrerName: app.referrerInfo?.referrerName || '',
                    referrerSignature: app.referrerInfo?.referrerSignature || '',
                    declaration: app.declaration || false,
                    status: app.status || 'pending',
                });
                setCurrentView('edit');
                setActiveTab('basic');
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
            fullName: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            pincode: '',
            nameAsPerBank: '',
            bankName: '',
            accountNo: '',
            ifscCode: '',
            branch: '',
            bankCity: '',
            referrerName: '',
            referrerSignature: '',
            declaration: false,
            status: 'pending',
        });
        setCurrentApplication(null);
        setActiveTab('basic');
    };

    // Memoized filtered applications
    const filteredApplications = useMemo(() => {
        let filtered = applications;

        if (filter !== 'all') {
            filtered = filtered.filter(app => app.status === filter);
        }

        if (searchTerm) {
            filtered = filtered.filter(app =>
                app.personalInfo?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.personalInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.personalInfo?.phone?.includes(searchTerm)
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
                                                            {app.personalInfo?.fullName}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            ID: {app._id?.slice(-6)}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">{app.personalInfo?.email}</div>
                                                    <div className="text-sm text-gray-500">{app.personalInfo?.phone}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">{app.bankDetails?.bankName}</div>
                                                    <div className="text-sm text-gray-500">XXXX{app.bankDetails?.accountNo?.slice(-4)}</div>
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
                        <nav className="flex gap-1 px-6">
                            {['basic', 'bank', 'referrer', 'declaration'].map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-3 text-sm font-medium transition border-b-2 ${activeTab === tab
                                        ? 'border-yellow-600 text-yellow-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab === 'basic' && 'Basic Info'}
                                    {tab === 'bank' && 'Bank Details'}
                                    {tab === 'referrer' && 'Referrer Info'}
                                    {tab === 'declaration' && 'Declaration'}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <form id="application-form" onSubmit={handleSubmit} className="p-6">
                        {/* Basic Information Tab */}
                        {activeTab === 'basic' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        label="Email Address"
                                        name="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        validation="email"
                                        required={true}
                                    />
                                    <InputField
                                        label="Phone Number"
                                        name="phone"
                                        type="tel"
                                        placeholder="9876543210"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        validation="mobile"
                                        required={true}
                                        maxLength={10}
                                    />
                                    <InputField
                                        label="Address"
                                        name="address"
                                        placeholder="Street address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        required={true}
                                        maxLength={200}
                                    />
                                    <InputField
                                        label="City"
                                        name="city"
                                        placeholder="City"
                                        value={formData.city}
                                        onChange={handleChange}
                                        validation="city"
                                        required={true}
                                    />
                                    <InputField
                                        label="State"
                                        name="state"
                                        placeholder="State"
                                        value={formData.state}
                                        onChange={handleChange}
                                        validation="city"
                                        required={true}
                                    />
                                    <InputField
                                        label="Pincode"
                                        name="pincode"
                                        placeholder="Pincode"
                                        value={formData.pincode}
                                        onChange={handleChange}
                                        validation="pincode"
                                        required={true}
                                        maxLength={6}
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
                                        validation="name"
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
                                        validation="city"
                                        required={true}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Referrer Info Tab */}
                        {activeTab === 'referrer' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Referrer Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField
                                        label="Referrer Name"
                                        name="referrerName"
                                        required={true}
                                        placeholder="Name of the referrer"
                                        value={formData.referrerName}
                                        onChange={handleChange}
                                        validation="name"
                                    />
                                    <InputField
                                        label="Referrer Signature"
                                        name="referrerSignature"
                                        required={false}
                                        placeholder="Signature or confirmation"
                                        value={formData.referrerSignature}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="mt-6 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                                    <p className="text-sm text-gray-500 text-center">
                                        ⚡ Referrer Signature: By signing above, you confirm that you have referred this applicant
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Declaration Tab */}
                        {activeTab === 'declaration' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Declaration</h3>
                                <div className="bg-gray-50 p-6 rounded-lg">
                                    <label className="flex items-start space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="declaration"
                                            checked={formData.declaration}
                                            onChange={handleChange}
                                            required
                                            className="mt-1 w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                                        />
                                        <span className="text-gray-700 text-sm leading-relaxed">
                                            I hereby declare that the above mentioned information is correct to my knowledge and I bear the responsibility for the correctness of the above mentioned information.
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`px-6 py-2 bg-yellow-600 text-white rounded-lg transition ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-yellow-700'
                                    }`}
                            >
                                {isLoading ? 'Saving...' : currentView === 'add' ? 'Create Application' : 'Update Application'}
                            </button>
                        </div>
                    </form>
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