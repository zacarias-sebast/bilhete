"use client";

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function AdminAccessPage() {
  const [status, setStatus] = useState<"loading" | "allowed" | "denied">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkAccess() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setStatus("denied");
          setMessage("Você precisa estar logado");
          return;
        }

        // Allow any authenticated user for now
        setStatus("allowed");
        setMessage("Acesso concedido!");
        
        // Redirect to admin bookings
        setTimeout(() => {
          redirect("/admin/bookings");
        }, 500);
      } catch (error) {
        setStatus("denied");
        setMessage("Erro ao verificar acesso");
      }
    }

    checkAccess();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white flex items-center justify-center p-6">
      <div className="text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-lg">Verificando acesso...</p>
          </>
        )}

        {status === "allowed" && (
          <>
            <div className="text-4xl mb-4">✅</div>
            <p className="text-lg text-emerald-400">{message}</p>
            <p className="text-slate-400 mt-2">Redirecionando para admin...</p>
          </>
        )}

        {status === "denied" && (
          <>
            <div className="text-4xl mb-4">❌</div>
            <p className="text-lg text-red-400">{message}</p>
            <p className="text-slate-400 mt-2">Verifique com o administrador do sistema</p>
          </>
        )}
      </div>
    </div>
  );
}
