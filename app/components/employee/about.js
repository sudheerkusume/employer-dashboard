'use client';
import React, { useState, useEffect, useContext } from 'react';
import { PencilIcon, PlusIcon, TrashIcon, EyeIcon, EyeSlashIcon, DocumentArrowUpIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Mutated } from '../config/useswrfetch';
import RootContext from '../config/rootcontext';
import Loading from '../common/loading';
import { formatDateTime } from '../config/sitesettings';

const dummyLogos = [
    'https://placehold.co/48x48/F0F0F0/000000?text=Google',
    'https://placehold.co/48x48/F0F0F0/000000?text=Facebook',
    'https://placehold.co/48x48/F0F0F0/000000?text=LinkedIn',
    'https://placehold.co/48x48/F0F0F0/000000?text=Microsoft',
    'https://placehold.co/48x48/F0F0F0/000000?text=YouTube',
];

export default function AboutMe({ profile }) {
    // State for Summary section
    const [editingSummary, setEditingSummary] = useState(false);
    const [tempSummary, setTempSummary] = useState('');
    const [summary, setSummary] = useState(profile.summary || 'Write a brief summary about yourself, your skills, and your professional goals.');
    const [previewSummary, setPreviewSummary] = useState(false);

    // State for Experience section
    const [experience, setExperience] = useState([]);
    const [editingExperienceIndex, setEditingExperienceIndex] = useState(null);
    const [tempExperience, setTempExperience] = useState({
        company: '',
        location: '',
        role: '',
        logo: dummyLogos[0],
        startDate: '',
        endDate: '',
        description: '',
        document: null,
        documentUrl: ''
    });
    const [previewExperience, setPreviewExperience] = useState(false);
    const [uploadingExpDoc, setUploadingExpDoc] = useState(null);
    const [expDocumentPreview, setExpDocumentPreview] = useState({ show: false, file: null, index: null });

    // State for Education section
    const [education, setEducation] = useState([]);
    const [editingEducationIndex, setEditingEducationIndex] = useState(null);
    const [tempEducation, setTempEducation] = useState({
        degree: '',
        board: '',
        startYear: '',
        endYear: '',
        document: null,
        documentUrl: ''
    });

    const [tempPersonal, setTempPersonal] = useState({
        name: profile?.name || '',
        email: profile?.email || '',
        mobile: profile?.mobile || '',
        gender: profile?.gender || '',
        dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
        panNumber: profile?.panNumber || '',
        aadhaarNumber: profile?.aadhaarNumber || '',
        designation: profile?.designation || '',
        department: profile?.department || '',
        employeeCode: profile?.employeeCode || '',
        ctc: profile?.ctc || '',
        regime: profile?.regime || ''
    });
    const [previewEducation, setPreviewEducation] = useState(false);
    const [uploadingEduDoc, setUploadingEduDoc] = useState(null);
    const [eduDocumentPreview, setEduDocumentPreview] = useState({ show: false, file: null, index: null });
    const [editingPersonal, setEditingPersonal] = useState(false);
    const { setRootContext } = useContext(RootContext);
    const [isAddingOrEditing, setIsAddingOrEditing] = useState(false);
    const [accountDetails, setAccountDetails] = useState(profile.accountDetails || {});
    const [tempAccount, setTempAccount] = useState({
        accountHolderName: profile?.accountDetails?.accountHolderName || '',
        accountNumber: profile?.accountDetails?.accountNumber || '',
        ifscCode: profile?.accountDetails?.ifscCode || '',
        branch: profile?.accountDetails?.branch || ''
    });

    const [editingAccount, setEditingAccount] = useState(false);
    const [serviceCall, setServiceCall] = useState(false);

    // Sort experiences by start date (most recent first)
    const sortExperiences = (experiences) => {
        return experiences.sort((a, b) => {
            const dateA = new Date(a.startDate || '1970-01-01');
            const dateB = new Date(b.startDate || '1970-01-01');
            return dateB - dateA;
        });
    };

    // Sort education by end year (most recent first)
    const sortEducation = (education) => {
        return education.sort((a, b) => {
            const yearA = parseInt(a.endYear || a.years?.split('-')[1] || '1970');
            const yearB = parseInt(b.endYear || b.years?.split('-')[1] || '1970');
            return yearB - yearA;
        });
    };

    // Effect to update states when profile prop changes
    useEffect(() => {
        setSummary(profile?.summary || 'Write a brief summary about yourself, your skills, and your professional goals.');

        const sortedExperiences = sortExperiences(profile?.experience || []);
        const sortedEducation = sortEducation(profile?.education || []);

        setExperience(sortedExperiences);
        setEducation(sortedEducation);
        
        // Ensure tempPersonal is populated once the profile loads
        setTempPersonal({
            name: profile?.name || '',
            email: profile?.email || '',
            mobile: profile?.mobile || '',
            gender: profile?.gender || '',
            dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
            panNumber: profile?.panNumber || '',
            aadhaarNumber: profile?.aadhaarNumber || '',
            designation: profile?.designation || '',
            department: profile?.department || '',
            employeeCode: profile?.employeeCode || '',
            ctc: profile?.ctc || '',
            regime: profile?.regime || ''
        });

        setTempAccount({
            accountHolderName: profile?.accountDetails?.accountHolderName || '',
            accountNumber: profile?.accountDetails?.accountNumber || '',
            ifscCode: profile?.accountDetails?.ifscCode || '',
            branch: profile?.accountDetails?.branch || ''
        });
    }, [profile]);

    // Effect to manage the global adding/editing state
    useEffect(() => {
        setIsAddingOrEditing(editingSummary || editingExperienceIndex !== null || editingEducationIndex !== null);
    }, [editingSummary, editingExperienceIndex, editingEducationIndex]);


    const handleCancelPersonal = () => {
        setEditingPersonal(false);
        setTempPersonal({
            name: profile?.name || '',
            email: profile?.email || '',
            mobile: profile?.mobile || '',
            gender: profile?.gender || '',
            dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
            panNumber: profile?.panNumber || '',
            aadhaarNumber: profile?.aadhaarNumber || '',
            designation: profile?.designation || '',
            department: profile?.department || '',
            employeeCode: profile?.employeeCode || '',
            ctc: profile?.ctc || '',
            regime: profile?.regime || '',
        });
    };
    const user_details =
        typeof window !== 'undefined'
            ? JSON.parse(localStorage.getItem('user_details') || '{}')
            : {};
    const role = user_details?.role || "";
    const employeeID = user_details.userId;
    const mutated = Mutated(employeeID ? `/api/employees?id=${employeeID}` : null)

    // Generic update function using FormData for document uploads
    const updateProfileWithDocuments = async (updateData, documents = []) => {
        setServiceCall(true);
        try {
            const formData = new FormData();

            // 🆔 Always include employee ID
            formData.append("id", employeeID);

            // 🔹 Append all fields in updateData
            Object.keys(updateData).forEach((key) => {
                const value = updateData[key];
                if (value !== undefined && value !== null) {
                    // Convert nested objects/arrays to JSON
                    if (typeof value === "object") {
                        formData.append(key, JSON.stringify(value));
                    } else {
                        formData.append(key, value);
                    }
                }
            });

            // 🔹 Attach document files (experience, education, etc.)
            documents.forEach((doc) => {
                if (doc?.file) {
                    // Example: experienceDoc_0, educationDoc_1, etc.
                    formData.append(`${doc.type}Doc_${doc.index}`, doc.file);
                }
            });

            // 🔹 Make PUT request
            const res = await fetch(`/api/employees`, {
                method: "PUT",
                body: formData,
            });

            const data = await res.json();
            if (res.status) {
                setServiceCall(false);
            }

            // 🔹 Handle success
            if (res.ok) {
                mutated(); // Refresh employee data
                setRootContext((prevContext) => ({
                    ...prevContext,
                    toast: {
                        show: true,
                        dismiss: true,
                        type: "success",
                        title: "Success",
                        message: "Details Updated Successfully",
                    },
                }));
                return true;
            } else {
                // 🔹 Handle API error
                setRootContext((prevContext) => ({
                    ...prevContext,
                    toast: {
                        show: true,
                        dismiss: true,
                        type: "error",
                        title: "Failed",
                        message: data.error || "Failed to update profile",
                    },
                }));
                return false;
            }
        } catch (err) {
            // 🔹 Handle network or unexpected error
            setServiceCall(false);
            return false;
        }
    };

    // Handle document file selection for experience
    const handleExperienceDocumentChange = (e, index) => {
        const file = e.target.files[0];
        if (file) {
            // Check file type (PDF, DOC, DOCX)
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                setRootContext((prevContext) => ({
                    ...prevContext,
                    toast: {
                        show: true,
                        dismiss: true,
                        type: "error",
                        title: "Invalid File",
                        message: 'Please upload PDF or Word documents only',
                    },
                }));
                return;
            }

            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                setRootContext((prevContext) => ({
                    ...prevContext,
                    toast: {
                        show: true,
                        dismiss: true,
                        type: "error",
                        title: "File Too Large",
                        message: 'File size should be less than 5MB',
                    },
                }));
                return;
            }

            // If we're in edit mode, update tempExperience immediately without preview
            if (editingExperienceIndex === index) {
                const tempUrl = URL.createObjectURL(file);
                setTempExperience(prev => ({
                    ...prev,
                    documentUrl: tempUrl,
                    document: file
                }));

                setRootContext((prevContext) => ({
                    ...prevContext,
                    toast: {
                        show: true,
                        dismiss: true,
                        type: "success",
                        title: "Document Selected",
                        message: 'Document will be saved when you save the experience',
                    },
                }));
            } else {
                // Show preview only for non-edit mode (view mode)
                setExpDocumentPreview({
                    show: true,
                    file: file,
                    index: index
                });
            }

            // Reset file input
            e.target.value = '';
        }
    };

    // Handle document file selection for education
    const handleEducationDocumentChange = (e, index) => {
        const file = e.target.files[0];
        if (file) {
            // Check file type (PDF, DOC, DOCX)
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                setRootContext((prevContext) => ({
                    ...prevContext,
                    toast: {
                        show: true,
                        dismiss: true,
                        type: "error",
                        title: "Invalid File",
                        message: 'Please upload PDF or Word documents only',
                    },
                }));
                return;
            }

            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                setRootContext((prevContext) => ({
                    ...prevContext,
                    toast: {
                        show: true,
                        dismiss: true,
                        type: "error",
                        title: "File Too Large",
                        message: 'File size should be less than 5MB',
                    },
                }));
                return;
            }

            // If we're in edit mode, update tempEducation immediately without preview
            if (editingEducationIndex === index) {
                const tempUrl = URL.createObjectURL(file);
                setTempEducation(prev => ({
                    ...prev,
                    documentUrl: tempUrl,
                    document: file
                }));

                setRootContext((prevContext) => ({
                    ...prevContext,
                    toast: {
                        show: true,
                        dismiss: true,
                        type: "success",
                        title: "Document Selected",
                        message: 'Document will be saved when you save the education',
                    },
                }));
            } else {
                // Show preview only for non-edit mode (view mode)
                setEduDocumentPreview({
                    show: true,
                    file: file,
                    index: index
                });
            }

            // Reset file input
            e.target.value = '';
        }
    };

    // Save experience document from preview (for view mode)
    const handleSaveExperienceDocument = async () => {
        if (!expDocumentPreview.file || expDocumentPreview.index === null) return;

        setUploadingExpDoc(expDocumentPreview.index);

        const success = await updateProfileWithDocuments(
            { experience: experience },
            [{ type: 'experience', file: expDocumentPreview.file, index: expDocumentPreview.index }]
        );

        if (success) {
            // Update local state with the new document
            const updated = [...experience];
            const tempUrl = URL.createObjectURL(expDocumentPreview.file);
            updated[expDocumentPreview.index] = {
                ...updated[expDocumentPreview.index],
                documentUrl: tempUrl,
                documentFile: expDocumentPreview.file
            };
            setExperience(updated);

            setRootContext((prevContext) => ({
                ...prevContext,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "success",
                    title: "Document Uploaded",
                    message: 'Experience document uploaded successfully',
                },
            }));
        }

        setUploadingExpDoc(null);
        setExpDocumentPreview({ show: false, file: null, index: null });
    };

    // Save education document from preview (for view mode)
    const handleSaveEducationDocument = async () => {
        if (!eduDocumentPreview.file || eduDocumentPreview.index === null) return;

        setUploadingEduDoc(eduDocumentPreview.index);

        const success = await updateProfileWithDocuments(
            { education: education },
            [{ type: 'education', file: eduDocumentPreview.file, index: eduDocumentPreview.index }]
        );

        if (success) {
            // Update local state with the new document
            const updated = [...education];
            const tempUrl = URL.createObjectURL(eduDocumentPreview.file);
            updated[eduDocumentPreview.index] = {
                ...updated[eduDocumentPreview.index],
                documentUrl: tempUrl,
                documentFile: eduDocumentPreview.file
            };
            setEducation(updated);

            setRootContext((prevContext) => ({
                ...prevContext,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "success",
                    title: "Document Uploaded",
                    message: 'Education document uploaded successfully',
                },
            }));
        }

        setUploadingEduDoc(null);
        setEduDocumentPreview({ show: false, file: null, index: null });
    };

    // Cancel document upload from preview
    const handleCancelExperienceDocument = () => {
        setExpDocumentPreview({ show: false, file: null, index: null });
    };

    const handleCancelEducationDocument = () => {
        setEduDocumentPreview({ show: false, file: null, index: null });
    };
    // Delete entire experience entry
    const handleRemoveExperience = async (index) => {
        setServiceCall(true);
        try {
            const res = await fetch(`/api/employees?id=${profile?._id}&index=${index}&type=experience&deleteType=entry`, {
                method: 'DELETE',
            });

            const data = await res.json();
            if (res.status) {
                setServiceCall(false);
            }
            mutated()
            if (!res.ok) {
                console.log("Error deleting experience:", data.error);
                setRootContext(prev => ({
                    ...prev,
                    toast: {
                        show: true,
                        dismiss: true,
                        type: "error",
                        title: "Failed",
                        message: data.error || "Failed to delete experience",
                    },
                }));
                return;
            }

            console.log("✅ Experience entry deleted successfully");

        } catch (err) {
            console.log("❌ Failed to delete experience:", err);
            setRootContext(prev => ({
                ...prev,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "error",
                    title: "Failed",
                    message: "Something went wrong while deleting experience",
                },
            }));
        }
    };

    // Delete only experience document (keep the entry)
    const handleRemoveExperienceDocument = async (index) => {
        setServiceCall(true);
        try {
            if (editingExperienceIndex === index) {
                setTempExperience(prev => ({
                    ...prev,
                    document: null,
                    documentUrl: ''
                }));
            }

            const res = await fetch(`/api/employees?id=${profile?._id}&index=${index}&type=experience&deleteType=document`, {
                method: 'DELETE',
            });
            if (res.status) {
                setServiceCall(false);
            }
            const data = await res.json();
            mutated();
            if (!res.ok) {
                console.log("Error deleting experience document:", data.error);
                setRootContext(prev => ({
                    ...prev,
                    toast: {
                        show: true,
                        dismiss: true,
                        type: "error",
                        title: "Failed",
                        message: data.error || "Failed to delete experience document",
                    },
                }));
                return;
            }
            console.log("✅ Experience document deleted successfully");

        } catch (err) {
            console.log("❌ Failed to delete experience document:", err);
            setRootContext(prev => ({
                ...prev,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "error",
                    title: "Failed",
                    message: "Something went wrong while deleting experience document",
                },
            }));
        }
    };

    // Delete entire education entry
    const handleRemoveEducation = async (index) => {
        setServiceCall(true);
        try {
            const res = await fetch(`/api/employees?id=${profile?._id}&index=${index}&type=education&deleteType=entry`, {
                method: 'DELETE',
            });

            const data = await res.json();
            if (res.status) {
                setServiceCall(false);
            }
            mutated()
            if (!res.ok) {
                console.log("Error deleting education:", data.error);
                setRootContext(prev => ({
                    ...prev,
                    toast: {
                        show: true,
                        dismiss: true,
                        type: "error",
                        title: "Failed",
                        message: data.error || "Failed to delete education",
                    },
                }));
                return;
            }
            console.log("✅ Education entry deleted successfully");

        } catch (err) {
            console.log("❌ Failed to delete education:", err);
            setRootContext(prev => ({
                ...prev,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "error",
                    title: "Failed",
                    message: "Something went wrong while deleting education",
                },
            }));
        }
    };

    // Delete only education document (keep the entry)
    const handleRemoveEducationDocument = async (index) => {
        setServiceCall(true);
        try {
            if (editingEducationIndex === index) {
                setTempEducation((prev) => ({
                    ...prev,
                    document: null,
                    documentUrl: ''
                }));
            }

            const res = await fetch(`/api/employees?id=${profile?._id}&index=${index}&type=education&deleteType=document`, {
                method: 'DELETE',
            });
            if (res.status) {
                setServiceCall(true);
            }
            const data = await res.json();
            mutated()
            if (!res.ok) {
                console.log("Error deleting education document:", data.error);
                setRootContext(prev => ({
                    ...prev,
                    toast: {
                        show: true,
                        dismiss: true,
                        type: "error",
                        title: "Failed",
                        message: data.error || "Failed to delete education document",
                    },
                }));
                return;
            }
            console.log("✅ Education document deleted successfully");

        } catch (err) {
            console.log("❌ Failed to delete education document:", err);
            setRootContext(prev => ({
                ...prev,
                toast: {
                    show: true,
                    dismiss: true,
                    type: "error",
                    title: "Failed",
                    message: "Something went wrong while deleting education document",
                },
            }));
        }
    };

    const DocumentPreviewModal = ({
        isOpen,
        onClose,
        onSave,
        file,
        type,
        index,
        uploading,
    }) => {
        if (!isOpen || !file) return null;

        const isPDF = file.type === "application/pdf";
        const fileUrl = URL.createObjectURL(file);

        // Prevent background scroll while modal open
        useEffect(() => {
            if (isOpen) document.body.style.overflow = "hidden";
            else document.body.style.overflow = "auto";
            return () => (document.body.style.overflow = "auto");
        }, [isOpen]);

        return (
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="documentPreviewTitle"
            >
                <div className="bg-white rounded-xl w-full sm:w-[96%] md:w-[86%] lg:w-[76%] xl:w-[66%] h-[85vh] flex flex-col overflow-hidden shadow-2xl">
                    {/* Header */}
                    <div className="flex justify-between items-center p-3 sm:p-4 border-b bg-gray-50">
                        <h3
                            id="documentPreviewTitle"
                            className="text-base sm:text-lg font-semibold text-gray-800 truncate"
                        >
                            Preview {type === "experience" ? "Experience" : "Education"} Document
                        </h3>

                        <button
                            onClick={onClose}
                            aria-label="Close document preview"
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <XMarkIcon className="w-5 h-5 text-gray-700" aria-hidden="true" />
                        </button>
                    </div>

                    {/* Document Preview */}
                    <div className="flex-1 overflow-auto p-3 sm:p-4 bg-white">
                        {isPDF ? (
                            <iframe
                                src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                                className="w-full h-full border rounded-lg"
                                title="Document Preview"
                            />
                        ) : (
                            <div className="text-center py-10 px-4">
                                <DocumentIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-700 font-medium text-sm sm:text-base">
                                    {file.name}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500 mt-2">
                                    Preview not available for this file type. Click Save to upload
                                    the document.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-0 p-3 sm:p-4 border-t bg-gray-50">
                        <div className="text-xs sm:text-sm text-gray-600 truncate">
                            <p>
                                <strong>File:</strong> {file.name}
                            </p>
                            <p>
                                <strong>Size:</strong>{" "}
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 sm:gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-300 transition-colors duration-200"
                                disabled={uploading}
                                aria-label="Cancel and close preview"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={onSave}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md flex items-center gap-2"
                                disabled={uploading}
                                aria-label="Save document"
                            >
                                {uploading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Uploading...
                                    </>
                                ) : (
                                    "Save Document"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const handleSaveSummary = async () => {
        const success = await updateProfileWithDocuments({ summary: tempSummary });
        if (success) {
            setEditingSummary(false);
            setSummary(tempSummary);
        }
    };

    const handleCancelSummary = () => {
        setEditingSummary(false);
        setTempSummary(summary);
    };

    // Handlers for Experience section
    const handleAddExperience = () => {
        const newExperience = {
            company: '',
            location: '',
            role: '',
            logo: dummyLogos[0],
            startDate: '',
            endDate: '',
            description: '',
            showDescription: false,
            documentUrl: '',
            document: null
        };
        const updatedExperiences = [newExperience, ...experience];
        setExperience(updatedExperiences);
        setEditingExperienceIndex(0);
        setTempExperience(newExperience);
    };

    const handleEditExperience = (index) => {
        setEditingExperienceIndex(index);
        setTempExperience({
            ...experience[index],
            document: null // Reset temporary document when starting edit
        });
    };

    const handleSaveExperience = async (index) => {
        const documents = [];

        // If there's a new document in tempExperience, include it for upload
        if (tempExperience.document && tempExperience.document instanceof File) {
            documents.push({ type: 'experience', file: tempExperience.document, index: index });
        }

        const updatedExperience = {
            company: tempExperience.company,
            location: tempExperience.location,
            role: tempExperience.role,
            logo: tempExperience.logo,
            startDate: tempExperience.startDate,
            endDate: tempExperience.endDate,
            description: tempExperience.description,
            documentUrl: tempExperience.documentUrl,
            showDescription: experience[index]?.showDescription || false
        };

        const updated = [...experience];
        updated[index] = updatedExperience;
        const sortedExperiences = sortExperiences(updated);
        setExperience(sortedExperiences);
        setEditingExperienceIndex(null);

        const success = await updateProfileWithDocuments({ experience: sortedExperiences }, documents);
        if (!success) {
            setExperience(experience);
        } else {
            // Clear the temporary document after successful save
            setTempExperience(prev => ({ ...prev, document: null }));
        }
    };

    const handleCancelExperience = () => {
        if (editingExperienceIndex !== null && !experience[editingExperienceIndex]?.company) {
            setExperience(experience.filter((_, i) => i !== editingExperienceIndex));
        }
        setEditingExperienceIndex(null);
        setTempExperience({
            company: '',
            location: '',
            role: '',
            logo: dummyLogos[0],
            startDate: '',
            endDate: '',
            description: '',
            document: null,
            documentUrl: ''
        });
    };


    const handleExperienceChange = (e, field) => {
        setTempExperience({ ...tempExperience, [field]: e.target.value });
    };

    const toggleDescription = (index) => {
        const updated = [...experience];
        updated[index].showDescription = !updated[index].showDescription;
        setExperience(updated);
    };

    // Handlers for Education section
    const handleAddEducation = () => {
        const newEducation = {
            degree: '',
            board: '',
            startYear: '',
            endYear: '',
            documentUrl: '',
            document: null
        };
        const updatedEducation = [newEducation, ...education];
        setEducation(updatedEducation);
        setEditingEducationIndex(0);
        setTempEducation(newEducation);
    };

    const handleEditEducation = (index) => {
        setEditingEducationIndex(index);
        setTempEducation({
            ...education[index],
            document: null // Reset temporary document when starting edit
        });
    };

    const handleSaveEducation = async (index) => {
        const documents = [];

        // If there's a new document in tempEducation, include it for upload
        if (tempEducation.document && tempEducation.document instanceof File) {
            documents.push({ type: 'education', file: tempEducation.document, index: index });
        }

        const updatedEducation = {
            degree: tempEducation.degree,
            board: tempEducation.board,
            startYear: tempEducation.startYear,
            endYear: tempEducation.endYear,
            years: `${tempEducation.startYear} - ${tempEducation.endYear}`,
            documentUrl: tempEducation.documentUrl
        };

        const updated = [...education];
        updated[index] = updatedEducation;
        const sortedEducation = sortEducation(updated);
        setEducation(sortedEducation);
        setEditingEducationIndex(null);

        const success = await updateProfileWithDocuments({ education: sortedEducation }, documents);
        if (!success) {
            setEducation(education);
        } else {
            // Clear the temporary document after successful save
            setTempEducation(prev => ({ ...prev, document: null }));
        }
    };

    const handleCancelEducation = () => {
        if (editingEducationIndex !== null && !education[editingEducationIndex]?.degree) {
            setEducation(education.filter((_, i) => i !== editingEducationIndex));
        }
        setEditingEducationIndex(null);
        setTempEducation({
            degree: '',
            board: '',
            startYear: '',
            endYear: '',
            document: null,
            documentUrl: ''
        });
    };

    const handleEducationChange = (e, field) => {
        setTempEducation({ ...tempEducation, [field]: e.target.value });
    };

    const handleSaveAccount = async () => {
        const success = await updateProfileWithDocuments({ accountDetails: tempAccount });
        if (success) {
            setAccountDetails(tempAccount);
            setEditingAccount(false);
        }
    };

    const handleSavePersonal = async () => {
        const success = await updateProfileWithDocuments(tempPersonal);
        if (success) {
            setTempPersonal(tempPersonal);
            setEditingPersonal(false);
        }
    };

    const handleCancelAccount = () => {
        setEditingAccount(false);
        setTempAccount(accountDetails);
    };

    // Initialize tempSummary when editing starts
    useEffect(() => {
        if (editingSummary) {
            setTempSummary(summary);
        }
    }, [editingSummary, summary]);

    return (
        <div className="sm:px-4 sm:py-8 space-y-8 md:space-y-10 text-gary-700">
            {serviceCall && <Loading />}

            {/* Document Preview Modals */}
            <DocumentPreviewModal
                isOpen={expDocumentPreview.show}
                onClose={handleCancelExperienceDocument}
                onSave={handleSaveExperienceDocument}
                file={expDocumentPreview.file}
                type="experience"
                index={expDocumentPreview.index}
                uploading={uploadingExpDoc === expDocumentPreview.index}
            />

            <DocumentPreviewModal
                isOpen={eduDocumentPreview.show}
                onClose={handleCancelEducationDocument}
                onSave={handleSaveEducationDocument}
                file={eduDocumentPreview.file}
                type="education"
                index={eduDocumentPreview.index}
                uploading={uploadingEduDoc === eduDocumentPreview.index}
            />

            {/* Summary Section */}
            <section className="bg-white rounded-xl p-2 sm:p-2 sm:p-6 shadow-lg border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Summary of {profile.name || 'Your Profile'}</h3>
                    <div className="flex space-x-3">
                        {editingSummary ? (
                            <>
                                <button
                                    onClick={handleSaveSummary}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={handleCancelSummary}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setPreviewSummary(!previewSummary)}
                                    className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                                    aria-label={previewSummary ? "Hide preview" : "Show preview"}
                                >
                                    {previewSummary ? (
                                        <EyeSlashIcon className="w-5 h-5 text-gray-600" />
                                    ) : (
                                        <EyeIcon className="w-5 h-5 text-gray-600" />
                                    )}
                                </button>
                                <button
                                    onClick={() => { setEditingSummary(true); setTempSummary(summary); }}
                                    className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                                    aria-label="Edit summary"
                                    disabled={isAddingOrEditing}
                                >
                                    <PencilIcon className={`w-5 h-5 ${isAddingOrEditing ? 'text-gray-400' : 'text-gray-600'}`} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                {editingSummary ? (
                    <div className="space-y-4">
                        <textarea
                            className="mt-2 w-full p-3 border border-gray-300 rounded-lg text-base text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-y"
                            rows={6}
                            value={tempSummary}
                            onChange={(e) => setTempSummary(e.target.value)}
                            placeholder="Write a comprehensive summary about your professional journey..."
                        />
                        {previewSummary && (
                            <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                <h4 className="font-semibold text-gray-700 mb-2">Preview:</h4>
                                <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">
                                    {tempSummary}
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">
                        {summary}
                    </p>
                )}
            </section>
            {/* Personal Details Section */}
            <section className="bg-white rounded-xl p-2 sm:p-6 text-gray-800 shadow-lg border border-gray-200 mb-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">PERSONAL DETAILS</h3>
                    {!editingPersonal ? (
                        <button
                            onClick={() => setEditingPersonal(true)}
                            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200 shadow-md"
                            aria-label="Edit personal details"
                            disabled={isAddingOrEditing}
                        >
                            <PencilIcon className="w-5 h-5" />
                        </button>
                    ) : null}
                </div>

                {editingPersonal ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={tempPersonal.name}
                                    onChange={(e) => setTempPersonal({ ...tempPersonal, name: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={tempPersonal.email}
                                    onChange={(e) => setTempPersonal({ ...tempPersonal, email: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                                <input
                                    type="text"
                                    value={tempPersonal.mobile || ''}
                                    onChange={(e) => setTempPersonal({ ...tempPersonal, mobile: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                <select
                                    value={tempPersonal.gender}
                                    onChange={(e) => setTempPersonal({ ...tempPersonal, gender: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                <input
                                    type="date"
                                    value={tempPersonal.dateOfBirth}
                                    onChange={(e) => setTempPersonal({ ...tempPersonal, dateOfBirth: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                                <input
                                    type="text"
                                    value={tempPersonal.panNumber}
                                    onChange={(e) => setTempPersonal({ ...tempPersonal, panNumber: e.target.value.toUpperCase() })}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 uppercase"
                                    placeholder="ABCDE1234F"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number</label>
                                <input
                                    type="number"
                                    value={tempPersonal.aadhaarNumber}
                                    onChange={(e) => setTempPersonal({ ...tempPersonal, aadhaarNumber: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="XXXX-XXXX-XXXX"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                                <input
                                    type="text"
                                    value={tempPersonal.designation}
                                    onChange={(e) => setTempPersonal({ ...tempPersonal, designation: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                <input
                                    type="text"
                                    value={tempPersonal.department}
                                    onChange={(e) => setTempPersonal({ ...tempPersonal, department: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Employee Code</label>
                                <input
                                    type="text"
                                    value={tempPersonal.employeeCode}
                                    onChange={(e) => setTempPersonal({ ...tempPersonal, employeeCode: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">CTC (₹)</label>
                                <input
                                    type="number"
                                    value={tempPersonal.ctc}
                                    onChange={(e) => setTempPersonal({ ...tempPersonal, ctc: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Regime</label>
                                <select
                                    value={tempPersonal.regime}
                                    onChange={(e) => setTempPersonal({ ...tempPersonal, regime: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="old">Old</option>
                                    <option value="new">New</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-4">
                            <button
                                onClick={handleSavePersonal}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md"
                            >
                                Save
                            </button>
                            <button
                                onClick={handleCancelPersonal}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                        <p><span className="font-semibold">Full Name:</span> {profile?.name || '-'}</p>
                        <p><span className="font-semibold">Email:</span> {profile?.email || '-'}</p>
                        <p><span className="font-semibold">Mobile:</span> {profile?.mobile || '-'}</p>
                        <p><span className="font-semibold">Gender:</span> {profile?.gender || '-'}</p>
                        <p><span className="font-semibold">Date of Birth:</span> {formatDateTime(profile?.dateOfBirth, "DD-MM-YYYY") || '-'}</p>
                        <p><span className="font-semibold">PAN Number:</span> {profile?.panNumber || '-'}</p>
                        <p><span className="font-semibold">Aadhaar Number:</span> {profile?.aadhaarNumber || '-'}</p>
                        <p><span className="font-semibold">Designation:</span> {profile?.designation || '-'}</p>
                        <p><span className="font-semibold">Department:</span> {profile?.department || '-'}</p>
                        <p><span className="font-semibold">Employee Code:</span> {profile?.employeeCode || '-'}</p>
                        <p><span className="font-semibold">CTC:</span> ₹{profile?.ctc || '-'}</p>
                        <p><span className="font-semibold">Regime:</span> {profile?.regime || '-'}</p>
                    </div>
                )}
            </section>


            {/* Account Details Section */}
            <section className="bg-white rounded-xl p-2 sm:p-6 text-gray-800 shadow-lg border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">ACCOUNT DETAILS</h3>
                    {!editingAccount ? (
                        <button
                            onClick={() => {
                                setEditingAccount(true);
                                setTempAccount(accountDetails || { accountHolderName: '', accountNumber: '', ifscCode: '', branch: '' });
                            }}
                            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200 shadow-md"
                            aria-label="Edit account details"
                            disabled={isAddingOrEditing}
                        >
                            <PencilIcon className="w-5 h-5" />
                        </button>
                    ) : null}
                </div>

                {editingAccount ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                                <input
                                    type="text"
                                    value={tempAccount.accountHolderName || ""}
                                    onChange={(e) => setTempAccount({ ...tempAccount, accountHolderName: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter Account Holder Name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                                <input
                                    type="number"
                                    value={tempAccount.accountNumber || ""}
                                    onChange={(e) => setTempAccount({ ...tempAccount, accountNumber: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g. 1234567890"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                                <input
                                    type="text"
                                    value={tempAccount.ifscCode || ""}
                                    onChange={(e) => setTempAccount({ ...tempAccount, ifscCode: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g. HDFC0001234"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                                <input
                                    type="text"
                                    value={tempAccount.branch || ""}
                                    onChange={(e) => setTempAccount({ ...tempAccount, branch: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g. Banjara Hills"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-4">
                            <button
                                onClick={handleSaveAccount}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md"
                            >
                                Save
                            </button>
                            <button
                                onClick={handleCancelAccount}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                        <p><span className="font-semibold">Account Holder Name:</span> {profile?.accountDetails?.accountHolderName || '-'}</p>
                        <p><span className="font-semibold">Account Number:</span> {profile?.accountDetails?.accountNumber || '-'}</p>
                        <p><span className="font-semibold">IFSC Code:</span> {profile?.accountDetails?.ifscCode || '-'}</p>
                        <p><span className="font-semibold">Branch:</span> {profile?.accountDetails?.branch || '-'}</p>
                    </div>
                )}
            </section>

            {/* Experience Section */}
            <section className="bg-white rounded-xl p-2 sm:p-6 shadow-lg border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">EXPERIENCE</h3>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setPreviewExperience(!previewExperience)}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                            aria-label={previewExperience ? "Hide preview" : "Show preview"}
                        >
                            {previewExperience ? (
                                <EyeSlashIcon className="w-5 h-5 text-gray-600" />
                            ) : (
                                <EyeIcon className="w-5 h-5 text-gray-600" />
                            )}
                        </button>
                        <button
                            onClick={handleAddExperience}
                            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200 shadow-md"
                            aria-label="Add experience"
                            disabled={isAddingOrEditing}
                        >
                            <PlusIcon className={`w-5 h-5 ${isAddingOrEditing ? 'text-gray-400' : 'text-white'}`} />
                        </button>
                    </div>
                </div>
                <div className="space-y-6">
                    {experience.length === 0 ? (
                        <p className="text-gray-600 text-center py-4">No experience added yet. Click the '+' button to add one.</p>
                    ) : (
                        experience.map((exp, index) => {
                            const isPresent = exp.endDate?.toLowerCase() === "present";

                            return (
                                <div
                                    key={index}
                                    className="flex flex-col border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm"
                                >
                                    {editingExperienceIndex === index ? (
                                        <div className="flex flex-col gap-3 w-full">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label htmlFor={`company-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                                                    <input
                                                        id={`company-${index}`}
                                                        className="w-full p-2 border border-gray-300 text-gray-700 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                                        value={tempExperience.company}
                                                        onChange={(e) => handleExperienceChange(e, 'company')}
                                                        placeholder="Company Name"
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor={`location-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                                    <input
                                                        id={`location-${index}`}
                                                        className="w-full p-2 border border-gray-300 text-gray-700 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                                        value={tempExperience.location}
                                                        onChange={(e) => handleExperienceChange(e, 'location')}
                                                        placeholder="Location"
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor={`role-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                                    <input
                                                        id={`role-${index}`}
                                                        className="w-full p-2 border border-gray-300 text-gray-700 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                                        value={tempExperience.role}
                                                        onChange={(e) => handleExperienceChange(e, 'role')}
                                                        placeholder="Your Role"
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor={`startDate-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                                    <input
                                                        id={`startDate-${index}`}
                                                        type="month"
                                                        className="w-full p-2 border border-gray-300 text-gray-700 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                                        value={tempExperience.startDate}
                                                        onChange={(e) => handleExperienceChange(e, 'startDate')}
                                                    />
                                                </div>

                                                {!isPresent && (
                                                    <div>
                                                        <label htmlFor={`endDate-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                                                            End Date
                                                        </label>
                                                        <input
                                                            id={`endDate-${index}`}
                                                            type="month"
                                                            className="w-full p-2 border border-gray-300 text-gray-700 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                                            value={tempExperience.endDate || ""}
                                                            onChange={(e) => handleExperienceChange(e, 'endDate')}
                                                        />
                                                    </div>
                                                )}

                                                <div className="flex items-center mt-1">
                                                    <input
                                                        id={`current-${index}`}
                                                        type="checkbox"
                                                        checked={tempExperience.endDate?.toLowerCase() === "present"}
                                                        onChange={(e) => {
                                                            handleExperienceChange({
                                                                target: { value: e.target.checked ? "Present" : "" },
                                                            }, 'endDate');
                                                        }}
                                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                    <label htmlFor={`current-${index}`} className="ml-2 text-sm text-gray-700">
                                                        Currently working here
                                                    </label>
                                                </div>

                                                <div className="md:col-span-2">
                                                    <label htmlFor={`description-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                    <textarea
                                                        id={`description-${index}`}
                                                        className="w-full p-2 border border-gray-300 text-gray-700 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 resize-y"
                                                        rows={4}
                                                        value={tempExperience.description}
                                                        onChange={(e) => handleExperienceChange(e, 'description')}
                                                        placeholder="Describe your responsibilities and achievements in this role."
                                                    />
                                                </div>

                                                {/* Document Upload for Experience */}
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Experience Document
                                                    </label>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.doc,.docx"
                                                            onChange={(e) => handleExperienceDocumentChange(e, index)}
                                                            className="hidden"
                                                            id={`exp-doc-${index}`}
                                                        />
                                                        <label
                                                            htmlFor={`exp-doc-${index}`}
                                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors duration-200 cursor-pointer"
                                                        >
                                                            <DocumentArrowUpIcon className="w-4 h-4" />
                                                            {tempExperience.document ? 'Change Document' : 'Upload Document'}
                                                        </label>

                                                        {tempExperience.documentUrl && (
                                                            <div className="flex items-center gap-2">
                                                                <a
                                                                    href={tempExperience.documentUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors duration-200"
                                                                >
                                                                    <DocumentIcon className="w-4 h-4" />
                                                                    View Document
                                                                </a>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveExperienceDocument(index)}
                                                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                                                                    aria-label="Remove document"
                                                                >
                                                                    <TrashIcon className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {tempExperience.document
                                                            ? `Selected: ${tempExperience.document.name}`
                                                            : 'Upload experience certificate, offer letter, or relevant document (PDF/DOC, max 5MB)'
                                                        }
                                                    </p>
                                                </div>
                                            </div>

                                            {previewExperience && (
                                                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white">
                                                    <h4 className="font-semibold text-gray-700 mb-3">Experience Preview:</h4>
                                                    <div className="flex items-center gap-4">
                                                        <img
                                                            src={tempExperience.logo || dummyLogos[index % dummyLogos.length]}
                                                            alt={`${tempExperience.company} Logo`}
                                                            className="w-12 h-12 object-contain border border-gray-200 rounded-full p-1 bg-white shadow-sm"
                                                        />
                                                        <div>
                                                            <h4 className="text-base font-semibold text-gray-900">{tempExperience.role || 'Your Role'}</h4>
                                                            <p className="text-sm text-gray-700">
                                                                {tempExperience.company || 'Company'} • {tempExperience.location || 'Location'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {tempExperience.startDate || 'Start Date'} – {tempExperience.endDate?.toLowerCase() === "present" ? (
                                                                    <span className="text-green-600 font-medium">Present</span>
                                                                ) : (
                                                                    tempExperience.endDate || 'End Date'
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className='flex gap-5 justify-between'>
                                                        {tempExperience.description && (
                                                            <div className="mt-3">
                                                                <p className="text-sm text-gray-800 whitespace-pre-line">
                                                                    {tempExperience.description}
                                                                </p>
                                                            </div>
                                                        )}
                                                        {tempExperience.documentUrl && (
                                                            <div className="mt-3">
                                                                <a
                                                                    href={tempExperience.documentUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors duration-200"
                                                                >
                                                                    <DocumentIcon className="w-4 h-4" />
                                                                    View Document
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex justify-end space-x-3 mt-4">
                                                <button
                                                    onClick={() => handleSaveExperience(index)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={handleCancelExperience}
                                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors duration-200"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col w-full">
                                            <div className="flex items-start justify-between w-full">
                                                <div className="flex items-center gap-4 mb-2">
                                                    <img
                                                        src={exp.logo || dummyLogos[index % dummyLogos.length] || "https://placehold.co/48x48/F0F0F0/000000?text=Logo"}
                                                        alt={`${exp.company} Logo`}
                                                        className="w-12 h-12 object-contain border border-gray-200 rounded-full p-1 bg-white shadow-sm"
                                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/48x48/F0F0F0/000000?text=Logo'; }}
                                                    />
                                                    <div>
                                                        <h4 className="text-base font-semibold text-gray-900">{exp.role}</h4>
                                                        <p className="text-sm text-gray-700">
                                                            {exp.company} • {exp.location}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {exp.startDate} – {isPresent ? (
                                                                <span className="text-green-600 font-medium">Present</span>
                                                            ) : (
                                                                exp.endDate
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                {isPresent && (
                                                    <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded-md shadow-sm">
                                                        Currently Working
                                                    </span>
                                                )}

                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleEditExperience(index)}
                                                        className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                                                        aria-label="Edit experience"
                                                        disabled={isAddingOrEditing && editingExperienceIndex !== index}
                                                    >
                                                        <PencilIcon className={`w-5 h-5 ${isAddingOrEditing && editingExperienceIndex !== index ? 'text-gray-400' : 'text-blue-600'}`} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveExperience(index)}
                                                        className="p-2 rounded-full hover:bg-red-100 transition-colors duration-200"
                                                        aria-label="Delete experience"
                                                        disabled={isAddingOrEditing}
                                                    >
                                                        <TrashIcon className={`w-5 h-5 ${isAddingOrEditing ? 'text-gray-400' : 'text-red-600'}`} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className='flex gap-5 sm:justify-between'>
                                                {exp.description && (
                                                    <div className="mt-2">
                                                        <button
                                                            onClick={() => toggleDescription(index)}
                                                            className="text-sm text-blue-600 hover:underline focus:outline-none"
                                                        >
                                                            {exp.showDescription ? 'Show Less' : 'Know More'}
                                                        </button>
                                                        {exp.showDescription && (
                                                            <p className="text-sm text-gray-800 mt-2 whitespace-pre-line">
                                                                {exp.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                                {/* Document display for non-editing mode */}
                                                {exp.documentUrl && (
                                                    <div className="mt-3">
                                                        <a
                                                            href={`${exp.documentUrl.replace(
                                                                "/upload/",
                                                                "/upload/fl_attachment:original_document/"
                                                            )}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors duration-200"
                                                        >
                                                            <DocumentIcon className="w-4 h-4" />
                                                            View Document
                                                        </a>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Document upload for non-editing mode */}
                                            {(!editingExperienceIndex && (exp.documentUrl === "" || !exp.documentUrl)) && (
                                                <div className="mt-3">
                                                    <input
                                                        type="file"
                                                        accept=".pdf,.doc,.docx"
                                                        onChange={(e) => handleExperienceDocumentChange(e, index)}
                                                        className="hidden"
                                                        id={`exp-doc-view-${index}`}
                                                    />
                                                    <label
                                                        htmlFor={`exp-doc-view-${index}`}
                                                        className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors duration-200 cursor-pointer"
                                                    >
                                                        <DocumentArrowUpIcon className="w-4 h-4" />
                                                        Upload Document
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </section>

            {/* Qualification Section */}
            <section className="bg-white rounded-xl p-2 sm:p-6 shadow-lg border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">QUALIFICATION</h3>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setPreviewEducation(!previewEducation)}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                            aria-label={previewEducation ? "Hide preview" : "Show preview"}
                        >
                            {previewEducation ? (
                                <EyeSlashIcon className="w-5 h-5 text-gray-600" />
                            ) : (
                                <EyeIcon className="w-5 h-5 text-gray-600" />
                            )}
                        </button>
                        <button
                            onClick={handleAddEducation}
                            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200 shadow-md"
                            aria-label="Add education"
                            disabled={isAddingOrEditing}
                        >
                            <PlusIcon className={`w-5 h-5 ${isAddingOrEditing ? 'text-gray-400' : 'text-white'}`} />
                        </button>
                    </div>
                </div>
                <div className="space-y-6">
                    {education.length === 0 ? (
                        <p className="text-gray-600 text-center py-4">No education added yet. Click the '+' button to add one.</p>
                    ) : (
                        education.map((edu, index) => (
                            <div key={index} className="flex flex-col md:flex-row items-start md:items-center border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm">
                                {editingEducationIndex === index ? (
                                    <div className="flex flex-col gap-3 w-full">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div>
                                                <label htmlFor={`degree-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                                                <input
                                                    id={`degree-${index}`}
                                                    className="w-full p-2 border border-gray-300 text-gray-700 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                                    value={tempEducation.degree}
                                                    onChange={(e) => handleEducationChange(e, 'degree')}
                                                    placeholder="e.g., Bachelor's Degree"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor={`board-${index}`} className="block text-sm font-medium text-gray-700 mb-1">University/Board</label>
                                                <input
                                                    id={`board-${index}`}
                                                    className="w-full p-2 border border-gray-300 text-gray-700 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                                    value={tempEducation.board}
                                                    onChange={(e) => handleEducationChange(e, 'board')}
                                                    placeholder="University/Board Name"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label htmlFor={`startYear-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Start Year</label>
                                                    <input
                                                        id={`startYear-${index}`}
                                                        type="month"
                                                        className="w-full p-2 border border-gray-300 text-gray-700 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                                        value={tempEducation.startYear}
                                                        onChange={(e) => handleEducationChange(e, 'startYear')}
                                                        placeholder="Start Year"
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor={`endYear-${index}`} className="block text-sm font-medium text-gray-700 mb-1">End Year</label>
                                                    <input
                                                        id={`endYear-${index}`}
                                                        type="month"
                                                        className="w-full p-2 border border-gray-300 text-gray-700 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                                        value={tempEducation.endYear}
                                                        onChange={(e) => handleEducationChange(e, 'endYear')}
                                                        placeholder="End Year"
                                                    />
                                                </div>
                                            </div>

                                            {/* Document Upload for Education */}
                                            <div className="md:col-span-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Education Document
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="file"
                                                        accept=".pdf,.doc,.docx"
                                                        onChange={(e) => handleEducationDocumentChange(e, index)}
                                                        className="hidden"
                                                        id={`edu-doc-${index}`}
                                                    />
                                                    <label
                                                        htmlFor={`edu-doc-${index}`}
                                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors duration-200 cursor-pointer"
                                                    >
                                                        <DocumentArrowUpIcon className="w-4 h-4" />
                                                        {tempEducation.document ? 'Change Document' : 'Upload Document'}
                                                    </label>

                                                    {tempEducation.documentUrl && (
                                                        <div className="flex items-center gap-2">
                                                            <a
                                                                href={`${tempEducation.documentUrl.replace(
                                                                    "/upload/",
                                                                    "/upload/fl_attachment:original_document/"
                                                                )}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors duration-200"
                                                            >
                                                                <DocumentIcon className="w-4 h-4" />
                                                                View Document
                                                            </a>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveEducationDocument(index)}
                                                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                                                                aria-label="Remove document"
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {tempEducation.document
                                                        ? `Selected: ${tempEducation.document.name}`
                                                        : 'Upload degree certificate, marksheet, or relevant document (PDF/DOC, max 5MB)'
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        {previewEducation && (
                                            <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white">
                                                <h4 className="font-semibold text-gray-700 mb-2">Education Preview:</h4>
                                                <div>
                                                    <h4 className="text-base font-semibold text-gray-900">{tempEducation.degree || 'Your Degree'}</h4>
                                                    <p className="text-sm text-gray-700">{tempEducation.board || 'University/Board'}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {tempEducation.startYear || 'Start'} - {tempEducation.endYear || 'End'}
                                                    </p>
                                                    {tempEducation.documentUrl && (
                                                        <div className="mt-2">
                                                            <a
                                                                href={tempEducation.documentUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors duration-200"
                                                            >
                                                                <DocumentIcon className="w-4 h-4" />
                                                                View Education Document
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-end space-x-3 mt-4">
                                            <button
                                                onClick={() => handleSaveEducation(index)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={handleCancelEducation}
                                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors duration-200"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex-1">
                                            <h4 className="text-base font-semibold text-gray-900">{edu.degree}</h4>
                                            <p className="text-sm text-gray-700">{edu.board}</p>
                                            <p className="text-xs text-gray-500">{edu.years || `${edu.startYear} - ${edu.endYear}`}</p>

                                            {/* Document display for non-editing mode */}
                                            {edu.documentUrl && (
                                                <div className="mt-2">
                                                    <a
                                                        href={`${edu.documentUrl.replace(
                                                            "/upload/",
                                                            "/upload/fl_attachment:original_document/"
                                                        )}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors duration-200"
                                                    >
                                                        <DocumentIcon className="w-4 h-4" />
                                                        View
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex space-x-2 ml-4">
                                            {/* Document upload for non-editing mode */}
                                            {!editingEducationIndex && (edu.documentUrl === "" || !edu.documentUrl) && (
                                                <div className="mr-2">
                                                    <input
                                                        type="file"
                                                        accept=".pdf,.doc,.docx"
                                                        onChange={(e) => handleEducationDocumentChange(e, index)}
                                                        className="hidden"
                                                        id={`edu-doc-view-${index}`}
                                                    />
                                                    <label
                                                        htmlFor={`edu-doc-view-${index}`}
                                                        className="inline-flex items-center gap-1 px-2 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors duration-200 cursor-pointer"
                                                        title="Upload Document"
                                                    >
                                                        <DocumentArrowUpIcon className="w-3 h-3" />
                                                        Upload
                                                    </label>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => handleEditEducation(index)}
                                                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                                                aria-label="Edit education"
                                                disabled={isAddingOrEditing && editingEducationIndex !== index}
                                            >
                                                <PencilIcon className={`w-5 h-5 ${isAddingOrEditing && editingEducationIndex !== index ? 'text-gray-400' : 'text-blue-600'}`} />
                                            </button>
                                            <button
                                                onClick={() => handleRemoveEducation(index)}
                                                className="p-2 rounded-full hover:bg-red-100 transition-colors duration-200"
                                                aria-label="Delete education"
                                                disabled={isAddingOrEditing}
                                            >
                                                <TrashIcon className={`w-5 h-5 ${isAddingOrEditing ? 'text-gray-400' : 'text-red-600'}`} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}