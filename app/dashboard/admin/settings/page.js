"use client";
import React, { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSWRFetch } from "@/app/components/config/useswrfetch";
import Loading from "@/app/components/common/loading";
import Error from "@/app/components/common/error";
import RootContext from "@/app/components/config/rootcontext";
import { 
    Settings, Building2, Globe, Shield, Save, Building, Mail, Phone, 
    MapPin, Clock, Calendar, Lock, AlertCircle 
} from "lucide-react";

export default function AdminSettings() {
    const { rootContext, setRootContext } = useContext(RootContext);
    const { data: initialSettings, error, isLoading, mutate } = useSWRFetch("/api/settings");
    
    const [activeTab, setActiveTab] = useState("organization");
    const [settings, setSettings] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (initialSettings) {
            setSettings(initialSettings);
        }
    }, [initialSettings]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings)
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || "Failed to save settings");
            
            mutate();
            setRootContext((prev) => ({
                ...prev,
                toast: { show: true, dismiss: true, type: "success", title: "Success", message: "Settings saved successfully." },
            }));
        } catch (err) {
            setRootContext((prev) => ({
                ...prev,
                toast: { show: true, dismiss: true, type: "error", title: "Error", message: err.message },
            }));
        } finally {
            setIsSaving(false);
        }
    };

    if (error) return <Error />;
    if (isLoading) return <Loading />;

    const tabs = [
        { id: "organization", name: "Organization Profile", icon: Building2 },
        { id: "system", name: "System Preferences", icon: Globe },
        { id: "security", name: "Security & Policies", icon: Shield },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans text-gray-900">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">
                        <Settings className="text-orange-500 w-8 h-8" /> 
                        Admin <span className="text-orange-500">Settings</span>
                    </h1>
                    <p className="text-gray-500 mt-1">Manage global system configurations and organization profile.</p>
                </div>
                
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 transition-all disabled:opacity-70"
                >
                    <Save size={18} />
                    {isSaving ? "Saving..." : "Save Changes"}
                </button>
            </div>

            {/* Layout */}
            <div className="flex flex-col lg:flex-row gap-8">
                
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 shrink-0">
                    <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col gap-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                                    activeTab === tab.id 
                                    ? "bg-orange-50 text-orange-600" 
                                    : "text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                <tab.icon size={18} className={activeTab === tab.id ? "text-orange-500" : "text-gray-400"} />
                                {tab.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                    <AnimatePresence mode="wait">
                        
                        {activeTab === "organization" && (
                            <motion.div
                                key="organization"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6">Organization Profile</h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <Building size={16} className="text-gray-400" /> Company Name
                                        </label>
                                        <input 
                                            type="text" 
                                            value={settings.organizationName || ""}
                                            onChange={(e) => setSettings({...settings, organizationName: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <Mail size={16} className="text-gray-400" /> Official Email
                                        </label>
                                        <input 
                                            type="email" 
                                            value={settings.organizationEmail || ""}
                                            onChange={(e) => setSettings({...settings, organizationEmail: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <Phone size={16} className="text-gray-400" /> Support Phone
                                        </label>
                                        <input 
                                            type="text" 
                                            value={settings.organizationPhone || ""}
                                            onChange={(e) => setSettings({...settings, organizationPhone: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <Building2 size={16} className="text-gray-400" /> Tax / Registration ID (GSTIN)
                                        </label>
                                        <input 
                                            type="text" 
                                            value={settings.taxId || ""}
                                            onChange={(e) => setSettings({...settings, taxId: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <MapPin size={16} className="text-gray-400" /> Physical Address
                                        </label>
                                        <textarea 
                                            rows="3"
                                            value={settings.address || ""}
                                            onChange={(e) => setSettings({...settings, address: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all font-medium resize-none"
                                        ></textarea>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "system" && (
                            <motion.div
                                key="system"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6">System Preferences</h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <Clock size={16} className="text-gray-400" /> Default Work Start Time
                                        </label>
                                        <input 
                                            type="time" 
                                            value={settings.defaultWorkHoursStart || "09:30"}
                                            onChange={(e) => setSettings({...settings, defaultWorkHoursStart: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <Clock size={16} className="text-gray-400" /> Default Work End Time
                                        </label>
                                        <input 
                                            type="time" 
                                            value={settings.defaultWorkHoursEnd || "18:30"}
                                            onChange={(e) => setSettings({...settings, defaultWorkHoursEnd: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <Globe size={16} className="text-gray-400" /> System Timezone
                                        </label>
                                        <select 
                                            value={settings.timezone || "Asia/Kolkata"}
                                            onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all font-medium bg-white"
                                        >
                                            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                                            <option value="America/New_York">America/New_York (EST)</option>
                                            <option value="Europe/London">Europe/London (GMT)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <Calendar size={16} className="text-gray-400" /> Default Currency
                                        </label>
                                        <select 
                                            value={settings.currency || "INR"}
                                            onChange={(e) => setSettings({...settings, currency: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all font-medium bg-white"
                                        >
                                            <option value="INR">INR (₹)</option>
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2 md:col-span-2 pt-4 border-t border-gray-100 mt-4">
                                        <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900">Enable EOD System</h3>
                                                <p className="text-xs text-gray-500 mt-1">Turns on the End-of-Day reporting flow (Day Plan & Evening Updates) for all employees and managers.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    className="sr-only peer"
                                                    checked={settings.eodEnabled ?? true}
                                                    onChange={(e) => setSettings({...settings, eodEnabled: e.target.checked})}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "security" && (
                            <motion.div
                                key="security"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6">Security & Policies</h2>
                                
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-6">
                                    <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                                    <div>
                                        <h4 className="text-sm font-bold text-amber-800">Password Policies</h4>
                                        <p className="text-xs text-amber-700 mt-1">These rules apply to all new employees and when existing employees change their passwords.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <Lock size={16} className="text-gray-400" /> Minimum Password Length
                                        </label>
                                        <input 
                                            type="number" 
                                            value={settings.passwordPolicyLength || "8"}
                                            onChange={(e) => setSettings({...settings, passwordPolicyLength: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <Calendar size={16} className="text-gray-400" /> Password Expiry (Days)
                                        </label>
                                        <input 
                                            type="number" 
                                            value={settings.passwordPolicyExpiry || "90"}
                                            onChange={(e) => setSettings({...settings, passwordPolicyExpiry: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all font-medium"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
