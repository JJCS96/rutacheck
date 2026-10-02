import { Circle, Marker, Polyline, Popup } from "react-leaflet";
import { iconoEntrada, iconoFuera, iconoSalida, iconoTienda, iconoTiendaActiva } from "../iconos";

const COLORES = { entrada: "#34d399", salida: "#fb7185" };

function Marcacion({ tipo, marcacion, visita, onSeleccionar }) {
  const tienda = visita.tienda;
  const icono = marcacion.fueraDeRadio ? iconoFuera(tipo) : tipo === "entrada" ? iconoEntrada : iconoSalida;
  const posicion = [marcacion.lat, marcacion.lng];

  return (
    <>
      <Polyline
        positions={[[tienda.lat, tienda.lng], posicion]}
        pathOptions={{ color: COLORES[tipo], weight: 2, opacity: 0.9, dashArray: "2,6", lineCap: "round" }}
      />
      <Marker position={posicion} icon={icono} eventHandlers={{ click: () => onSeleccionar(visita.id) }}>
        <Popup>
          <div className="popup">
            <span className={`popup-etiqueta ${tipo}`}>{tipo === "entrada" ? "Check-in" : "Check-out"}</span>
            <strong>{marcacion.hora}</strong>
            <dl>
              <dt>Promotor</dt>
              <dd>{visita.promotor}</dd>
              <dt>Distancia a la tienda</dt>
              <dd className={marcacion.fueraDeRadio ? "texto-alerta" : undefined}>
                {marcacion.distancia} m {marcacion.fueraDeRadio && `(máx. ${tienda.radio} m)`}
              </dd>
            </dl>
          </div>
        </Popup>
      </Marker>
    </>
  );
}

function VisitaEnMapa({ visita, activa, atenuada, onSeleccionar }) {
  const tienda = visita.tienda;
  const centro = [tienda.lat, tienda.lng];

  return (
    <>
      <Circle
        center={centro}
        radius={tienda.radio}
        pathOptions={{
          color: "#a3e635",
          weight: activa ? 2 : 1,
          opacity: atenuada ? 0.25 : 0.8,
          fillColor: "#a3e635",
          fillOpacity: activa ? 0.15 : 0.06,
        }}
      />
      <Marker
        position={centro}
        icon={activa ? iconoTiendaActiva : iconoTienda}
        opacity={atenuada ? 0.45 : 1}
        zIndexOffset={activa ? 1000 : 0}
        eventHandlers={{ click: () => onSeleccionar(visita.id) }}
      >
        <Popup>
          <div className="popup">
            <span className="popup-etiqueta tienda">{tienda.canal}</span>
            <strong>{tienda.nombre}</strong>
            <dl>
              <dt>Código</dt>
              <dd>{tienda.codigo}</dd>
              <dt>Dirección</dt>
              <dd>
                {tienda.direccion}, {tienda.ciudad}
              </dd>
              <dt>Radio permitido</dt>
              <dd>{tienda.radio} m</dd>
            </dl>
          </div>
        </Popup>
      </Marker>

      {!atenuada &&
        ["entrada", "salida"].map(
          (tipo) =>
            visita[tipo] && (
              <Marcacion key={tipo} tipo={tipo} marcacion={visita[tipo]} visita={visita} onSeleccionar={onSeleccionar} />
            )
        )}
    </>
  );
}

/** Capa del modo Visitas: tiendas, radios, check-in/check-out y lineas de distancia. */
export default function CapaVisitas({ visitas, seleccion, onSeleccionar }) {
  return visitas.map((v) => (
    <VisitaEnMapa
      key={v.id}
      visita={v}
      activa={v.id === seleccion}
      atenuada={seleccion !== null && v.id !== seleccion}
      onSeleccionar={onSeleccionar}
    />
  ));
}
