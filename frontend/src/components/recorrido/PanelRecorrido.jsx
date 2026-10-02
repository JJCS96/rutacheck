import { filtrarPorRango, resumirRecorrido } from "../../utils/recorrido";
import { aHora, formatearDuracion } from "../../utils/tiempo";

/**
 * Doble control deslizante para elegir el rango horario visible del recorrido
 * (reemplaza a los campos "hora desde / hora hasta").
 */
function RangoHoras({ rango, limites, onCambiar }) {
  const cambiar = (campo) => (e) => {
    const valor = Number(e.target.value);
    // Evita que "desde" supere a "hasta" (y viceversa), con al menos 15 min de margen
    onCambiar(
      campo === "desde"
        ? { ...rango, desde: Math.min(valor, rango.hasta - 15) }
        : { ...rango, hasta: Math.max(valor, rango.desde + 15) }
    );
  };
  const pos = (v) => ((v - limites.desde) / (limites.hasta - limites.desde)) * 100;

  return (
    <div className="rango">
      <div className="rango-cabecera">
        <span>Franja horaria</span>
        <strong>
          {aHora(rango.desde)} → {aHora(rango.hasta)}
        </strong>
      </div>
      <div className="rango-pista" style={{ "--desde": `${pos(rango.desde)}%`, "--hasta": `${pos(rango.hasta)}%` }}>
        {["desde", "hasta"].map((campo) => (
          <input
            key={campo}
            type="range"
            aria-label={campo === "desde" ? "Hora desde" : "Hora hasta"}
            min={limites.desde}
            max={limites.hasta}
            step={5}
            value={rango[campo]}
            onChange={cambiar(campo)}
          />
        ))}
      </div>
      <div className="rango-marcas">
        <span>{aHora(limites.desde)}</span>
        <span>{aHora(limites.hasta)}</span>
      </div>
    </div>
  );
}

function TarjetaPromotor({ recorrido, resumen, activa, onSeleccionar }) {
  const visitadas = recorrido.tiendas.filter((t) => t.visitada).length;

  return (
    <li>
      <button
        type="button"
        className={`promotor ${activa ? "activa" : ""}`}
        style={{ "--color": recorrido.color }}
        onClick={() => onSeleccionar(recorrido.usuario)}
      >
        <div className="promotor-cabecera">
          <span className="punto-color" />
          <strong>{recorrido.nombre}</strong>
          <span className="promotor-tiendas">
            {visitadas}/{recorrido.tiendas.length} tiendas
          </span>
        </div>
        <dl className="metricas">
          <div>
            <dt>Distancia</dt>
            <dd>{resumen.km.toFixed(1)} km</dd>
          </div>
          <div>
            <dt>En movimiento</dt>
            <dd>{formatearDuracion(resumen.minutosMovimiento)}</dd>
          </div>
          <div>
            <dt>Detenido</dt>
            <dd>{formatearDuracion(resumen.minutosDetenido)}</dd>
          </div>
          <div>
            <dt>Paradas</dt>
            <dd>{resumen.paradas}</dd>
          </div>
        </dl>
      </button>
    </li>
  );
}

/** Panel lateral del modo Recorrido: franja horaria, totales del equipo y metricas por promotor. */
export default function PanelRecorrido({ recorridos, rango, limites, onRango, seleccion, onSeleccionar }) {
  const resumenes = recorridos.map((r) => resumirRecorrido(filtrarPorRango(r.puntos, rango)));
  const kmEquipo = resumenes.reduce((s, r) => s + r.km, 0);
  const paradasEquipo = resumenes.reduce((s, r) => s + r.paradas, 0);

  return (
    <>
      <RangoHoras rango={rango} limites={limites} onCambiar={onRango} />

      <section className="resumen">
        <div className="indicador">
          <i className="fa-solid fa-road" />
          <strong>{kmEquipo.toFixed(1)}</strong>
          <span>km del equipo</span>
        </div>
        <div className="indicador">
          <i className="fa-solid fa-mug-hot" />
          <strong>{paradasEquipo}</strong>
          <span>Paradas</span>
        </div>
      </section>

      <section className="lista">
        <h2>Promotores</h2>
        <ul className="lista-plana">
          {recorridos.map((r, i) => (
            <TarjetaPromotor
              key={r.usuario}
              recorrido={r}
              resumen={resumenes[i]}
              activa={r.usuario === seleccion}
              onSeleccionar={onSeleccionar}
            />
          ))}
        </ul>
      </section>
    </>
  );
}
