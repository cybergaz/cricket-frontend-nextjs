"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  TrendingUp, 
  BarChart3, 
  Wallet, 
  User,
  Home
} from "lucide-react";

const BottomDock = () => {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Live Matches",
      href: "/live-matches",
      icon: TrendingUp,
      active: pathname === "/live-matches"
    },
    {
      title: "Positions",
      href: "/positions",
      icon: BarChart3,
      active: pathname === "/positions"
    },
    {
      title: "Wallet",
      href: "/wallet",
      icon: Wallet,
      active: pathname === "/wallet"
    },
    {
      title: "Profile",
      href: "/user-profile",
      icon: User,
      active: pathname === "/user-profile"
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-t border-white/10 md:hidden">
      <div className="flex items-center justify-around px-4 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-[60px]",
                item.active
                  ? "text-blue-400 bg-blue-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-xs font-medium">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomDock; 