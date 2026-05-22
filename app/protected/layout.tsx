import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

async function ProtectedGuard({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <>{children}</>;
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense 
      fallback={
        <div className="h-screen flex items-center justify-center">
          <Loader2 className="animate-spin w-10 h-10" />
        </div>
      }
    >
      <ProtectedGuard>{children}</ProtectedGuard>
    </Suspense>
  );
}