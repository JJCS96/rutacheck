import Pestanas from "./Pestanas";
import FiltrosForm from "./FiltrosForm";
import Mensaje from "./Mensaje";
import ResumenVisitas from "./visitas/ResumenVisitas";
import ListaVisitas from "./visitas/ListaVisitas";
import PanelRecorrido from "./recorrido/PanelRecorrido";
import PanelEnVivo from "./vivo/PanelEnVivo";

const INICIAL = {
  visitas: ["map-location-dot", "Revisa las visitas", "Elige un coordinador y un día para ver los check-in y check-out de su equipo."],
  recorrido: ["person-walking", "Revisa el recorrido", "Elige un coordinador y un día para ver por dónde se movió cada promotor."],
  vivo: ["satellite-dish", "Sigue al equipo", "Elige un coordinador para ver dónde está cada promotor ahora mismo."],
};

/** Contenido del panel segun el modo y el estado de la consulta. */
function Contenido({ modo, consulta, vivo, rango, limites, onRango, seleccion, onSeleccionar, onVerEquipo }) {
  const estado = modo === "vivo" ? vivo.estado : consulta.estado;

  if (estado === "inicial" || estado === "inactivo") {
    const [icono, titulo, texto] = INICIAL[modo];
    return (
      <Mensaje icono={icono} titulo={titulo}>
        {texto}
      </Mensaje>
    );
  }
  if (estado === "error") {
    return (
      <Mensaje icono="plug-circle-xmark" titulo="No se pudo conectar">
        Revisa que la API esté en ejecución e inténtalo de nuevo.
      </Mensaje>
    );
  }
  if (estado === "cargando") return null;

  if (modo === "vivo") {
    return <PanelEnVivo vivo={vivo} seleccion={seleccion} onSeleccionar={onSeleccionar} onVerEquipo={onVerEquipo} />;
  }

  const datos = modo === "visitas" ? consulta.visitas : consulta.recorridos;
  if (datos.length === 0) {
    return (
      <Mensaje icono="calendar-xmark" titulo="Sin actividad">
        No hay registros para ese día. Los domingos el equipo no trabaja.
      </Mensaje>
    );
  }

  if (modo === "visitas") {
    return (
      <>
        <ResumenVisitas visitas={datos} />
        <ListaVisitas visitas={datos} seleccion={seleccion} onSeleccionar={onSeleccionar} />
      </>
    );
  }
  return (
    <PanelRecorrido
      recorridos={datos}
      rango={rango}
      limites={limites}
      onRango={onRango}
      seleccion={seleccion}
      onSeleccionar={onSeleccionar}
    />
  );
}

export default function Sidebar({ modo, onModo, filtros, onFiltro, onBuscar, consulta, ...resto }) {
  return (
    <aside className="sidebar">
      <header className="marca">
        <span className="marca-logo">
          <i className="fa-solid fa-route" />
        </span>
        <div>
          <h1>RutaCheck</h1>
          <p>Verificación de visitas en ruta</p>
        </div>
      </header>

      <Pestanas modo={modo} onCambiar={onModo} />

      <FiltrosForm
        modo={modo}
        filtros={filtros}
        onChange={onFiltro}
        onBuscar={onBuscar}
        cargando={consulta.estado === "cargando"}
      />

      <Contenido modo={modo} consulta={consulta} {...resto} />
    </aside>
  );
}
