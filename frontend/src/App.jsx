import { useMemo, useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import MapaPrincipal from "./components/mapa/MapaPrincipal";
import { getMarcaciones, getRecorrido } from "./api/consultas";
import { useEnVivo } from "./hooks/useEnVivo";
import { agruparVisitas } from "./utils/visitas";
import { limitesHorarios } from "./utils/recorrido";

const hoy = () => new Date().toLocaleDateString("en-CA"); // AAAA-MM-DD en hora local
const FILTROS_INICIALES = { coordinador: "", promotor: "TODOS", fecha: hoy() };
const CONSULTA_VACIA = { estado: "inicial", visitas: [], recorridos: [] };

/**
 * Raiz de la app. Guarda el modo activo (visitas | recorrido | vivo), los filtros
 * compartidos y el resultado de la ultima consulta, y decide cuando reencuadrar el mapa.
 */
export default function App() {
  const [modo, setModo] = useState("visitas");
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [consulta, setConsulta] = useState(CONSULTA_VACIA);
  const [seleccion, setSeleccion] = useState(null);
  const [rango, setRango] = useState({ desde: 8 * 60, hasta: 18 * 60 });
  const [enfoque, setEnfoque] = useState(0); // Se incrementa con "Ver a todo el equipo"

  // Id de la ultima peticion: descarta respuestas que llegan despues de cambiar de modo o filtros
  const peticion = useRef(0);

  const vivo = useEnVivo(modo === "vivo", filtros.coordinador, filtros.promotor);
  const limites = useMemo(() => limitesHorarios(consulta.recorridos), [consulta.recorridos]);

  const reiniciar = () => {
    peticion.current++;
    setConsulta(CONSULTA_VACIA);
    setSeleccion(null);
  };

  const cambiarModo = (nuevo) => {
    setModo(nuevo);
    reiniciar();
  };

  const cambiarFiltro = (campo, valor) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
      // Al cambiar de coordinador, el promotor elegido ya no aplica
      ...(campo === "coordinador" && { promotor: "TODOS" }),
    }));
    reiniciar();
  };

  const buscar = async () => {
    const id = ++peticion.current;
    setConsulta((c) => ({ ...c, estado: "cargando" }));
    setSeleccion(null);
    try {
      if (modo === "visitas") {
        const visitas = agruparVisitas(await getMarcaciones(filtros));
        if (id === peticion.current) setConsulta({ ...CONSULTA_VACIA, estado: "listo", visitas });
      } else {
        const recorridos = await getRecorrido(filtros);
        if (id !== peticion.current) return;
        setRango(limitesHorarios(recorridos));
        setConsulta({ ...CONSULTA_VACIA, estado: "listo", recorridos });
      }
    } catch (error) {
      console.error(error);
      if (id === peticion.current) setConsulta({ ...CONSULTA_VACIA, estado: "error" });
    }
  };

  // Un segundo clic sobre el elemento activo lo deselecciona
  const seleccionar = (id) => setSeleccion((actual) => (actual === id ? null : id));

  // Cuando cambia esta clave el mapa se reencuadra (ver AjustarVista)
  const claveEncuadre =
    modo === "vivo"
      ? `vivo-${filtros.coordinador}-${filtros.promotor}-${seleccion}-${enfoque}-${vivo.promotores.length > 0}`
      : `${modo}-${consulta.estado}-${seleccion}`;

  return (
    <div className="app">
      <Sidebar
        modo={modo}
        onModo={cambiarModo}
        filtros={filtros}
        onFiltro={cambiarFiltro}
        onBuscar={buscar}
        consulta={consulta}
        vivo={vivo}
        rango={rango}
        limites={limites}
        onRango={setRango}
        seleccion={seleccion}
        onSeleccionar={seleccionar}
        onVerEquipo={() => {
          setSeleccion(null);
          setEnfoque((n) => n + 1);
        }}
      />
      <MapaPrincipal
        modo={modo}
        datos={{ visitas: consulta.visitas, recorridos: consulta.recorridos, rango, vivo, seleccion }}
        claveEncuadre={claveEncuadre}
        onSeleccionar={seleccionar}
      />
    </div>
  );
}
