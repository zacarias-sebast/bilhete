"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import {
  Calendar,
  Clock,
  Users,
  Ticket,
  Loader2,
  ArrowBigRight
} from "lucide-react"


import Link from "next/link"
import { useTrips } from "@/lib/supabase/queries/use-trips"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useQueryClient } from "@tanstack/react-query"

export default function TripPage(){
   
  const { data, isLoading, error } = useTrips()
  const queryClient = useQueryClient()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const supabase = createClient()

    // Configurar Realtime para a tabela trip
    const tripChannel = supabase
      .channel('trip-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip'
        },
        () => {
          console.log('Mudança detectada em viagens! Atualizando lista...')
          queryClient.invalidateQueries({ queryKey: ["trip"] })
        }
      )
      .subscribe()

    // Configurar Realtime para a tabela booking (para atualizar available_seats)
    const bookingChannel = supabase
      .channel('booking-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking'
        },
        () => {
          console.log('Reserva criada/cancelada! Atualizando assentos disponíveis...')
          queryClient.invalidateQueries({ queryKey: ["trip"] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(tripChannel)
      supabase.removeChannel(bookingChannel)
    }
  }, [queryClient])

  if (isLoading || !isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Carregando viagens disponíveis...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Erro ao carregar viagens</p>
          <Button onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      {/* HEADER */}
      <section className="container mx-auto px-6 pt-16 pb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Viagens disponíveis
        </h1>

        <p className="text-slate-300 max-w-2xl mx-auto">
          Escolha uma das viagens disponíveis e reserve seu bilhete digital
          de forma rápida, segura e sem filas.
        </p>
      </section>

      {/* TRIPS GRID */}
      <section className="container mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.map((trip) => (
            <Card
              key={trip.id}
              className="bg-white/5 border-white/10 hover:border-blue-500/40 transition group"
            >

              <CardHeader className="space-y-4">
                {/* STATUS */}
                <div className="flex justify-between">
                  <Badge className={trip.status === "Disponivel" ? "bg-emerald-500/20 text-emerald-400": "bg-red-500/20 text-red-400"}
                  >
                    {trip.status}
                  </Badge>

                </div>


                {/* TITULO */}
                <CardTitle className="text-xl flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-blue-400" />
                  {trip.route.origin} <ArrowBigRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-transform group-hover:translate-x-1" /> {trip.route.destination}
                </CardTitle>
              </CardHeader>


              <CardContent className="space-y-4">
                {/* DATA */}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  Data de partida: {trip.departure_date}
                </div>


                {/* HORA */}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Horario de partida: {trip.departure_time}
                </div>


                {/* ASSENTOS */}
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-emerald-400" />
                   Assentos {trip.total_seats} / {trip.available_seats} lugares disponíveis
                </div>


                {/* PREÇO */}
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-slate-400 text-sm">
                    Preço
                  </span>

                  <span className="text-xl font-bold text-blue-400">
                    {trip.price} Kz
                  </span>
                </div>


                {/* BOTÃO */}
                <Button
                  asChild
                  disabled={trip.available_seats === 0 || trip.status !== "Disponivel"}
                  className={`w-full ${trip.available_seats === 0 ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700" }`} >
                  {trip.available_seats === 0 ? (<span>Esgotado</span>) : (
                    <Link href={`/protected/trip/${trip.id}/reserve/`}>Reservar Lugar</Link>)}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}