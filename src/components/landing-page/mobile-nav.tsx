"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Menu, TrendingUp, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

const navlinks = [
  { href: "/", label: "Home" },
  { href: "/game-rules", label: "Game Rules & Scoring" },
  { href: "/legality", label: "Security & Legality" },
  { href: "/contact-us", label: "Contact Us" },
  { href: "/about", label: "About Us" },
]

const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50"
      >
        {isOpen ? <X className="size-6" /> : <Menu className="size-6" />}
      </Button>

      {/* <div */}
      {/*   className={cn( */}
      {/*     "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity duration-300", */}
      {/*     isOpen ? "opacity-100" : "opacity-0 pointer-events-none" */}
      {/*   )} */}
      {/*   onClick={() => setIsOpen(false)} */}
      {/* /> */}

      {/* Mobile Menu */}
      {
        isOpen &&
        <div className={cn("fixed right-1 top-2 z-40 w-full max-w-sm animate-slide-up-sm shadow-lg",)} >
          <div className="flex flex-col space-y-4 bg-background border-white/15 border-1 mt-16 p-10 rounded-2xl">
            {navlinks.map((link) => {
              const isActive = link.href === usePathname()
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn("text-lg font-medium hover:text-primary", isActive && "text-accent-light")}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              )
            })
            }

            <Button className="mt-5 group bg-accent-dark text-base border-b border-transparent hover:rounded-none hover:border-purple-500 justify-center items-center rounded-sm" asChild>
              <Link href={"/login"} className="flex justify-center items-center">
                <span>Trade Now</span>
                <TrendingUp className="size-0 group-hover:size-5 transition-all duration-300" />
              </Link>
            </Button>
          </div>
        </div>
      }
    </div>
  )
}

export default MobileNav 
