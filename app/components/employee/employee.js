"use client";
import React, { useState, useEffect, useContext } from 'react';
import { PencilIcon } from '@heroicons/react/24/solid';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import AboutMe from './about';
import Attendance from './attendance';
import HRPolicy from './hrpolicy';
import Payslip from './payslip';
import ButtonTab from '../common/buttontab';
import RootContext from '../config/rootcontext';
import { Mutated } from '../config/useswrfetch';

const tabs = [
    { name: 'About Me', component: AboutMe },
    { name: 'Attendance', component: Attendance },
    { name: 'HR Policy', component: HRPolicy },
    { name: 'Payslips', component: Payslip },
];

function EmployeeProfile({ employeesData }) {
    const [activeTab, setActiveTab] = useState(0);
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        image: '',
        summary: '',
        experience: [],
        education: [],
    });
    const [editingHeader, setEditingHeader] = useState(false);
    const [tempProfile, setTempProfile] = useState(profile);
    const [accordionOpen, setAccordionOpen] = useState(null);

    const { rootContext } = useContext(RootContext);

    // Get userId from localStorage

    useEffect(() => {
        if (employeesData) {
            setProfile(employeesData);
            setTempProfile(employeesData);
        }
    }, [employeesData]);

    const ActiveComponent = tabs[activeTab].component;

    const user_details =
        typeof window !== 'undefined'
            ? JSON.parse(localStorage.getItem('user_details') || '{}')
            : {};


    const role = user_details?.role || "";
    const employeeID = user_details.userId;
    const mutated = Mutated(employeeID ? `/api/employees?id=${employeeID}` : null)

    const handleSaveHeader = async () => {
        try {
            const res = await fetch(`/api/employees`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: employeeID,
                    name: `${tempProfile.name}`,
                    email: tempProfile.email,
                    role: role
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setProfile(data);
                setTempProfile(data);
                setEditingHeader(false);
                mutated();
            } else {
                alert(data.error || 'Failed to update profile');
            }
        } catch (err) {
            console.error('Update Error:', err);
            alert('Something went wrong while updating profile');
        }
    };

    return (
        <div className="mt-20 bg-white min-h-screen">
            {/* Header Section */}
            <div className="fixed inset-0 bg-white z-[-1]" />
            <div className="max-w-5xl border border-gray-200 bg-white rounded-t-xl mx-auto relative shadow-sm">
                <div className="p-6 flex flex-col sm:flex-row items-center gap-4 relative z-10">
                    <div className="absolute -top-12 left-6 sm:left-6">
                        <img
                            src={tempProfile.image || 'https://placehold.co/80x80/F0F0F0/000000?text=Logo'}
                            alt="Avatar"
                            className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl border-4 border-white object-cover shadow-lg"
                        />
                    </div>

                    <div className="flex-1 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 w-full ml-0 sm:ml-40">
                        <div className="flex-1">
                            {editingHeader ? (
                                <div className="flex flex-col gap-2 text-gray-700">
                                    <input
                                        className="border p-1 rounded w-full"
                                        value={tempProfile.name || ""}
                                        placeholder='Enter First Name'
                                        onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                                    />
                                    <input
                                        className="border p-1 rounded w-full"
                                        value={tempProfile.email || ""}
                                        onChange={(e) => setTempProfile({ ...tempProfile, email: e.target.value })}
                                    />
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            className="px-3 py-1 bg-blue-600 text-white rounded"
                                            onClick={handleSaveHeader}
                                        >
                                            Save
                                        </button>
                                        <button
                                            className="px-3 py-1 border border-gray-400 rounded"
                                            onClick={() => setEditingHeader(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{profile.name}</h2>
                                    <p className="text-sm sm:text-base text-gray-600">{profile.title}</p>
                                    <p className="text-xs sm:text-sm text-gray-500">{profile.email}</p>
                                </div>
                            )}
                        </div>

                        {!editingHeader && rootContext?.user?.role !== 'recruiter' && (
                            <button
                                onClick={() => {
                                    setEditingHeader(true);
                                    setTempProfile(profile);
                                }}
                                className="text-gray-600 hover:text-gray-900 mt-2 sm:mt-0"
                            >
                                <PencilIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs Section */}
            <div className="bg-white border-b border-gray-200 max-w-5xl mx-auto px-4 py-6 rounded-b-md shadow-sm">
                {rootContext?.user?.role === 'recruiter' ? (
                    <AboutMe profile={profile} />
                ) : (
                    <>
                        {/* Desktop Tabs */}
                        <div className="hidden sm:block">
                            <ButtonTab tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
                            <div className="py-3">
                                <ActiveComponent profile={profile} />
                            </div>
                        </div>

                        {/* Mobile Accordion */}
                        <div className="sm:hidden">
                            {tabs.map((tab, index) => {
                                const Component = tab.component;
                                const isOpen = accordionOpen === index;
                                return (
                                    <div key={tab.name} className="border-b border-gray-200">
                                        <button
                                            onClick={() => setAccordionOpen(isOpen ? null : index)}
                                            className="w-full flex justify-between items-center py-2 px-2 bg-gray-50 text-left"
                                        >
                                            <span className="font-medium text-gray-700 text-sm">{tab.name}</span>
                                            <ChevronDownIcon
                                                className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                        {isOpen && (
                                            <div className="p-2">
                                                <Component profile={profile} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default EmployeeProfile;
