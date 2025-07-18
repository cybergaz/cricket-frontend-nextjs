"use client"

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Download,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  RefreshCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TransactionModal } from "./components/transaction-modal";
import { load } from "@cashfreepayments/cashfree-js";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import WithdrawModal from "./components/withdrawl";
import { Transaction, UserV2 } from "@/types/user";
import { formatINR } from "@/lib/helper";


let cashfree: any = null;
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL

export default function MoneyTransactionsPage() {
  const searchParams = useSearchParams()
  const odrId = searchParams.get("ODR")
  const router = useRouter()

  const [addtxnAmount, setAddtxnAmount] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [depositsAvailable, setDepositsAvailable] = useState(false)
  const [withdrawlAvailable, setWithdrawlAvailable] = useState(false)
  const [transactionsAvailable, setTransactionsAvailable] = useState(false)
  const [user, setUser] = useState<UserV2>()
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction>()
  const [transactions, setTransactions] = useState<Transaction[]>()
  const [searchQuery, setSearchQuery] = useState("")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [paymentSessionId, setPaymentSessionId] = useState('');
  const [paymentLink, setPaymentLink] = useState('');

  useEffect(() => {
    setDepositsAvailable(true)
    setTransactionsAvailable(true)
    setWithdrawlAvailable(true)
  }, [])

  useEffect(() => {
    (async () => {
      cashfree = await load({ mode: "production" });
    })();
  }, []);
  useEffect(() => {
    (async () => {
      try {
        const getTokenFromCookies = () => {
          if (typeof document === "undefined") return null;
          const cookies = document.cookie.split("; ");
          const tokenCookie = cookies.find((cookie) => cookie.startsWith("token="));
          return tokenCookie ? tokenCookie.split("=")[1] : null;
        };
        const token = getTokenFromCookies();
        const res = await fetch(`${BACKEND}/user/data`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });
        const data = await res.json();
        if (data.data && data.success) {
          setUser(data.data);
          console.log(data.data.transactions)
          if (data.data.transactions) {
            setTransactions(data.data.transactions);
          }

        } else {
          toast(data?.message || "Failed to fetch user data");
        }
      } catch (e: any) {
        toast("Error fetching user data: " + (e?.message || e));
      }
    })();

  }, []);
  useEffect(() => {
    if (odrId) {
      (async () => {
        try {
          const getTokenFromCookies = () => {
            if (typeof document === "undefined") return null;
            const cookies = document.cookie.split("; ");
            const tokenCookie = cookies.find((cookie) => cookie.startsWith("token="));
            return tokenCookie ? tokenCookie.split("=")[1] : null;
          };
          const token = getTokenFromCookies();
          const res = await fetch(`${BACKEND}/payment/order/check/${odrId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              status: "Completed"
            }),
            credentials: 'include',
          });

          const data = await res.json();
          if (!data.status) {
            toast(data.message);
            return
          }
          toast(data.message);
        } catch (e: any) {
          toast("Error verifying payment: " + (e?.message || e));
          return
        } finally {
          setTimeout(() => {
            refreshTransactions()
          }, 1000);
        }
      })();
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete("ODR");
    router.replace(`/wallet?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const exportTransactions = () => {
    if (!transactions || transactions.length === 0) {
      alert("No transactions to export.");
      return;
    }
    // Prepare CSV header
    const headers = [
      "ID",
      "Type",
      "Status",
      "Amount",
      "Txn Date",
      "Reference",
      "Remarks"
    ];
    // Prepare CSV rows
    const rows = transactions.map((t) => [
      t._id ?? "",
      t.type ?? "",
      t.status ?? "",
      t.amount ?? "",
      t.txnDate
        ? new Date(t.txnDate).toLocaleString("en-IN", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
        : ""
    ]);
    // Convert to CSV string
    const csvContent =
      [headers, ...rows]
        .map((row) =>
          row
            .map((field) =>
              typeof field === "string" && (field.includes(",") || field.includes('"') || field.includes("\n"))
                ? `"${field.replace(/"/g, '""')}"`
                : field
            )
            .join(",")
        )
        .join("\r\n");
    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  const refreshTransactions = () => {
    setIsRefreshing(true);
    window.location.reload();
  }
  const createOrder = async () => {
    try {
      const toastID = toast.loading(`Creating Order For ₹ ${addtxnAmount}`)
      const orderBody = {
        name: user?.name,
        mobile: user?.mobile,
        amount: addtxnAmount
      }
      // Get token from cookies
      const getTokenFromCookies = () => {
        if (typeof document === "undefined") return null;
        const cookies = document.cookie.split("; ");
        const tokenCookie = cookies.find((cookie) => cookie.startsWith("token="));
        return tokenCookie ? tokenCookie.split("=")[1] : null;
      };
      const token = getTokenFromCookies();

      const response = await fetch(`${BACKEND}/payment/order/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderBody),
        credentials: 'include',
      });


      const data = await response.json();
      console.log(data)
      if (data.success) {
        setPaymentSessionId(data.orderDetails.paymentSessionId);
        setPaymentLink(data.orderDetails.paymentSessionId);
        toast.dismiss(toastID)
        toast("Click Pay to continue.");
      } else {
        toast("Failed to create order.");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast("Something went wrong while creating the payment.");
    }
  };

  const doPayment = async () => {
    if (!paymentSessionId) {
      toast("Please create an order first.");
      return;
    }
    const checkoutOptions = {
      paymentSessionId: paymentSessionId,
      redirectTarget: "_blank",
    };

    try {
      setPaymentLink("")
      setPaymentSessionId("")
      const result = await cashfree.checkout(checkoutOptions);

      console.log("Payment Result:", result);

      if (result?.paymentDetails?.order?.order_status === "PAID") {
        toast("Payment successful!");
      } else if (result.error) {
        toast("Payment failed or cancelled.");
      }
    } catch (err) {
      console.error("Checkout Error:", err);
      toast("Something went wrong during payment.");
    }
  };

  const presettxnAmounts = [
    "₹100",
    "₹500",
    "₹1,000",
    "₹5,000",
    "₹7,500",
    "₹10,000",
    "₹12,500",
    "₹15,000",
    "₹17,500",
    "₹20,000",
    "₹22,500",
    "₹25,000",

  ];

  const parsetxnAmount = (txnAmount: string) => txnAmount.replace(/[^\d]/g, "")

  const handleTransactionClick = (transaction: any) => {
    setSelectedTransaction(transaction)
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("")
    setPaymentMethodFilter("all")
    setStatusFilter("all")
    setDateRange({ from: undefined, to: undefined })
  }

  const filteredTransactions = transactions
    ? transactions.filter((transaction) => {
      const query = searchQuery.toLowerCase();
      return (
        transaction.tID?.toLowerCase().includes(query) ||
        transaction.method?.toLowerCase().includes(query) ||
        transaction.amount?.toString().includes(query) ||
        transaction.type?.toLowerCase().includes(query) ||
        transaction.status?.toLowerCase().includes(query) ||
        (transaction.txnDate && new Date(transaction.txnDate).toLocaleString("en-IN", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).toLowerCase().includes(query))
      );
    })
    : [];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-tl from-transparent via-transparent to-sky-600/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-transparent border-t-white/70 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-white/70 rounded-full animate-pulses"></div>
                </div>
              </div>
            </div>
            <CardTitle className="text-xl font-semibold text-white/70">Loading Wallet Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
          </CardContent>
        </Card>
      </div>)
  }
  return (
    <div className="p-5 h-full min-h-screen bg-gradient-to-tl from-transparent via-transparent to-sky-600/30">
      <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-white">My Wallet</h1>
            <p className="text-gray-400 text-lg font-bold">
              Manage your wallet, view your available balance, and keep track of all your deposit and withdrawal transactions
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Button
              variant="outline"
              size="sm"
              className="border-spacing-x-0.5 border-transparent bg-white/10 text-white hover:bg-white/70 hover:text-gray-800 p-4 sm:size-default"
            >
              <span
                className="flex items-center cursor-pointer"
                onClick={() => exportTransactions()}
              >
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Export Transactions</span>
                <span className="sm:hidden">Export</span>
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-spacing-x-0.5 border-transparent bg-white/10 text-white hover:bg-white/70 hover:text-gray-800 p-4 sm:size-default relative overflow-hidden"
              onClick={() => refreshTransactions()}
            >
              <span className="flex items-center cursor-pointer select-none">
                <span className="relative flex items-center">
                  <RefreshCcw
                    className={`mr-2 h-4 w-4 transition-transform duration-500 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  {isRefreshing && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-6 h-6 rounded-full animate-spin opacity-40"></span>
                    </span>
                  )}
                </span>
                <span className={`transition-opacity duration-300 ${isRefreshing ? "opacity-50" : "opacity-100"}`}>Refresh</span>
              </span>
            </Button>
            {/* Add this state at the top of your component: */}
            {/* const [isRefreshing, setIsRefreshing] = useState(false); */}
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 mb-6 sm:mb-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-gradient-to-br from-emerald-600 via-transparent to-transparent rounded-none rounded-tl-[80px] pl-10">
            <CardHeader className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
              <CardTitle className="text-2xl text-white">Available Balance</CardTitle>
              <CardDescription className="text-lg text-gray-400">Current funds in your wallet</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center">
                <Wallet className="h-10 w-10 mr-3 text-emerald-500" />
                <div>
                  <div className="text-3xl font-bold text-white">{formatINR(user?.amount)}</div>
                  <p className="mt-1 text-sm text-gray-400">
                    Last updated :{" "}
                    {user?.lastSeen
                      ? (() => {
                        const diffMs = Date.now() - new Date(user.lastSeen).getTime()
                        const diffSec = Math.floor(diffMs / 1000)
                        const hours = Math.floor(diffSec / 3600)
                        const minutes = Math.floor((diffSec % 3600) / 60)
                        return `${hours} hrs ${minutes} mins ago`
                      })()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-sky-600 via-transparent to-transparent rounded-none rounded-tl-[80px] pl-10">
            <CardHeader className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
              <CardTitle className="text-2xl text-white">Total Deposited</CardTitle>
              <CardDescription className="text-lg text-gray-400">All-time deposits to platform</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center">
                <ArrowDownLeft className="h-10 w-10 mr-3 text-blue-400" />
                <div>
                  <div className="text-3xl font-bold text-white">
                    {formatINR(
                      (transactions ?? [])
                        .filter((transaction) => transaction.type === "Deposit" && transaction.status === "Completed")
                        .reduce((sum, transaction) => {
                          const amount = Number(
                            (transaction.amount ?? "0").toString().replace(/,/g, "")
                          );
                          return sum + (isNaN(amount) ? 0 : amount);
                        }, 0),
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-400">
                    Across {(transactions ?? [])
                      .filter((transaction) => transaction.type === "Deposit").length} deposits
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-600 via-transparent to-transparent rounded-none rounded-tl-[80px] pl-10">
            <CardHeader className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
              <CardTitle className="text-2xl text-white">Total Withdrawls</CardTitle>
              <CardDescription className="text-lg text-gray-400">All-time withdrawals from platform</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center">
                <ArrowUpRight className="h-10 w-10 mr-3 text-orange-600" />
                <div>
                  <div className="text-3xl font-bold text-white">
                    {formatINR(
                      (transactions ?? [])
                        .filter((transaction) => transaction.type === "withdrawal")
                        .reduce((sum, transaction) => {
                          const amount = Number(
                            (transaction.amount ?? "0").toString().replace(/,/g, "")
                          );
                          return sum + (isNaN(amount) ? 0 : amount);
                        }, 0),
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-400">
                    Across {(transactions ?? [])
                      .filter((transaction) => transaction.type === "withdrawal").length} withdrawals
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          {/* Quick Add Money Card */}
          <Card className="bg-gradient-to-br from-gray-600/30 via-transparent to-transparent rounded-none rounded-tl-4xl mt-10">

            <CardHeader className="px-7 py-2">
              <div className="flex justify-between">
                <div>
                  <CardTitle className="text-4xl text-white">Add Funds</CardTitle>
                  <CardDescription className="text-lg text-gray-400">Add funds to your wallet</CardDescription>
                </div>

                <WithdrawModal />

              </div>
            </CardHeader>
            <CardContent className="px-7">
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {presettxnAmounts.map((txnAmount) => (
                    <Button
                      key={txnAmount}
                      variant="outline"
                      onClick={() => setAddtxnAmount(parsetxnAmount(txnAmount))}
                      className="border-0 bg-white/10 text-gray-200 hover:bg-white/70 hover:text-gray-900"
                    >
                      {txnAmount}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Enter Amount"
                    value={addtxnAmount}
                    onChange={(e) => setAddtxnAmount(e.target.value)}
                    className="border-2 border-transparent focus-visible:border-green-600 bg-gray-800 text-gray-200 placeholder:text-gray-500"
                  />
                  {!paymentLink && addtxnAmount != "" &&
                    <Button onClick={createOrder} className="bg-green-600 text-white font-bold hover:bg-green-600/60">Create Order</Button>
                  }{paymentLink &&
                    <Button onClick={doPayment} className="bg-green-600 text-white font-bold hover:bg-green-600/60">Pay</Button>
                  }
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
        <Card className="bg-gradient-to-br from-gray-600/30 via-transparent to-transparent rounded-none rounded-tl-4xl mt-10">
          <CardHeader className="px-3 pt-2 sm:px-4 sm:pt-3 md:px-6 md:pt-4">
            <CardTitle className="text-4xl text-white">All Transactions</CardTitle>
          </CardHeader>
          {transactions ? (
            <>
              <CardContent className="p-6 pt-0">
                <div className="sm:mb-6 flex flex-col gap-3 sm:gap-4 lg:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search transactions..."
                      className="border-transparent focus-visible:border-gray-700 bg-gray-800 pl-10 text-gray-200 placeholder:text-gray-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="rounded-md border border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700 bg-gray-800/50">
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Date & Time</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Transaction ID</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Payment Method</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Amount</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Type</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions && (
                          filteredTransactions.map((transaction, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-gray-700 bg-gray-800/20 hover:bg-gray-700/30 cursor-pointer"
                              onClick={() => handleTransactionClick(transaction)}
                            >
                              <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-300">
                                {new Date(transaction.txnDate).toLocaleString("en-IN", {
                                  year: "numeric",
                                  month: "short",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-300">
                                <div className="font-mono">{transaction.tID}</div>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-300">
                                <div className="flex items-center">
                                  {gettxnPaymentMethodIcon(transaction.method)}
                                  <span className="ml-2">{transaction.method}</span>
                                </div>
                              </td>
                              <td
                                className={`whitespace-nowrap px-4 py-4 text-right text-sm font-medium ${transaction.type === "Deposit" ? "text-green-400" : "text-orange-400"
                                  }`}
                              >
                                {transaction.type === "Deposit" ? "+" : "-"}₹{transaction.amount}
                              </td>
                              <td className="whitespace-nowrap px-4 py-4 text-center text-sm">
                                <Badge
                                  className={`${transaction.type === "Deposit"
                                    ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                                    : "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                                    }`}
                                >
                                  <span className="flex items-center">
                                    {transaction.type === "Deposit" ? (
                                      <ArrowDownLeft className="mr-1 h-3 w-3" />
                                    ) : (
                                      <ArrowUpRight className="mr-1 h-3 w-3" />
                                    )}
                                    {transaction.type === "Deposit" ? "Deposit" : "Withdrawal"}
                                  </span>
                                </Badge>
                              </td>
                              <td className="whitespace-nowrap px-4 py-4 text-right text-sm">
                                <Badge className={`${gettxnStatusColor(transaction.status)}`}>
                                  {transaction.status}
                                </Badge>
                              </td>
                            </tr>
                          ))

                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <p className="text-lg text-gray-400">Your Transactions will be displayed here</p>
              </CardContent>
            </>
          )}
        </Card>
      </div>
      {selectedTransaction !== undefined && selectedTransaction !== null ? (
        <TransactionModal transaction={selectedTransaction as Transaction} onClose={() => setSelectedTransaction(undefined)} />
      ) : null}
    </div >
  )
}
function gettxnStatusColor(txnStatus: string) {
  switch (txnStatus) {
    case "Completed":
      return "bg-green-500/20 text-green-400 hover:bg-green-500/30"
    case "Pending":
      return "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
    case "Failed":
      return "bg-red-500/20 text-red-400 hover:bg-red-500/30"
    default:
      return "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
  }
}
function gettxnPaymentMethodIcon(method: string) {
  switch (method) {
    case "UPI":
      return (
        <div className="h-4 w-4 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs">U</div>
      )
    case "Credit Card":
      return (
        <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">C</div>
      )
    case "Debit Card":
      return (
        <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">D</div>
      )
    case "Net Banking":
      return (
        <div className="h-4 w-4 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs">N</div>
      )
    case "Bank Transfer":
      return (
        <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">B</div>
      )
    case "Wallet":
      return (
        <div className="h-4 w-4 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs">W</div>
      )
    default:
      return (
        <div className="h-4 w-4 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs">?</div>
      )
  }
}
