import React from 'react';
import { Shield, Zap, Trophy, Smartphone } from 'lucide-react';

const GameRules = () => {
  return (
    <div className="min-h-screen bg-[#0B1121] text-white">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-16 animate-slide-down-lg">
          <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-6">
            Game Rules
          </h1>
          <p className="text-slate-400 text-xl max-w-3xl mx-auto">
            Learn how to play and master the art of cricket stock trading
          </p>
        </div>

        <div className="space-y-12">
          {/* Overview Section */}
          <section className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/20 rounded-2xl p-8 border border-white/10 animate-scale-in-lg">
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">Overview</h2>
            <p className="text-slate-300">
              CricStock11 is a skill-based fantasy trading game where users buy and sell virtual stocks tied to real-world cricket players.
              Playing signifies acceptance of the platform’s Terms & Conditions and Privacy Policy.
            </p>
          </section>

          {/* Getting Started Section */}
          <section className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/20 rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
              <h3 className="text-xl font-medium mb-4 text-purple-300">Sign Up</h3>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Verify via mobile number and OTP
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Optional referral code for bonuses
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Quick registration process
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/20 rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
              <h3 className="text-xl font-medium mb-4 text-purple-300">Deposit</h3>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Minimum: ₹100 | Maximum: ₹20,00,000 per month
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Max ₹25,000 stock per player per match
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  No limit on team stock
                </li>
              </ul>
            </div>
          </section>

          {/* Account Types Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-purple-300">Account Balances</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/20 rounded-2xl p-6 border border-white/10">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-purple-300">Deposits</h3>
                <p className="text-slate-300">
                  Funds added after GST deduction. Used to buy stocks but not withdrawable.
                </p>
              </div>
              <div className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/20 rounded-2xl p-6 border border-white/10">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-purple-300">Winnings</h3>
                <p className="text-slate-300">
                  Earnings from stock trades. Can be used again or withdrawn.
                </p>
              </div>
              <div className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/20 rounded-2xl p-6 border border-white/10">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-purple-300">Discount Bonus</h3>
                <p className="text-slate-300">
                  Earned via promos, referrals, or contests. Covers GST on deposits. Can only be used for purchases.
                </p>
              </div>
            </div>
          </section>

          {/* Trading Rules */}
          <section className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/20 rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-purple-300">Trading Rules</h2>
            <div className="text-slate-300 space-y-8">
              {/* Portfolio Creation */}
              <div>
                <h3 className="text-xl font-medium mb-3 text-purple-300">Portfolio Creation</h3>
                <p>
                  To begin trading, users must create a portfolio by selecting players whose virtual stocks will fluctuate based on real-time performance. Player selection and strategy are crucial for maximizing gains.
                </p>
              </div>

              {/* Stock Goes Up */}
              <div>
                <h3 className="text-xl font-medium mb-3 text-purple-300">Stock Goes Up</h3>
                <ul className="space-y-2 list-disc list-inside">
                  <li>+₹0.75 for every 1 run scored</li>
                  <li>+₹1.50 for 2 runs</li>
                  <li>+₹2.25 for 3 runs</li>
                  <li>+₹3.00 for 4 runs</li>
                  <li>+₹3.75 for 5 runs</li>
                  <li>+₹4.50 for 6 runs</li>
                </ul>
              </div>

              {/* Stock Goes Down */}
              <div>
                <h3 className="text-xl font-medium mb-3 text-purple-300">Stock Goes Down</h3>
                <ul className="space-y-2 list-disc list-inside">
                  <li>-₹1 for each dot ball (no run scored)</li>
                  <li>-50% of the stock's buying price if the player gets out</li>
                </ul>
              </div>

              {/* Team Stock Working */}
              <div>
                <h3 className="text-xl font-medium mb-3 text-purple-300">Team Stock Mechanism</h3>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Each Batsman will contribute 20% of their runs to team stock</li>
                  <li>If a Batsman gets out the team stock goes down by 10% of it's current price</li>
                </ul>
              </div>

              {/* Example */}
              <div className="pt-4">
                <h4 className="text-lg font-semibold text-purple-200 mb-2">Illustrative Example</h4>
                <p className="italic text-slate-400">
                  You buy a stock at ₹10. If the player hits a six, the stock value rises by ₹4.50. You can now sell it at ₹14.50 — gaining ₹4.50 profit (+45%).
                </p>
              </div>
            </div>
          </section>

          {/* Withdrawal */}
          <section className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/20 rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-purple-300">Withdrawal</h2>
            <ul className="space-y-3 text-slate-300 list-disc list-inside">
              <li>Minimum: ₹25 | Maximum: ₹1,00,000 per day</li>
              <li>Maximum 10 withdrawals per day</li>
              <li>KYC, bank verification, and TDS compliance required</li>
            </ul>
          </section>

          {/* Responsible Gaming Notice */}
          <section className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/20 rounded-2xl p-8 border border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <Shield className="w-8 h-8 text-purple-400" />
              <h2 className="text-2xl font-semibold text-purple-300">Responsible Gaming</h2>
            </div>

            <ul className="space-y-3 text-slate-300 list-disc list-inside">
              <li>
                We are not liable for any natural events, such as rain, or any unforeseen circumstances
                that may occur during the match.
              </li>
              <li>
                This game involves financial risk and potential addiction. Please play responsibly and at
                your own.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default GameRules;
