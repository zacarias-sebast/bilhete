import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Loader2, LayoutDashboard, Map, Ticket, Users, ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const ALLOWED_ADMINS = [
  "samuel kissoque francisco teca",
  "eugénio adão",
  "zacarias sebastião",
];

const ALLOWED_EMAILS = [
  "sf8531197@gmail.com"
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
        <Link href="/admin">
          <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-white/10">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Button>
        </Link>
        <Link href="/admin/bookings">
          <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-white/10">
            <BookOpen className="w-4 h-4" />
            Reservas
          </Button>
        </Link>
        <Link href="/admin/trips">
          <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-white/10">
            <Ticket className="w-4 h-4" />
            Viagens
          </Button>
        </Link>
        <Link href="/admin/routes">
          <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-white/10">
            <Map className="w-4 h-4" />
            Rotas
          </Button>
        </Link>
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

async function AdminAuthCheck({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
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
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
            <AdminAuthCheck>{children}</AdminAuthCheck>
          </Suspense>
        </div>
      </main>
    </div>
  );
}
