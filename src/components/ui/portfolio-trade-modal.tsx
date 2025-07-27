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
    <div>
      portfolio trade modal
    </div>
  );
};

export default PortfolioTradeModal; 
