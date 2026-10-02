import L from "leaflet";

const metros = (a, b) => L.latLng(a.lat, a.lng).distanceTo([b.lat, b.lng]);

/**
 * Deja solo los puntos GPS cuya hora (en minutos) esta dentro del rango.
 * @param {Array<{min:number}>} puntos
 * @param {{desde:number, hasta:number}} rango
 */
export function filtrarPorRango(puntos, { desde, hasta }) {
  return puntos.filter((p) => p.min >= desde && p.min <= hasta);
}

/**
 * Detecta paradas: tramos en los que el promotor permanece dentro de un radio
 * pequeno durante un tiempo minimo (p. ej. mientras atiende una tienda).
 *
 * Recorre los puntos en orden y va agrupando los que quedan a menos de
 * `radioMetros` del primer punto del grupo; si el grupo dura al menos
 * `minutosMinimos`, se considera una parada.
 *
 * @param {Array<{min:number, lat:number, lng:number}>} puntos  Traza GPS ordenada por hora.
 * @returns {Array<{desde:number, hasta:number, minutos:number, lat:number, lng:number}>}
 */
export function detectarParadas(puntos, { radioMetros = 60, minutosMinimos = 10 } = {}) {
  const paradas = [];
  let i = 0;

  while (i < puntos.length) {
    const ancla = puntos[i];
    let j = i;
    while (j + 1 < puntos.length && metros(ancla, puntos[j + 1]) <= radioMetros) j++;

    const minutos = puntos[j].min - ancla.min;
    if (minutos >= minutosMinimos) {
      const grupo = puntos.slice(i, j + 1);
      paradas.push({
        desde: ancla.min,
        hasta: puntos[j].min,
        minutos,
        // Centro de la parada: promedio de los puntos del grupo
        lat: grupo.reduce((s, p) => s + p.lat, 0) / grupo.length,
        lng: grupo.reduce((s, p) => s + p.lng, 0) / grupo.length,
      });
    }
    i = j + 1;
  }
  return paradas;
}

/**
 * Calcula los indicadores de un recorrido: distancia total, tiempo en
 * movimiento, tiempo detenido y numero de paradas.
 *
 * @param {Array<{min:number, lat:number, lng:number}>} puntos  Traza GPS (ya filtrada si aplica).
 * @returns {{km:number, minutosMovimiento:number, minutosDetenido:number, paradas:number}}
 */
export function resumirRecorrido(puntos) {
  if (puntos.length < 2) return { km: 0, minutosMovimiento: 0, minutosDetenido: 0, paradas: 0 };

  let distancia = 0;
  for (let i = 1; i < puntos.length; i++) distancia += metros(puntos[i - 1], puntos[i]);

  const paradas = detectarParadas(puntos);
  const minutosDetenido = paradas.reduce((s, p) => s + p.minutos, 0);
  const minutosTotales = puntos[puntos.length - 1].min - puntos[0].min;

  return {
    km: distancia / 1000,
    minutosMovimiento: Math.max(0, minutosTotales - minutosDetenido),
    minutosDetenido,
    paradas: paradas.length,
  };
}

/** Rango horario (en minutos, redondeado a la hora) que cubren todos los recorridos. */
export function limitesHorarios(recorridos) {
  const minutos = recorridos.flatMap((r) => r.puntos.map((p) => p.min));
  if (minutos.length === 0) return { desde: 8 * 60, hasta: 18 * 60 };
  return {
    desde: Math.floor(Math.min(...minutos) / 60) * 60,
    hasta: Math.ceil(Math.max(...minutos) / 60) * 60,
  };
}
