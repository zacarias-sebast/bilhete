import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Loader2, LayoutDashboard, Map, Ticket, Users, ArrowLeft, BookOpen, Menu } from "lucide-react";
import Link from "next/link";
// Adiciona esta linha junto aos outros imports no topo
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

const ALLOWED_ADMINS = [
  "samuel kissoque francisco teca",
  "eugénio adão",
  "zacarias sebastião",
];

const ALLOWED_EMAILS = [
  "sf8531197@gmail.com"
];

const adminMenuItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Reservas", icon: BookOpen },
  { href: "/admin/trips", label: "Viagens", icon: Ticket },
  { href: "/admin/routes", label: "Rotas", icon: Map },
];

function AdminSidebar() {
  return (
    <aside className="w-64 border-r border-white/10 bg-slate-900/50 hidden md:flex flex-col">
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-400">
          Morvic Admin
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {adminMenuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-white/10">
              <item.icon className="w-4 h-4" />
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <Link href="/">
          <Button variant="outline" className="w-full gap-2 border-white/10 hover:bg-white/5">
            <ArrowLeft className="w-4 h-4" />
            Sair do Admin
          </Button>
        </Link>
      </div>
    </aside>
  );
}

function AdminMobileMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 flex flex-col">
        <div className="mb-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-400">
            Morvic Admin
          </Link>
        </div>
        <nav className="flex-1 space-y-2">
          {adminMenuItems.map((item) => (
            <SheetClose key={item.href} asChild>
              <Link href={item.href}>
                <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-white/10">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            </SheetClose>
          ))}
        </nav>
        <div className="border-t border-white/10 pt-4">
          <SheetClose asChild>
            <Link href="/">
              <Button variant="outline" className="w-full gap-2 border-white/10 hover:bg-white/5">
                <ArrowLeft className="w-4 h-4" />
                Sair do Admin
              </Button>
            </Link>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}

async function AdminAuthCheck({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    // Handle refresh token errors - redirect to login
    if (error?.message?.includes("Refresh Token Not Found") || !user) {
      redirect("/auth/login");
    }

    // Busca o perfil do usuário logado
    const { data: profile } = await supabase
      .from("profile")
      .select("full_name")
      .eq("id", user.id)
      .single();

    // Função para remover acentos e espaços extras para facilitar a comparação
    const normalizeText = (text: string) =>
      text ? text.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

    const userFullName = normalizeText(profile?.full_name || "");
    const userEmail = user.email?.toLowerCase() || "";

    // Verifica se o nome do usuário ou o email está na lista de administradores permitidos
    const isAdminByName = ALLOWED_ADMINS.some(admin =>
      userFullName === normalizeText(admin)
    );

    const isAdminByEmail = ALLOWED_EMAILS.includes(userEmail);

    // Se não for um dos administradores autorizados, é expulso do painel admin
    if (!isAdminByName && !isAdminByEmail) {
      redirect("/"); // Redireciona para a página principal do cliente
    }

    return <>{children}</>;
  } catch (error) {
  if (isRedirectError(error)) throw error; // ← adiciona esta linha
  console.error("Admin auth check error:", error);
  redirect("/login");
  }
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-white flex-col md:flex-row">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto flex flex-col">
        <div className="md:hidden p-3 sm:p-4 border-b border-white/10 flex items-center gap-2">
          <AdminMobileMenu />
          <h1 className="flex-1 text-base sm:text-lg font-bold text-blue-400">Morvic Admin</h1>
        </div>
        <div className="p-3 sm:p-4 md:p-8 flex-1">
          <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
            <AdminAuthCheck>{children}</AdminAuthCheck>
          </Suspense>
        </div>
      </main>
    </div>
  );
}
