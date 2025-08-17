"use client"

import { redirect } from "next/navigation";
import { toast } from "sonner";

export default function ErrorPage() {
  toast.error("An unexpected error occurred, Maybe the Match is not Started Yet Properly.");
  redirect("/live-matches");

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-red-600 mb-4">Error</h1>
      <p className="text-lg text-gray-700 mb-6">An unexpected error occurred while loading the betting interface.</p>
      <a href="/" className="text-blue-500 hover:underline">Go back to home</a>
    </div>
  );
}
