import { CircleMarker, Marker, Polyline, Popup } from "react-leaflet";
import { iconoExtremo, iconoTiendaRuta } from "../iconos";
import { detectarParadas, filtrarPorRango } from "../../../utils/recorrido";
import { aHora, formatearDuracion } from "../../../utils/tiempo";

function TiendaDeRuta({ tienda }) {
  return (
    <Marker position={[tienda.lat, tienda.lng]} icon={iconoTiendaRuta(tienda.visitada)}>
      <Popup>
        <div className="popup">
          <span className={`popup-etiqueta ${tienda.visitada ? "tienda" : "pendiente"}`}>
            {tienda.visitada ? "Visitada" : "No visitada"}
          </span>
          <strong>{tienda.nombre}</strong>
          <dl>
            <dt>Código</dt>
            <dd>{tienda.codigo}</dd>
            <dt>Dirección</dt>
            <dd>{tienda.direccion}</dd>
          </dl>
        </div>
      </Popup>
    </Marker>
  );
}

function RecorridoPromotor({ recorrido, rango, atenuado, onSeleccionar }) {
  const puntos = filtrarPorRango(recorrido.puntos, rango);
  if (puntos.length === 0) return null;

  const linea = puntos.map((p) => [p.lat, p.lng]);
  const paradas = detectarParadas(puntos);
  const inicio = puntos[0];
  const fin = puntos[puntos.length - 1];
  const seleccionar = { click: () => onSeleccionar(recorrido.usuario) };

  return (
    <>
      {!atenuado && recorrido.tiendas.map((t) => <TiendaDeRuta key={t.codigo} tienda={t} />)}

      {/* Contorno oscuro debajo de la linea para que destaque sobre el mapa */}
      <Polyline positions={linea} pathOptions={{ color: "#05070f", weight: 8, opacity: atenuado ? 0.1 : 0.55 }} />
      <Polyline
        positions={linea}
        pathOptions={{ color: recorrido.color, weight: 4, opacity: atenuado ? 0.2 : 0.95, lineJoin: "round" }}
        eventHandlers={seleccionar}
      >
        <Popup>
          <div className="popup">
            <strong>{recorrido.nombre}</strong>
            <dl>
              <dt>Tramo visible</dt>
              <dd>
                {inicio.hora} – {fin.hora}
              </dd>
            </dl>
          </div>
        </Popup>
      </Polyline>

      {!atenuado && (
        <>
          {paradas.map((p) => (
            <CircleMarker
              key={p.desde}
              center={[p.lat, p.lng]}
              radius={7}
              pathOptions={{ color: recorrido.color, weight: 3, fillColor: "#0b1020", fillOpacity: 1 }}
            >
              <Popup>
                <div className="popup">
                  <span className="popup-etiqueta pendiente">Parada</span>
                  <strong>{formatearDuracion(p.minutos)}</strong>
                  <dl>
                    <dt>Promotor</dt>
                    <dd>{recorrido.nombre}</dd>
                    <dt>Horario</dt>
                    <dd>
                      {aHora(p.desde)} – {aHora(p.hasta)}
                    </dd>
                  </dl>
                </div>
              </Popup>
            </CircleMarker>
          ))}
          <Marker position={[inicio.lat, inicio.lng]} icon={iconoExtremo("inicio", recorrido.color)}>
            <Popup>
              {recorrido.nombre} · inicio {inicio.hora}
            </Popup>
          </Marker>
          <Marker position={[fin.lat, fin.lng]} icon={iconoExtremo("fin", recorrido.color)}>
            <Popup>
              {recorrido.nombre} · último punto {fin.hora}
            </Popup>
          </Marker>
        </>
      )}
    </>
  );
}

/**
 * Capa del modo Recorrido: la traza GPS de cada promotor dentro del rango horario,
 * sus paradas, el inicio y el fin, y las tiendas de su ruta (visitadas o no).
 */
export default function CapaRecorrido({ recorridos, rango, seleccion, onSeleccionar }) {
  return recorridos.map((r) => (
    <RecorridoPromotor
      key={r.usuario}
      recorrido={r}
      rango={rango}
      atenuado={seleccion !== null && seleccion !== r.usuario}
      onSeleccionar={onSeleccionar}
    />
  ));
}
