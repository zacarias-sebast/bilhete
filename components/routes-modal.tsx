"use client"
import { useState, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  Navigation, 
  ArrowRight, 
  Search, 
  Activity, 
  Calendar,
  BusFront
} from 'lucide-react';

const ROUTES_MOCK = [
  { id: "1", origin: "Lisboa", destination: "Porto", distance_km: 312.5, estimated_duration: "3h 15min", active: true, created_at: "2024-03-01" },
  { id: "2", origin: "Coimbra", destination: "Braga", distance_km: 180.2, estimated_duration: "1h 50min", active: true, created_at: "2024-03-02" },
  { id: "3", origin: "Faro", destination: "Sevilha", distance_km: 200.0, estimated_duration: "2h 10min", active: false, created_at: "2024-03-03" }
];

export default function RoutesModal() {
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);

  const filteredRoutes = useMemo(() => {
    if (!searchTerm.trim()) return ROUTES_MOCK;
    
    const lowerSearch = searchTerm.toLowerCase();
    return ROUTES_MOCK.filter(route =>
      route.origin.toLowerCase().includes(lowerSearch) ||
      route.destination.toLowerCase().includes(lowerSearch)
    );
  }, [searchTerm]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Botão que abre o Modal - Estilizado conforme seu tema */}
      <DialogTrigger asChild>
        <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6 group">
          <BusFront className="mr-2 w-5 h-5" />
          Ver Rotas Disponíveis
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-950 border-white/10 text-white shadow-2xl">
        {/* Efeito de brilho dentro do modal */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
        
        <DialogHeader>
          <DialogTitle className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-300">
            Explorar Rotas
          </DialogTitle>
          <DialogDescription className="sr-only">
            Browse available routes and their details
          </DialogDescription>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Para onde quer ir?" 
              className="pl-10 bg-white/5 border-white/10 focus:ring-blue-500 focus:border-blue-500 text-white text-sm sm:text-base"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 mt-6">
          {filteredRoutes.map((route) => (
            <Card key={route.id} className="bg-white/5 border-white/10 hover:border-blue-500/50 transition-all duration-300 group overflow-hidden">
              <CardHeader className="pb-2 space-y-4">
                <div className="flex justify-between items-center">
                  <Badge className={route.active ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}>
                    <Activity className="w-3 h-3 mr-1" />
                    {route.active ? "Ativa" : "Indisponível"}
                  </Badge>
                  <span className="text-[10px] text-slate-500 font-mono">#{route.id}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-blue-400 font-bold">Origem</span>
                    <span className="text-lg font-semibold text-white">{route.origin}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-transform group-hover:translate-x-1" />
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] uppercase text-purple-400 font-bold">Destino</span>
                    <span className="text-lg font-semibold text-white">{route.destination}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium">{route.distance_km} km</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium">{route.estimated_duration}</span>
                  </div>
                </div>

                <Button 
                  disabled={!route.active}
                  className={`w-full transition-all ${
                    route.active 
                    ? "bg-blue-600 hover:bg-blue-700" 
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {route.active ? "Selecionar Viagem" : "Esgotado"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRoutes.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-400 font-medium">Nenhuma rota encontrada para sua busca.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}