import { SIN_NOVEDAD, duracionMinutos, tieneAlerta } from "../../utils/visitas";

function Visita({ visita, activa, onSeleccionar }) {
  const { tienda, entrada, salida } = visita;
  const duracion = duracionMinutos(visita);

  return (
    <li>
      <button type="button" className={`visita ${activa ? "activa" : ""}`} onClick={() => onSeleccionar(visita.id)}>
        <div className="visita-cabecera">
          <span className="visita-horario">
            <i className="fa-regular fa-clock" />
            {entrada?.hora ?? "--:--"} – {salida?.hora ?? "--:--"}
            {duracion !== null && <small>{duracion} min</small>}
          </span>
          {tieneAlerta(visita) && (
            <span className="chip chip-alerta">
              <i className="fa-solid fa-triangle-exclamation" /> Fuera de radio
            </span>
          )}
        </div>
        <strong className="visita-nombre">{tienda.nombre}</strong>
        <span className="visita-meta">
          {tienda.codigo} · {visita.promotor}
        </span>
        {visita.novedad !== SIN_NOVEDAD && <span className="chip chip-neutro">{visita.novedad}</span>}
      </button>
    </li>
  );
}

export default function ListaVisitas({ visitas, seleccion, onSeleccionar }) {
  return (
    <section className="lista">
      <h2>Visitas del día</h2>
      <ul>
        {visitas.map((v) => (
          <Visita key={v.id} visita={v} activa={v.id === seleccion} onSeleccionar={onSeleccionar} />
        ))}
      </ul>
    </section>
  );
}
