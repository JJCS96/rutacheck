import { resumir } from "../../utils/visitas";

function Indicador({ icono, valor, etiqueta, variante = "" }) {
  return (
    <div className={`indicador ${variante}`}>
      <i className={`fa-solid fa-${icono}`} />
      <strong>{valor}</strong>
      <span>{etiqueta}</span>
    </div>
  );
}

export default function ResumenVisitas({ visitas }) {
  const r = resumir(visitas);

  return (
    <section className="resumen">
      <Indicador icono="shop" valor={r.visitas} etiqueta="Visitas" />
      <Indicador icono="user-group" valor={r.promotores} etiqueta="Promotores" />
      <Indicador
        icono="triangle-exclamation"
        valor={r.fueraDeRadio}
        etiqueta="Fuera de radio"
        variante={r.fueraDeRadio > 0 ? "alerta" : ""}
      />
      <Indicador icono="circle-info" valor={r.conNovedad} etiqueta="Con novedad" />
    </section>
  );
}
