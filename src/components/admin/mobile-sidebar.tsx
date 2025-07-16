import { cn } from "@/lib/utils";
import { LogOut, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

type MobileSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const MobileSidebar = ({ isOpen, onClose }: MobileSidebarProps) => {
  const pathname = usePathname();

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
          "fixed top-0 left-0 z-50 h-full w-[16rem] p-4 py-8 flex flex-col items-center gap-5 bg-[#001440] transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="w-full flex justify-center mt-10">
          <div className="flex flex-col items-center gap-3">
            <User className="size-8 rounded-full" />
            <h2 className="text-lg text-white text-center">Very Long User Name</h2>
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

          <Button 
            onClick={async () => {
              const { performLogout } = await import('@/lib/logout-utils');
              await performLogout();
            }}
            className="w-full flex justify-center items-center font-medium bg-transparent"
          >
            <LogOut className="mr-2 size-5 stroke-3" />
            Log Out
          </Button>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;
