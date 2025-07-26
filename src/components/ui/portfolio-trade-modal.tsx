import { Team } from "@/app/(root)/betting-interface/types";
import { PlayerPortfolio } from "@/app/(root)/positions/types";
import { X } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

interface PortfolioTradeModalProps {
  open: boolean;
  onClose: () => void;
  portfolio: PlayerPortfolio; // PlayerPortfolio or TeamPortfolio
  team: Team
  onBuy: (quantity: number) => void;
  onSell: (quantity: number) => void;
}

const PortfolioTradeModal: React.FC<PortfolioTradeModalProps> = ({ open, onClose, portfolio, onBuy, onSell }) => {
  const [quantity, setQuantity] = useState(1);
  if (!open || !portfolio) return null;

  const buyPrice = Number(portfolio.boughtPrice);
  const currentPrice = Number(portfolio.currentPrice);
  const profitLoss = (currentPrice - buyPrice) * Number(portfolio.quantity);
  const profitLossClass = profitLoss > 0 ? "text-emerald-400" : profitLoss < 0 ? "text-red-500" : "text-gray-300";

  const MAX_TOTAL_VALUE = 25000;

  // Handler for clicking outside modal content
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="bg-gray-900 rounded-3xl shadow-lg p-5 w-full max-w-sm relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white text-lg cursor-pointer"><X /></button>
        <div className="mb-3">
          <div className="text-2xl font-bold text-white">{portfolio.playerName}</div>
          <div className="text-sm text-gray-400 mb-2">{portfolio.team}</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-1">
            <div className="bg-gray-800 rounded-lg p-2 flex flex-col items-center">
              <span className="text-xs text-gray-400 mb-1">Buy</span>
              <span className="font-bold text-lg text-white">
                ₹{buyPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="bg-gray-800 rounded-lg p-2 flex flex-col items-center">
              <span className="text-xs text-gray-400 mb-1">Current</span>
              <span
                className={`font-bold text-lg ${currentPrice > buyPrice
                  ? "text-emerald-400"
                  : currentPrice < buyPrice
                    ? "text-red-500"
                    : "text-gray-300"
                  }`}
              >
                ₹{currentPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="bg-gray-800 rounded-lg p-2 flex flex-col items-center">
              <span className="text-xs text-gray-400 mb-1 md:hidden">Profit &amp; Loss</span>
              <span className="text-xs text-gray-400 mb-1 hidden md:inline-block">P&amp;L</span>
              <span className={`font-bold text-lg ${profitLossClass}`}>
                {profitLoss >= 0 ? "+" : "-"}₹
                {Math.abs(profitLoss).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="bg-gray-800 rounded-lg p-2 flex flex-col items-center">
              <span className="text-xs text-gray-400 mb-1 md:hidden">Current Quantity</span>
              <span className="text-xs text-gray-400 mb-1 hidden md:inline-block">Qty</span>
              <span className="font-bold text-lg text-white">
                {portfolio.quantity}
              </span>
            </div>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-gray-300 text-base mb-1 font-bold">Qty</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="0"
            value={quantity === 0 ? "" : quantity}
            onChange={(e) => {
              const val = e.target.value;
              if (!/^\d*$/.test(val)) return;
              if (val === "") {
                setQuantity(0);
                return;
              }
              let numVal = Number(val);
              if (numVal < 1) numVal = 1;
              if (numVal * currentPrice > MAX_TOTAL_VALUE) {
                numVal = Math.floor(MAX_TOTAL_VALUE / currentPrice);
              }
              setQuantity(numVal);
            }}
            className="w-full rounded-lg bg-gray-800 text-white px-4 py-2 text-xl font-bold border-0 focus:outline-none focus:ring-0"
            onWheel={(e) => e.currentTarget.blur()}
            onKeyDown={(e) => {
              if (
                ["e", "E", "+", "-", ".", "ArrowUp", "ArrowDown"].includes(e.key)
              ) {
                e.preventDefault();
              }
            }}
            style={{
              MozAppearance: "textfield",
            }}
          />
        </div>
        <div className="mb-3 flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
          <span className="text-gray-300 text-base font-semibold">Total</span>
          <span className="text-lg font-bold text-white">₹{(quantity * currentPrice).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
        </div>
        {quantity * currentPrice > MAX_TOTAL_VALUE && (
          <div className="mb-2 text-red-500 text-sm font-semibold">Total value cannot exceed ₹{MAX_TOTAL_VALUE.toLocaleString("en-IN")}</div>
        )}
        <div className="flex gap-3">
          <button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 text-lg transition rounded-lg cursor-pointer"
            onClick={() => {
              if (quantity == 0) {
                toast("Select a Quantity")
                return
              }
              if (typeof onClose === "function") {
                onClose();
              }
              onBuy(quantity)
            }}
            disabled={quantity * currentPrice > MAX_TOTAL_VALUE}
          >
            Buy
          </button>
          <button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 text-lg rounded-lg transition cursor-pointer"
            onClick={() => {
              if (quantity == 0) {
                toast("Select a Quantity")
                return
              }
              onSell(quantity)
            }}
          >
            Sell
          </button>
        </div>
      </div>
    </div>
  );
};

export default PortfolioTradeModal; 
