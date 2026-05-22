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
                Cadastro Bem-Sucedido! 🎉
              </CardTitle>
              <CardDescription>Você está quase pronto para começar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Próximos passos:</h3>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Você pode fazer login imediatamente com seu email e senha</li>
                  <li>Se receber um email de confirmação, clique no link para ativar sua conta completamente</li>
                  <li>Após fazer login, complete seu perfil com seus dados pessoais</li>
                </ol>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded text-sm text-blue-900 dark:text-blue-100">
                <strong>💡 Dica:</strong> Se tiver problemas ao fazer login, verifique se confirmou seu email ou tente usar a opção "Esqueceu sua senha".
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button className="w-full">
                <Link href="/auth/login">
                  Ir para Login
                </Link>
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Não recebeu o email?{" "}
                <Link href="/auth/login" className="underline underline-offset-4">
                  Tente fazer login
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
