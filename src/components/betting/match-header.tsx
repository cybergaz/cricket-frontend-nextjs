import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell } from "lucide-react"

interface MatchHeaderProps {
  team1: string
  team2: string
  winStatus?: string
}

export function MatchHeader({ team1, team2, winStatus }: MatchHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-900">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-800 text-indigo-500 font-bold">
            G
          </div>
          <Link href="/" className="text-xl font-bold text-indigo-500">
            Galaxy
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/matches" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Live Matches
          </Link>
          <Link href="/positions" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Portfolio
          </Link>
          <Link href="/contact" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Contact
          </Link>
          <Link href="/about" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            About Us
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <button className="relative text-gray-300 hover:text-white">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
          </button>
          <Avatar>
            <AvatarImage src="/placeholder.svg?key=61u5r" alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
