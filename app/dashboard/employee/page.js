'use client'
import Error from "@/app/components/common/error";
import Loading from "@/app/components/common/loading";
import { useSWRFetch } from "@/app/components/config/useswrfetch";
import EmployeeProfile from "@/app/components/employee/employee";

export default function EmployeeDashboard() {

  const user_details =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('user_details') || '{}')
      : {};


  const userId = user_details?.userId || "";
  const { data, error, isLoading } = useSWRFetch(userId ? `/api/employees?id=${userId}` : null);
  if (error) { return <Error /> }
  return <div className="">
    {isLoading && <Loading />}
    <EmployeeProfile employeesData={data} />
  </div>
    ;
}
