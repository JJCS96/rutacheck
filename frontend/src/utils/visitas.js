import L from "leaflet";
import { aMinutos } from "./tiempo";

export const SIN_NOVEDAD = "VISITA NORMAL";

const distanciaEntre = (a, b) => Math.round(L.latLng(a).distanceTo(b));

/**
 * Une el check-in y el check-out de cada tienda en una sola visita y calcula la
 * distancia de cada marcacion a la tienda (para saber si quedo fuera del radio).
 *
 * @param {Array} registros  Marcaciones devueltas por la API (recurso=marcaciones).
 * @returns {Array<{id, tienda, promotor, novedad, entrada, salida}>}  Ordenadas por hora de entrada.
 */
export function agruparVisitas(registros) {
  const visitas = new Map();

  for (const r of registros) {
    const tienda = r.tienda;
    const id = `${tienda.codigo}-${r.promotor}`;

    if (!visitas.has(id)) {
      visitas.set(id, { id, tienda, promotor: r.promotor, novedad: r.novedad, entrada: null, salida: null });
    }

    const distancia = distanciaEntre([tienda.lat, tienda.lng], [r.lat, r.lng]);
    visitas.get(id)[r.tipo === "ENTRADA" ? "entrada" : "salida"] = {
      hora: r.hora,
      lat: r.lat,
      lng: r.lng,
      distancia,
      fueraDeRadio: distancia > tienda.radio,
    };
  }

  return [...visitas.values()].sort((a, b) =>
    (a.entrada?.hora ?? "").localeCompare(b.entrada?.hora ?? "")
  );
}

export const marcacionesDe = (visita) => [visita.entrada, visita.salida].filter(Boolean);

export const tieneAlerta = (visita) => marcacionesDe(visita).some((m) => m.fueraDeRadio);

export function duracionMinutos(visita) {
  if (!visita.entrada || !visita.salida) return null;
  return aMinutos(visita.salida.hora) - aMinutos(visita.entrada.hora);
}

/** Totales del dia para las tarjetas de resumen del modo Visitas. */
export function resumir(visitas) {
  return {
    visitas: visitas.length,
    promotores: new Set(visitas.map((v) => v.promotor)).size,
    fueraDeRadio: visitas.filter(tieneAlerta).length,
    conNovedad: visitas.filter((v) => v.novedad !== SIN_NOVEDAD).length,
  };
}
