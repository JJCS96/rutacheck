/** Estado vacio / de error del panel lateral. */
export default function Mensaje({ icono, titulo, children }) {
  return (
    <div className="mensaje">
      <i className={`fa-solid fa-${icono}`} />
      <strong>{titulo}</strong>
      <p>{children}</p>
    </div>
  );
}
