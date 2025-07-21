import Footer from "@/components/footer/footer";
import Header from "@/components/header/header";
import MobileNav from "@/components/landing-page/mobile-nav";
import Navlinks from "@/components/landing-page/navlinks";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="sticky top-0 z-50 border-white/10 pt-2 px-2 backdrop-blur-md">
        <div className="flex justify-between items-center py-1 px-4 sm:px-6 max-w-[90rem] mx-auto bg-white/5 backdrop-blur-md rounded-2xl">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="Logo" width={180} height={100} className="rounded-md object-cover w-[140px] sm:w-[180px]" />
          </Link>

          <div className="hidden lg:block">
            <Navlinks />
          </div>

          <div className="flex items-center gap-4">
            <Button className="hidden sm:flex group bg-purple-700 text-base border-b border-transparent hover:rounded-none hover:border-purple-500 justify-center items-center rounded-sm" asChild>
              <Link href={"/login"} className="flex justify-center items-center animate-bounce hover:animate-none">
                <span>Trade Now</span>
                <Image src="/images/trade.svg" alt="trade now" width={50} height={50} className="invert size-0 group-hover:size-6 transition-all duration-400" />
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

