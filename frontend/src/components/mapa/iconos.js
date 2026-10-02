import L from "leaflet";

/** Crea un marcador circular/cuadrado con un icono de Font Awesome; el estilo vive en index.css (.pin). */
const crearIcono = (clase, icono, tamano, estilo = "") =>
  L.divIcon({
    className: "",
    html: `<div class="pin ${clase}" style="${estilo}"><i class="fa-solid fa-${icono}"></i></div>`,
    iconSize: [tamano, tamano],
    iconAnchor: [tamano / 2, tamano / 2],
    popupAnchor: [0, -tamano / 2],
  });

/** Memoiza iconos por clave para no recrearlos en cada render (Leaflet los compara por referencia). */
const cache = new Map();
const memo = (clave, crear) => {
  if (!cache.has(clave)) cache.set(clave, crear());
  return cache.get(clave);
};

// Modo Visitas
export const iconoTienda = crearIcono("pin-tienda", "shop", 34);
export const iconoTiendaActiva = crearIcono("pin-tienda activo", "shop", 42);
export const iconoEntrada = crearIcono("pin-entrada", "arrow-right-to-bracket", 24);
export const iconoSalida = crearIcono("pin-salida", "arrow-right-from-bracket", 24);
export const iconoFuera = (tipo) =>
  memo(`fuera-${tipo}`, () =>
    crearIcono(`pin-${tipo === "entrada" ? "entrada" : "salida"} fuera`, "triangle-exclamation", 26)
  );

// Modo Recorrido
export const iconoTiendaRuta = (visitada) =>
  memo(`ruta-${visitada}`, () => crearIcono(`pin-tienda ruta ${visitada ? "" : "pendiente"}`, "shop", 22));

/** Inicio (casa) o fin (bandera) del recorrido, con el color del promotor. */
export const iconoExtremo = (tipo, color) =>
  memo(`extremo-${tipo}-${color}`, () =>
    crearIcono("pin-extremo", tipo === "inicio" ? "house" : "flag-checkered", 22, `--color:${color}`)
  );

// Modo En vivo
/** Marcador del promotor en vivo: circulo con sus iniciales y un pulso de su color. */
export const iconoVivo = (iniciales, color, activo) =>
  memo(`vivo-${iniciales}-${color}-${activo}`, () => {
    const tamano = activo ? 44 : 36;
    return L.divIcon({
      className: "marcador-vivo",
      html: `<div class="pin-vivo ${activo ? "activo" : ""}" style="--color:${color}"><span>${iniciales}</span></div>`,
      iconSize: [tamano, tamano],
      iconAnchor: [tamano / 2, tamano / 2],
      popupAnchor: [0, -tamano / 2],
    });
  });

export const iniciales = (nombre) =>
  nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
