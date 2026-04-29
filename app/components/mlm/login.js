'use client';

import { useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import RootContext from '../config/rootcontext';

export default function LoginPage() {
    const router = useRouter();
    const [applicationId, setApplicationId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { setRootContext } = useContext(RootContext);

    // Static super admin credentials
    const SUPER_ADMIN_CODE = "SB-000000";
    const SUPER_ADMIN_NAME = "Bheema";

    const handleSubmit = async (e) => {
        e.preventDefault();
        const enteredCode = applicationId.trim().toUpperCase();
        if (!enteredCode) {
            setError('Please enter your user applicationId');
            return;
        }

        setLoading(true);
        setError('');

        // 🔐 STATIC SUPER ADMIN LOGIN
        if (enteredCode === SUPER_ADMIN_CODE) {
            // ✅ Define userData for super admin
            const userData = {
                isLoggedIn: true,
                userCode: SUPER_ADMIN_CODE,
                fullName: SUPER_ADMIN_NAME,
                level: 'GM',
                role: 'super_admin',
                isSuperAdmin: true
            };

            // Store in localStorage
            localStorage.setItem('mlm_user_code', SUPER_ADMIN_CODE);
            localStorage.setItem('mlm_user_role', 'super_admin');
            localStorage.setItem('mlm_user_name', SUPER_ADMIN_NAME);
            localStorage.setItem('mlm_user_level', 'GM');
            localStorage.setItem('mlm_is_super_admin', 'true');
            localStorage.setItem('user_details', JSON.stringify(userData)); // ✅ stringify

            // Update context
            setRootContext(prev => ({
                ...prev,
                mlmUser: userData,
                user: userData
            }));

            setLoading(false);
            router.push('/');
            return;
        }

        // Normal user login via API
        try {
            const res = await fetch(`/api/mlm/users?userId=${encodeURIComponent(enteredCode)}`);
            const data = await res.json();

            if (data.success) {
                const userData = {
                    isLoggedIn: true,
                    userCode: data.user.applicationId,
                    fullName: data.user.fullName,
                    level: data.user.level,
                    role: data.user.role || 'user',
                    isSuperAdmin: false
                };

                // Store user data
                localStorage.setItem('mlm_user_code', data.user.applicationId);
                localStorage.setItem('mlm_user_role', data.user.role || 'user');
                localStorage.setItem('mlm_user_name', data.user.fullName);
                localStorage.setItem('mlm_user_level', data.user.level);
                localStorage.setItem('mlm_is_super_admin', 'false');
                localStorage.setItem('user_details', JSON.stringify(userData)); // ✅ stringify

                // Update context
                setRootContext(prev => ({
                    ...prev,
                    mlmUser: userData,
                    user: userData
                }));

                router.push('/');
            } else {
                setError(data.error || 'Invalid user applicationId');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative text-gray-900 flex h-[100vh] w-full items-center justify-center overflow-hidden bg-[#FFC107] p-4">
            {/* Glass morphism background (unchanged) */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5"></div>
                <div className="absolute inset-0">
                    <div className="absolute top-0 -left-1/4 w-[150%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent rotate-12 animate-shimmer-slow"></div>
                    <div className="absolute top-0 -right-1/4 w-[150%] h-full bg-gradient-to-l from-transparent via-white/10 to-transparent -rotate-12 animate-shimmer-medium" style={{ animationDelay: '1.5s' }}></div>
                </div>
                <div className="absolute inset-0">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={`spot-${i}`}
                            className="absolute w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float-slow"
                            style={{
                                left: `${20 + i * 30}%`,
                                top: `${30 + i * 20}%`,
                                animationDelay: `${i * 2}s`,
                            }}
                        />
                    ))}
                </div>
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-300/20 rounded-full blur-3xl animate-pulse-slow"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-300/20 rounded-full blur-3xl animate-pulse-slower"></div>
                </div>
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }}></div>
            </div>

            {/* Floating glass particles */}
            <div className="absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full animate-glass-float"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${8 + Math.random() * 7}s`,
                            filter: 'blur(0.5px)'
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="absolute -inset-1 bg-white rounded-3xl blur-md"></div>
                <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
                    <div className="absolute inset-0 rounded-2xl bg-white/5 pointer-events-none"></div>
                    <div className="flex justify-center mb-4">
                        <Image
                            src="/salesbeez_logo.png"
                            alt="Logo"
                            width={200}
                            height={200}
                        />
                    </div>
                    <div>
                        <h2 className="mt-6 text-center text-2xl font-extrabold text-gray-900">
                            Sales Beez Member Login
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Enter your user applicationId to access your dashboard
                        </p>                       
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="applicationId" className="block text-sm font-medium text-gray-700">
                                Application ID / User Code
                            </label>
                            <input
                                id="applicationId"
                                name="applicationId"
                                type="text"
                                autoComplete="off"
                                required
                                value={applicationId}
                                onChange={(e) => setApplicationId(e.target.value.toUpperCase())}
                                placeholder="e.g., SB-000012"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                            />
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                        </div>

                        <div className="text-center text-sm">
                            <span className="text-gray-600">Don't have an account?</span>{' '}
                            <Link href="/mlm/register" className="text-yellow-600 hover:text-yellow-700 font-medium">
                                Register here
                            </Link>
                        </div>
                    </form>
                </div>
            </div>

            <style jsx>{`
                @keyframes shimmer-slow {
                    0% { transform: translateX(-150%) rotate(12deg); }
                    50% { transform: translateX(50%) rotate(12deg); }
                    100% { transform: translateX(150%) rotate(12deg); }
                }
                @keyframes shimmer-medium {
                    0% { transform: translateX(-150%) rotate(-12deg); }
                    50% { transform: translateX(50%) rotate(-12deg); }
                    100% { transform: translateX(150%) rotate(-12deg); }
                }
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
                    50% { transform: translateY(-20px) scale(1.1); opacity: 0.5; }
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.2; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(1.2); }
                }
                @keyframes pulse-slower {
                    0%, 100% { opacity: 0.15; transform: scale(1); }
                    50% { opacity: 0.3; transform: scale(1.3); }
                }
                @keyframes streak {
                    0% { transform: translateX(-100%); opacity: 0; }
                    20% { opacity: 0.5; }
                    80% { opacity: 0.5; }
                    100% { transform: translateX(200%); opacity: 0; }
                }
                @keyframes glass-float {
                    0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
                    25% { opacity: 0.5; }
                    50% { transform: translateY(-40px) translateX(10px) scale(1.5); opacity: 0.2; }
                    75% { opacity: 0.3; }
                    100% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
                }
                .animate-shimmer-slow { animation: shimmer-slow 8s ease-in-out infinite; }
                .animate-shimmer-medium { animation: shimmer-medium 10s ease-in-out infinite; }
                .animate-float-slow { animation: float-slow 12s ease-in-out infinite; }
                .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }
                .animate-pulse-slower { animation: pulse-slower 8s ease-in-out infinite; }
                .animate-streak { animation: streak 6s ease-in-out infinite; }
                .animate-glass-float { animation: glass-float 12s ease-in-out infinite; }
            `}</style>
        </div>
    );
}