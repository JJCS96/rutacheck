import { useEffect, useState } from "react";
import { getEnVivo } from "../api/consultas";

export const INTERVALO_VIVO_MS = 5000;

/**
 * Consulta la posicion del equipo cada INTERVALO_VIVO_MS mientras `activo` sea true.
 *
 * Deja de consultar al desactivarse o al cambiar de coordinador/promotor, y descarta
 * respuestas que lleguen tarde de una consulta anterior.
 *
 * @returns {{estado:'inactivo'|'cargando'|'listo'|'error', horaSimulada:string|null, promotores:Array}}
 */
export function useEnVivo(activo, coordinador, promotor) {
  const [datos, setDatos] = useState({ estado: "inactivo", horaSimulada: null, promotores: [] });

  useEffect(() => {
    if (!activo || !coordinador) {
      setDatos({ estado: "inactivo", horaSimulada: null, promotores: [] });
      return;
    }

    let vigente = true;
    setDatos({ estado: "cargando", horaSimulada: null, promotores: [] });

    const consultar = () =>
      getEnVivo({ coordinador, promotor })
        .then((r) => vigente && setDatos({ estado: "listo", horaSimulada: r.horaSimulada, promotores: r.promotores }))
        .catch((error) => {
          console.error(error);
          if (vigente) setDatos((prev) => ({ ...prev, estado: "error" }));
        });

    consultar();
    const temporizador = setInterval(consultar, INTERVALO_VIVO_MS);
    return () => {
      vigente = false;
      clearInterval(temporizador);
    };
  }, [activo, coordinador, promotor]);

  return datos;
}
