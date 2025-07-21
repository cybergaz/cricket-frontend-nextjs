"use client";

import { Button } from "@/components/ui/button";
import { MOBILE_NAVLINKS, NAVLINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Menu, X, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarImage } from "../ui/avatar";
import { useUserStore } from "@/store/user-store";
import { useOutsideClick } from "@/lib/hooks";

const Navbar = () => {
  const setUser = useUserStore((state) => state.setUser);
  const user = useUserStore((state) => state.user);
  const pathname = usePathname();
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);


  useEffect(() => {
    const checkAuth = async () => {
      const cookies = document.cookie.split(";");
      const tokenCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("token=")
      );
      setIsUserAuthenticated(!!tokenCookie);
    };
    checkAuth();
  }, []);

  return (
    <>
      <div className="z-50 w-full bg-background/60 border-b border-white/20 backdrop-blur-sm px-5 max-sm:px-3 flex justify-between items-center transition-normal duration-500">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xl font-bold bg-gradient-to-r from-purple-500 to-cyan-500 text-transparent bg-clip-text"
            >
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={160}
                height={100}
                className="rounded-full object-cover"
              />
            </Link>
          </div>

          {/* Desktop Nav */}
          {isUserAuthenticated && (
            <nav className="hidden min-[1040px]:flex items-center gap-10">
              {NAVLINKS.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className={cn(
                    "text-gray-400 hover:text-white transition-colors duration-200",
                    pathname === link.href && "text-purple-400"
                  )}
                >
                  {link.title}
                </Link>
              ))}
            </nav>
          )}

          {/* Mobile Hamburger */}
          {isUserAuthenticated && (
            <button
              className="min-[1040px]:hidden text-white"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              aria-label="Toggle Mobile Navigation"
            >
              {isMobileNavOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}

          {/* User Avatar */}
          <Link href="/user-profile" className="hidden min-[1040px]:flex">
            <Avatar className="size-11 border-2 transition-all duration-250 border-white/40 hover:border-accent shadow-md cursor-pointer flex justify-center items-center">
              {user?.profileImage ? (
                <AvatarImage
                  src={user.profileImage}
                  alt="User Profile"
                  className="object-cover"
                />
              ) : (
                <User />
              )}
            </Avatar>
          </Link>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {isMobileNavOpen && isUserAuthenticated && (
        <>
          <div
            className=" z-50 bg-background/90 backdrop-blur-sm border-t border-white/10 px-4 py-4 space-y-4 shadow-xl animate-slide-down-sm">
            {MOBILE_NAVLINKS.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                onClick={() => setIsMobileNavOpen(false)}
                className={cn(
                  "block text-gray-300 hover:text-white transition-colors duration-200 bg-white/5 rounded-lg p-3 pl-5",
                  pathname === link.href && "text-white bg-sky-200/20"
                )}
              >
                {link.title}
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
