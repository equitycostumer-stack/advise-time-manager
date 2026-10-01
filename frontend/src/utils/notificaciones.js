export function enviarNotificacion(incidencia) {
    // Las notificaciones visibles deben manejarse en la interfaz; no se imprimen
    // detalles de incidencias en la consola del navegador.
    return Boolean(incidencia);
}
