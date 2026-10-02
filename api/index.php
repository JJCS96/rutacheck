<?php

/**
 * API demo de RutaCheck.
 *
 * No usa base de datos: lee datos ficticios de api/datos/*.json y simula la
 * jornada de cada promotor de forma determinista (misma fecha => mismos datos).
 * Los tres modos de la app (visitas, recorrido y en vivo) salen de esa misma
 * jornada, por eso son coherentes entre si.
 *
 *   GET ?recurso=coordinadores
 *   GET ?recurso=promotores&coordinador=CO01
 *   GET ?recurso=marcaciones&coordinador=CO01&fecha=2026-10-01[&promotor=prom01]
 *   GET ?recurso=recorrido&coordinador=CO01&fecha=2026-10-01[&promotor=prom01]
 *   GET ?recurso=en-vivo&coordinador=CO01[&promotor=prom01]
 */

header('Content-Type: application/json; charset=utf-8');
date_default_timezone_set('America/Guayaquil');

const VELOCIDAD_KMH = 18;      // Velocidad media de traslado en ciudad
const INTERVALO_GPS_MIN = 3;   // Cada cuantos minutos el telefono reporta su posicion
const ACELERACION_VIVO = 30;   // En vivo, 1 minuto real = 30 minutos de jornada
const VIVO_DESDE_MIN = 7 * 60 + 50; // Horario que recorre en bucle el modo En vivo
const VIVO_DURACION_MIN = 6 * 60;
const NOVEDADES = ['VISITA NORMAL', 'VISITA NORMAL', 'VISITA NORMAL', 'LOCAL CERRADO', 'SIN ENCARGADO'];

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

function leerDatos($archivo)
{
    return json_decode(file_get_contents(__DIR__ . "/datos/$archivo.json"), true);
}

