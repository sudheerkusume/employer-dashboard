'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [userCode, setUserCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userCode.trim()) {
            setError('Please enter your user code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/mlm/users?code=${encodeURIComponent(userCode.toUpperCase())}`);
            const data = await res.json();

            if (data.success) {
                // Store user data in localStorage
                localStorage.setItem('mlm_user_code', data.user.userCode);
                localStorage.setItem('mlm_user_name', data.user.fullName);
                localStorage.setItem('mlm_user_level', data.user.level);
                // Redirect to dashboard
                router.push('/mlm/dashboard');
            } else {
                setError(data.error || 'Invalid user code');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        MLM Member Login
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Enter your user code to access your dashboard
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="userCode" className="block text-sm font-medium text-gray-700">
                            User Code
                        </label>
                        <input
                            id="userCode"
                            name="userCode"
                            type="text"
                            autoComplete="off"
                            required
                            value={userCode}
                            onChange={(e) => setUserCode(e.target.value.toUpperCase())}
                            placeholder="e.g., ME-001"
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
    );
}