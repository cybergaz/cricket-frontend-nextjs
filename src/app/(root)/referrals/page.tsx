"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ReferralPage() {
  const referralCode = useSearchParams().get("ref");

  return (
    <div className="min-h-screen flex items-center justify-center text-white px-4">
      <div className="bg-gray-950 border-4 border-emerald-600 p-10 rounded-3xl max-w-xl w-full text-center relative">
        <span className="absolute -top-4 right-5 bg-yellow-400 text-black text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide shandow">
          Special User
        </span>

        <h1 className="text-4xl font-extrabold mb-3 text-emerald-400 drop-shadow-lg">
          Welcome to the Club!
        </h1>

        <p className="text-gray-300 text-lg mb-4">
          You've been invited by someone special
        </p>

        {referralCode ? (
          <>
            <div className="bg-black bg-opacity-20 p-4 rounded-xl border border-emerald-500 mb-6">
              <p className="text-sm text-gray-400 mb-1">Your Referral Code</p>
              <p className="text-2xl font-mono text-emerald-400 animate-pulse">
                {referralCode}
              </p>
            </div>

            <Link href={`/login?mode=signup&referral=${referralCode}`}>
              <button className="bg-emerald-600 hover:bg-emerald-500 transition-colors text-gray-900 font-bold py-3 px-6 text-lg rounded-full">
                Create Account with Code &rarr;
              </button>
            </Link>

            <p className="text-xs text-gray-500 mt-4 italic">
              Referrals apply only after first successful transaction over ₹1000
            </p>
          </>
        ) : (
          <p className="text-gray-400">Loading referral details...</p>
        )}
      </div>
    </div>
  );
}
