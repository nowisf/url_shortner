/**
 * Script para liberar el puerto 3000 cuando está en uso
 * Detecta y termina procesos que bloquean el puerto
 */
import { execSync } from "child_process";

const PORT = 3000;

/**
 * Libera el puerto especificado terminando los procesos que lo utilizan
 */
function freePort() {
  try {
    // Ejecución específica según el sistema operativo
    if (process.platform === "win32") {
      // Windows: usar netstat + taskkill
      console.log(
        `Buscando procesos que utilizan el puerto ${PORT} en Windows...`
      );
      const output = execSync(`netstat -ano | findstr :${PORT}`).toString();

      if (output) {
        // Extraer PIDs únicos
        const lines = output.split("\n");
        const pids = new Set();

        for (const line of lines) {
          if (line.includes("LISTENING")) {
            const pid = line.trim().split(/\s+/).pop();
            if (pid && !isNaN(parseInt(pid))) {
              pids.add(pid);
            }
          }
        }

        // Terminar procesos
        if (pids.size > 0) {
          for (const pid of pids) {
            console.log(`Terminando proceso con PID: ${pid}`);
            execSync(`taskkill /F /PID ${pid}`);
          }
          console.log(`${pids.size} proceso(s) terminado(s) correctamente.`);
        } else {
          console.log(
            `No se encontraron procesos bloqueando el puerto ${PORT}.`
          );
        }
      } else {
        console.log(`El puerto ${PORT} está disponible.`);
      }
    } else {
      // Linux/Mac: usar lsof + kill
      console.log(
        `Buscando procesos que utilizan el puerto ${PORT} en Linux/Mac...`
      );
      execSync(`kill $(lsof -t -i:${PORT}) 2>/dev/null || true`);
      console.log("Procesos terminados si existían.");
    }

    console.log(
      `Puerto ${PORT} liberado. La aplicación puede iniciarse ahora.`
    );
  } catch (error) {
    // Ignora errores específicos - cuando no hay procesos para terminar
    console.log(
      `El puerto ${PORT} está disponible o no se pudieron terminar los procesos.`
    );
  }
}

// Ejecutar la función
freePort();
