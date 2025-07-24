"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import {
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Calendar,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import jsPDF from "jspdf"
import { Transaction } from "@/types/user"
function formatINR(amount: Number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(Number(amount));
}
export const generateTransactionPDF = (transaction: Transaction) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Add title
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text("Transaction Receipt", 20, 20);

  // Add transaction details
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text(`Transaction ID: ${transaction.tID}`, 20, 40);
  doc.text(`Status: ${transaction.status}`, 20, 50);
  doc.text(`Type: ${transaction.type}`, 20, 60);
  doc.text(`Amount: Rs ${transaction.amount}`, 20, 70);
  doc.text(`Date & Time: ${transaction.txnDate}`, 20, 80);
  doc.text(`Payment Method: ${transaction.method}`, 20, 90);


  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `© ${new Date().getFullYear()} Your Company Name. All rights reserved. | Page ${i} of ${pageCount}`,
      20,
      285,
    );
  }

  // Save the PDF
  doc.save(`transaction-${transaction.tID}.pdf`);
};


interface TransactionModalProps {
  transaction: Transaction | null
  onClose: () => void
}

export function TransactionModal({ transaction, onClose }: TransactionModalProps) {
  if (!transaction) return null

  // Format transaction status with icon
  const getStatusDetails = (status: string) => {
    switch (status) {
      case "Completed":
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-400" />,
          color: "bg-green-500/20 text-green-400",
          description: "Transaction Completed",
        }
      case "Pending":
        return {
          icon: <Clock className="h-5 w-5 text-yellow-400" />,
          color: "bg-yellow-500/20 text-yellow-400",
          description: "Transaction is being processed",
        }
      case "Failed":
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-400" />,
          color: "bg-red-500/20 text-red-400",
          description: "Transaction could not be completed",
        }
      default:
        return {
          icon: <AlertCircle className="h-5 w-5 text-gray-400" />,
          color: "bg-gray-500/20 text-gray-400",
          description: "Unknown status",
        }
    }
  }

  // Get transaction type icon and color
  const getTypeDetails = (type: string) => {
    if (type === "Deposit") {
      return {
        icon: <ArrowDownLeft className="h-5 w-5 text-blue-400" />,
        color: "bg-blue-500/20 text-blue-400",
        label: "Deposit",
      }
    } else {
      return {
        icon: <ArrowUpRight className="h-5 w-5 text-orange-400" />,
        color: "bg-orange-500/20 text-orange-400",
        label: "Withdrawal",
      }
    }
  }

  // Get payment method icon
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "UPI":
        return (
          <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs">
            U
          </div>
        )
      case "Credit Card":
        return (
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">C</div>
        )
      case "Debit Card":
        return (
          <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">D</div>
        )
      case "Net Banking":
        return (
          <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs">
            N
          </div>
        )
      case "Bank Transfer":
        return (
          <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">B</div>
        )
      case "Wallet":
        return (
          <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs">W</div>
        )
      default:
        return (
          <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs">?</div>
        )
    }
  }

  const statusDetails = getStatusDetails(transaction.status)
  const typeDetails = getTypeDetails(transaction.type)

  // Format amount to handle both string and number types
  const originalAmount = typeof transaction.amount === "string"
    ? parseFloat(transaction.amount)
    : transaction.amount;

  let gst = 0;
  let tds = 0;
  let netAmount = originalAmount;

  if (transaction.type === "Withdrawal") {
    gst = originalAmount * 0.28;
    if (originalAmount > 10000) {
      tds = originalAmount * 0.01;
    }
    netAmount = originalAmount - gst - tds;
  }

  const formattedAmount = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(originalAmount);

  const formattedGST = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(gst);

  const formattedTDS = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(tds);

  const formattedNetAmount = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(netAmount);

  function handleDownloadReciept(transaction: Transaction): void {
    generateTransactionPDF(transaction)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in-0 zoom-in-95 duration-300">
        <Card className="border-gray-700 bg-gray-900 shadow-xl">
          <CardHeader className="relative pb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                {typeDetails.icon}
                <span>{typeDetails.label} Details</span>
              </CardTitle>
            </div>
            <CardDescription className="text-gray-400">
              Transaction ID: <span className="font-mono">{transaction.tID}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status */}
            <div className="rounded-lg bg-gray-800 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {statusDetails.icon}
                  <div>
                    <h3 className="font-medium text-white">Status</h3>
                    <p className="text-sm text-gray-400">{statusDetails.description}</p>
                  </div>
                </div>
                <Badge className={statusDetails.color}>{transaction.status}</Badge>
              </div>
            </div>

            {/* Amount */}
            <div className="rounded-lg bg-gray-800 p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-1">Requested Amount</h3>
              <p
                className={`text-2xl font-bold ${transaction.type === "Deposit" ? "text-green-400" : "text-orange-400"}`}
              >
                {transaction.type === "Deposit" ? "+" : "-"}₹{formattedAmount}
              </p>
              {transaction.type === "Withdrawal" && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>GST (28%)</span>
                    <span>-₹{formattedGST}</span>
                  </div>
                  {originalAmount > 10000 && (
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>TDS (1%)</span>
                      <span>-₹{formattedTDS}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-semibold text-white border-t border-gray-700 pt-1">
                    <span>Final Amount</span>
                    <span className="text-orange-400">₹{formattedNetAmount}</span>
                  </div>
                  <span className="block text-xs text-gray-400 mt-1">GST and TDS (if applicable) are applied on the requested withdrawal amount.</span>
                  <span className="block text-xs text-orange-400 bg-orange-900/30 rounded px-2 py-1 mt-1">
                    Amount will be reflected within 2 to 3 business days
                  </span>
                </div>
              )}
            </div>

            {/* Other details */}
            <div className="rounded-lg bg-gray-800 p-4 space-y-4">
              {/* Date */}
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Date & Time</h3>
                  <p className="text-white">
                    {new Date(transaction.txnDate).toLocaleString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}                  </p>
                </div>
              </div>

            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              className="border-0 bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              className={`${transaction.type === "Deposit" ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"} text-white`
              }
              onClick={() => handleDownloadReciept(transaction)}
            >
              <Download className="mr-2 h-4 w-4" />
              Receipt
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
