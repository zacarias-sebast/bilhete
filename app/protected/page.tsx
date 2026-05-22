import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";


export default async function ProtectedPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.id) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profile")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.full_name || !profile?.phone) {
    redirect(`/protected/profile/${user.id}/complete`);
  }

  return (
    <div>
      <h1>Bem-vindo ao Ola</h1>
      <p>Olá, {profile.full_name}!</p>
    </div>
  );
}
