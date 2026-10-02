import { describirEstado } from "./estados";
import { iniciales } from "../mapa/iconos";
import { INTERVALO_VIVO_MS } from "../../hooks/useEnVivo";

/** Panel lateral del modo En vivo: hora simulada, boton de encuadre y estado de cada promotor. */
export default function PanelEnVivo({ vivo, seleccion, onSeleccionar, onVerEquipo }) {
  const enVisita = vivo.promotores.filter((p) => p.estado === "en-visita").length;
  const enCamino = vivo.promotores.filter((p) => p.estado === "en-camino").length;

  return (
    <>
      <div className="banner-vivo">
        <span className="punto-vivo grande" />
        <div>
          <strong>Hora de jornada {vivo.horaSimulada ?? "--:--"}</strong>
          <small>Simulación acelerada · se actualiza cada {INTERVALO_VIVO_MS / 1000} s</small>
        </div>
      </div>

      <section className="resumen">
        <div className="indicador">
          <i className="fa-solid fa-store" />
          <strong>{enVisita}</strong>
          <span>En visita</span>
        </div>
        <div className="indicador">
          <i className="fa-solid fa-person-walking-arrow-right" />
          <strong>{enCamino}</strong>
          <span>En camino</span>
        </div>
      </section>

      <button type="button" className="boton secundario" onClick={onVerEquipo}>
        <i className="fa-solid fa-users-viewfinder" /> Ver a todo el equipo
      </button>

      <section className="lista">
        <h2>Equipo</h2>
        <ul className="lista-plana">
          {vivo.promotores.map((p) => {
            const estado = describirEstado(p);
            return (
              <li key={p.usuario}>
                <button
                  type="button"
                  className={`promotor vivo ${p.usuario === seleccion ? "activa" : ""}`}
                  style={{ "--color": p.color }}
                  onClick={() => onSeleccionar(p.usuario)}
                >
                  <span className="avatar">{iniciales(p.nombre)}</span>
                  <span className="promotor-texto">
                    <strong>{p.nombre}</strong>
                    <small>{estado.detalle}</small>
                  </span>
                  <span className="promotor-estado">
                    <span className={`chip chip-${estado.variante}`}>{estado.titulo}</span>
                    {p.senal && <small>señal {p.senal}</small>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
