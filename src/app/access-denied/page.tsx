import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import clsx from "clsx";
import {
  ShieldX,
  Home,
  BookOpen,
  AlertTriangle,
  User,
  Scale,
} from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

const AccessDeniedPage = async () => {

  return (
    <div className="min-h-screen flex items-center justify-center p-4 transition-all bg-background">
      <Card className="w-full max-w-md border-0 shadow-none rounded-xl bg-transparent">
        <CardContent className="p-8 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div
              className={clsx(
                "rounded-full p-4 border shadow-inner",
                "bg-red-100 border-red-200"
              )}
            >
              <ShieldX className="h-12 w-12 text-red-600" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-red-700">
              Access Restricted
            </h1>
          </div>

          <Button variant="outline" asChild className="w-full bg-white/60 text-black">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Return Home
            </Link>
          </Button>

        </CardContent>
      </Card>
    </div>
  );
};

export default AccessDeniedPage;
