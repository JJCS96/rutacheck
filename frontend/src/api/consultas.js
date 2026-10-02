// En produccion la app vive en <proyecto>/app/, asi que la API queda un nivel arriba.
// En desarrollo, Vite reenvia /api/* al servidor PHP (ver vite.config.js).
const API_URL = import.meta.env.VITE_API_URL || "../api/index.php";

/**
 * Llama a un recurso de la API y devuelve el JSON de la respuesta.
 * @param {string} recurso  coordinadores | promotores | marcaciones | recorrido | en-vivo
 * @param {Record<string,string>} params  Parametros de la consulta.
 */
async function pedir(recurso, params = {}) {
  const query = new URLSearchParams({ recurso, ...params });
  const res = await fetch(`${API_URL}?${query}`);
  if (!res.ok) throw new Error(`Hubo un error en la respuesta: ${res.status}`);
  return res.json();
}

const comoLista = (datos) => (Array.isArray(datos) ? datos : []);

export const getCoordinadores = async () => comoLista(await pedir("coordinadores"));

export const getPromotores = async (coordinador) => comoLista(await pedir("promotores", { coordinador }));

/** Check-in y check-out del dia (modo Visitas). */
export const getMarcaciones = async ({ coordinador, promotor, fecha }) =>
  comoLista(await pedir("marcaciones", { coordinador, promotor, fecha }));

/** Traza GPS y tiendas asignadas de cada promotor (modo Recorrido). */
export const getRecorrido = async ({ coordinador, promotor, fecha }) =>
  comoLista(await pedir("recorrido", { coordinador, promotor, fecha }));

/** Posicion actual del equipo (modo En vivo): { fecha, horaSimulada, promotores }. */
export const getEnVivo = ({ coordinador, promotor }) => pedir("en-vivo", { coordinador, promotor });
