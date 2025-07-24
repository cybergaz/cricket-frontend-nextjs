import Footer from "@/components/footer/footer";
import Header from "@/components/header/header";
import MobileNav from "@/components/landing-page/mobile-nav";
import Navlinks from "@/components/landing-page/navlinks";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="sticky top-0 z-50 border-white/10 pt-3 px-2 backdrop-blur-md">
        <div className="flex justify-between items-center py-2 px-4 sm:px-6 max-w-[90rem] mx-auto bg-white/5 backdrop-blur-md rounded-2xl">
          <Link href={"/"} >
            <Image
              src={"/images/logo.png"}
              alt="Logo"
              width={160}
              height={100}
              className=" w-[10rem] rounded-full object-cover"
            />
          </Link>

          <div className="hidden lg:block">
            <Navlinks />
          </div>

          <div className="flex items-center gap-4">
            <Button className="hidden sm:flex group bg-accent-dark text-base border-b border-transparent hover:rounded-none hover:border-accent-dark justify-center items-center rounded-sm" asChild>
              <Link href={"/login"} className="flex justify-center items-center animate-bounce hover:animate-none">
                <span>Trade Now</span>
                <TrendingUp className="size-0 group-hover:size-5 transition-all duration-300" />
              </Link>
            </Button>
            <MobileNav />
          </div>
        </div>
      </header>
      <div className="h-[4.8rem] " /> {/* Used as a space between FIXED header and rest of layout */}
      <main className="">
        {children}
      </main>
      <Footer />
    </>
  );
}

