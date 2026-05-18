"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";
import {
  Loader2,
  BookOpen,
  Map,
  Ticket,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface Stats {
  bookings: { total: number; confirmed: number; pending: number; cancelled: number };
  trips: { total: number; active: number; inactive: number; totalSeats: number; bookedSeats: number };
  routes: { total: number; active: number; inactive: number };
}

function DonutChart({
  segments,
  size = 120,
  stroke = 18,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = pct * circ;
        const gap = circ - dash;
        const el = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset * circ}
          />
        );
        offset += pct;
        return el;
      })}
    </svg>
  );
}

function BarChart({ bars, height = 80 }: { bars: { label: string; value: number; color: string }[]; height?: number }) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="flex items-end gap-3 w-full" style={{ height }}>
      {bars.map((bar, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-xs font-bold" style={{ color: bar.color }}>{bar.value}</span>
          <div
            className="w-full rounded-t-md"
            style={{ height: `${(bar.value / max) * (height - 24)}px`, background: bar.color, opacity: 0.85 }}
          />
          <span className="text-[10px] text-slate-400 text-center leading-tight">{bar.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({
    bookings: { total: 0, confirmed: 0, pending: 0, cancelled: 0 },
    trips: { total: 0, active: 0, inactive: 0, totalSeats: 0, bookedSeats: 0 },
    routes: { total: 0, active: 0, inactive: 0 },
  });

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { redirect("/auth/login"); return; }

      const { data: profile } = await supabase
        .from("profile").select("full_name").eq("id", authUser.id).single();
      setUser({ email: authUser.email, name: profile?.full_name });

      const [bookingsRes, tripsRes, routesRes] = await Promise.all([
        supabase.from("booking").select("status"),
        supabase.from("trip").select("status, total_seats, available_seats"),
        supabase.from("route").select("active"),
      ]);

      const bookings = bookingsRes.data || [];
      const trips = tripsRes.data || [];
      const routes = routesRes.data || [];

      setStats({
        bookings: {
          total: bookings.length,
          confirmed: bookings.filter((b) =>
            ["confirmado", "confirmed"].includes(b.status ?? "")
          ).length,
          pending: bookings.filter((b) =>
            ["pendente", "pending"].includes(b.status ?? "")
          ).length,
          cancelled: bookings.filter((b) =>
            ["cancelado", "cancelled"].includes(b.status ?? "")
          ).length,
        },
        trips: {
          total: trips.length,
          active: trips.filter((t) => t.status === "ativa").length,
          inactive: trips.filter((t) => t.status === "inativa").length,
          totalSeats: trips.reduce((s, t) => s + (t.total_seats || 0), 0),
          bookedSeats: trips.reduce((s, t) => s + ((t.total_seats || 0) - (t.available_seats || 0)), 0),
        },
        routes: {
          total: routes.length,
          active: routes.filter((r) => r.active === true).length,
          inactive: routes.filter((r) => r.active === false).length,
        },
      });

      setLoading(false);
    }
    init().catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
      </div>
    );
  }

  const pct = (part: number, total: number) =>
    total ? `${Math.round((part / total) * 100)}%` : "0%";

  const occupancyPct = stats.trips.totalSeats > 0
    ? Math.round((stats.trips.bookedSeats / stats.trips.totalSeats) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Painel de Administração</h1>
        <p className="text-slate-400">
          Bem-vindo{user?.name ? `, ${user.name}` : ""}! Aqui está o resumo do sistema.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Reservas", value: stats.bookings.total, icon: <BookOpen className="w-5 h-5" />, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
          { label: "Total Viagens", value: stats.trips.total, icon: <Ticket className="w-5 h-5" />, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
          { label: "Total Rotas", value: stats.routes.total, icon: <Map className="w-5 h-5" />, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { label: "Ocupação Geral", value: `${occupancyPct}%`, icon: <TrendingUp className="w-5 h-5" />, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
        ].map((k) => (
          <div key={k.label} className={`rounded-xl border p-5 ${k.bg}`}>
            <div className={`flex items-center gap-2 mb-3 ${k.color}`}>
              {k.icon}
              <span className="text-xs font-semibold uppercase tracking-wide">{k.label}</span>
            </div>
            <p className={`text-4xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* Reservas */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" /> Reservas
          </h2>
          <p className="text-slate-500 text-xs mb-5">Distribuição por status</p>
          <div className="flex items-center justify-center mb-6 relative">
            <DonutChart
              segments={[
                { value: stats.bookings.confirmed, color: "#10b981" },
                { value: stats.bookings.pending, color: "#f59e0b" },
                { value: stats.bookings.cancelled, color: "#ef4444" },
              ]}
              size={130} stroke={20}
            />
            <div className="absolute text-center pointer-events-none">
              <p className="text-2xl font-bold text-white">{stats.bookings.total}</p>
              <p className="text-[10px] text-slate-400">total</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: "Confirmadas", value: stats.bookings.confirmed, color: "#10b981", icon: <CheckCircle className="w-3 h-3" /> },
              { label: "Pendentes", value: stats.bookings.pending, color: "#f59e0b", icon: <Clock className="w-3 h-3" /> },
              { label: "Canceladas", value: stats.bookings.cancelled, color: "#ef4444", icon: <XCircle className="w-3 h-3" /> },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2" style={{ color: item.color }}>
                  {item.icon}
                  <span className="text-xs text-slate-300">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: pct(item.value, stats.bookings.total), background: item.color }} />
                  </div>
                  <span className="text-xs font-semibold text-white w-8 text-right">
                    {pct(item.value, stats.bookings.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Viagens */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-purple-400" /> Viagens
          </h2>
          <p className="text-slate-500 text-xs mb-5">Status e ocupação de assentos</p>
          <div className="flex items-center justify-center mb-6 relative">
            <DonutChart
              segments={[
                { value: stats.trips.active, color: "#a78bfa" },
                { value: stats.trips.inactive, color: "#475569" },
              ]}
              size={130} stroke={20}
            />
            <div className="absolute text-center pointer-events-none">
              <p className="text-2xl font-bold text-white">{stats.trips.total}</p>
              <p className="text-[10px] text-slate-400">total</p>
            </div>
          </div>
          <div className="space-y-2 mb-5">
            {[
              { label: "Ativas", value: stats.trips.active, color: "#a78bfa" },
              { label: "Inativas", value: stats.trips.inactive, color: "#475569" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-xs text-slate-300">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: pct(item.value, stats.trips.total), background: item.color }} />
                  </div>
                  <span className="text-xs font-semibold text-white w-8 text-right">
                    {pct(item.value, stats.trips.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-400">Assentos ocupados</span>
              <span className="font-semibold text-amber-400">{occupancyPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${occupancyPct}%` }} />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {stats.trips.bookedSeats} / {stats.trips.totalSeats} assentos
            </p>
          </div>
        </div>

        {/* Rotas */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
            <Map className="w-4 h-4 text-emerald-400" /> Rotas
          </h2>
          <p className="text-slate-500 text-xs mb-5">Rotas ativas vs inativas</p>
          <div className="flex items-center justify-center mb-6 relative">
            <DonutChart
              segments={[
                { value: stats.routes.active, color: "#34d399" },
                { value: stats.routes.inactive, color: "#475569" },
              ]}
              size={130} stroke={20}
            />
            <div className="absolute text-center pointer-events-none">
              <p className="text-2xl font-bold text-white">{stats.routes.total}</p>
              <p className="text-[10px] text-slate-400">total</p>
            </div>
          </div>
          <div className="space-y-2 mb-5">
            {[
              { label: "Ativas", value: stats.routes.active, color: "#34d399" },
              { label: "Inativas", value: stats.routes.inactive, color: "#475569" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-xs text-slate-300">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: pct(item.value, stats.routes.total), background: item.color }} />
                  </div>
                  <span className="text-xs font-semibold text-white w-8 text-right">
                    {pct(item.value, stats.routes.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-3">Visão geral</p>
            <BarChart
              bars={[
                { label: "Ativas", value: stats.routes.active, color: "#34d399" },
                { label: "Inativas", value: stats.routes.inactive, color: "#475569" },
                { label: "Total", value: stats.routes.total, color: "#22d3ee" },
              ]}
              height={80}
            />
          </div>
        </div>
      </div>



      {/* User info */}
      {user && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-white font-semibold">{user.name || "Admin"}</p>
            <p className="text-slate-400 text-sm font-mono">{user.email}</p>
          </div>
        </div>
      )}
    </div>
  );
}