"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, LoaderCircle, CheckCircle, Clock, AlertCircle, DollarSign, User, Calendar } from "lucide-react";
import { toast } from "sonner";

// Types for withdrawal requests
interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  status: "pending" | "completed" | "rejected";
  requestDate: string;
  completedDate?: string;
  notes?: string;
}

// Dummy data for withdrawal requests
const dummyWithdrawals: WithdrawalRequest[] = [
  {
    id: "1",
    userId: "user1",
    userName: "Rahul Sharma",
    userEmail: "rahul.sharma@email.com",
    amount: 2500,
    bankName: "HDFC Bank",
    accountNumber: "****1234",
    ifscCode: "HDFC0001234",
    status: "pending",
    requestDate: "2024-01-15T10:30:00Z",
    notes: "User requested urgent processing"
  },
  {
    id: "2",
    userId: "user2",
    userName: "Priya Patel",
    userEmail: "priya.patel@email.com",
    amount: 5000,
    bankName: "ICICI Bank",
    accountNumber: "****5678",
    ifscCode: "ICIC0005678",
    status: "pending",
    requestDate: "2024-01-14T15:45:00Z"
  },
  {
    id: "3",
    userId: "user3",
    userName: "Amit Kumar",
    userEmail: "amit.kumar@email.com",
    amount: 1200,
    bankName: "SBI Bank",
    accountNumber: "****9012",
    ifscCode: "SBIN0009012",
    status: "completed",
    requestDate: "2024-01-13T09:15:00Z",
    completedDate: "2024-01-14T11:20:00Z"
  },
  {
    id: "4",
    userId: "user4",
    userName: "Neha Singh",
    userEmail: "neha.singh@email.com",
    amount: 3500,
    bankName: "Axis Bank",
    accountNumber: "****3456",
    ifscCode: "AXIS0003456",
    status: "rejected",
    requestDate: "2024-01-12T14:20:00Z",
    notes: "Insufficient balance in user account"
  },
  {
    id: "5",
    userId: "user5",
    userName: "Vikram Malhotra",
    userEmail: "vikram.malhotra@email.com",
    amount: 8000,
    bankName: "Kotak Bank",
    accountNumber: "****7890",
    ifscCode: "KOTK0007890",
    status: "pending",
    requestDate: "2024-01-11T16:30:00Z"
  },
  {
    id: "6",
    userId: "user6",
    userName: "Sneha Reddy",
    userEmail: "sneha.reddy@email.com",
    amount: 1800,
    bankName: "Canara Bank",
    accountNumber: "****2345",
    ifscCode: "CNRB0002345",
    status: "pending",
    requestDate: "2024-01-10T12:45:00Z"
  },
  {
    id: "7",
    userId: "user7",
    userName: "Arjun Mehta",
    userEmail: "arjun.mehta@email.com",
    amount: 4200,
    bankName: "PNB Bank",
    accountNumber: "****6789",
    ifscCode: "PUNB0006789",
    status: "completed",
    requestDate: "2024-01-09T08:15:00Z",
    completedDate: "2024-01-10T10:30:00Z"
  },
  {
    id: "8",
    userId: "user8",
    userName: "Kavya Iyer",
    userEmail: "kavya.iyer@email.com",
    amount: 6500,
    bankName: "Union Bank",
    accountNumber: "****0123",
    ifscCode: "UBIN0000123",
    status: "pending",
    requestDate: "2024-01-08T13:20:00Z"
  }
];

