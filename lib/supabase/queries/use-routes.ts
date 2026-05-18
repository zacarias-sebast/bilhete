"use client"
import { useQuery } from "@tanstack/react-query";
import { getRoutes } from "./get-routes";
import {Route} from "./get-routes"

export  function useRoutes(){
    return useQuery<Route[]>({
        queryKey:["routes"],
        queryFn:getRoutes,
        staleTime:1000 * 60 * 60
    });
}