import { cn } from "@/lib/utils";
import { LogOut, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "../ui/avatar";
import { useUserStore } from "@/store/user-store";
import { useEffect, useState } from "react";
import { AdminDetails } from "@/app/admin/layout";
import { getTokenFromCookies } from "@/lib/actions";

type MobileSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const MobileSidebar = ({ isOpen, onClose }: MobileSidebarProps) => {
  const pathname = usePathname();
  const user = useUserStore((state) => state.user);

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

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[16rem] p-4 py-8 flex flex-col items-center gap-5 bg-[#181a20] transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="w-full flex justify-center mt-10">
          <div className="flex flex-col items-center gap-3">
            <Avatar className="size-11 border-2 transition-all duration-250 border-white/40 hover:border-accent shadow-md cursor-pointer flex justify-center items-center" >
              {
                user?.profileImage
                  ? <AvatarImage src={user?.profileImage} alt="User Profile" className="object-cover" />
                  : <User />
              }
            </Avatar>
            <h2 className="mt-4 text-lg text-center text-white">{user?.name}</h2>
          </div>
        </div>
        <hr className="w-full border-white/40" />

        <div className="flex flex-col justify-between h-full items-center">
          <div className="space-y-2 w-full mt-10">
            <Link
              href="/admin"
              onClick={onClose}
              className={cn(
                "flex items-center py-3 px-4 text-white rounded-lg",
                pathname === "/admin"
                  ? "bg-green-500/20 text-green-500"
                  : "hover:bg-white/10"
              )}
            >
              <span className="font-medium">Admin Dashboard</span>
            </Link>
            <Link
              href="/admin/manage-users"
              onClick={onClose}
              className={cn(
                "flex items-center py-3 px-4 text-white rounded-lg",
                pathname === "/admin/manage-users" ||
                  /^\/admin\/user\/[^/]+$/.test(pathname)
                  ? "bg-green-500/20 text-green-500"
                  : "hover:bg-white/10"
              )}
            >
              <span className="font-medium">Manage Users</span>
            </Link>

            {(adminDetails && (adminDetails.role === "super_admin" || adminDetails.role === "financial")) &&
              <Link
                href="/admin/withdrawals"
                onClick={onClose}
                className={cn(
                  "flex items-center py-3 px-4 text-white rounded-lg",
                  pathname === "/admin/withdrawals"
                    ? "bg-green-500/20 text-green-500"
                    : "hover:bg-white/10"
                )}
              >
                <span className="font-medium">Withdrawals</span>
              </Link>
            }
            <Link
              href="/admin/notifications"
              onClick={onClose}
              className={cn(
                "flex items-center py-3 px-4 text-white rounded-lg",
                pathname === "/admin/notifications"
                  ? "bg-green-500/20 text-green-500"
                  : "hover:bg-white/10"
              )}
            >
              <span className="font-medium">Notifications Manager</span>
            </Link>
          </div>

          <Button className="w-full flex justify-center items-center font-medium bg-transparent">
            <LogOut className="mr-2 size-5 stroke-3" />
            Log Out
          </Button>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;
