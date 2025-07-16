"use client";

import { Button } from "@/components/ui/button";
import { NAVLINKS, UNPROTECTED_ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { LoaderCircle, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarImage } from "../ui/avatar";
import { useUserStore } from "@/store/user-store";


const Navbar = () => {
  const setUser = useUserStore((state) => state.setUser)
  const user = useUserStore((state) => state.user)
  const pathname = usePathname();
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);


  useEffect(() => {
    // Check for token in cookies
    const checkAuth = async () => {
      // const userDetails = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/whoami`, { credentials: "include", });
      // if (userDetails.status === 200) {
      //   setIsUserAuthenticated(true);
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
      setIsUserAuthenticated(!!tokenCookie);
      // }
    }

    checkAuth();
  }, []);

  return (
    <>
      <div
        className={cn(
          "max-w-screen w-full mx-auto bg-background/60 border-b border-white/20 backdrop-blur-sm px-5 max-sm:p-0 flex justify-between items-center transition-normal duration-500"
        )}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href={"/"}
              className="text-xl font-bold bg-gradient-to-r from-purple-500 to-cyan-500 text-transparent bg-clip-text"
            >
              <Image
                src={"/images/logo.png"}
                alt="Logo"
                width={160}
                height={100}
                className="rounded-full object-cover"
              />
            </Link>
          </div>

          {isUserAuthenticated &&
            <nav className="hidden md:flex items-center gap-10">
              {NAVLINKS.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className={cn(
                    "text-gray-400 hover:text-white transition-colors duration-200",
                    pathname == link.href && "text-purple-400"
                  )}
                >
                  {link.title}
                </Link>
              ))}
            </nav>
          }

          <Link href="/user-profile">
            <Avatar className="size-11 border-2 transition-all duration-250 border-white/40 hover:border-accent shadow-md cursor-pointer flex justify-center items-center" >
              {
                user?.profileImage
                  ? <AvatarImage src={user?.profileImage} alt="User Profile" className="object-cover" />
                  : <User />
              }
            </Avatar>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Navbar;
