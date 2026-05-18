import { useQuery } from "@tanstack/react-query";
import { getTrips, Trip } from "./get-trips";

export function useTrips(){
    
    return useQuery<Trip[]>({
        queryKey:["trip"],
        queryFn:getTrips,
        staleTime:1000 * 60 * 60
    }); 

}