import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

/**
 * Encuadra el mapa en `puntos` cada vez que cambia `clave`.
 *
 * Se usa una clave explicita (y no los puntos) para decidir cuando reencuadrar:
 * asi, por ejemplo, el modo En vivo no mueve la camara en cada actualizacion,
 * solo al cambiar de equipo o al pulsar "Ver a todo el equipo".
 * Sin puntos, vuelve a la vista inicial.
 *
 * Usa fitBounds y no flyToBounds: la animacion pide tiles de cada zoom intermedio
 * y el servidor de OpenStreetMap rechaza esas rafagas.
 */
export default function AjustarVista({ clave, puntos, maxZoom = 16, centroInicial, zoomInicial }) {
  const map = useMap();
  const ultimosPuntos = useRef(puntos);
  ultimosPuntos.current = puntos;

  useEffect(() => {
    const p = ultimosPuntos.current;
    if (p.length > 0) {
      map.fitBounds(p, { padding: [60, 60], maxZoom });
    } else {
      map.setView(centroInicial, zoomInicial);
    }
  }, [map, clave, maxZoom, centroInicial, zoomInicial]);

  return null;
}
