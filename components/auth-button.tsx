"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "./logout-button";
import { UserCircle, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";

const ALLOWED_ADMINS = [
  "zacarias sebastião",
  "zacarias sebastiao",
  "eugénio adao",
  "eugénio adão",
  "eugenio adao",
  "eugenio adão"
];

export function AuthButton() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function checkAuth() {
      const { data } = await supabase.auth.getUser();
      const currentUser = data?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data: profile } = await supabase
          .from("profile")
          .select("full_name")
          .eq("id", currentUser.id)
          .single();

        const fullName = (profile?.full_name || "").toLowerCase().trim();
        setIsAdmin(ALLOWED_ADMINS.includes(fullName));
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    }

    checkAuth();

    // optionally listen for auth changes so the button updates automatically
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setIsAdmin(false);
      } else {
        // re-check admin status on login
        checkAuth();
      }
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        router.refresh();
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />;
  }

  return user ? (
    <div className="flex items-center gap-4">
      {isAdmin && (
        <Button asChild size="sm" variant="outline" className="text-amber-400 border-amber-400/20 hover:bg-amber-400/10 gap-1 hidden sm:flex">
          <Link href="/admin">
            <LayoutDashboard className="w-4 h-4" />
            Painel Admin
          </Link>
        </Button>
      )}
      <Button asChild size="sm" variant={"default"}>
        <Link href="/protected/profile/"><UserCircle /></Link>
      </Button>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/auth/login">Entrar</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/auth/sign-up">Cadastrar-se</Link>
      </Button>
    </div>
  );
}
