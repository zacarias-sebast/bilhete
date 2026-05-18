"use client";
import jsPDF from "jspdf";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  User,
  Phone,
  IdCard,
  MapPin,
  Calendar,
  Clock,
  Armchair,
  Trash2,
  Navigation,
  ChevronLeft,
  Download,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";


type Booking = {
  id: string;
  trip_id: string;
  seat_number: number;
  status: string;
  amount_to_pay: number;
  payment_proof_url?: string | null;
  trip: {
    id: string;
    available_seats: number;
    departure_date: string;
    departure_time: string;
    route: {
      origin: string;
      destination: string;
    };
  };
};

type Profile = {
  full_name: string | null;
  phone: string | null;
  document_number: string | null;
  address: string | null;
};

export default function ProfilePage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // States for deleting booking
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  async function handleUploadProof(bookingId: string, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(bookingId);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${bookingId}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('booking')
        .update({ payment_proof_url: publicUrl })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      toast.success('Comprovativo enviado com sucesso!');
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar comprovativo.');
    } finally {
      setUploading(null);
    }
  }

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // Fetch Profile
    const { data: profileData } = await supabase
      .from("profile")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileData) setProfile(profileData);

    // Fetch Bookings with Trip and Route details
    const { data: bookingsData } = await supabase
      .from("booking")
      .select(`
        *,
        trip:trip_id (
          id,
          available_seats,
          departure_date,
          departure_time,
          route:route_id (
            origin,
            destination
          )
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (bookingsData) setBookings(bookingsData as any);

    setLoading(false);
  }

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    loadData();

    // Configurar Realtime para a tabela booking
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escutar INSERT, UPDATE e DELETE
          schema: 'public',
          table: 'booking'
        },
        () => {
          console.log('Mudança detectada no Supabase! Recarregando dados...');
          loadData(); // Recarregar dados automaticamente
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleCancelBooking() {
    if (!bookingToCancel) return;

    setCancelling(true);

    // 1. Eliminar a reserva do banco de dados
    const { error: bookingError } = await supabase
      .from("booking")
      .delete()
      .eq("id", bookingToCancel.id);

    if (bookingError) {
      setCancelling(false);
      toast.error("Erro ao eliminar reserva: " + bookingError.message);
      return;
    }

    // 2. Incrementar assentos disponíveis na viagem
    // Buscamos o valor mais atualizado da viagem antes de incrementar
    const { data: currentTrip } = await supabase
      .from("trip")
      .select("available_seats, total_seats")
      .eq("id", bookingToCancel.trip_id)
      .single();

    if (currentTrip && currentTrip.available_seats < currentTrip.total_seats) {
      const newAvailableSeats = currentTrip.available_seats + 1;

      const { error: tripError } = await supabase
        .from("trip")
        .update({ available_seats: newAvailableSeats })
        .eq("id", bookingToCancel.trip_id);

      if (tripError) {
        console.error("Erro detalhado ao atualizar assentos da viagem:", tripError);
      }
    }

    setCancelling(false);

    toast.success("Reserva eliminada com sucesso!");
    setIsDeleteOpen(false);
    loadData();
  }

  function handleExportPDF(booking: Booking) {
    const doc = new jsPDF();

    // Configurações iniciais
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(30, 64, 175); // Azul
    doc.text("BILHETE DE PASSAGEM", 105, 20, { align: "center" });

    // Informações da Empresa / Cabeçalho
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Sistema de Reservas - Morvic-Express", 105, 28, { align: "center" });

    doc.setDrawColor(200);
    doc.line(20, 35, 190, 35);

    // Dados do Passageiro
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Dados do Passageiro", 20, 45);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${profile?.full_name || "N/A"}`, 20, 55);
    doc.text(`Documento: ${profile?.document_number || "N/A"}`, 20, 63);
    doc.text(`Telefone: ${profile?.phone || "N/A"}`, 20, 71);

    // Dados da Viagem
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Detalhes da Viagem", 20, 85);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Rota: ${booking.trip.route.origin} -> ${booking.trip.route.destination}`, 20, 95);
    doc.text(`Data de Partida: ${booking.trip.departure_date}`, 20, 103);
    doc.text(`Hora de Partida: ${booking.trip.departure_time}`, 20, 111);

    // Dados do Assento e Pagamento
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Reserva", 20, 125);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Assento: Nº ${booking.seat_number}`, 20, 135);
    doc.text(`Valor Pago: ${booking.amount_to_pay} Kz`, 20, 143);
    doc.text(`Status: CONFIRMADO`, 20, 151);

    // Rodapé
    doc.setDrawColor(200);
    doc.line(20, 165, 190, 165);

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Obrigado por viajar connosco. Apresente este bilhete no momento do embarque.", 105, 175, { align: "center" });

    doc.save(`Bilhete_${booking.trip.route.origin}_${booking.trip.route.destination}_Assento${booking.seat_number}.pdf`);
  }



  if (loading || !isMounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* BOTÃO VOLTAR */}
        <div className="flex justify-start mb-2">
          <Button asChild variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <Link href="/protected/trip" className="flex items-center gap-2">
              <ChevronLeft className="w-5 h-5" />
              Voltar para Viagens
            </Link>
          </Button>
        </div>

        {/* PERFIL INFO */}
        <Card className="bg-white/5 border-white/10 overflow-hidden">
          <CardHeader className="bg-white/[0.02] border-b border-white/10">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <User className="w-6 h-6 text-blue-400" />
              Meu Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Nome Completo</p>
              <p className="font-medium text-lg">{profile?.full_name || "---"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Telefone</p>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-purple-400" />
                <p className="font-medium text-lg">{profile?.phone || "---"}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Nº Documento</p>
              <div className="flex items-center gap-2">
                <IdCard className="w-4 h-4 text-green-400" />
                <p className="font-medium text-lg">{profile?.document_number || "---"}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Endereço</p>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-400" />
                <p className="font-medium text-lg truncate">{profile?.address || "---"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LISTAGEM DE RESERVAS */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-400" />
            Minhas Reservas
          </h2>

          {bookings.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
              <p className="text-slate-400">Você ainda não possui nenhuma reserva.</p>
              <Button
                variant="link"
                className="text-blue-400 mt-2"
                onClick={() => window.location.href = '/protected'}
              >
                Explorar viagens disponíveis
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookings.map((booking) => (
                <Card key={booking.id} className="bg-white/5 border-white/10 hover:bg-white/[0.08] transition-colors overflow-hidden group">
                  <div className="p-4 flex flex-col h-full">
                    {/* Header: Rota e Status */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <Navigation className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{booking.trip.route.origin} → {booking.trip.route.destination}</p>
                          <Badge variant="outline" className="text-[10px] mt-1 bg-green-500/10 text-green-400 border-green-500/20">
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-lg font-black text-white">{booking.amount_to_pay} Kz</p>
                    </div>

                    {/* Detalhes: Data, Hora, Assento */}
                    <div className="grid grid-cols-3 gap-2 mb-6">
                      <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                        <p className="text-[9px] text-slate-500 uppercase">Data</p>
                        <p className="text-xs font-medium">{booking.trip.departure_date}</p>
                      </div>
                      <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                        <p className="text-[9px] text-slate-500 uppercase">Hora</p>
                        <p className="text-xs font-medium">{booking.trip.departure_time}</p>
                      </div>
                      <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <p className="text-[9px] text-blue-400 uppercase">Assento</p>
                        <p className="text-xs font-bold text-blue-400">Nº {booking.seat_number}</p>
                      </div>
                    </div>

                    {/* Instruções de Pagamento e Upload */}
                    {booking.status === "pendente" && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4">
                        <p className="text-xs text-blue-200 mb-3">

                          Pode pagar por <strong>Express: 946005680</strong> ou <strong>Por IBAN: 000600005828234623900</strong>.
                          Deve ser feito a transferência pelo <strong>mesmo banco BFA</strong> e deve enviar o comprovativo de transferência abaixo.
                          <strong> Obeservação:</strong> o valor a ser pago deve ser conrespondente da rota escolhida e<strong> se fizeres o pagamento por banco diferente
                          </strong> tera de esperar por 24H para obter o boletim.
                          de embarque<strong> Qualquer duvida, temos o chat para auxilia-lo(a)</strong> ou ligue para o Tel:936445980.
                        </p>

                        {booking.payment_proof_url ? (
                          <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/10">
                            <span className="text-xs text-green-400 font-medium flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              Comprovativo Enviado
                            </span>
                            <Button size="sm" variant="outline" className="h-7 text-[10px]" asChild>
                              <a href={booking.payment_proof_url} target="_blank" rel="noreferrer">Ver Anexo</a>
                            </Button>
                          </div>
                        ) : (
                          <div className="relative">
                            <input
                              type="file"
                              id={`upload-${booking.id}`}
                              className="hidden"
                              accept="image/*,.pdf"
                              onChange={(e) => handleUploadProof(booking.id, e)}
                              disabled={uploading === booking.id}
                            />
                            <label
                              htmlFor={`upload-${booking.id}`}
                              className={`flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg border border-dashed border-blue-400/50 text-blue-300 text-xs font-medium cursor-pointer hover:bg-blue-500/20 transition-colors ${uploading === booking.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <span>
                                {uploading === booking.id ? (
                                  <><Loader2 className="w-4 h-4 animate-spin" /> A enviar...</>
                                ) : (
                                  <><Upload className="w-4 h-4" /> Anexar Comprovativo</>
                                )}
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Ações */}
                    <div className="mt-auto space-y-2 pt-4 border-t border-white/10">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-white/5 border-white/10 hover:bg-red-600 hover:text-white"
                          onClick={() => {
                            setBookingToCancel(booking);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                        {booking.status === "confirmado" && (
                          <Button
                            size="sm"
                            variant="default"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => handleExportPDF(booking)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Bilhete PDF
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DELETAR RESERVA */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <Trash2 className="w-5 h-5" />
              Cancelar Reserva
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Tem certeza que deseja cancelar esta reserva? O assento ficará disponível para outros passageiros.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="bg-white/5 border-white/10">
              Manter Reserva
            </Button>
            <Button onClick={handleCancelBooking} disabled={cancelling} className="bg-red-600 hover:bg-red-700 text-white border-none">
              <span>
                {cancelling ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
              </span>
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
