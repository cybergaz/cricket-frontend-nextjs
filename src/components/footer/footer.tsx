import {
  Mail,
  Phone,
  Twitter,
  Instagram,
  Facebook,
  Globe,
  BirdIcon as Cricket,
  Trophy,
  Calendar,
  Users,
  BarChart2,
  HelpCircle,
  MessageSquare,
  Shield,
  Gift,
  Smartphone,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function Footer() {
  return (
    <footer className="mt-10 sm:mt-32 mb-5 px-5 sm:px-10 font-normal border-t border-white/20 py-10 bg-background">
      <div className="mx-auto p-5">
        {/* Main Footer Grid - 5 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Column 1: Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Image src="/images/logo.png" alt="CricStock11 Logo" width={140} height={40} className="rounded-full" />
            </div>
            <p className="text-gray-400 text-sm">
              Your premier platform for cricket stock trading and fantasy league investments.
            </p>
            <div className="flex space-x-4 pt-2">
              <Link href="#" className="text-gray-500 hover:text-accent transition-colors">
                <Twitter className="w-5 h-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-gray-500 hover:text-accent transition-colors">
                <Instagram className="w-5 h-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-gray-500 hover:text-accent transition-colors">
                <Facebook className="w-5 h-5" />
                <span className="sr-only">Facebook</span>
              </Link>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h4 className="text-white font-medium text-lg">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/live-matches" className="text-gray-400 hover:text-accent transition-colors flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  <span>Live Matches</span>
                </Link>
              </li>
              <li>
                <Link href="/positions" className="text-gray-400 hover:text-accent transition-colors flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" />
                  <span>Positions</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div className="space-y-4">
            <h4 className="text-white font-medium text-lg">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/contact-us" className="text-gray-400 hover:text-accent transition-colors flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>Help Center</span>
                </Link>
              </li>
              <li>
                <Link href="/invite" className="text-gray-400 hover:text-accent transition-colors flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  <span>Referral Program</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Contact */}
          <div className="space-y-4">
            <h4 className="text-white font-medium text-lg">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-400 group">
                <Mail className="w-4 h-4 text-accent group-hover:text-accent/80" />
                <span className="group-hover:text-gray-300 transition-colors">support@cricstock11.com</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400 group select-none">
                <Globe className="w-4 h-4 text-accent group-hover:text-accent/80" />
                <span className="transition-colors">www.cricstock11.com</span>
              </div>
            </div>
          </div>
        </div>
        {/* Copyright Section */}
        <div className="flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm pt-6">
          <div>© {new Date().getFullYear()} CricStock11. All rights reserved.</div>
          <div className="mt-4 md:mt-0 flex gap-6">
            <Link href="/privacy-policy" className="hover:text-accent transition-colors">
              Privacy Policy
            </Link>
            <Link href="terms-and-conditions" className="hover:text-accent transition-colors">
              Terms of Service
            </Link>

          </div>
        </div>
      </div>
    </footer>
  )
}
