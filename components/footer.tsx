import { Ticket } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Footer(){
    return(
          <footer className="relative z-10 border-t border-white/10 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
             
                <Link href="/" className="flex items-center space-x-2 mb-4">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                        <Image src="/logo.jpeg" width={30} height={30} alt="Logo" className="rounded-full" />
                    </div>
                    <span className="font-bold">Morvic</span>
                </Link>
             
                <p className="text-slate-400 text-sm">
                Revolucionando o transporte público com tecnologia de ponta.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carreiras</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-slate-400 text-sm">
            © 2026 Morvic. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    )
}