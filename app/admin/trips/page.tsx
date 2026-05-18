"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
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
  Trash2,
  Loader2,
  Filter,
  Download,
  Eye,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

interface TripWithDetails {
  id: string;
  route_id: string;
  departure_date: string;
  departure_time: string;
  expected_arrival_date: string | null;
  price: number;
  total_seats: number;
  available_seats: number;
  status: string | null;
  created_at: string | null;
  route?: {
    id: string;
    origin: string;
    destination: string;
    distance_km: number | null;
    estimated_duration: string | null;
  };
}

type StatusFilter = "todos" | "ativas" | "inativas";

export default function AdminTripsPage() {
  const [trips, setTrips] = useState<TripWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");

  const [selectedTrip, setSelectedTrip] = useState<TripWithDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [routes, setRoutes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    route_id: "",
    departure_date: "",
    departure_time: "",
    expected_arrival_date: "",
    price: "",
    total_seats: "",
  });
  const [creatingTrip, setCreatingTrip] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadTrips();
    loadRoutes();

    const channel = supabase
      .channel('admin-trips-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trip' },
        () => {
          loadTrips(); // Recarregar viagens automaticamente sem atualizar a página
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadTrips() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("trip")
        .select(`*, route (id, origin, destination, distance_km, estimated_duration)`)
        .order("departure_date", { ascending: true });

      if (error) throw new Error(JSON.stringify(error));
      setTrips((data || []) as TripWithDetails[]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : JSON.stringify(error);
      toast.error(`Erro ao carregar viagens: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadRoutes() {
    try {
      const { data, error } = await supabase
        .from("route")
        .select("id, origin, destination")
        .eq("active", true)
        .order("origin", { ascending: true });

      if (error) throw error;
      setRoutes((data || []) as any[]);
    } catch (error) {
      console.error("Erro ao carregar rotas:", error);
    }
  }

  async function toggleTripStatus(tripId: string, currentStatus: string | null) {
    setProcessing(tripId);
    try {
      const newStatus = currentStatus === "Disponivel" ? "Esgotado" : "Disponivel";
      const { error } = await supabase
        .from("trip")
        .update({ status: newStatus })
        .eq("id", tripId);

      if (error) throw new Error(JSON.stringify(error));

      setTrips((prev) =>
        prev.map((t) => (t.id === tripId ? { ...t, status: newStatus } : t))
      );
      toast.success(newStatus === "Disponivel" ? "Viagem marcada como disponível!" : "Viagem marcada como esgotada!");
    } catch (error) {
      const msg = error instanceof Error ? error.message : JSON.stringify(error);
      toast.error(`Erro: ${msg}`);
    } finally {
      setProcessing(null);
    }
  }

  async function deleteTrip(tripId: string) {
    setProcessing(tripId);
    try {
      const { data: bookings } = await supabase
        .from("booking")
        .select("id")
        .eq("trip_id", tripId)
        .limit(1);

      if (bookings && bookings.length > 0)
        throw new Error("Não é possível deletar uma viagem com reservas vinculadas");

      const { error } = await supabase.from("trip").delete().eq("id", tripId);
      if (error) throw new Error(JSON.stringify(error));

      setTrips((prev) => prev.filter((t) => t.id !== tripId));
      toast.success("Viagem deletada com sucesso!");
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (error) {
      const msg = error instanceof Error ? error.message : JSON.stringify(error);
      toast.error(`Erro: ${msg}`);
    } finally {
      setProcessing(null);
    }
  }

  async function createTrip() {
    setCreatingTrip(true);
    try {
      if (!formData.route_id.trim()) throw new Error("Rota é obrigatória");
      if (!formData.departure_date.trim()) throw new Error("Data de partida é obrigatória");
      if (!formData.departure_time.trim()) throw new Error("Hora de partida é obrigatória");
      if (!formData.price) throw new Error("Preço é obrigatório");
      if (!formData.total_seats) throw new Error("Total de assentos é obrigatório");

      const { error } = await supabase.from("trip").insert([
        {
          route_id: formData.route_id,
          departure_date: formData.departure_date,
          departure_time: formData.departure_time,
          expected_arrival_date: formData.expected_arrival_date || null,
          price: parseFloat(formData.price),
          total_seats: parseInt(formData.total_seats),
          available_seats: parseInt(formData.total_seats),
          status: "Disponivel",
        },
      ]);

      if (error) throw new Error(JSON.stringify(error));

      toast.success("Viagem criada com sucesso!");
      setFormData({
        route_id: "",
        departure_date: "",
        departure_time: "",
        expected_arrival_date: "",
        price: "",
        total_seats: "",
      });
      setShowCreateForm(false);
      loadTrips();
    } catch (error) {
      const msg = error instanceof Error ? error.message : JSON.stringify(error);
      toast.error(`Erro ao criar viagem: ${msg}`);
    } finally {
      setCreatingTrip(false);
    }
  }

  const filteredTrips = trips.filter((t) => {
    if (statusFilter === "todos") return true;
    if (statusFilter === "ativas") return t.status === "Disponivel";
    if (statusFilter === "inativas") return t.status === "Esgotado";
    return true;
  });

  const stats = {
    total: trips.length,
    ativas: trips.filter((t) => t.status === "Disponivel").length,
    inativas: trips.filter((t) => t.status === "Esgotado").length,
  };

  const occupancyStats = {
    totalSeatsBooked: trips.reduce((sum, t) => sum + (t.total_seats - (t.available_seats || 0)), 0),
    totalSeatsCapacity: trips.reduce((sum, t) => sum + t.total_seats, 0),
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
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Gestão de Viagens</h1>
        <p className="text-slate-400">Visualize e gerencie todas as viagens disponíveis</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-slate-400 text-sm mb-2">Total</p>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-emerald-400 text-sm mb-2">Ativas</p>
              <p className="text-3xl font-bold text-emerald-400">{stats.ativas}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-400 text-sm mb-2">Inativas</p>
              <p className="text-3xl font-bold text-red-400">{stats.inativas}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-blue-400 text-sm mb-2">Assentos</p>
              <p className="text-3xl font-bold text-blue-400">
                {occupancyStats.totalSeatsBooked}/{occupancyStats.totalSeatsCapacity}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={statusFilter === "todos" ? "default" : "outline"}
          onClick={() => setStatusFilter("todos")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Filter className="w-4 h-4 mr-2" />
          Todas ({stats.total})
        </Button>
        <Button
          variant={statusFilter === "ativas" ? "default" : "outline"}
          onClick={() => setStatusFilter("ativas")}
          className="bg-emerald-500 hover:bg-emerald-600"
        >
          Ativas ({stats.ativas})
        </Button>
        <Button
          variant={statusFilter === "inativas" ? "default" : "outline"}
          onClick={() => setStatusFilter("inativas")}
          className="bg-red-500 hover:bg-red-600"
        >
          Inativas ({stats.inativas})
        </Button>
      </div>

      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="flex items-center justify-between">
            Viagens
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Viagem
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/10"
                onClick={() => {
                  const csv = filteredTrips
                    .map((t) =>
                      [
                        t.id,
                        t.route?.origin || "---",
                        t.route?.destination || "---",
                        t.departure_date,
                        t.departure_time,
                        t.price,
                        t.available_seats,
                        t.total_seats,
                        t.status,
                        t.created_at,
                      ].join(",")
                    )
                    .join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `trips-${new Date().toISOString().split("T")[0]}.csv`;
                  a.click();
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Rota</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Data e Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Preço</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Assentos</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Disponíveis</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                      Nenhuma viagem encontrada
                    </td>
                  </tr>
                ) : (
                  filteredTrips.map((trip) => (
                    <tr
                      key={trip.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-white font-medium">
                            {trip.route?.origin} → {trip.route?.destination}
                          </p>
                          <p className="text-slate-400 text-xs">
                            {trip.route?.distance_km ? `${trip.route.distance_km} km` : "---"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-white font-medium">{trip.departure_date}</p>
                          <p className="text-slate-400 text-xs">{trip.departure_time}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white font-semibold">{trip.price} Kz</td>
                      <td className="px-6 py-4 text-white font-semibold">{trip.total_seats}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start">
                          <p className="text-white font-semibold">{trip.available_seats}</p>
                          <p className="text-slate-400 text-xs">
                            {trip.total_seats - (trip.available_seats || 0)} reservados
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            trip.status === "Disponivel"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }
                        >
                          {trip.status === "Disponivel" ? "Disponível" : "Esgotado"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
                            onClick={() => {
                              setSelectedTrip(trip);
                              setShowDetails(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={
                              trip.status === "Disponivel"
                                ? "border-red-500/20 text-red-400 hover:bg-red-500/10"
                                : "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                            }
                            disabled={processing === trip.id}
                            onClick={() => toggleTripStatus(trip.id, trip.status)}
                          >
                            <span>
                              {processing === trip.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : trip.status === "Disponivel" ? (
                                "Marcar Esgotado"
                              ) : (
                                "Marcar Disponível"
                              )}
                            </span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                            disabled={processing === trip.id}
                            onClick={() => {
                              setDeleteTarget(trip.id);
                              setShowDeleteConfirm(true);
                            }}
                          >
                            <span>
                              {processing === trip.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </span>
                          </Button>
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
      {selectedTrip && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Detalhes da Viagem</DialogTitle>
              <DialogDescription className="sr-only">
                Informações completas da viagem
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm">Rota</p>
                <p className="font-semibold text-lg">
                  {selectedTrip.route?.origin} → {selectedTrip.route?.destination}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Distância</p>
                <p className="font-semibold">
                  {selectedTrip.route?.distance_km ? `${selectedTrip.route.distance_km} km` : "---"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Data e Hora de Partida</p>
                <p className="font-semibold">
                  {selectedTrip.departure_date} às {selectedTrip.departure_time}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Data Prevista de Chegada</p>
                <p className="font-semibold">{selectedTrip.expected_arrival_date || "---"}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Preço</p>
                <p className="font-semibold text-lg text-blue-400">{selectedTrip.price} Kz</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Assentos</p>
                <p className="font-semibold">
                  Total: {selectedTrip.total_seats} | Disponíveis: {selectedTrip.available_seats} | Reservados:{" "}
                  {selectedTrip.total_seats - (selectedTrip.available_seats || 0)}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Status</p>
                <Badge
                  className={
                    selectedTrip.status === "Disponivel"
                      ? "bg-emerald-500/20 text-emerald-400 mt-2"
                      : "bg-red-500/20 text-red-400 mt-2"
                  }
                >
                  {selectedTrip.status === "Disponivel" ? "Disponível" : "Esgotado"}
                </Badge>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Data de Criação</p>
                <p className="font-semibold text-sm">
                  {selectedTrip.created_at
                    ? new Date(selectedTrip.created_at).toLocaleString("pt-PT")
                    : "---"}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetails(false)} className="border-white/10">
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
            <DialogTitle className="text-red-400">Deletar Viagem</DialogTitle>
            <DialogDescription>
              Tem a certeza que deseja deletar esta viagem? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="border-white/10"
            >
              Cancelar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteTarget) deleteTrip(deleteTarget);
              }}
              disabled={processing !== null}
            >
              <span>
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
              </span>
              Deletar Viagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE TRIP DIALOG */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Viagem</DialogTitle>
            <DialogDescription className="text-slate-400">
              Preencha os dados para criar uma nova viagem.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 block mb-1">Rota</label>
              <select
                className="w-full bg-slate-800 border border-white/10 rounded-md px-3 py-2 text-white text-sm"
                value={formData.route_id}
                onChange={(e) => setFormData((p) => ({ ...p, route_id: e.target.value }))}
              >
                <option value="">Selecione uma rota</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.origin} → {r.destination}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1">Data de Partida</label>
              <input
                type="date"
                className="w-full bg-slate-800 border border-white/10 rounded-md px-3 py-2 text-white text-sm"
                value={formData.departure_date}
                onChange={(e) => setFormData((p) => ({ ...p, departure_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1">Hora de Partida</label>
              <input
                type="time"
                className="w-full bg-slate-800 border border-white/10 rounded-md px-3 py-2 text-white text-sm"
                value={formData.departure_time}
                onChange={(e) => setFormData((p) => ({ ...p, departure_time: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1">Data Prevista de Chegada</label>
              <input
                type="datetime-local"
                className="w-full bg-slate-800 border border-white/10 rounded-md px-3 py-2 text-white text-sm"
                value={formData.expected_arrival_date}
                onChange={(e) => setFormData((p) => ({ ...p, expected_arrival_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1">Preço (Kz)</label>
              <input
                type="number"
                className="w-full bg-slate-800 border border-white/10 rounded-md px-3 py-2 text-white text-sm"
                placeholder="Ex: 5000"
                value={formData.price}
                onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1">Total de Assentos</label>
              <input
                type="number"
                className="w-full bg-slate-800 border border-white/10 rounded-md px-3 py-2 text-white text-sm"
                placeholder="Ex: 40"
                value={formData.total_seats}
                onChange={(e) => setFormData((p) => ({ ...p, total_seats: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateForm(false)}
              className="border-white/10"
            >
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={createTrip}
              disabled={creatingTrip}
            >
              <span>
                {creatingTrip ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
              </span>
              Criar Viagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}