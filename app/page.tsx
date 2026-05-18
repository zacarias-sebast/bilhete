"use client";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {  Clock, Badge, Activity, ArrowBigRight, Navigation, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import {useRoutes} from '@/lib/supabase/queries/use-routes';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';



const destinos = [
  { nome: "Luanda", imagens: ["/img/Luanda0.jpg", "/img/Luanda1.jpg"] },
  { nome: "Benguela", imagens: ["/img/Benguela0.jpg", "/img/Benguela1.jpg"] },
  { nome: "Huíla", imagens: ["/img/Huila0.jpg", "/img/Huila1.jpg"] },
  { nome: "Namibe", imagens: ["/img/Namibe0.jpg", "/img/Namibe1.jpg"] },
  { nome: "Cunene", imagens: ["/img/Cunene0.jpg", "/img/Cunene1.jpg"] },
];

export default function Home() {

  const {data, isLoading , error} = useRoutes()

  if (isLoading)
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center gap-4">

        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />

        <p className="text-slate-400 text-sm">
          Carregando rotas disponíveis...
        </p>

      </div>
  );

  if(error) return <p>Erro ao carregar rotas</p>
  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white overflow-hidden">
        
       {/* HERO SECTION */}
        <section className="relative h-[650px] w-full overflow-hidden">
          {/* IMAGEM DE FUNDO */}
          <img
            src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957"
            alt="Viagem de autocarro"
            className="absolute inset-0 w-full h-full object-cover"
             />


          {/* OVERLAY ESCURECIDO */}
          <div className="absolute inset-0 bg-black/50" />

          {/* HERO CONTENT */}
          <div className="relative z-10 flex items-center justify-center h-full px-6">

            <div className="max-w-3xl text-center">

              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
                Viaje sem limites com bilhetes digitais
              </h1>

              <p className="text-xl text-slate-200 mb-8">
                A forma mais moderna, rápida e segura de comprar bilhetes de transporte.
                Esqueça as filas e viaje com liberdade total.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">

                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/protected/trip">
                    Explore as viagens
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/20"
                >
                  <Link href="/galeria">
                    Ver Galeria
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ROUTES SECTION */}
        <section className="container mx-auto px-6 pb-5 pt-12" >
          {/* TITULO E DESCRIÇÃO */}
          <div className="text-center mb-12 max-w-3xl mx-auto">

            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Nossas Rotas Disponíveis
            </h2>

            <p className="text-slate-300 text-lg">
              Explore as principais rotas de transporte disponíveis na nossa plataforma. 
              Escolha o seu destino, reserve o seu bilhete digital e viaje com segurança,
              conforto e rapidez.
            </p>

          </div>

          {/* GRID DE ROTAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.map((route) => (
              <Card
                key={route.id}
                className="bg-white/5 border-white/10 hover:border-blue-500/50 transition-all duration-300 group"
              >
              
                <CardHeader className="space-y-4">
            
                  {/* STATUS */}
                  <div className="flex justify-between items-center">
                    <Badge
                      className={
                        route.active
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }
                    >
                      <Activity className="w-3 h-3 mr-1" />
                      {route.active ? "Ativa" : "Indisponível"}
                    </Badge>
                  </div>
                    
                  {/* ORIGEM → DESTINO */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs uppercase text-blue-400 font-bold">
                        Origem
                      </span>
                      <span className="text-lg font-semibold">{route.origin}</span>
                    </div>
                    
                    <ArrowBigRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-transform group-hover:translate-x-1" />
                    
                    <div className="flex flex-col text-right">
                      <span className="text-xs uppercase text-purple-400 font-bold">
                        Destino
                      </span>
                      <span className="text-lg font-semibold">
                        {route.destination}
                      </span>
                    </div>
                  </div>
                    
                </CardHeader>
                    
                <CardContent className="space-y-4">
                    
                  {/* DISTANCIA E TEMPO */}
                  <div className="flex justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-blue-400" />
                      <span className="text-sm">{route.distance_km} km</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span className="text-sm">{route.estimated_duration}</span>
                    </div>
                  </div>
                    
                  {/* BOTÃO */}
                  <Button
                    asChild
                    disabled={!route.active}
                    className={`w-full ${
                      route.active
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    {route.active ? (
                      <Link href="protected/trip/">Selecionar Viagem</Link>
                    ) : (
                      <span>Esgotado</span>
                    )}
                  </Button>
                  
                </CardContent>
                  
              </Card>
            ))}
          </div>
        </section>
        
        <section className="py-16 px-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">Nossos Destinos</CardTitle>
              <p className="text-muted-foreground mt-2">
                Explore algumas das principais províncias de Angola nas nossas rotas
              </p>
            </CardHeader>

            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                {destinos.map((destino, index) => (
                  <div
                    key={index}
                    className="group rounded-xl overflow-hidden shadow-md hover:shadow-xl transition relative"
                  >
                    <Carousel className="relative w-full h-40">
                      <CarouselContent className="flex gap-4">
                        {destino.imagens.map((img, idx) => (
                          <CarouselItem key={idx} className="basis-full">
                            <img src={img} alt={`${destino.nome} ${idx}`} className="object-cover w-full h-40" />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      
                      <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition">
                        <ChevronLeft size={20} />
                      </CarouselPrevious>
                      
                      <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition">
                        <ChevronRight size={20} />
                      </CarouselNext>
                    </Carousel>
                      
                    <div className="p-4">
                      <h3 className="font-semibold text-lg">{destino.nome}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="container mx-auto px-6 py-5">
          <div className="text-center ">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Uma plataforma completa para transformar sua experiência de viagem
            </p>
          </div>
        </section>
          
        {/* CTA SECTION */}
        <section className="container mx-auto px-6 py-10">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 overflow-hidden">
            <CardContent className="p-12 md:p-16 text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Pronto para começar?
              </h2>
          
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Junte-se a milhares de usuários que já transformaram sua forma de viajar
              </p>
          
              <Button
                asChild
                size="lg"
                className="bg-white text-blue-600 hover:bg-slate-100 text-lg px-8 py-6"
              >
                <Link href="/protected">Começar</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
  );
}