"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, User, Phone, IdCard, MapPin, Calendar } from "lucide-react";
import { toast } from "sonner";

type usuario = {
    address: string | null;
    birth_date: string | null;
    document_number: string | null;
    full_name: string | null;
    phone: string | null;
}


export default function ProfilePage() {

  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [profile, setProfile] = useState<usuario>({full_name: "", phone: "", document_number: "", birth_date: "", address: ""});

  useEffect(() => {
    setIsMounted(true);
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      const { data } = await supabase
        .from("profile")
        .select("*")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data);

      setLoading(false);
    }

    loadProfile();

  }, []);

  async function updateProfile() {

    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      alert("Usuário não autenticado");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profile")
      .upsert({
        id: user.id,
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        document_number: profile.document_number || "",
        birth_date: profile.birth_date || null,
        address: profile.address || null,
        updated_at: new Date().toISOString(),
      });

    setSaving(false);

    if (error) {
      alert("Erro ao atualizar perfil: " + error.message);
      return;
    }

    toast.success("Perfil atualizado com sucesso!");
    router.push("/protected/trip");
  }

  if (loading || !isMounted)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white flex justify-center items-center p-6">

      <Card className="w-full max-w-xl bg-white/5 border-white/10">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">
            Perfil do Usuário
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* NOME */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4"/>
              Nome completo
            </label>

            <Input
              value={profile.full_name ?? ""}
              onChange={(e)=>setProfile({...profile, full_name:e.target.value})}
              className="bg-white/5 border-white/10"
            />
          </div>

          {/* TELEFONE */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4"/>
              Telefone
            </label>

            <Input
              value={profile.phone ?? ""}
              onChange={(e)=>setProfile({...profile, phone:e.target.value})}
              className="bg-white/5 border-white/10"
            />
          </div>

          {/* DOCUMENTO */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <IdCard className="w-4 h-4"/>
              Documento
            </label>

            <Input
              value={profile.document_number ?? ""}
              onChange={(e)=>setProfile({...profile, document_number:e.target.value})}
              className="bg-white/5 border-white/10"
            />
          </div>

          {/* DATA NASCIMENTO */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4"/>
              Data de nascimento
            </label>

            <Input
              type="date"
              value={profile.birth_date ?? ""}
              onChange={(e)=>setProfile({...profile, birth_date:e.target.value})}
              className="bg-white/5 border-white/10"
            />
          </div>

          {/* ENDEREÇO */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4"/>
              Endereço
            </label>

            <Input
              value={profile.address ?? ""}
              onChange={(e)=>setProfile({...profile, address:e.target.value})}
              className="bg-white/5 border-white/10"
            />
          </div>

          {/* BOTÃO */}
          <Button
            onClick={updateProfile}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >

            {saving ? (
              <>
                <Loader2 className="animate-spin mr-2"/>
                Salvando...
              </>
            ) : "Salvar Perfil"}

          </Button>
        </CardContent>
      </Card>
    </div>
  );
}