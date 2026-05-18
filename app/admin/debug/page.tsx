"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function AdminDebugPage() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkUser() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setMessage("❌ Não há usuário autenticado. Faça login primeiro.");
          setLoading(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from("profile")
          .select("full_name, id")
          .eq("id", user.id)
          .single();

        if (error) {
          setMessage(`❌ Erro ao buscar perfil: ${error.message}`);
          setLoading(false);
          return;
        }

        setUserInfo({
          email: user.email,
          userId: user.id,
          fullName: profile?.full_name,
          fullNameLowercase: profile?.full_name?.toLowerCase().trim(),
        });

        setMessage("✅ Informações carregadas com sucesso!");
      } catch (error) {
        setMessage(`❌ Erro: ${String(error)}`);
      } finally {
        setLoading(false);
      }
    }

    checkUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/5 border border-white/10 rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-blue-400">🔍 Debug Admin Access</h1>

          <div className="space-y-4 mb-8">
            <div className="bg-white/5 p-4 rounded border border-white/10">
              <p className="text-slate-400 text-sm mb-1">Status</p>
              <p className={`text-lg font-semibold ${message.includes("✅") ? "text-emerald-400" : "text-red-400"}`}>
                {message}
              </p>
            </div>

            {userInfo && (
              <>
                <div className="bg-white/5 p-4 rounded border border-white/10">
                  <p className="text-slate-400 text-sm mb-1">Email</p>
                  <p className="text-lg font-mono">{userInfo.email}</p>
                </div>

                <div className="bg-white/5 p-4 rounded border border-white/10">
                  <p className="text-slate-400 text-sm mb-1">User ID</p>
                  <p className="text-lg font-mono">{userInfo.userId}</p>
                </div>

                <div className="bg-white/5 p-4 rounded border border-white/10">
                  <p className="text-slate-400 text-sm mb-1">Full Name (Original)</p>
                  <p className="text-lg font-semibold text-white">{userInfo.fullName || "---"}</p>
                </div>

                <div className="bg-blue-500/10 p-4 rounded border border-blue-500/20">
                  <p className="text-blue-400 text-sm mb-1">✅ Use this value in ALLOWED_ADMINS:</p>
                  <p className="text-lg font-mono bg-white/5 p-3 rounded mt-2 text-yellow-300">
                    "{userInfo.fullNameLowercase}"
                  </p>
                </div>

                <div className="bg-emerald-500/10 p-4 rounded border border-emerald-500/20 mt-6">
                  <p className="text-emerald-400 font-semibold mb-3">📝 Para dar acesso ao admin:</p>
                  <p className="text-sm text-slate-300 mb-3">
                    Copie o valor acima e adicione à lista ALLOWED_ADMINS no arquivo:
                  </p>
                  <code className="bg-black/50 p-2 rounded text-xs text-slate-300 block">
                    app/admin/layout.tsx
                  </code>
                </div>
              </>
            )}
          </div>

          <div className="space-y-3 text-sm text-slate-400">
            <h2 className="text-white font-semibold mb-3">❓ O que fazer agora:</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Copie o valor mostrado em azul acima</li>
              <li>Abra o arquivo <code className="bg-white/5 px-2 py-1 rounded">app/admin/layout.tsx</code></li>
              <li>Adicione seu nome à lista <code className="bg-white/5 px-2 py-1 rounded">ALLOWED_ADMINS</code></li>
              <li>Salve o arquivo e recarregue a página</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
