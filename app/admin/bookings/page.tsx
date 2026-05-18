"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateBookingStatusAdmin } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  Trash2,
  Loader2,
  Filter,
  Download,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

interface BookingWithDetails {
  id: string;
  trip_id: string;
  user_id: string;
  seat_number: number;
  amount_to_pay: number;
  booking_date: string | null;
  status: string | null;
  created_at: string | null;
  payment_proof_url?: string | null;

  // Related data
  trip?: {
    id: string;
    departure_date: string;
    departure_time: string;
    route: {
      origin: string;
      destination: string;
    };
  };
  profile?: {
    full_name: string;
    phone: string;
    document_number: string;
  };
}

type StatusFilter = "todos" | "confirmado" | "pendente" | "rejeitado";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");

  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [validatingBookingId, setValidatingBookingId] = useState<string | null>(null);

  const supabase = createClient();

  // Load all bookings with related data
  useEffect(() => {
    loadBookings();

    const channel = supabase
      .channel('admin-bookings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'booking' },
        () => {
          loadBookings(); // Recarregar reservas automaticamente
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadBookings() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("booking")
        .select(
          `
          *,
          trip (
            id,
            departure_date,
            departure_time,
            route (origin, destination)
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
        throw new Error(`Erro ao buscar reservas: ${errorMsg}`);
      }

      // Fetch profile data separately for each booking
      const bookingsWithProfiles = await Promise.all(
        (data || []).map(async (booking) => {
          const { data: profileData } = await supabase
            .from("profile")
            .select("full_name, phone, document_number")
            .eq("id", booking.user_id)
            .single();

          return {
            ...booking,
            profile: profileData,
          };
        })
      );

      setBookings((bookingsWithProfiles as any) || []);
      console.log(`✅ Carregadas ${bookingsWithProfiles?.length || 0} reservas`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      console.error("Erro ao carregar reservas:", errorMsg, error);
      toast.error(`Erro ao carregar reservas: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  }

  async function validateBooking(bookingId: string) {
    setProcessing(bookingId);
    try {

      await updateBookingStatusAdmin(bookingId, "confirmado");

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "confirmado" } : b
        )
      );

      toast.success("Reserva confirmada e marcada como paga!");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      console.error("Erro ao validar reserva:", errorMsg, error);
      toast.error(`Erro ao validar reserva: ${errorMsg}`);
    } finally {
      setProcessing(null);
    }
  }

  async function deleteBooking(bookingId: string) {
    setProcessing(bookingId);
    try {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) throw new Error("Reserva não encontrada");

      // Update booking status to cancelado using Server Action
      await updateBookingStatusAdmin(bookingId, "cancelado");

      // Increase available seats in the trip
      if (booking.trip_id) {
        const { data: tripData } = await supabase
          .from("trip")
          .select("available_seats, total_seats")
          .eq("id", booking.trip_id)
          .single();

        if (tripData && tripData.available_seats < tripData.total_seats) {
          const { error: tripError } = await supabase
            .from("trip")
            .update({
              available_seats: tripData.available_seats + 1
            })
            .eq("id", booking.trip_id);

          if (tripError) {
            const errorMsg = tripError instanceof Error ? tripError.message : JSON.stringify(tripError);
            throw new Error(`Erro ao atualizar assentos: ${errorMsg}`);
          }
        }
      }

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "cancelado" } : b
        )
      );

      toast.success("Reserva rejeitada com sucesso!");
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      console.error("Erro ao rejeitar reserva:", errorMsg, error);
      toast.error(`Erro ao rejeitar reserva: ${errorMsg}`);
    } finally {
      setProcessing(null);
    }
  }

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === "todos") return true;
    if (statusFilter === "rejeitado") return b.status === "cancelado" || b.status === "rejeitado";
    return b.status === statusFilter;
  });

  const stats = {
    total: bookings.length,
    confirmado: bookings.filter((b) => b.status === "confirmado").length,
    pendente: bookings.filter((b) => b.status === "pendente").length,
    rejeitado: bookings.filter((b) => b.status === "cancelado" || b.status === "rejeitado").length,
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Gestão de Reservas</h1>
        <p className="text-slate-400">
          Visualize, valide e gerencie todas as reservas de bilhetes
        </p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-slate-400 text-sm mb-2">Total</p>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-500/10 border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-yellow-400 text-sm mb-2">Pendentes</p>
              <p className="text-3xl font-bold text-yellow-400">{stats.pendente}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-blue-400 text-sm mb-2">Confirmadas</p>
              <p className="text-3xl font-bold text-blue-400">{stats.confirmado}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-400 text-sm mb-2">Rejeitadas/Canceladas</p>
              <p className="text-3xl font-bold text-red-400">{stats.rejeitado}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={statusFilter === "todos" ? "default" : "outline"}
          onClick={() => setStatusFilter("todos")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Filter className="w-4 h-4 mr-2" />
          Todos ({stats.total})
        </Button>
        <Button
          variant={statusFilter === "confirmado" ? "default" : "outline"}
          onClick={() => setStatusFilter("confirmado")}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Confirmadas ({stats.confirmado})
        </Button>
        <Button
          variant={statusFilter === "pendente" ? "default" : "outline"}
          onClick={() => setStatusFilter("pendente")}
          className="bg-yellow-500 hover:bg-yellow-600"
        >
          Pendentes ({stats.pendente})
        </Button>
        <Button
          variant={statusFilter === "rejeitado" ? "default" : "outline"}
          onClick={() => setStatusFilter("rejeitado")}
          className="bg-red-500 hover:bg-red-600"
        >
          Rejeitadas ({stats.rejeitado})
        </Button>
      </div>

      {/* BOOKINGS TABLE */}
      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="flex items-center justify-between">
            Reservas
            <Button
              variant="outline"
              size="sm"
              className="border-white/10"
              onClick={() => {
                // Export functionality
                const csv = filteredBookings
                  .map((b) => [
                    b.id,
                    b.profile?.full_name || "---",
                    b.profile?.phone || "---",
                    b.trip?.route?.origin || "---",
                    b.trip?.route?.destination || "---",
                    b.seat_number,
                    b.amount_to_pay,
                    b.status,
                    b.created_at,
                  ].join(","))
                  .join("\n");

                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `bookings-${new Date().toISOString().split("T")[0]}.csv`;
                a.click();
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                    Passageiro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                    Rota
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                    Assento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                      Nenhuma reserva encontrada
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-white text-sm">
                            {booking.profile?.full_name || "---"}
                          </p>
                          <p className="text-slate-400 text-xs">
                            {booking.profile?.phone || "---"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-white font-medium">
                            {booking.trip?.route?.origin} →{" "}
                            {booking.trip?.route?.destination}
                          </p>
                          <p className="text-slate-400 text-xs">
                            {booking.trip?.departure_date} às{" "}
                            {booking.trip?.departure_time}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white font-semibold">
                        Nº {booking.seat_number}
                      </td>
                      <td className="px-6 py-4 text-white font-semibold">
                        {booking.amount_to_pay} Kz
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            booking.status === "confirmado"
                              ? "bg-blue-500/20 text-blue-400"
                              : booking.status === "pendente"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                          }
                        >
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {booking.created_at
                          ? new Date(booking.created_at).toLocaleDateString("pt-PT")
                          : "---"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowDetails(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {booking.status !== "confirmado" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                              disabled={processing === booking.id}
                              onClick={() => validateBooking(booking.id)}
                            >
                              {processing === booking.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </Button>
                          )}

                          {booking.status !== "cancelado" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                              disabled={processing === booking.id}
                              onClick={() => {
                                setDeleteTarget(booking.id);
                                setShowDeleteConfirm(true);
                              }}
                            >
                              {processing === booking.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* DETAILS DIALOG */}
      {selectedBooking && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Reserva</DialogTitle>
              <DialogDescription className="sr-only">
                Informações completas da reserva
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm">Passageiro</p>
                <p className="font-semibold">{selectedBooking.profile?.full_name}</p>
              </div>

              <div>
                <p className="text-slate-400 text-sm">Telefone</p>
                <p className="font-semibold">{selectedBooking.profile?.phone}</p>
              </div>

              <div>
                <p className="text-slate-400 text-sm">Documento</p>
                <p className="font-semibold">
                  {selectedBooking.profile?.document_number}
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-sm">Rota</p>
                <p className="font-semibold">
                  {selectedBooking.trip?.route?.origin} →{" "}
                  {selectedBooking.trip?.route?.destination}
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-sm">Data e Hora</p>
                <p className="font-semibold">
                  {selectedBooking.trip?.departure_date} às{" "}
                  {selectedBooking.trip?.departure_time}
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-sm">Assento</p>
                <p className="font-semibold text-lg">Nº {selectedBooking.seat_number}</p>
              </div>

              <div>
                <p className="text-slate-400 text-sm">Valor da Reserva</p>
                <p className="font-semibold text-lg text-blue-400">
                  {selectedBooking.amount_to_pay} Kz
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-sm">Status</p>
                <Badge
                  className={
                    selectedBooking.status === "validado"
                      ? "bg-emerald-500/20 text-emerald-400 mt-2"
                      : selectedBooking.status === "confirmado"
                        ? "bg-blue-500/20 text-blue-400 mt-2"
                        : "bg-red-500/20 text-red-400 mt-2"
                  }
                >
                  {selectedBooking.status}
                </Badge>
              </div>

              <div>
                <p className="text-slate-400 text-sm">Data de Criação</p>
                <p className="font-semibold text-sm">
                  {selectedBooking.created_at
                    ? new Date(selectedBooking.created_at).toLocaleString("pt-PT")
                    : "---"}
                </p>
              </div>

              {selectedBooking.status === "confirmado" && (
                <div>
                  <p className="text-slate-400 text-sm">Status: Confirmada</p>
                  <p className="font-semibold text-sm text-blue-400">✓ Reserva Confirmada</p>
                </div>
              )}
              {selectedBooking.status === "pendente" && (
                <div>
                  <p className="text-slate-400 text-sm">Status: Pendente</p>
                  <p className="font-semibold text-sm text-yellow-400">⏱ Aguardando Validação</p>
                </div>
              )}

              {selectedBooking.payment_proof_url && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-slate-400 text-sm mb-2">Comprovativo de Pagamento</p>
                  <Button variant="outline" className="w-full bg-white/5 border-white/10" asChild>
                    <a href={selectedBooking.payment_proof_url} target="_blank" rel="noreferrer">
                      Ver Comprovativo
                    </a>
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDetails(false)}
                className="border-white/10"
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-400">Cancelar Reserva</DialogTitle>
            <DialogDescription>
              Tem a certeza que deseja cancelar esta reserva? O assento ficará disponível
              novamente.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="border-white/10"
            >
              Manter Reserva
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteTarget) {
                  deleteBooking(deleteTarget);
                }
              }}
              disabled={processing !== null}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Cancelar Reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
