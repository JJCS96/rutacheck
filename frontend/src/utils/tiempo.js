/** Convierte "HH:MM" a minutos desde la medianoche. */
export function aMinutos(hora) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

/** Convierte minutos desde la medianoche a "HH:MM". */
export function aHora(minutos) {
  const m = Math.floor(minutos);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Formatea una duracion en minutos como "45 min" o "2 h 05 min". */
export function formatearDuracion(minutos) {
  const m = Math.round(minutos);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} min`;
}
