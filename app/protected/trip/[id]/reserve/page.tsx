"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Navigation, Clock, Armchair, User, Phone, IdCard, CheckCircle2, ChevronLeft } from "lucide-react";
import { Trip } from "@/lib/supabase/queries/get-trips";
import { toast } from "sonner";

type TripWithRoute = Trip & {
  route: {
    origin: string;
    destination: string;
  };
};

type UserProfile = {
  full_name: string | null;
  phone: string | null;
  document_number: string | null;
};

export default function ReserveTripPage() {
  const [trip, setTrip] = useState<TripWithRoute | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // 🪑 NOVOS STATES
  const [occupiedSeats, setOccupiedSeats] = useState<number[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      // 🚍 Carregar viagem
      const { data: tripData, error: tripError } = await supabase
        .from("trip")
        .select(`*, route (origin, destination)`)
        .eq("id", id)
        .single();

      if (!tripError) setTrip(tripData as TripWithRoute);

      // 👤 Carregar usuário
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && user.id) {
        const { data: profileData } = await supabase
          .from("profile")
          .select("full_name, phone, document_number")
          .eq("id", user.id)
          .single();

        if (profileData) {
          if (!profileData.full_name || !profileData.phone || !profileData.document_number) {
            toast.info("Por favor, complete o seu perfil para poder fazer reservas.");
            router.push(`/protected/profile/${user.id}/complete`);
            return;
          }
          setProfile(profileData as UserProfile);
        }
      } else {
        toast.error("Sessão expirada. Por favor, faça login novamente.");
        router.push("/auth/login");
        return;
      }

      // 🪑 Buscar assentos ocupados (apenas confirmados ou pendentes)
      const { data: bookings, error: bookingsError } = await supabase
        .from("booking")
        .select("seat_number")
        .eq("trip_id", id)
        .not("status", "eq", "cancelado");

      if (bookingsError) {
        console.error("Erro ao buscar assentos ocupados:", bookingsError);
      }

      if (bookings) {
        const seats = bookings.map((b) => Number(b.seat_number));
        console.log("Assentos ocupados carregados:", seats);
        setOccupiedSeats(seats);
      }

      setLoading(false);
    }

    if (id) loadData();
  }, [id]);

  // Real-time subscription for seat updates
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`bookings-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "booking",
          filter: `trip_id=eq.${id}`,
        },
        (payload) => {
          const newSeat = Number(payload.new.seat_number);
          if (payload.new.status !== "cancelado") {
            setOccupiedSeats((prev) => [
              ...prev,
              newSeat,
            ]); 
            console.log(`Assento ${newSeat} foi reservado em tempo real`);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "booking",
          filter: `trip_id=eq.${id}`,
        },
        (payload) => {
          const seat = Number(payload.new.seat_number);
          if (payload.new.status === "cancelado") {
            setOccupiedSeats((prev) => prev.filter((s) => s !== seat));
            console.log(`Assento ${seat} foi liberado em tempo real`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  async function handleReserve() {
    if (!trip || !selectedSeat) {
      toast.info("Por favor, selecione um assento.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Usuário não autenticado.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("booking").insert({
      trip_id: id,
      user_id: user.id,
      seat_number: selectedSeat,
      status: "pendente",
      amount_to_pay: trip.price,
    });

    if (!error) {
      const { data: currentTrip } = await supabase
        .from("trip")
        .select("available_seats")
        .eq("id", id)
        .single();
        
      if (currentTrip && currentTrip.available_seats > 0) {
        await supabase
          .from("trip")
          .update({ available_seats: currentTrip.available_seats - 1 })
          .eq("id", id);
      }
    }

    setSaving(false);

    if (error) {
      toast.error("Assento já pode ter sido reservado!");
      return;
    }

    // Update seat immediately in UI (real-time effect)
    setOccupiedSeats((prev) => [...prev, selectedSeat]);
    setSelectedSeat(null);
    
    toast.success("Reserva realizada com sucesso!");
    
    // Redirect after a brief delay so user sees the seat update
    setTimeout(() => {
      router.push("/protected/profile");
    }, 1500);
  }

  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white flex justify-center items-center p-6">

      <Card className="w-full max-w-4xl bg-white/5 border-white/10 overflow-hidden">

        <CardHeader className="border-b border-white/10 pb-4 relative">
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            onClick={() => router.back()}
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Voltar
          </Button>
          <CardTitle className="text-3xl font-bold tracking-tight text-center">
            Reserva de Viagem
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            
            {/* COLUNA ESQUERDA: INFORMAÇÕES */}
            <div className="p-6 space-y-6 border-b lg:border-b-0 lg:border-r border-white/10 bg-white/[0.02]">
              
              {/* DADOS DO USUÁRIO */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-widest">
                  Informações do Passageiro
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="flex flex-col items-center text-center p-3 bg-white/5 rounded-lg border border-white/5">
                    <User className="w-4 h-4 text-blue-400 mb-2" />
                    <p className="text-[10px] text-slate-400 uppercase">Nome</p>
                    <p className="text-xs font-medium truncate w-full">{profile?.full_name || "---"}</p>
                  </div>

                  <div className="flex flex-col items-center text-center p-3 bg-white/5 rounded-lg border border-white/5">
                    <Phone className="w-4 h-4 text-purple-400 mb-2" />
                    <p className="text-[10px] text-slate-400 uppercase">Telefone</p>
                    <p className="text-xs font-medium">{profile?.phone || "---"}</p>
                  </div>

                  <div className="flex flex-col items-center text-center p-3 bg-white/5 rounded-lg border border-white/5">
                    <IdCard className="w-4 h-4 text-green-400 mb-2" />
                    <p className="text-[10px] text-slate-400 uppercase">Documento</p>
                    <p className="text-xs font-medium">{profile?.document_number || "---"}</p>
                  </div>
                </div>
              </div>

              {/* DETALHES DA VIAGEM */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-widest">
                  Detalhes do Itinerário
                </h3>
                
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="space-y-1">
                    <p className="text-[10px] text-blue-400 uppercase">Origem</p>
                    <p className="text-lg font-bold">{trip?.route.origin}</p>
                  </div>
                  <div className="flex flex-col items-center px-4">
                    <Navigation className="text-slate-500 w-5 h-5 mb-1" />
                    <div className="h-[2px] w-16 bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50 rounded-full"></div>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] text-purple-400 uppercase">Destino</p>
                    <p className="text-lg font-bold">{trip?.route.destination}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <p className="text-[10px] text-slate-400 uppercase mb-1">Data de Partida</p>
                    <p className="text-sm font-medium">{trip?.departure_date}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <p className="text-[10px] text-slate-400 uppercase mb-1">Horário</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-blue-400"/>
                      <span className="text-sm font-medium">{trip?.departure_time}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA: RESERVA */}
            <div className="p-6 flex flex-col justify-center space-y-8 bg-blue-600/5">
              
              <div className="text-center space-y-2">
                <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider">Finalizar Reserva</h3>
                <p className="text-xs text-slate-500 italic">Selecione seu lugar no mapa e confirme</p>
              </div>

              <div className="space-y-6">
                {/* PREÇO DESTAQUE */}
                <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                  <p className="text-xs text-slate-400 uppercase mb-1">Valor do Bilhete</p>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-black text-white">{trip?.price}</span>
                    <span className="text-lg font-bold text-blue-400">Kz</span>
                  </div>
                </div>

                {/* MODAL DE ASSENTOS */}
                <div className="w-full flex flex-col items-center gap-3">
                  <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={`w-full max-w-[240px] h-14 border-white/10 flex flex-col gap-1 ${selectedSeat ? "bg-green-600/10 border-green-600/50 hover:bg-green-600/20" : "bg-white/5 hover:bg-white/10"}`}
                      >
                        <span className="text-[10px] text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                          <Armchair className="w-3 h-3" />
                          {selectedSeat ? "Assento Selecionado" : "Escolher Assento"}
                        </span>
                        <span className="text-lg font-bold">
                          {selectedSeat ? `Nº ${selectedSeat}` : "Clique para selecionar"}
                        </span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-white/10 text-white max-w-sm sm:max-w-md h-[80vh] flex flex-col p-0">
                      <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                          <Armchair className="w-5 h-5 text-blue-400" />
                          Mapa de Assentos
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                          Select your seat from the available seats in the bus
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar">
                        <div className="space-y-6 pb-6">
                          {/* LEGENDA */}
                          <div className="flex justify-center gap-4 text-[10px] uppercase sticky top-0 bg-slate-900/95 backdrop-blur-sm py-2 z-10">
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <div className="w-3 h-3 bg-white/10 border border-white/10 rounded-sm"></div>
                              Livre
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <div className="w-3 h-3 bg-gray-600 rounded-sm"></div>
                              Ocupado
                            </div>
                            <div className="flex items-center gap-1.5 text-green-400">
                              <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
                              Sua Escolha
                            </div>
                          </div>

                          {/* GRID DE ASSENTOS */}
                          <div className="grid grid-cols-4 gap-3 max-w-xs mx-auto p-4 bg-white/5 rounded-2xl border border-white/5 relative mt-8">
                            {/* VOLANTE DO MOTORISTA */}
                            <div className="absolute top-[-30px] left-4 text-[8px] text-slate-600 flex flex-col items-center">
                              <div className="w-6 h-6 border-2 border-dashed border-slate-700 rounded-full mb-1"></div>
                              MOTORISTA
                            </div>

                            {Array.from({ length: 100 }, (_, i) => {
                              const seatNumber = i + 1;
                              const isOccupied = occupiedSeats.includes(seatNumber);
                              const isSelected = selectedSeat === seatNumber;

                              return (
                                <button
                                  key={seatNumber}
                                  disabled={isOccupied}
                                  onClick={() => {
                                    setSelectedSeat(seatNumber);
                                    setIsModalOpen(false);
                                    toast.success(`Assento ${seatNumber} selecionado!`);
                                  }}
                                  className={`
                                    h-10 w-10 rounded-md font-bold text-xs transition-all duration-200
                                    flex items-center justify-center
                                    ${isOccupied 
                                      ? "bg-gray-600 text-slate-400 cursor-not-allowed opacity-50" 
                                      : isSelected 
                                        ? "bg-green-600 text-white shadow-lg shadow-green-900/40 scale-110 ring-2 ring-white/20" 
                                        : "bg-white/10 text-slate-300 hover:bg-blue-600 hover:text-white hover:scale-105 border border-white/5"}
                                  `}
                                >
                                  {seatNumber}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border-t border-white/10 bg-slate-900/50 text-center">
                        <p className="text-[10px] text-slate-500 italic">Role para ver todos os 100 assentos</p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* BOTÃO FINAL */}
              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleReserve}
                  disabled={saving || !selectedSeat}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-xl font-bold shadow-xl shadow-blue-900/40 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin mr-3 w-6 h-6"/>
                      Processando...
                    </>
                  ) : (
                    <>
                      Confirmar Reserva
                      <CheckCircle2 className="ml-2 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </>
                  )}
                </Button>
                <p className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-1">
                  <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                  Garantia de reserva imediata após o pagamento
                </p>
              </div>

            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}