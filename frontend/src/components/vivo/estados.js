/**
 * Traduce el estado que devuelve la API (en-visita | en-camino | sin-iniciar | finalizada)
 * a textos para la interfaz.
 * @returns {{titulo:string, detalle:string, variante:string}}
 */
export function describirEstado({ estado, tienda }) {
  switch (estado) {
    case "en-visita":
      return { titulo: "En visita", detalle: tienda, variante: "visita" };
    case "en-camino":
      return { titulo: "En camino", detalle: tienda ? `Rumbo a ${tienda}` : "En movimiento", variante: "camino" };
    case "sin-iniciar":
      return { titulo: "Sin iniciar", detalle: "Aún no inicia su jornada", variante: "inactivo" };
    default:
      return { titulo: "Jornada terminada", detalle: "Completó su ruta", variante: "inactivo" };
  }
}