const Withdrawals = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedWithdrawals, setSelectedWithdrawals] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [itemsPerPage] = useState<number>(5);

  // Simulate API call
  const fetchWithdrawals = async (page: number = 1, search: string = "", status: string = "all"): Promise<void> => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let filteredData = [...dummyWithdrawals];
      
      // Apply status filter
      if (status !== "all") {
        filteredData = filteredData.filter(item => item.status === status);
      }
      
      // Apply search filter
      if (search) {
        filteredData = filteredData.filter(item =>
          item.userName.toLowerCase().includes(search.toLowerCase()) ||
          item.userEmail.toLowerCase().includes(search.toLowerCase()) ||
          item.bankName.toLowerCase().includes(search.toLowerCase()) ||
          item.amount.toString().includes(search)
        );
      }
      
      // Calculate pagination
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      setWithdrawals(paginatedData);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filteredData.length / itemsPerPage));
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

  const handleSelectWithdrawal = (withdrawalId: string): void => {
    setSelectedWithdrawals(prev => 
      prev.includes(withdrawalId)
        ? prev.filter(id => id !== withdrawalId)
        : [...prev, withdrawalId]
    );
  };

  const handleSelectAll = (): void => {
    const pendingWithdrawals = withdrawals.filter(w => w.status === "pending");
    const pendingIds = pendingWithdrawals.map(w => w.id);
    
    if (selectedWithdrawals.length === pendingIds.length) {
      setSelectedWithdrawals([]);
    } else {
      setSelectedWithdrawals(pendingIds);
    }
  };

  const handleMarkAsCompleted = async (): Promise<void> => {
    if (selectedWithdrawals.length === 0) {
      toast.error("Please select at least one withdrawal request");
      return;
    }

    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update local state
      setWithdrawals(prev => prev.map(w => 
        selectedWithdrawals.includes(w.id) 
          ? { ...w, status: "completed" as const, completedDate: new Date().toISOString() }
          : w
      ));
      
      setSelectedWithdrawals([]);
      toast.success(`${selectedWithdrawals.length} withdrawal request(s) marked as completed`);
      
      // Refresh data
      fetchWithdrawals(currentPage, searchQuery, statusFilter);
    } catch (error) {
      console.error("Error marking withdrawals as completed:", error);
      toast.error("Failed to mark withdrawals as completed");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
      completed: "bg-green-500/20 text-green-500 border-green-500/30",
      rejected: "bg-red-500/20 text-red-500 border-red-500/30"
    };
    
    return (
      <Badge className={`${variants[status as keyof typeof variants]} font-medium`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
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

  const pendingCount = withdrawals.filter(w => w.status === "pending").length;

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
          <Button 
            onClick={handleMarkAsCompleted}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={loading}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Completed ({selectedWithdrawals.length})
          </Button>
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
            variant={statusFilter === "completed" ? "default" : "outline"}
            onClick={() => handleStatusFilterChange("completed")}
            className="bg-green-600 hover:bg-green-700"
          >
            Completed
          </Button>
          <Button
            variant={statusFilter === "rejected" ? "default" : "outline"}
            onClick={() => handleStatusFilterChange("rejected")}
            className="bg-red-600 hover:bg-red-700"
          >
            Rejected
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
                {withdrawals.map((withdrawal) => (
                  <Card key={withdrawal.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        {/* Selection and User Info */}
                        <div className="flex items-start gap-4 flex-1">
                          <Checkbox
                            checked={selectedWithdrawals.includes(withdrawal.id)}
                            onCheckedChange={() => handleSelectWithdrawal(withdrawal.id)}
                            disabled={withdrawal.status !== "pending"}
                            className="mt-1"
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <h3 className="font-semibold text-white">{withdrawal.userName}</h3>
                              <span className="text-gray-400 text-sm">{withdrawal.userEmail}</span>
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
                                <span className="text-white">{formatDate(withdrawal.requestDate)}</span>
                              </div>
                            </div>
                            
                            {withdrawal.completedDate && (
                              <div className="flex items-center gap-2 mt-2">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                <span className="text-gray-300">Completed:</span>
                                <span className="text-white">{formatDate(withdrawal.completedDate)}</span>
                              </div>
                            )}
                            
                            {withdrawal.notes && (
                              <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                                <p className="text-yellow-400 text-sm">{withdrawal.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Status */}
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(withdrawal.status)}
                          <div className="flex items-center gap-1">
                            {getStatusIcon(withdrawal.status)}
                            <span className="text-xs text-gray-400">
                              {withdrawal.status === "pending" ? "Awaiting approval" :
                               withdrawal.status === "completed" ? "Processed" : "Rejected"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