function responder($datos, $status = 200)
{
    http_response_code($status);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

function aHora($minutos)
{
    $m = (int) floor($minutos);
    return sprintf('%02d:%02d', intdiv($m, 60), $m % 60);
}

/** Distancia aproximada en metros entre dos puntos [lat, lng] (equirectangular). */
function metrosEntre($a, $b)
{
    $x = deg2rad($b[1] - $a[1]) * cos(deg2rad(($a[0] + $b[0]) / 2));
    $y = deg2rad($b[0] - $a[0]);
    return sqrt($x * $x + $y * $y) * 6371000;
}

/** Desplaza un punto [lat, lng] una distancia en metros con un rumbo aleatorio. */
function desplazar($punto, $metros)
{
    $angulo = deg2rad(mt_rand(0, 359));
    $dLat = ($metros * cos($angulo)) / 111320;
    $dLng = ($metros * sin($angulo)) / (111320 * cos(deg2rad($punto[0])));
    return [round($punto[0] + $dLat, 6), round($punto[1] + $dLng, 6)];
}

function promotoresDe($coordinadorId, $promotor = 'TODOS')
{
    return array_values(array_filter(
        leerDatos('promotores'),
        fn($p) => $p['coordinadorId'] === $coordinadorId && ($promotor === 'TODOS' || $p['usuario'] === $promotor)
    ));
}

/* ------------------------------------------------------------------ */
/* Simulacion de la jornada                                            */
/* ------------------------------------------------------------------ */

/**
 * Simula la jornada de un promotor en una fecha.
 *
 * Elige en orden aleatorio (pero determinista) las tiendas que visita, calcula el
 * tiempo de traslado entre ellas segun la distancia y genera el check-in y el
 * check-out de cada visita. ~15 % de las marcaciones caen fuera del radio permitido.
 *
 * @return array|null  ['inicio' => [min, lat, lng], 'visitas' => [...], 'tiendas' => [...]]
 *                     o null si ese dia no trabaja (domingo o fecha invalida).
 */
function simularJornada($promotor, $fecha)
{
    $dia = strtotime($fecha);
    if ($dia === false || date('N', $dia) == 7) return null;

    mt_srand(crc32($fecha . $promotor['usuario']));

    $tiendas = array_values(array_filter(leerDatos('tiendas'), fn($t) => $t['promotor'] === $promotor['usuario']));
    shuffle($tiendas);
    // Algunas tiendas no se visitan ese dia (siempre queda al menos una)
    $aVisitar = array_values(array_filter($tiendas, fn($t, $i) => $i === 0 || mt_rand(1, 100) > 20, ARRAY_FILTER_USE_BOTH));

    // El promotor sale de su casa, a 1-3 km de la primera tienda
    $inicio = desplazar([$aVisitar[0]['lat'], $aVisitar[0]['lng']], mt_rand(1000, 3000));
    $reloj = 8 * 60 + mt_rand(0, 40);
    $jornada = ['inicio' => ['min' => $reloj, 'lat' => $inicio[0], 'lng' => $inicio[1]], 'visitas' => []];

    $posicion = $inicio;
    foreach ($aVisitar as $tienda) {
        $centro = [$tienda['lat'], $tienda['lng']];
        $traslado = metrosEntre($posicion, $centro) / 1000 / VELOCIDAD_KMH * 60;
        $reloj += max(5, round($traslado)) + mt_rand(0, 8);

        $visita = ['tienda' => $tienda, 'novedad' => NOVEDADES[mt_rand(0, count(NOVEDADES) - 1)]];
        foreach (['entrada' => 0, 'salida' => mt_rand(20, 90)] as $tipo => $duracion) {
            $reloj += $duracion;
            $fuera = mt_rand(1, 100) <= 15;
            $metros = $fuera ? mt_rand($tienda['radio'] + 20, $tienda['radio'] * 4) : mt_rand(5, $tienda['radio']);
            [$lat, $lng] = desplazar($centro, $metros);
            $visita[$tipo] = ['min' => $reloj, 'lat' => $lat, 'lng' => $lng];
        }

        $jornada['visitas'][] = $visita;
        $posicion = $centro;
    }

    $visitadas = array_column($aVisitar, 'codigo');
    $jornada['tiendas'] = array_map(fn($t) => $t + ['visitada' => in_array($t['codigo'], $visitadas)], $tiendas);
    return $jornada;
}

/**
 * Convierte una jornada en la traza GPS que reportaria el telefono: un punto cada
 * INTERVALO_GPS_MIN minutos, con trayectos curvos entre tiendas y pequenas
 * variaciones mientras el promotor esta dentro de una tienda.
 *
 * @return array  Lista de puntos ['min', 'hora', 'lat', 'lng'] en orden cronologico.
 */
function trazarRecorrido($jornada)
{
    $puntos = [];
    $agregar = function ($min, $punto) use (&$puntos) {
        $puntos[] = ['min' => round($min, 2), 'hora' => aHora($min), 'lat' => $punto[0], 'lng' => $punto[1]];
    };

    $desde = [$jornada['inicio']['lat'], $jornada['inicio']['lng']];
    $t0 = $jornada['inicio']['min'];
    $agregar($t0, $desde);

    foreach ($jornada['visitas'] as $v) {
        $centro = [$v['tienda']['lat'], $v['tienda']['lng']];

        // Trayecto: interpolacion con una curva lateral para que no sea una recta perfecta
        $t1 = $v['entrada']['min'];
        $pasos = max(1, (int) floor(($t1 - $t0) / INTERVALO_GPS_MIN));
        $dLat = $centro[0] - $desde[0];
        $dLng = $centro[1] - $desde[1];
        $largo = hypot($dLat, $dLng) ?: 1;
        $curvaGrados = mt_rand(-400, 400) / 111320; // desvio lateral maximo: +-400 m
        for ($i = 1; $i < $pasos; $i++) {
            $f = $i / $pasos;
            $lateral = sin($f * M_PI) * $curvaGrados; // 0 en los extremos, maximo a mitad de camino
            $base = [
                $desde[0] + $dLat * $f - ($dLng / $largo) * $lateral,
                $desde[1] + $dLng * $f + ($dLat / $largo) * $lateral,
            ];
            $agregar($t0 + ($t1 - $t0) * $f, desplazar($base, mt_rand(0, 25)));
        }

        // Permanencia en la tienda
        for ($m = $t1; $m <= $v['salida']['min']; $m += INTERVALO_GPS_MIN) {
            $agregar($m, desplazar($centro, mt_rand(2, 15)));
        }

        $desde = $centro;
        $t0 = $v['salida']['min'];
    }
    return $puntos;
}

/* ------------------------------------------------------------------ */
/* Recursos                                                            */
/* ------------------------------------------------------------------ */

/** Check-in y check-out de todas las visitas del dia (modo Visitas). */
function marcaciones($coordinadorId, $fecha, $promotor)
{
    $marcaciones = [];
    foreach (promotoresDe($coordinadorId, $promotor) as $p) {
        $jornada = simularJornada($p, $fecha);
        if (!$jornada) continue;

        foreach ($jornada['visitas'] as $v) {
            foreach (['entrada' => 'ENTRADA', 'salida' => 'SALIDA'] as $clave => $tipo) {
                $marcaciones[] = [
                    'tipo' => $tipo,
                    'novedad' => $v['novedad'],
                    'fecha' => $fecha,
                    'hora' => aHora($v[$clave]['min']),
                    'lat' => $v[$clave]['lat'],
                    'lng' => $v[$clave]['lng'],
                    'promotor' => $p['nombre'],
                    'tienda' => $v['tienda'],
                ];
            }
        }
    }
    return $marcaciones;
}

/** Traza GPS del dia y tiendas asignadas de cada promotor (modo Recorrido). */
function recorrido($coordinadorId, $fecha, $promotor)
{
    $resultado = [];
    foreach (promotoresDe($coordinadorId, $promotor) as $p) {
        $jornada = simularJornada($p, $fecha);
        if (!$jornada) continue;

        $resultado[] = [
            'usuario' => $p['usuario'],
            'nombre' => $p['nombre'],
            'color' => $p['color'],
            'puntos' => trazarRecorrido($jornada),
            'tiendas' => $jornada['tiendas'],
        ];
    }
    return $resultado;
}

/**
 * Posicion actual de cada promotor (modo En vivo).
 *
 * Como es una demo, la "hora de jornada" se simula: avanza ACELERACION_VIVO veces
 * mas rapido que el reloj real y recorre en bucle el horario de 07:50 a 13:50
 * (una vuelta cada 12 minutos reales), asi siempre hay movimiento sin importar la hora
 * a la que se abra la app.
 */
function enVivo($coordinadorId, $promotor)
{
    $fecha = date('N') == 7 ? date('Y-m-d', strtotime('-1 day')) : date('Y-m-d');
    $ahora = VIVO_DESDE_MIN + fmod(microtime(true) / 60 * ACELERACION_VIVO, VIVO_DURACION_MIN);

    $promotores = [];
    foreach (promotoresDe($coordinadorId, $promotor) as $p) {
        $jornada = simularJornada($p, $fecha);
        $puntos = trazarRecorrido($jornada);
        $primero = $puntos[0];
        $ultimo = end($puntos);

        $estado = ['estado' => 'en-camino', 'tienda' => null];
        if ($ahora < $primero['min']) {
            $posicion = $primero;
            $estado = ['estado' => 'sin-iniciar', 'tienda' => null];
        } elseif ($ahora >= $ultimo['min']) {
            $posicion = $ultimo;
            $estado = ['estado' => 'finalizada', 'tienda' => null];
        } else {
            // Interpola entre los dos puntos GPS que rodean la hora actual
            $i = 0;
            while ($puntos[$i + 1]['min'] <= $ahora) $i++;
            [$a, $b] = [$puntos[$i], $puntos[$i + 1]];
            $f = ($ahora - $a['min']) / ($b['min'] - $a['min']);
            $posicion = ['lat' => $a['lat'] + ($b['lat'] - $a['lat']) * $f, 'lng' => $a['lng'] + ($b['lng'] - $a['lng']) * $f];

            foreach ($jornada['visitas'] as $v) {
                if ($ahora >= $v['entrada']['min'] && $ahora <= $v['salida']['min']) {
                    $estado = ['estado' => 'en-visita', 'tienda' => $v['tienda']['nombre']];
                    break;
                }
                if ($ahora < $v['entrada']['min']) {
                    $estado = ['estado' => 'en-camino', 'tienda' => $v['tienda']['nombre']];
                    break;
                }
            }
        }

        // Estela: los ultimos 30 minutos de recorrido
        $estela = array_values(array_filter($puntos, fn($pt) => $pt['min'] <= $ahora && $pt['min'] >= $ahora - 30));
        $estela = array_map(fn($pt) => [$pt['lat'], $pt['lng']], $estela);
        $estela[] = [round($posicion['lat'], 6), round($posicion['lng'], 6)];

        $promotores[] = $estado + [
            'usuario' => $p['usuario'],
            'nombre' => $p['nombre'],
            'color' => $p['color'],
            'lat' => round($posicion['lat'], 6),
            'lng' => round($posicion['lng'], 6),
            'senal' => $estado['estado'] === 'sin-iniciar' ? null : aHora(min($ahora, $ultimo['min'])),
            'estela' => $estela,
        ];
    }

    return ['fecha' => $fecha, 'horaSimulada' => aHora($ahora), 'promotores' => $promotores];
}

$recurso = $_GET['recurso'] ?? '';
$coordinador = $_GET['coordinador'] ?? '';
$promotor = $_GET['promotor'] ?? 'TODOS';
$fecha = $_GET['fecha'] ?? '';

switch ($recurso) {
    case 'coordinadores':
        responder(leerDatos('coordinadores'));
    case 'promotores':
        responder(promotoresDe($coordinador));
    case 'marcaciones':
        responder(marcaciones($coordinador, $fecha, $promotor));
    case 'recorrido':
        responder(recorrido($coordinador, $fecha, $promotor));
    case 'en-vivo':
        responder(enVivo($coordinador, $promotor));
    default:
        responder(['error' => 'Recurso no encontrado'], 404);
}
