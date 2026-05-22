import Link from "next/link";
import Image from "next/image";
import { EnvVarWarning } from "./env-var-warning";
import { hasEnvVars } from "@/lib/utils";
import { ThemeSwitcher } from "./theme-switcher";
import { Suspense } from "react";
import { AuthButton } from "./auth-button";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LayoutDashboard } from "lucide-react";
import { MobileMenu } from "./mobile-menu";

export async function NavBar() {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
      <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
        <div className="flex gap-5 items-center font-semibold">
          <Link href="/" className="flex items-center space-x-2 ">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg" suppressHydrationWarning>
                <Image 
                  src="/logo.jpeg" 
                  width={30} 
                  height={30} 
                  alt="Logotipo Morvic" 
                  className="rounded-full"
                  loading="eager"
                  priority
                  style={{ height: "auto" }}
                />
            </div>
            <span className="font-bold hidden sm:inline" suppressHydrationWarning>Morvic</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-2">
            <Link href="/protected/trip" className="hover:text-blue-400 transition-colors" prefetch={false} suppressHydrationWarning>Viagens</Link>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <MobileMenu items={[{ href: "/protected/trip", label: "Viagens" }]} />
          {!hasEnvVars ? (
            <EnvVarWarning />
          ) : (
            <Suspense fallback={<div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />}>
              <AuthButton />
            </Suspense>
          )}
          <ThemeSwitcher />
        </div>
      </div>
    </nav>
  );
}
