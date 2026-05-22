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
  Edit,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Route {
  id: string;
  origin: string;
  destination: string;
  distance_km: number | null;
  estimated_duration: string | null;
  active: boolean | null;
  created_at: string | null;
}

type ActiveFilter = "todos" | "ativas" | "inativas";

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("todos");
  
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    distance_km: "",
    estimated_duration: "",
  });
  const [creatingRoute, setCreatingRoute] = useState(false);

  const supabase = createClient();

  // Load all routes
  useEffect(() => {
    loadRoutes();
  }, []);

  async function loadRoutes() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("route")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
        throw new Error(`Erro ao buscar rotas: ${errorMsg}`);
      }

      setRoutes((data || []) as Route[]);
      console.log(`✅ Carregadas ${data?.length || 0} rotas`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      console.error("Erro ao carregar rotas:", errorMsg, error);
      toast.error(`Erro ao carregar rotas: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  }

  async function toggleRouteStatus(routeId: string, currentStatus: boolean | null) {
    setProcessing(routeId);
    try {
      const { error: updateError } = await supabase
        .from("route")
        .update({
          active: !currentStatus,
        })
        .eq("id", routeId);

      if (updateError) {
        const errorMsg = updateError instanceof Error ? updateError.message : JSON.stringify(updateError);
        throw new Error(`Erro Supabase: ${errorMsg}`);
      }

      setRoutes((prev) =>
        prev.map((r) =>
          r.id === routeId ? { ...r, active: !currentStatus } : r
        )
      );

      toast.success(!currentStatus ? "Rota ativada com sucesso!" : "Rota desativada com sucesso!");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      console.error("Erro ao atualizar rota:", errorMsg, error);
      toast.error(`Erro ao atualizar rota: ${errorMsg}`);
    } finally {
      setProcessing(null);
    }
  }

  async function deleteRoute(routeId: string) {
    setProcessing(routeId);
    try {
      // Check if route has any trips
      const { data: tripsData } = await supabase
        .from("trip")
        .select("id")
        .eq("route_id", routeId)
        .limit(1);

      if (tripsData && tripsData.length > 0) {
        throw new Error("Não é possível deletar uma rota que possui viagens vinculadas");
      }

      const { error: deleteError } = await supabase
        .from("route")
        .delete()
        .eq("id", routeId);

      if (deleteError) {
        const errorMsg = deleteError instanceof Error ? deleteError.message : JSON.stringify(deleteError);
        throw new Error(`Erro ao deletar: ${errorMsg}`);
      }

      setRoutes((prev) => prev.filter((r) => r.id !== routeId));

      toast.success("Rota deletada com sucesso!");
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      console.error("Erro ao deletar rota:", errorMsg, error);
      toast.error(`Erro ao deletar rota: ${errorMsg}`);
    } finally {
      setProcessing(null);
    }
  }

  async function createRoute() {
    setCreatingRoute(true);
    try {
      if (!formData.origin.trim()) throw new Error("Origem é obrigatória");
      if (!formData.destination.trim()) throw new Error("Destino é obrigatório");

      // Convert duration to valid PostgreSQL interval format
      let estimatedDuration: string | null = null;
      if (formData.estimated_duration.trim()) {
        const duration = formData.estimated_duration.trim().toLowerCase();
        
        // Try to parse common formats: "12", "12h", "12:30", "12h30", "12h 30m"
        const hourMatch = duration.match(/(\d+)\s*h/);
        const minMatch = duration.match(/(\d+)\s*m/);
        const colonMatch = duration.match(/(\d+):(\d+)/);
        
        let hours = 0;
        let minutes = 0;
        
        if (colonMatch) {
          hours = parseInt(colonMatch[1]);
          minutes = parseInt(colonMatch[2]);
        } else {
          if (hourMatch) hours = parseInt(hourMatch[1]);
          if (minMatch) minutes = parseInt(minMatch[1]);
        }
        
        if (hours >= 0 && minutes >= 0 && minutes < 60) {
          // Format as HH:MM:SS for PostgreSQL interval
          estimatedDuration = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
        } else {
          throw new Error("Duração inválida. Use formatos como: '2:30', '12h', '12h30', '2h 30m'");
        }
      }

      const { data, error } = await supabase
        .from("route")
        .insert([
          {
            origin: formData.origin.trim(),
            destination: formData.destination.trim(),
            distance_km: formData.distance_km ? parseInt(formData.distance_km) : null,
            estimated_duration: estimatedDuration,
            active: true,
          },
        ])
        .select();

      if (error) {
        const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
        throw new Error(`Erro Supabase: ${errorMsg}`);
      }

      toast.success("Rota criada com sucesso!");
      setFormData({ origin: "", destination: "", distance_km: "", estimated_duration: "" });
      setShowCreateForm(false);
      loadRoutes();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      console.error("Erro ao criar rota:", errorMsg, error);
      toast.error(`Erro ao criar rota: ${errorMsg}`);
    } finally {
      setCreatingRoute(false);
    }
  }

  const filteredRoutes = routes.filter((r) => {
    if (activeFilter === "todos") return true;
    if (activeFilter === "ativas") return r.active === true;
    if (activeFilter === "inativas") return r.active === false;
    return true;
  });

  const stats = {
    total: routes.length,
    ativas: routes.filter((r) => r.active === true).length,
    inativas: routes.filter((r) => r.active === false).length,
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
        <h1 className="text-3xl font-bold text-white mb-2">Gestão de Rotas</h1>
        <p className="text-slate-400">
          Visualize e gerencie todas as rotas disponíveis
        </p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeFilter === "todos" ? "default" : "outline"}
          onClick={() => setActiveFilter("todos")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Filter className="w-4 h-4 mr-2" />
          Todas ({stats.total})
        </Button>
        <Button
          variant={activeFilter === "ativas" ? "default" : "outline"}
          onClick={() => setActiveFilter("ativas")}
          className="bg-emerald-500 hover:bg-emerald-600"
        >
          Ativas ({stats.ativas})
        </Button>
        <Button
          variant={activeFilter === "inativas" ? "default" : "outline"}
          onClick={() => setActiveFilter("inativas")}
          className="bg-red-500 hover:bg-red-600"
        >
          Inativas ({stats.inativas})
        </Button>
      </div>

      {/* ROUTES TABLE */}
      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="flex items-center justify-between">
            Rotas
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Rota
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/10"
                onClick={() => {
                  // Export functionality
                  const csv = filteredRoutes
                    .map((r) => [
                      r.id,
                      r.origin,
                      r.destination,
                      r.distance_km || "---",
                      r.estimated_duration || "---",
                      r.active ? "Ativa" : "Inativa",
                      r.created_at,
                    ].join(","))
                    .join("\n");
                  
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `routes-${new Date().toISOString().split("T")[0]}.csv`;
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
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                    Origem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                    Destino
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                    Distância
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                    Duração
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
                {filteredRoutes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                      Nenhuma rota encontrada
                    </td>
                  </tr>
                ) : (
                  filteredRoutes.map((route) => (
                    <tr
                      key={route.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-white text-sm">
                          {route.origin}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-white text-sm">
                          {route.destination}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-white font-semibold">
                        {route.distance_km ? `${route.distance_km} km` : "---"}
                      </td>
                      <td className="px-6 py-4 text-white font-semibold">
                        {route.estimated_duration || "---"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            route.active === true
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }
                        >
                          {route.active === true ? "Ativa" : "Inativa"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {route.created_at
                          ? new Date(route.created_at).toLocaleDateString("pt-PT")
                          : "---"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
                            onClick={() => {
                              setSelectedRoute(route);
                              setShowDetails(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className={
                              route.active === true
                                ? "border-red-500/20 text-red-400 hover:bg-red-500/10"
                                : "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                            }
                            disabled={processing === route.id}
                            onClick={() => toggleRouteStatus(route.id, route.active)}
                          >
                            {processing === route.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : route.active === true ? (
                              "Desativar"
                            ) : (
                              "Ativar"
                            )}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                            disabled={processing === route.id}
                            onClick={() => {
                              setDeleteTarget(route.id);
                              setShowDeleteConfirm(true);
                            }}
                          >
                            {processing === route.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 p-4">
            {filteredRoutes.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                Nenhuma rota encontrada
              </div>
            ) : (
              filteredRoutes.map((route) => (
                <div
                  key={route.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3 hover:bg-white/[0.08] transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-400 text-xs uppercase">Rota</p>
                      <p className="text-white text-sm font-medium">
                        {route.origin} → {route.destination}
                      </p>
                    </div>
                    <Badge
                      className={
                        route.active
                          ? "bg-emerald-500/20 text-emerald-400 text-xs"
                          : "bg-red-500/20 text-red-400 text-xs"
                      }
                    >
                      {route.active ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>

                  <div className="border-t border-white/10 pt-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-slate-400 text-xs uppercase">Distância</p>
                        <p className="text-white text-sm font-semibold">
                          {route.distance_km ? `${route.distance_km} km` : "---"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs uppercase">Duração</p>
                        <p className="text-white text-sm font-semibold">
                          {route.estimated_duration || "---"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-slate-400 text-xs uppercase">Data Criação</p>
                      <p className="text-white text-sm">
                        {route.created_at
                          ? new Date(route.created_at).toLocaleDateString("pt-PT")
                          : "---"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-white/10 pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-blue-500/20 text-blue-400 hover:bg-blue-500/10 text-xs"
                      onClick={() => {
                        setSelectedRoute(route);
                        setShowDetails(true);
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Ver
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs"
                      disabled={processing === route.id}
                      onClick={() => {
                        setDeleteTarget(route.id);
                        setShowDeleteConfirm(true);
                      }}
                    >
                      {processing === route.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* DETAILS DIALOG */}
      {selectedRoute && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Detalhes da Rota</DialogTitle>
              <DialogDescription className="sr-only">
                Informações completas da rota
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm">Origem</p>
                <p className="font-semibold text-lg">{selectedRoute.origin}</p>
              </div>

              <div>
                <p className="text-slate-400 text-sm">Destino</p>
                <p className="font-semibold text-lg">{selectedRoute.destination}</p>
              </div>

              <div>
                <p className="text-slate-400 text-sm">Distância</p>
                <p className="font-semibold">
                  {selectedRoute.distance_km ? `${selectedRoute.distance_km} km` : "---"}
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-sm">Duração Estimada</p>
                <p className="font-semibold">
                  {selectedRoute.estimated_duration || "---"}
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-sm">Status</p>
                <Badge
                  className={
                    selectedRoute.active === true
                      ? "bg-emerald-500/20 text-emerald-400 mt-2"
                      : "bg-red-500/20 text-red-400 mt-2"
                  }
                >
                  {selectedRoute.active === true ? "Ativa" : "Inativa"}
                </Badge>
              </div>

              <div>
                <p className="text-slate-400 text-sm">Data de Criação</p>
                <p className="font-semibold text-sm">
                  {selectedRoute.created_at
                    ? new Date(selectedRoute.created_at).toLocaleString("pt-PT")
                    : "---"}
                </p>
              </div>
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
            <DialogTitle className="text-red-400">Deletar Rota</DialogTitle>
            <DialogDescription>
              Tem a certeza que deseja deletar esta rota? Esta ação não pode ser desfeita.
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
                if (deleteTarget) {
                  deleteRoute(deleteTarget);
                }
              }}
              disabled={processing !== null}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Deletar Rota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE ROUTE DIALOG */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Rota</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para criar uma nova rota
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="origin" className="text-slate-300">
                Origem *
              </Label>
              <Input
                id="origin"
                placeholder="Ex: Luanda"
                value={formData.origin}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, origin: e.target.value }))
                }
                className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
              />
            </div>

            <div>
              <Label htmlFor="destination" className="text-slate-300">
                Destino *
              </Label>
              <Input
                id="destination"
                placeholder="Ex: Benguela"
                value={formData.destination}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, destination: e.target.value }))
                }
                className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
              />
            </div>

            <div>
              <Label htmlFor="distance" className="text-slate-300">
                Distância (km)
              </Label>
              <Input
                id="distance"
                placeholder="Ex: 250"
                type="number"
                value={formData.distance_km}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, distance_km: e.target.value }))
                }
                className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
              />
            </div>

            <div>
              <Label htmlFor="duration" className="text-slate-300">
                Duração Estimada
              </Label>
              <Input
                id="duration"
                placeholder="Ex: 2:30, 4h, 4h30, 4h 30m"
                value={formData.estimated_duration}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, estimated_duration: e.target.value }))
                }
                className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateForm(false);
                setFormData({ origin: "", destination: "", distance_km: "", estimated_duration: "" });
              }}
              className="border-white/10"
              disabled={creatingRoute}
            >
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={createRoute}
              disabled={creatingRoute}
            >
              {creatingRoute ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {creatingRoute ? "Criando..." : "Criar Rota"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
