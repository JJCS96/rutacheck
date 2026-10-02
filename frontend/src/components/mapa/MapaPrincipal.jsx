import { MapContainer, ScaleControl, TileLayer, ZoomControl } from "react-leaflet";
import AjustarVista from "./AjustarVista";
import CapaVisitas from "./capas/CapaVisitas";
import CapaRecorrido from "./capas/CapaRecorrido";
import CapaEnVivo from "./capas/CapaEnVivo";
import { marcacionesDe } from "../../utils/visitas";
import { filtrarPorRango } from "../../utils/recorrido";

const CENTRO_INICIAL = [-1.6, -78.9];
const ZOOM_INICIAL = 7;
const TILES_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATRIBUCION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Si un tile falla (p. ej. por limite de peticiones), se reintenta una vez
const reintentarTile = ({ tile }) => {
  if (tile.dataset.reintento) return;
  tile.dataset.reintento = "1";
  setTimeout(() => (tile.src = tile.src.split("?")[0] + "?r=1"), 1500);
};

const LEYENDAS = {
  visitas: [
    ["pin-tienda", "shop", "Tienda y radio"],
    ["pin-entrada", "arrow-right-to-bracket", "Check-in"],
    ["pin-salida", "arrow-right-from-bracket", "Check-out"],
    ["pin-salida fuera", "triangle-exclamation", "Fuera de radio"],
  ],
  recorrido: [
    ["pin-extremo", "house", "Inicio"],
    ["pin-parada", "", "Parada (10+ min)"],
    ["pin-extremo", "flag-checkered", "Último punto"],
    ["pin-tienda pendiente", "shop", "Tienda no visitada"],
  ],
  vivo: [
    ["pin-vivo-mini", "", "Posición actual"],
    ["pin-estela", "", "Últimos 30 min"],
  ],
};

function Leyenda({ modo }) {
  return (
    <ul className="leyenda">
      {LEYENDAS[modo].map(([clase, icono, texto]) => (
        <li key={texto}>
          <span className={`pin mini ${clase}`}>{icono && <i className={`fa-solid fa-${icono}`} />}</span>
          {texto}
        </li>
      ))}
    </ul>
  );
}

/** Puntos a encuadrar en cada modo: la seleccion si la hay, si no todo lo visible. */
function puntosDeEncuadre(modo, { visitas, recorridos, rango, vivo, seleccion }) {
  if (modo === "visitas") {
    const lista = seleccion ? visitas.filter((v) => v.id === seleccion) : visitas;
    return lista.flatMap((v) => [[v.tienda.lat, v.tienda.lng], ...marcacionesDe(v).map((m) => [m.lat, m.lng])]);
  }
  if (modo === "recorrido") {
    const lista = seleccion ? recorridos.filter((r) => r.usuario === seleccion) : recorridos;
    return lista.flatMap((r) => filtrarPorRango(r.puntos, rango).map((p) => [p.lat, p.lng]));
  }
  const lista = seleccion ? vivo.promotores.filter((p) => p.usuario === seleccion) : vivo.promotores;
  return lista.map((p) => [p.lat, p.lng]);
}

export default function MapaPrincipal({ modo, datos, claveEncuadre, onSeleccionar }) {
  const { visitas, recorridos, rango, vivo, seleccion } = datos;

  return (
    <section className="mapa-contenedor">
      <MapContainer className="mapa" center={CENTRO_INICIAL} zoom={ZOOM_INICIAL} zoomControl={false}>
        <TileLayer url={TILES_URL} maxZoom={19} attribution={ATRIBUCION} eventHandlers={{ tileerror: reintentarTile }} />
        <ZoomControl position="bottomright" />
        <ScaleControl position="bottomright" imperial={false} />
        <AjustarVista
          clave={claveEncuadre}
          puntos={puntosDeEncuadre(modo, datos)}
          maxZoom={seleccion && modo === "visitas" ? 18 : 16}
          centroInicial={CENTRO_INICIAL}
          zoomInicial={ZOOM_INICIAL}
        />

        {modo === "visitas" && <CapaVisitas visitas={visitas} seleccion={seleccion} onSeleccionar={onSeleccionar} />}
        {modo === "recorrido" && (
          <CapaRecorrido recorridos={recorridos} rango={rango} seleccion={seleccion} onSeleccionar={onSeleccionar} />
        )}
        {modo === "vivo" && <CapaEnVivo promotores={vivo.promotores} seleccion={seleccion} onSeleccionar={onSeleccionar} />}
      </MapContainer>
      <Leyenda modo={modo} />
    </section>
  );
}
