import { useLista } from "../hooks/useLista";
import { getCoordinadores, getPromotores } from "../api/consultas";

const BOTON = {
  visitas: { icono: "magnifying-glass", texto: "Ver visitas del día" },
  recorrido: { icono: "route", texto: "Ver recorrido del día" },
};

/**
 * Filtros comunes a los tres modos. En el modo En vivo no hay fecha ni boton:
 * la posicion se actualiza sola en cuanto se elige un coordinador.
 */
export default function FiltrosForm({ modo, filtros, onChange, onBuscar, cargando }) {
  const coordinadores = useLista(getCoordinadores, "todos");
  const promotores = useLista(getPromotores, filtros.coordinador);
  const enVivo = modo === "vivo";

  const cambiar = (e) => onChange(e.target.name, e.target.value);

  const enviar = (e) => {
    e.preventDefault();
    if (!enVivo) onBuscar();
  };

  return (
    <form className="filtros" onSubmit={enviar}>
      <label className="campo">
        <span>Coordinador</span>
        <select name="coordinador" value={filtros.coordinador} onChange={cambiar} required>
          <option value="" disabled>
            Elige un coordinador
          </option>
          {coordinadores.map(({ id, nombre }) => (
            <option key={id} value={id}>
              {nombre}
            </option>
          ))}
        </select>
      </label>

      <div className={enVivo ? "" : "campos-fila"}>
        <label className="campo">
          <span>Promotor</span>
          <select name="promotor" value={filtros.promotor} onChange={cambiar} disabled={!filtros.coordinador}>
            <option value="TODOS">Todo el equipo</option>
            {promotores.map(({ usuario, nombre }) => (
              <option key={usuario} value={usuario}>
                {nombre}
              </option>
            ))}
          </select>
        </label>

        {!enVivo && (
          <label className="campo">
            <span>Día</span>
            <input type="date" name="fecha" value={filtros.fecha} onChange={cambiar} required />
          </label>
        )}
      </div>

      {!enVivo && (
        <button type="submit" className="boton" disabled={cargando}>
          <i className={`fa-solid ${cargando ? "fa-circle-notch fa-spin" : `fa-${BOTON[modo].icono}`}`} />
          {cargando ? "Cargando…" : BOTON[modo].texto}
        </button>
      )}
    </form>
  );
}
