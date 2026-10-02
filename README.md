# RutaCheck · Verificación de visitas en ruta

Aplicación web para que un coordinador supervise a su equipo de promotores en campo:
qué tiendas visitaron, por dónde se movieron y dónde están ahora mismo.

> **Proyecto demo.** Todos los datos (coordinadores, promotores, tiendas, marcaciones y
> recorridos GPS) son **ficticios** y se generan automáticamente. No se conecta a ninguna
> base de datos ni servicio real.

## Modos

| Modo | Qué muestra |
|---|---|
| **Visitas** | Check-in y check-out de cada visita, distancia de la marcación a la tienda y alertas cuando se marcó fuera del radio permitido. Resumen del día y línea de tiempo; al seleccionar una visita el mapa se centra en ella. |
| **Recorrido** | La traza GPS del día de cada promotor (una línea de color por persona), paradas de 10 min o más, inicio y último punto, y las tiendas de su ruta (visitadas o no). Una franja horaria con dos controles filtra el tramo visible. Por promotor: km recorridos, tiempo en movimiento, tiempo detenido y paradas. |
| **En vivo** | Posición actual de cada promotor con su estela de los últimos 30 minutos y su estado (en visita, en camino, sin iniciar, jornada terminada). Se actualiza cada 5 s. En la demo la hora de jornada es **simulada** y acelerada ×30, así siempre hay movimiento. |

Los tres modos salen de la misma jornada simulada, por eso son coherentes entre sí:
la tienda donde un promotor hace check-in en *Visitas* es una parada en su *Recorrido*
y es donde aparece "En visita" en *En vivo*.

## Tecnologías

- **Frontend:** React 19, Vite, React Leaflet, Font Awesome
- **Backend:** PHP 8 (API JSON sin base de datos)
- **Mapas:** © OpenStreetMap contributors

## Cómo ejecutarlo

Requisitos: Node.js 20+ y PHP 8+.

```bash
# 1. API (desde la raíz del proyecto)
php -S localhost:8000 -t .

# 2. Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

Abrir http://localhost:5173.

**Build de producción:** `cd frontend && npm run build` genera `app/`, que se publica junto a
`api/` en cualquier hosting con PHP.

## API

Un solo punto de entrada, `api/index.php`, con el parámetro `recurso`:

| Recurso | Parámetros | Devuelve |
|---|---|---|
| `coordinadores` | — | `[{ id, nombre }]` |
| `promotores` | `coordinador` | `[{ usuario, nombre, color, coordinadorId }]` |
| `marcaciones` | `coordinador`, `fecha`, `promotor`* | `[{ tipo, novedad, fecha, hora, lat, lng, promotor, tienda }]` |
| `recorrido` | `coordinador`, `fecha`, `promotor`* | `[{ usuario, nombre, color, puntos: [{ min, hora, lat, lng }], tiendas }]` |
| `en-vivo` | `coordinador`, `promotor`* | `{ fecha, horaSimulada, promotores: [{ usuario, nombre, color, lat, lng, estado, tienda, senal, estela }] }` |

\* Opcional; por defecto `TODOS`. La `fecha` va en formato `AAAA-MM-DD`.

### Cómo se generan los datos

- **`simularJornada($promotor, $fecha)`**: usa `crc32(fecha + usuario)` como semilla, así la
  misma fecha siempre da la misma jornada. Elige en orden aleatorio las tiendas a visitar
  (~80 %), calcula el traslado según la distancia (18 km/h) y genera check-in y check-out;
  ~15 % de las marcaciones caen fuera del radio. Los domingos no hay jornada.
- **`trazarRecorrido($jornada)`**: convierte la jornada en la traza que reportaría el
  teléfono, un punto cada 3 min, con trayectos curvos entre tiendas y pequeñas variaciones
  mientras el promotor está dentro de una tienda.
- **`enVivo($coordinador, $promotor)`**: calcula una "hora de jornada" simulada que recorre
  en bucle de 07:50 a 13:50 y devuelve la posición de cada promotor interpolando su traza.

## Estructura del frontend

```
frontend/src/
├── App.jsx                   modo activo, filtros, consultas y encuadre del mapa
├── api/consultas.js          cliente de la API
├── hooks/
│   ├── useLista.js           carga coordinadores y promotores
│   └── useEnVivo.js          consulta la posición del equipo cada 5 s
├── utils/
│   ├── visitas.js            agrupa marcaciones en visitas y calcula distancias
│   ├── recorrido.js          filtra por hora, detecta paradas y resume un recorrido
│   └── tiempo.js             conversiones de hora y duración
└── components/
    ├── Sidebar.jsx, Pestanas.jsx, FiltrosForm.jsx, Mensaje.jsx
    ├── visitas/              resumen y línea de tiempo de visitas
    ├── recorrido/            franja horaria y métricas por promotor
    ├── vivo/                 estado del equipo en vivo
    └── mapa/
        ├── MapaPrincipal.jsx mapa, leyenda y capa según el modo
        ├── AjustarVista.jsx  encuadre controlado por una clave
        ├── iconos.js         marcadores personalizados
        └── capas/            CapaVisitas, CapaRecorrido, CapaEnVivo
```

### Funciones principales

- **`agruparVisitas(registros)`** (`utils/visitas.js`): une el check-in y el check-out de cada
  tienda en una visita y marca las marcaciones fuera del radio.
- **`detectarParadas(puntos)`** (`utils/recorrido.js`): agrupa puntos GPS consecutivos que
  quedan a menos de 60 m del primero; si el grupo dura 10 min o más, es una parada.
- **`resumirRecorrido(puntos)`** (`utils/recorrido.js`): km recorridos, tiempo en movimiento,
  tiempo detenido y número de paradas.
- **`useEnVivo(activo, coordinador, promotor)`** (`hooks/useEnVivo.js`): sondea la API cada 5 s
  mientras el modo En vivo está activo y descarta respuestas de consultas anteriores.
- **`AjustarVista`** (`components/mapa/AjustarVista.jsx`): reencuadra el mapa solo cuando cambia
  una clave (nueva consulta, selección o "Ver a todo el equipo"), no en cada actualización en vivo.

## Autor

Jhonier Corozo
