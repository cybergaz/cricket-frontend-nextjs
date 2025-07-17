"use client";

import { useState } from "react";

const TransactionActivity = ({ transactions }: { transactions: any }) => {
  const [showModal, setShowModal] = useState(false);

  const RADIUS = 45;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const MAX = 10000;

  const percentage = Math.min(transactions.totalTransactionCount / MAX, 1);
  const strokeDashoffset = CIRCUMFERENCE * (1 - percentage);

  return (
    <div className="bg-[#181a20] border-[#1e293b] rounded-2xl relative">
      <div className="p-4 sm:p-6">
        <h2 className="text-xl font-bold mb-6">Transaction Activity</h2>
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-1/3 flex justify-center items-center mb-6 md:mb-0">
            <div className="relative w-48 h-48">
              <div className="w-full h-full rounded-full bg-[#181a20] flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold">{transactions.totalTransactionCount}</div>
                  <div className="text-sm text-gray-300">Total Transactions</div>
                </div>
              </div>
              {/* SVG Progress Circle */}
              <div className="absolute inset-0 w-full h-full">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Background ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#9333ea"
                    strokeWidth="1"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset="0"
                    className="opacity-20"
                  />
                  {/* Progress ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="w-full md:w-2/3 overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-b border-purple-800">
                  <th className="text-left py-3 pr-2">Transaction Type</th>
                  <th className="text-left py-3 pr-2">Users</th>
                  <th className="text-left py-3 pr-2">Transaction</th>
                  <th className="text-left py-3 pr-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-purple-800">
                  <td className="py-3">Deposit</td>
                  <td className="py-3">{transactions.depositUsers}</td>
                  <td className="py-3">{transactions.completedDeposit}</td>
                  <td className="py-3">{transactions.depositAmount}</td>
                </tr>
                <tr>
                  <td className="py-3">Withdraw</td>
                  <td className="py-3">{transactions.withdrawUsers}</td>
                  <td className="py-3">{transactions.completedWithdraw}</td>
                  <td className="py-3">{transactions.withdrawAmount}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-1 flex justify-end">
          <button
            onClick={() => setShowModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
          >
            More Details
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600/20 bg-opacity-50 backdrop-blur-md z-50 flex items-center justify-center">
          <div
            onClick={() => setShowModal(false)}
            className="fixed inset-0 w-screen h-screen z-40"
          />
          <div className="z-50 bg-[#181a20] border-2 rounded-2xl border-[#4c6590]/20  text-white shadow-lg w-full max-w-md p-6 relative">
            <h3 className="text-lg font-bold mb-4">All Transaction Details</h3>
            <div className="text-sm space-y-3 max-h-[60vh] overflow-y-auto">
              {Object.entries(transactions).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-gray-700 py-1">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-semibold">{value as string}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 text-white text-xl cursor-pointer hover:text-red-500"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionActivity;
