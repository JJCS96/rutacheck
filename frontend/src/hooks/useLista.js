import { useEffect, useState } from "react";

// Carga una lista desde la API cada vez que cambia `clave`; si la clave esta vacia, devuelve [].
export function useLista(cargar, clave) {
  const [lista, setLista] = useState([]);

  useEffect(() => {
    setLista([]);
    if (clave === "") return;

    // Evita que una respuesta lenta anterior pise la actual
    let activo = true;
    cargar(clave)
      .then((datos) => activo && setLista(datos))
      .catch((error) => console.error("Ocurrió un error", error));
    return () => {
      activo = false;
    };
  }, [cargar, clave]);

  return lista;
}
