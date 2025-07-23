'use client';

import { useState, useEffect, JSX } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import "dotenv/config"
import { Role } from "@/types/user";
import { getCookie } from "@/lib/helper";
import { UpdateRole } from "@/components/admin/update-role";
import TransactionActivity from "@/components/admin/transaction-activity";

// Define environment variables type-safe
declare global {
  interface Window {
    ENV: {
      NEXT_PUBLIC_BACKEND_URL: string;
      NEXT_PUBLIC_CLIENT_ID: string;
    }
  }
}

// Extract environment variables
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;

// API Service Layer with TypeScript
const dashboardApi = {
  getTotalUsers: async () => {
    const res = await fetch(`${BACKEND_URL}/admin/total-registered-users`);
    if (!res.ok) throw new Error('Failed to fetch total users');
    return res.json();
  },
  getActiveUsers: async () => {
    const res = await fetch(`${BACKEND_URL}/admin/total-active-users`);
    if (!res.ok) throw new Error('Failed to fetch active users');
    return res.json();
  },
  getCompanyProfit: async () => {
    const res = await fetch(`${BACKEND_URL}/admin/company-statement`,
      {

        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getCookie("token")}`,
        },
        credentials: "include",
      });
    if (!res.ok) throw new Error('Failed to fetch company statement');
    return res.json();
  },
  // getCompanyLoss: async () => {
  //   const res = await fetch(`${BACKEND_URL}/admin/company-loss`);
  //   if (!res.ok) throw new Error('Failed to fetch company loss');
  //   return res.json();
  // },
  getTeamMembers: async () => {
    const res = await fetch(`${BACKEND_URL}/admin/fetch-all-admins`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("token")}`,
      },
      credentials: "include",
    });
    if (!res.ok) throw new Error('Failed to fetch team members');
    return res.json();
  },
  getProfitableUsers: async () => {
    const res = await fetch(`${BACKEND_URL}/admin/fetch-profitable-users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("token")}`,
      },
      credentials: "include",
    });
    if (!res.ok) throw new Error('Failed to fetch team members');
    return res.json();
  },
  getLosingUsers: async () => {
    const res = await fetch(`${BACKEND_URL}/admin/fetch-users-having-loss`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("token")}`,
      },
      credentials: "include",
    });
    if (!res.ok) throw new Error('Failed to fetch team members');
    return res.json();
  },
  getTransactions: async () => {
    const res = await fetch(`${BACKEND_URL}/admin/fetch-total-transactions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("token")}`,
      },
      credentials: "include",
    });
    if (!res.ok) throw new Error('Failed to fetch total transactions');
    return res.json();
  },
};

// Custom Hook for Dashboard Data
const useDashboardData = () => {
  // Total Users
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [isTotalUsersLoading, setIsTotalUsersLoading] = useState<boolean>(true);
  const [totalUsersError, setTotalUsersError] = useState<string | null>(null);

  // Total Active Users
  const [totalActiveUsers, setTotalActiveUsers] = useState<number>(0);
  const [isTotalActiveUsersLoading, setIsTotalActiveUsersLoading] = useState<boolean>(true);
  const [totalActiveUsersError, setTotalActiveUsersError] = useState<string | null>(null);

  // Company Profit
  const [companyProfit, setCompanyProfit] = useState<any>(0);
  const [isCompanyProfitLoading, setIsCompanyProfitLoading] = useState<boolean>(true);
  const [companyProfitError, setCompanyProfitError] = useState<string | null>(null);

  // Company Loss
  // const [companyLoss, setCompanyLoss] = useState<number>(0);
  // const [isCompanyLossLoading, setIsCompanyLossLoading] = useState<boolean>(true);
  // const [companyLossError, setCompanyLossError] = useState<string | null>(null);

  const [teamMembers, setTeamMembers] = useState<{ _id: string, name: string, role: Role }[]>([]);
  const [isTeamMembersLoading, setIsTeamMembersLoading] = useState<boolean>(true);
  const [teamMembersError, setTeamMembersError] = useState<string | null>(null);

  const [profitableUsers, setProfitableUsers] = useState<number>(0);
  const [isProfitableUsersLoading, setProfitableUsersLoading] = useState<boolean>(true);
  const [profitableUsersError, setProfitableUsersError] = useState<string | null>(null);

  const [losingUsers, setLosingUsers] = useState<number>(0);
  const [isLosingUsersLoading, setLosingUsersLoading] = useState<boolean>(true);
  const [losingUsersError, setLosingUsersError] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<any>(null);
  const [isTransactionsLoading, setTransactionsLoading] = useState<boolean>(true);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  // Function to fetch individual metric with proper TypeScript
  const fetchMetric = async (
    apiCall: () => Promise<any>,
    setData: React.Dispatch<React.SetStateAction<any>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setError: React.Dispatch<React.SetStateAction<string | null>>,
    errorMessage: string
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiCall();
      setData(data.count || data.amount || data.data || data.profit || data.loss || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch each metric independently
    fetchMetric(
      dashboardApi.getTotalUsers,
      setTotalUsers,
      setIsTotalUsersLoading,
      setTotalUsersError,
      'Failed to fetch total users'
    );

    fetchMetric(
      dashboardApi.getActiveUsers,
      setTotalActiveUsers,
      setIsTotalActiveUsersLoading,
      setTotalActiveUsersError,
      'Failed to fetch total active users'
    );

    fetchMetric(
      dashboardApi.getCompanyProfit,
      setCompanyProfit,
      setIsCompanyProfitLoading,
      setCompanyProfitError,
      'Failed to fetch company profit'
    );

    // fetchMetric(
    //   dashboardApi.getCompanyLoss,
    //   setCompanyLoss,
    //   setIsCompanyLossLoading,
    //   setCompanyLossError,
    //   'Failed to fetch company loss'
    // );

    fetchMetric(
      dashboardApi.getTeamMembers,
      setTeamMembers,
      setIsTeamMembersLoading,
      setTeamMembersError,
      'Failed to fetch team members'
    );

    fetchMetric(
      dashboardApi.getProfitableUsers,
      setProfitableUsers,
      setProfitableUsersLoading,
      setProfitableUsersError,
      'Failed to fetch profitable users'
    );

    fetchMetric(
      dashboardApi.getLosingUsers,
      setLosingUsers,
      setLosingUsersLoading,
      setLosingUsersError,
      'Failed to fetch profitable users'
    );

    fetchMetric(
      dashboardApi.getTransactions,
      setTransactions,
      setTransactionsLoading,
      setTransactionsError,
      'Failed to fetch transactions'
    );
  }, []);

  return {
    totalUsers,
    isTotalUsersLoading,
    totalUsersError,
    totalActiveUsers,
    isTotalActiveUsersLoading,
    totalActiveUsersError,
    companyProfit,
    isCompanyProfitLoading,
    companyProfitError,
    // companyLoss,
    // isCompanyLossLoading,
    // companyLossError,
    teamMembers,
    isTeamMembersLoading,
    teamMembersError,
    profitableUsers,
    isProfitableUsersLoading,
    profitableUsersError,
    losingUsers,
    isLosingUsersLoading,
    losingUsersError,
    transactions,
    isTransactionsLoading,
    transactionsError,
  };
};

const Dashboard = (): JSX.Element => {
  const {
    totalUsers,
    isTotalUsersLoading,
    totalUsersError,
    totalActiveUsers,
    isTotalActiveUsersLoading,
    totalActiveUsersError,
    companyProfit,
    isCompanyProfitLoading,
    companyProfitError,
    // companyLoss,
    // isCompanyLossLoading,
    // companyLossError,
    teamMembers,
    isTeamMembersLoading,
    teamMembersError,
    profitableUsers,
    isProfitableUsersLoading,
    profitableUsersError,
    losingUsers,
    isLosingUsersLoading,
    losingUsersError,
    transactions,
    isTransactionsLoading,
    transactionsError,
  } = useDashboardData();

  // Helper function to render metric value
  const renderMetricValue = (
    value: number,
    isLoading: boolean,
    error: string | null
  ): JSX.Element | number => {
    if (isLoading) {
      return <div className="animate-pulse bg-[#181a20] h-12 w-24 rounded"></div>;
    }
    if (error) {
      return <div className="text-red-500 text-sm">Error loading data</div>;
    }
    return value;
  };
  console.log("companyProfit", transactions);

  return (
    <section className="w-full min-h-[calc(100vh-50px)]">
      <div className="flex flex-col min-[1500px]:flex-row gap-5 justify-between text-white w-full">
        {/* Main Content */}
        <div className="flex-1 order-2 lg:order-1 ">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold">Analytics</h1>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6">
            {/* div 1 */}
            <div className="bg-[#181a20] border-[#1e293b] rounded-2xl p-5 flex flex-col justify-between">
              <div className="text-4xl mb-2">
                {renderMetricValue(totalUsers, isTotalUsersLoading, totalUsersError)}
              </div>
              <div className="text-lg font-light mb-1">Total registered users</div>
            </div>

            {/* div 4 */}
            <div className="bg-[#181a20] border-[#1e293b] rounded-2xl p-5 flex flex-col justify-between">
              <div className="text-4xl mb-2">
                {renderMetricValue(totalActiveUsers, isTotalActiveUsersLoading, totalActiveUsersError)}
              </div>
              <div className="text-lg font-light mb-1">Total Active users</div>
            </div>

            {/* div 5 */}
            <div className="bg-[#181a20] border-[#1e293b] rounded-2xl p-5 flex flex-col justify-between">
              <div className="text-4xl mb-2">
                {renderMetricValue(profitableUsers, isProfitableUsersLoading, profitableUsersError)}
              </div>
              <div className="text-lg font-light mb-1">Users in profit</div>
            </div>

            {/* div 6 */}
            <div className="bg-[#181a20] border-[#1e293b] rounded-2xl p-5 flex flex-col justify-between">
              <div className="text-4xl mb-2">
                {renderMetricValue(losingUsers, isLosingUsersLoading, losingUsersError)}
              </div>
              <div className="text-lg font-light mb-1">Users in loss</div>
            </div>

            {/* div 2 */}
            <div className="bg-[#181a20] border-[#1e293b] rounded-2xl p-5 flex flex-col justify-between">
              <div className="text-4xl mb-2">
                {renderMetricValue(companyProfit.totalProfits, isCompanyProfitLoading, companyProfitError)}
              </div>
              <div className="text-lg font-light mb-1">Total company profit</div>
            </div>

            {/* div 3 */}
            <div className="bg-[#181a20] border-[#1e293b] rounded-2xl p-5 flex flex-col justify-between">
              <div className="text-4xl mb-2">
                {renderMetricValue(companyProfit.profitFromProfitableCuts, isCompanyProfitLoading, companyProfitError)}
              </div>
              <div className="text-lg font-light mb-1">Profit from 5% cuts</div>
            </div>

            <div className="bg-[#181a20] border-[#1e293b] rounded-2xl p-5 flex flex-col justify-between">
              <div className="text-4xl mb-2">
                {renderMetricValue(companyProfit.profitFromPlatformFees, isCompanyProfitLoading, companyProfitError)}
              </div>
              <div className="text-lg font-light mb-1">Profit from platform fee</div>
            </div>

            <div className="bg-[#181a20] border-[#1e293b] rounded-2xl p-5 flex flex-col justify-between">
              <div className="text-4xl mb-2">
                {renderMetricValue(companyProfit.profitFromAutoSell, isCompanyProfitLoading, companyProfitError)}
              </div>
              <div className="text-lg font-light mb-1">Profit from auto sell</div>
            </div>

            {/* <div className="bg-[#181a20] border-[#1e293b] rounded-2xl p-5 flex flex-col justify-between"> */}
            {/*   <div className="text-4xl mb-2"> */}
            {/*     {renderMetricValue(companyProfit.totalProfits, isCompanyProfitLoading, companyProfitError)} */}
            {/*   </div> */}
            {/*   <div className="text-lg font-light mb-1">Company Profit</div> */}
            {/* </div> */}

          </div>

          {/* Transaction Activity */}
          {
            transactions && <TransactionActivity transactions={transactions} />
          }

        </div>

        {/* Team Members Sidebar */}
        <div className="w-full h-[calc(100vh-50px)] overflow-y-scroll min-[1500px]:w-80 border-2 border-[#1e293b] rounded-2xl order-2 lg:order-1">
          <div className="text-xl bg-[#2f1d44] p-5 sticky top-0 font-bold ">Team members</div>
          <div className="space-y-4 p-4 sm:p-6 mb-6 lg:mb-0">
            {teamMembers.map((member, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  {/* <Avatar className="h-10 w-10 bg-gray-300"> */}
                  {/*   <AvatarImage src="/placeholder.svg" alt="Team member" /> */}
                  {/*   <AvatarFallback>TM</AvatarFallback> */}
                  {/* </Avatar> */}
                  <div className="ml-3">
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-gray-400">{member.role}</div>
                  </div>
                </div>
                <UpdateRole user_id={member._id}>Access</UpdateRole>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
