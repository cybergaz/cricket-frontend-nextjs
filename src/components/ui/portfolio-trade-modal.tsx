import { Team } from "@/app/(root)/betting-interface/types";
import { PlayerPortfolio } from "@/app/(root)/portfolio/types";
import { X } from "lucide-react";
import React, { useState } from "react";

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
            <div className="bg-gray-900 rounded-4xl  shadow-lg p-8 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl cursor-pointer mt-1 mr-1"><X /></button>
                <div className="mb-4">
                    <div className="text-4xl font-extrabold text-white">{portfolio.playerName}</div>
                    <div className="text-lg text-gray-400 mb-2">{portfolio.team}</div>
                    <div className="flex gap-6 mb-2">
                        <div>
                            <div className="text-base text-gray-400">Buy Price</div>
                            <div className="font-bold text-2xl text-white">₹{buyPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
                        </div>
                        <div>
                            <div className="text-base text-gray-400">Current Price</div>
                            <div className={`font-bold text-2xl ${currentPrice > buyPrice ? "text-emerald-400" : currentPrice < buyPrice ? "text-red-500" : "text-gray-300"}`}>₹{currentPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
                        </div>
                        <div>
                            <div className="text-base text-gray-400">P&L</div>
                            <div className={`font-bold text-2xl ${profitLossClass}`}>{profitLoss >= 0 ? "+" : "-"}₹{Math.abs(profitLoss).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
                        </div>
                    </div>
                </div>
                <div className="mb-6">
                    <label className="block text-gray-300 text-xl mb-2 font-bold">Quantity</label>
                    <input
                        type="number"
                        min={1}
                        max={25000}
                        value={quantity}
                        onChange={e => {
                            let val = Number(e.target.value);
                            if (val < 1) val = 1;
                            // Clamp so that quantity * currentPrice <= MAX_TOTAL_VALUE
                            if (val * currentPrice > MAX_TOTAL_VALUE) {
                                val = Math.floor(MAX_TOTAL_VALUE / currentPrice);
                            }
                            setQuantity(val);
                        }}
                        className="w-full rounded-xl bg-gray-800 text-white px-6 py-4 text-3xl font-bold border-0 focus:outline-none focus:ring-0 focus:border-0"
                        style={{
                            border: "none",
                            outline: "none",
                        }}
                    />
                </div>
                {/* Total Value Field */}
                <div className="mb-6 flex items-center justify-between">
                    <span className="text-gray-300 text-xl font-semibold">Total Value</span>
                    <span className="text-2xl font-bold text-white">₹{(quantity * currentPrice).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                </div>
                {quantity * currentPrice > MAX_TOTAL_VALUE && (
                    <div className="mb-4 text-red-500 text-lg font-semibold">Total value cannot exceed ₹{MAX_TOTAL_VALUE.toLocaleString("en-IN")}</div>
                )}
                <div className="flex gap-6">
                    <button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 text-2xl transition rounded-2xl cursor-pointer"
                        onClick={() => onBuy(quantity)}
                        disabled={quantity * currentPrice > MAX_TOTAL_VALUE}
                    >
                        Buy
                    </button>
                    <button
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 text-2xl rounded-2xl transition cursor-pointer"
                        onClick={() => onSell(quantity)}
                    >
                        Sell
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PortfolioTradeModal; 