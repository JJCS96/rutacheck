import { Fragment } from "react";
import { Marker, Polyline, Popup } from "react-leaflet";
import { iconoVivo, iniciales } from "../iconos";
import { describirEstado } from "../../vivo/estados";

/**
 * Capa del modo En vivo: posicion actual de cada promotor y su estela
 * (los ultimos 30 minutos de recorrido).
 */
export default function CapaEnVivo({ promotores, seleccion, onSeleccionar }) {
  return promotores.map((p) => {
    const activo = p.usuario === seleccion;
    const atenuado = seleccion !== null && !activo;

    return (
      <Fragment key={p.usuario}>
        <Polyline
          positions={p.estela}
          pathOptions={{ color: p.color, weight: 3, opacity: atenuado ? 0.15 : 0.7, dashArray: "1,7", lineCap: "round" }}
        />
        <Marker
          position={[p.lat, p.lng]}
          icon={iconoVivo(iniciales(p.nombre), p.color, activo)}
          opacity={atenuado ? 0.4 : 1}
          zIndexOffset={activo ? 1000 : 0}
          eventHandlers={{ click: () => onSeleccionar(p.usuario) }}
        >
          <Popup>
            <div className="popup">
              <span className="popup-etiqueta tienda">{describirEstado(p).titulo}</span>
              <strong>{p.nombre}</strong>
              <dl>
                <dt>Detalle</dt>
                <dd>{describirEstado(p).detalle}</dd>
                <dt>Última señal</dt>
                <dd>{p.senal ?? "—"}</dd>
              </dl>
            </div>
          </Popup>
        </Marker>
      </Fragment>
    );
  });
}
