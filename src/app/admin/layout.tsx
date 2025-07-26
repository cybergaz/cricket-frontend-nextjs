"use client"

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import MobileSidebar from "@/components/admin/mobile-sidebar";
import Image from "next/image";
import { useUserStore } from "@/store/user-store";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getTokenFromCookies } from "@/lib/actions";


export type AdminDetails = {
  name: string,
  role: string
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const user = useUserStore((state) => state.user);
  const router = useRouter();
  const pathname = usePathname();

  const [adminDetails, setAdminDetails] = useState<AdminDetails | null>(null)

  useEffect(() => {
    const fetchAdminDetails = async () => {
      const token = getTokenFromCookies();
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/is-admin`, {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.data) {
            // Map MongoDB user data to User type
            const mappedUser = {
              name: data.data.name as string,
              role: data.data.role as string,
            };
            setAdminDetails(mappedUser)
          }
        } else {
          console.error("Failed to fetch admin details");
        }
      } catch (error) {
        console.error("Error fetching admin details:", error);
      }
    };

    fetchAdminDetails();
  }, [])

  const handleLogout = async () => {
    // await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/logout`, { method: 'POST', credentials: "include" });
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
          <Avatar className="size-11 border-2 transition-all duration-250 border-white/40 hover:border-accent shadow-md cursor-pointer flex justify-center items-center" >
            {
              user?.profileImage
                ? <AvatarImage src={user?.profileImage} alt="User Profile" className="object-cover" />
                : <User />
            }
          </Avatar>
          <h2 className="mt-4 text-lg text-center text-white">{user?.name}</h2>
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
          {(adminDetails && (adminDetails.role === "super_admin" || adminDetails.role === "financial")) &&
            <Link
              href="/admin/withdrawals"
              className={cn(
                "flex items-start py-2 px-2 text-white border-l-4 border-transparent hover:bg-[#23263a]",
                (pathname === "/admin/withdrawals" && "border-[#a259ff] text-[#a259ff] bg-[#23263a]"))}
            >
              <span className="ml-2 font-medium">Withdrawals</span>
            </Link>
          }
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
