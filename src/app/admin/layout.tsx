"use client"

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import MobileSidebar from "@/components/admin/mobile-sidebar";
import Image from "next/image";


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    router.replace("/login");
  };

  return (
    <div className="flex flex-col md:flex-row gap-5 bg-[#11131a] w-screen h-screen px-2 md:px-5 py-2 md:py-5">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileSidebarOpen(true)}
        className="md:hidden fixed border-2 border-white/20 top-4 right-4 z-50 p-2 rounded-lg bg-[#181a20] text-white"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Desktop Sidebar */}
      <div className="hidden md:flex p-2 py-8 w-[16rem] border-2 border-white/10 rounded-2xl flex-col gap-10 items-center justify-between bg-[#181a20]">
        <div className="flex flex-col items-center mb-8">
          <User className="size-8 rounded-full text-[#a259ff]" />
          <h2 className="mt-4 text-lg text-center text-white">Very Long User Name</h2>
        </div>

        <div className="space-y-2 -mt-5 w-full">
          <Link
            href="/admin"
            className={cn(
              "flex items-start py-2 px-2 text-white border-l-4 border-transparent hover:bg-[#23263a]",
              pathname === "/admin" && "border-[#a259ff] text-[#a259ff] bg-[#23263a]"
            )}
          >
            <span className="ml-2 font-medium">Admin Dashboard</span>
          </Link>
          <Link
            href="/admin/manage-users"
            className={cn(
              "flex items-start py-2 px-2 text-white border-l-4 border-transparent hover:bg-[#23263a]",
              (pathname === "/admin/manage-users" || /^\/admin\/user\/[^/]+$/.test(pathname)) &&
              "border-[#a259ff] text-[#a259ff] bg-[#23263a]"
            )}
          >
            <span className="ml-2 font-medium">Manage Users</span>
          </Link>
          <Link
            href="/admin/notifications"
            className={cn(
              "flex items-start py-2 px-2 text-white hover:bg-[#23263a] border-l-4 border-transparent",
              pathname === "/admin/notifications" && "border-[#a259ff] text-[#a259ff] bg-[#23263a]"
            )}
          >
            <span className="ml-2 font-medium">Notifications Manager</span>
          </Link>
        </div>

        <Button onClick={handleLogout} className="flex justify-center items-center font-medium bg-transparent text-white hover:text-[#a259ff]">
          <LogOut className="mr-2 size-5 stroke-3" />
          Log Out
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto max-md:mt-16">
        {children}
      </div>
    </div>
  );
}
