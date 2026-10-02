export const MODOS = [
  { id: "visitas", icono: "shop", texto: "Visitas" },
  { id: "recorrido", icono: "person-walking", texto: "Recorrido" },
  { id: "vivo", icono: "satellite-dish", texto: "En vivo" },
];

/** Selector de modo de la app. */
export default function Pestanas({ modo, onCambiar }) {
  return (
    <nav className="pestanas" role="tablist">
      {MODOS.map((m) => (
        <button
          key={m.id}
          type="button"
          role="tab"
          aria-selected={modo === m.id}
          className={modo === m.id ? "activa" : ""}
          onClick={() => onCambiar(m.id)}
        >
          <i className={`fa-solid fa-${m.icono}`} />
          {m.texto}
          {m.id === "vivo" && <span className="punto-vivo" />}
        </button>
      ))}
    </nav>
  );
}
