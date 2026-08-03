'use client'
import Error from "@/app/components/common/error";
import Loading from "@/app/components/common/loading";
import { useSWRFetch } from "@/app/components/config/useswrfetch";
import EmployeeProfile from "@/app/components/employee/employee";
import { formatDateTime } from "@/app/components/config/sitesettings";
import { LogOut, Target, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext, useState, useEffect } from "react";
import RootContext from "@/app/components/config/rootcontext";
import BirthdayCelebration from "@/app/components/common/BirthdayCelebration";
import EodModal from "@/app/components/EodModal";

export default function EmployeeDashboard() {
  const router = useRouter();
  const { rootContext, setRootContext } = useContext(RootContext);
  const user_details =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('user_details') || '{}')
      : {};

  const userId = user_details?._id || user_details?.userId || user_details?.userCode || "";
  const { data, error, isLoading } = useSWRFetch(userId ? `/api/employees?id=${userId}` : null);
  const { data: allEmployees } = useSWRFetch('/api/employees');
  const { data: globalSettings } = useSWRFetch('/api/settings');

  if (error) { return <Error /> }

  const [showMorningModal, setShowMorningModal] = useState(false);
  const [showEveningModal, setShowEveningModal] = useState(false);
  const [todayPlan, setTodayPlan] = useState(null);
  const [pendingMorningModal, setPendingMorningModal] = useState(false);

  useEffect(() => {
    if (pendingMorningModal && !rootContext?.toast?.show) {
      setShowMorningModal(true);
      setPendingMorningModal(false);
    }
  }, [pendingMorningModal, rootContext?.toast?.show]);

  useEffect(() => {
    if (!userId || globalSettings?.eodEnabled === false) return;

    // Do not ask for Morning Plan on Weekends (Sunday=0)
    const todayDay = new Date().getDay();
    if (todayDay === 0) {
      return;
    }

    const checkMorningPlan = async () => {
      try {
        // Use IST date format to match backend standard (YYYY-MM-DD)
        const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        // const today = "2026-08-15"
        const res = await fetch(`/api/eod?role=employee&id=${userId}`);
        const data = await res.json();

        if (data.success && data.reports) {
          const todaysReport = data.reports.find(report => report.date === today);
          if (!todaysReport) {
            // Check for previous reports to extract roll-over tasks
            const previousReports = data.reports.filter(r => r.date < today).sort((a, b) => new Date(b.date) - new Date(a.date));
            if (previousReports.length > 0) {
              const lastReport = previousReports[0];
              const updateText = lastReport.eveningUpdate || '';

              const getSectionText = (startMarker, nextMarkers) => {
                const startIdx = updateText.indexOf(startMarker);
                if (startIdx === -1) return '';
                let endIdx = updateText.length;
                for (const marker of nextMarkers) {
                  const idx = updateText.indexOf(marker);
                  if (idx !== -1 && idx > startIdx && idx < endIdx) {
                    endIdx = idx;
                  }
                }
                return updateText.substring(startIdx, endIdx);
              };

              const completedSection = getSectionText('Completed Today:', ['In Progress:', 'Not Yet Picked / Unplanned Tasks:', 'Blocked:', 'Additional Accomplishments:']);

              const rolloverTasks = [];
              if (lastReport.morningPlan) {
                const pastTasks = lastReport.morningPlan.split('\n').filter(line => line.trim() !== '');
                for (const task of pastTasks) {
                  const cleanTask = task.replace(/^\[ROLLOVER\]\s*/, '');
                  if (!completedSection.includes(cleanTask)) {
                    rolloverTasks.push(`[ROLLOVER] ${cleanTask}`);
                  }
                }
              }

              if (rolloverTasks.length > 0) {
                const morningPlan = rolloverTasks.join('\n');
                try {
                  const payload = {
                    action: 'morning_plan',
                    employeeId: userId,
                    employeeName: user_details?.fullName || user_details?.name || 'Unknown Employee',
                    department: user_details?.designation || user_details?.role || 'Other',
                    content: morningPlan
                  };
                  const submitRes = await fetch('/api/eod', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  });
                  if (submitRes.ok) {
                    setTodayPlan({ morningPlan, status: 'pending', date: today, eveningUpdate: '' });
                    return; // Skip showing morning modal because we auto-generated
                  }
                } catch (err) {
                  console.error("Failed to auto-rollover tasks:", err);
                }
              }
            }
            // Wait for toast to disappear before showing modal
            setPendingMorningModal(true);
          } else {
            setTodayPlan(todaysReport);
            if (!todaysReport.morningPlan || todaysReport.morningPlan.trim() === '') {
              // Wait for toast to disappear before showing modal
              setPendingMorningModal(true);
            }
          }
        }
      } catch (err) {
        console.error("Failed to check morning plan:", err);
      }
    };
    checkMorningPlan();
  }, [userId]);

  const handleLogoutClick = async () => {
    if (globalSettings?.eodEnabled === false) {
      actualLogoutFunction();
      return;
    }

    // If it's a weekend (Sunday), bypass the evening modal and just logout
    const todayDay = new Date().getDay();
    if (todayDay === 0) {
      actualLogoutFunction();
      return;
    }

    if (userId) {
      try {
        const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        const res = await fetch(`/api/eod?role=employee&id=${userId}`);
        const data = await res.json();
        if (data.success && data.reports) {
          const todaysReport = data.reports.find(report => report.date === today);
          if (todaysReport) {
            setTodayPlan(todaysReport);

            // Validate if EOD is fully complete based on the database
            let morningTasks = [];
            if (todaysReport.morningPlan) {
              if (todaysReport.morningPlan.includes('<')) {
                const doc = new DOMParser().parseFromString(todaysReport.morningPlan, 'text/html');
                const listItems = doc.querySelectorAll('body > ul > li, body > ol > li');
                if (listItems.length > 0) {
                  morningTasks = Array.from(listItems).map(li => li.textContent.trim());
                } else {
                  morningTasks = [doc.body.textContent.trim()];
                }
              } else {
                morningTasks = todaysReport.morningPlan.split('\n').filter(l => l.trim());
              }
            }

            const eveningUpdate = todaysReport.eveningUpdate || '';

            let allTasksAddressed = true;
            if (morningTasks.length > 0) {
              // Every morning task must be mentioned in the evening update
              for (const task of morningTasks) {
                const cleanTask = task.replace(/^\[ROLLOVER\]\s*/, '');
                if (!eveningUpdate.includes(cleanTask)) {
                  allTasksAddressed = false;
                  break;
                }
              }
            } else {
              // If they had no morning tasks, they must have at least typed an evening update
              if (eveningUpdate.trim() === '') {
                allTasksAddressed = false;
              }
            }

            if (allTasksAddressed && eveningUpdate.trim() !== '') {
              // They have fully completed their EOD inline! Bypass modal!
              actualLogoutFunction();
              return;
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch latest plan before logout:", err);
      }
    }
    setShowEveningModal(true);
  };

  const actualLogoutFunction = () => {
    localStorage.clear();
    let resp = rootContext;
    resp.authenticated = false;
    setRootContext({ ...resp });
    router.push("/");
  };

  const submitEod = async (formData) => {
    const payload = {
      employeeId: user_details?._id || user_details?.userCode || user_details?.userId || 'unknown_id',
      employeeName: user_details?.fullName || user_details?.name || 'Unknown Employee',
      department: data?.department || user_details?.designation || user_details?.role || 'Other',
      managerId: null,
      ...formData
    };
    try {
      const res = await fetch('/api/eod', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        if (formData.action === 'morning_plan') {
          setShowMorningModal(false);
          setTodayPlan({ morningPlan: formData.content, status: 'pending' });
        } else if (formData.action === 'evening_update') {
          setShowEveningModal(false);
          actualLogoutFunction();
        }
      }
    } catch (err) {
      console.error(err);
    }
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
              onClick={handleLogoutClick}
              className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut size={16} /> <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 pt-8">
        {isLoading && <Loading />}


        <EmployeeProfile employeesData={data} todayPlan={todayPlan} />
      </div>

      <BirthdayCelebration currentUser={user_details} allEmployees={allEmployees} />

      <EodModal
        type="morning"
        isOpen={showMorningModal}
        onClose={() => setShowMorningModal(false)}
        onSubmit={submitEod}
      />

      <EodModal
        type="evening"
        isOpen={showEveningModal}
        onClose={() => {
          setShowEveningModal(false);
          actualLogoutFunction(); // Log out anyway if they skip
        }}
        onSubmit={submitEod}
        todayPlan={todayPlan}
      />
    </div>
  );
}
