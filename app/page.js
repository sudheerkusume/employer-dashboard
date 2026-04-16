'use client';

import { useContext } from 'react';
import { useRouter } from 'next/navigation';
import RootContext from './components/config/rootcontext';

export default function HomePage() {
  const { rootContext } = useContext(RootContext);
  const router = useRouter();
  const user = rootContext.user;
  const role = user?.role;

  const handleGoToDashboard = () => {
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
      default:
        router.push('/dashboard');
    }
  };

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