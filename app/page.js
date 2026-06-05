'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [role, setRole] = useState < string | null > (null);
  const [isLoading, setIsLoading] = useState(true); // track loading state

  useEffect(() => {
    // Safely get user_details from localStorage
    const stored = localStorage.getItem("user_details");
    let userDetails = null;
    try {
      userDetails = stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error("Invalid JSON in localStorage", e);
    }

    const storedRole = userDetails?.role || null;
    setRole(storedRole);
    setIsLoading(false); // done checking
  }, []);

  // Once loading is done, if no role, redirect to login
  useEffect(() => {
    if (!isLoading && !role) {
      router.push('/login'); // or any public route
    }
  }, [isLoading, role, router]);

  const handleGoToDashboard = () => {
    if (!role) return;
    switch (role) {
      case 'employee':
        router.push('/dashboard/employee');
        break;
      case 'manager':
        router.push('/dashboard/manager');
        break;
      case 'admin':
        router.push('/dashboard/admin');
        break;
      case 'super_admin':
        router.push('/dashboard/admin');
        break;
      default:
        router.push('/dashboard');
    }
  };

  // Show loading only while checking localStorage
  if (isLoading) {
    return <div className="min-h-screen text-center justify-center items-center bg-gray-50 p-4 text-gray-500">Loading...</div>;
  }

  // If role exists (user is logged in), show welcome + dashboard button
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">
        {role === 'employee' && 'Welcome, Employee!'}
        {role === 'manager' && 'Welcome, Manager!'}
        {role === 'admin' && 'Welcome, Admin!'}
      </h1>
      <p className="text-gray-600 mb-6 text-center">
        You have successfully logged in. Click the button below to go to your dashboard.
      </p>
      <button
        onClick={handleGoToDashboard}
        className="px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition"
      >
        Go to Dashboard
      </button>
    </div>
  );
}