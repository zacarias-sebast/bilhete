import { createClient } from "../client";
export type Route = {
  id: string
  origin: string
  destination: string
  distance_km: number
  estimated_duration: string
  active: boolean
  created_at: string
  updated_at: string
}


export async function getRoutes():Promise<Route[]>{
    const supabase = createClient();
    const {data , error} = await supabase.from("route").select("*").order("id")
    if(error) throw error;
    return data as Route[];
}

