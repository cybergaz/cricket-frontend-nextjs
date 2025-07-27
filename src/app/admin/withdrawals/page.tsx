"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, LoaderCircle, CheckCircle, Clock, AlertCircle, DollarSign, User, Calendar, Shield, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { getTokenFromCookies } from "@/lib/actions";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Types for withdrawal requests
interface WithdrawalRequest {
  _id: string;
  accountName: string;
  email: string;
  amount: number;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  phone: string;
  aadhar?: string;
  pan?: string;
  orderId: string;
  userMobile: string;
  createdAt: string;
  updatedAt: string;
}

interface WithdrawalResponse {
  withdrawals: WithdrawalRequest[];
  totalPages?: number;
  currentPage?: number;
}

const Withdrawals = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedWithdrawals, setSelectedWithdrawals] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [itemsPerPage] = useState<number>(10);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Fetch withdrawals from API
  const fetchWithdrawals = async (page: number = 1, search: string = "", status: string = "all"): Promise<void> => {
    setLoading(true);
    try {
      const token = getTokenFromCookies();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      let url = `${BACKEND_URL}/admin/fetch-all-withdrawals?page=${page}&limit=${itemsPerPage}`;
      if (search) {
        url += `&query=${encodeURIComponent(search)}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch withdrawals");
      }

      const data: WithdrawalResponse = await response.json();
      
      setWithdrawals(data.withdrawals || []);
      setCurrentPage(data.currentPage || page);
      setTotalPages(data.totalPages || 1);
      
      // Fetch transaction statuses for the withdrawals
      if (data.withdrawals && data.withdrawals.length > 0) {
        const orderIds = data.withdrawals.map((w: WithdrawalRequest) => w.orderId);
        fetchTransactionStatuses(orderIds);
      }
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      toast.error("Failed to fetch withdrawal requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals(currentPage, searchQuery, statusFilter);
  }, [currentPage, statusFilter]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setCurrentPage(1);
    fetchWithdrawals(1, searchQuery, statusFilter);
  };

  const handleStatusFilterChange = (status: string): void => {
    setStatusFilter(status);
    setCurrentPage(1);
    setSelectedWithdrawals([]);
  };

  const handleSelectWithdrawal = (orderId: string): void => {
    setSelectedWithdrawals(prev => 
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = (): void => {
    const selectableWithdrawals = withdrawals.filter(w => {
      const status = getTransactionStatus(w.orderId);
      return status === "Pending" || status === "Verified";
    });
    const selectableIds = selectableWithdrawals.map(w => w.orderId);
    
    if (selectedWithdrawals.length === selectableIds.length) {
      setSelectedWithdrawals([]);
    } else {
      setSelectedWithdrawals(selectableIds);
    }
  };

  const handleMarkAsVerified = async (): Promise<void> => {
    if (selectedWithdrawals.length === 0) {
      toast.error("Please select at least one withdrawal request");
      return;
    }

    try {
      setActionLoading(true);
      const token = getTokenFromCookies();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(`${BACKEND_URL}/admin/mark-withdrawal-verified`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ orderIds: selectedWithdrawals }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`${selectedWithdrawals.length} withdrawal request(s) marked as verified`);
        setSelectedWithdrawals([]);
        fetchWithdrawals(currentPage, searchQuery, statusFilter);
      } else {
        toast.error(data.message || "Failed to mark withdrawals as verified");
      }
    } catch (error) {
      console.error("Error marking withdrawals as verified:", error);
      toast.error("Failed to mark withdrawals as verified");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsCompleted = async (): Promise<void> => {
    if (selectedWithdrawals.length === 0) {
      toast.error("Please select at least one withdrawal request");
      return;
    }

    try {
      setActionLoading(true);
      const token = getTokenFromCookies();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(`${BACKEND_URL}/admin/mark-withdrawal-completed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ orderIds: selectedWithdrawals }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`${selectedWithdrawals.length} withdrawal request(s) marked as completed`);
        setSelectedWithdrawals([]);
        fetchWithdrawals(currentPage, searchQuery, statusFilter);
      } else {
        toast.error(data.message || "Failed to mark withdrawals as completed");
      }
    } catch (error) {
      console.error("Error marking withdrawals as completed:", error);
      toast.error("Failed to mark withdrawals as completed");
    } finally {
      setActionLoading(false);
    }
  };

  const [transactionStatuses, setTransactionStatuses] = useState<{[key: string]: string}>({});

  // Helper function to get transaction status
  const getTransactionStatus = (orderId: string): string => {
    return transactionStatuses[orderId] || "Pending";
  };

  // Fetch transaction statuses for all withdrawals
  const fetchTransactionStatuses = async (orderIds: string[]) => {
    if (orderIds.length === 0) return;
    
    try {
      const token = getTokenFromCookies();
      if (!token) return;

      const response = await fetch(`${BACKEND_URL}/admin/withdrawal-statuses?${orderIds.map(id => `orderIds=${id}`).join('&')}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.statuses) {
          const statusMap: {[key: string]: string} = {};
          data.statuses.forEach((item: {orderId: string, status: string}) => {
            statusMap[item.orderId] = item.status;
          });
          setTransactionStatuses(statusMap);
        }
      }
    } catch (error) {
      console.error("Error fetching transaction statuses:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "Verified":
        return <Shield className="h-4 w-4 text-blue-500" />;
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      Pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
      Verified: "bg-blue-500/20 text-blue-500 border-blue-500/30",
      Completed: "bg-green-500/20 text-green-500 border-green-500/30",
      Failed: "bg-red-500/20 text-red-500 border-red-500/30"
    };
    
    return (
      <Badge className={`${variants[status as keyof typeof variants]} font-medium`}>
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const pendingCount = withdrawals.filter(w => getTransactionStatus(w.orderId) === "Pending").length;
  const verifiedCount = withdrawals.filter(w => getTransactionStatus(w.orderId) === "Verified").length;

  return (
    <section className="bg-[#181a20] flex flex-col gap-5 rounded-2xl p-4 sm:p-8 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 text-white">
        <div>
          <h1 className="text-2xl font-bold">Withdrawal Requests</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage and process user withdrawal requests
          </p>
        </div>
        
        {selectedWithdrawals.length > 0 && (
          <div className="flex gap-2">
            <Button 
              onClick={handleMarkAsVerified}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={actionLoading}
            >
              <Shield className="h-4 w-4 mr-2" />
              Mark as Verified ({selectedWithdrawals.length})
            </Button>
            <Button 
              onClick={handleMarkAsCompleted}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={actionLoading}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Mark as Completed ({selectedWithdrawals.length})
            </Button>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, bank, or amount..."
              className="w-full px-4 py-2 rounded-md bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-white/20"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
          <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
            Search
          </Button>
        </form>

        {/* Status Filter */}
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => handleStatusFilterChange("all")}
            className="bg-purple-600 hover:bg-purple-700"
          >
            All
          </Button>
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            onClick={() => handleStatusFilterChange("pending")}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            Pending ({pendingCount})
          </Button>
          <Button
            variant={statusFilter === "verified" ? "default" : "outline"}
            onClick={() => handleStatusFilterChange("verified")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Verified ({verifiedCount})
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="w-full h-64 flex gap-3 justify-center items-center">
          <LoaderCircle className="animate-spin h-6 w-6" />
          <span className="text-white">Loading withdrawal requests...</span>
        </div>
      ) : (
        <>
          {withdrawals.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No withdrawal requests found</h3>
                <p className="text-gray-400 text-center">
                  {searchQuery || statusFilter !== "all" 
                    ? "Try adjusting your search or filter criteria"
                    : "There are no withdrawal requests to display at the moment"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Withdrawal Requests List */}
              <div className="space-y-4">
                {withdrawals.map((withdrawal) => {
                  const status = getTransactionStatus(withdrawal.orderId);
                  return (
                    <Card key={withdrawal._id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          {/* Selection and User Info */}
                          <div className="flex items-start gap-4 flex-1">
                            <Checkbox
                              checked={selectedWithdrawals.includes(withdrawal.orderId)}
                              onCheckedChange={() => handleSelectWithdrawal(withdrawal.orderId)}
                              disabled={status !== "Pending" && status !== "Verified"}
                              className="mt-1"
                            />
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <h3 className="font-semibold text-white">{withdrawal.accountName}</h3>
                                <span className="text-gray-400 text-sm">{withdrawal.email}</span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-green-400" />
                                  <span className="text-gray-300">Amount:</span>
                                  <span className="font-semibold text-white">{formatAmount(withdrawal.amount)}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-300">Bank:</span>
                                  <span className="text-white">{withdrawal.bankName}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-300">Account:</span>
                                  <span className="text-white">{withdrawal.accountNumber}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  <span className="text-gray-300">Requested:</span>
                                  <span className="text-white">{formatDate(withdrawal.createdAt)}</span>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-300">IFSC:</span>
                                  <span className="text-white">{withdrawal.ifsc}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-300">Phone:</span>
                                  <span className="text-white">{withdrawal.phone}</span>
                                </div>
                              </div>
                              
                              {(withdrawal.aadhar || withdrawal.pan) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-2">
                                  {withdrawal.aadhar && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-300">Aadhar:</span>
                                      <span className="text-white">{withdrawal.aadhar}</span>
                                    </div>
                                  )}
                                  
                                  {withdrawal.pan && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-300">PAN:</span>
                                      <span className="text-white">{withdrawal.pan}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="mt-2 text-xs text-gray-400">
                                Order ID: {withdrawal.orderId}
                              </div>
                            </div>
                          </div>
                          
                          {/* Status */}
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(status)}
                            <div className="flex items-center gap-1">
                              {getStatusIcon(status)}
                              <span className="text-xs text-gray-400">
                                {status === "Pending" ? "Awaiting verification" :
                                 status === "Verified" ? "Ready for payment" :
                                 status === "Completed" ? "Payment completed" : "Failed"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-400">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, withdrawals.length)} of {withdrawals.length} requests
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center px-4 py-2 text-white">
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
};

export default Withdrawals;
