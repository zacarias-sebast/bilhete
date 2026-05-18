import { createClient } from "../client";
import { Database } from "@/database.types";

export type Trip = Database["public"]["Tables"]["trip"]["Row"] & {
  route: {
    origin: string;
    destination: string;
  };
};

export async function getTrips(): Promise<Trip[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trip")
    .select(`*, route(origin , destination)`);
  if (error) throw error;
  return data as any as Trip[];
}