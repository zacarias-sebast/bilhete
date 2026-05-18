import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="flex flex-col items-center">
              <Image src="/logo.jpeg" width={150} height={150} alt="Logo" className="rounded-full" />
              <CardTitle className="text-2xl">
                Obrigado por se inscrever!
              </CardTitle>
              <CardDescription>Confira seu e-mail para confirmar.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Você se cadastrou com sucesso. Por favor, verifique seu e-mail para
                confirmar sua conta antes de fazer login.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col items-center">
              <Button>
                <Link href="/auth/login">
                  Entrar
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
