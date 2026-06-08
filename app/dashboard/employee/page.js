'use client'
import Error from "@/app/components/common/error";
import Loading from "@/app/components/common/loading";
import { useSWRFetch } from "@/app/components/config/useswrfetch";
import EmployeeProfile from "@/app/components/employee/employee";
import { formatDateTime } from "@/app/components/config/sitesettings";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext } from "react";
import RootContext from "@/app/components/config/rootcontext";

export default function EmployeeDashboard() {
  const router = useRouter();
  const { rootContext, setRootContext } = useContext(RootContext);
  const user_details =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('user_details') || '{}')
      : {};

  const userId = user_details?.userId || "";
  const { data, error, isLoading } = useSWRFetch(userId ? `/api/employees?id=${userId}` : null);
  
  if (error) { return <Error /> }

  const handleLogout = () => {
    localStorage.clear();
    let resp = rootContext;
    resp.authenticated = false;
    setRootContext({ ...resp });
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans pb-16">
      
      {/* Sleek Top Navigation Bar for Employee */}
      <nav className="bg-white border-b border-gray-200/60 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <img 
               src={require('../accets/logo.png').default?.src || require('../accets/logo.png')} 
               alt="Realbeez Logo" 
               className="w-8 h-8 rounded-lg object-contain"
             />
             <h1 className="text-sm font-bold text-gray-900 tracking-tight">Sales Beez <span className="font-normal text-gray-500">Workspace</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
             <p className="hidden md:block text-xs font-mono text-gray-400">
               {formatDateTime(new Date().toISOString(), "ddd • MMM DD, YYYY")}
             </p>
             <div className="h-6 w-px bg-gray-200"></div>
             <button 
               onClick={handleLogout}
               className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors"
             >
               <LogOut size={16} /> <span className="hidden sm:inline">Sign Out</span>
             </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 pt-8">
        {isLoading && <Loading />}
        <EmployeeProfile employeesData={data} />
      </div>
    </div>
  );
}
