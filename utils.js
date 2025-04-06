import { db } from "./db.js";

/**
 * Valida si una cadena es una URL válida
 * @param {string} str - La cadena a validar
 * @returns {boolean} true si es una URL válida, false en caso contrario
 */
function isURL(str) {
  try {
    new URL(str);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Genera una cadena aleatoria de caracteres alfanuméricos
 * @param {number} length - Longitud de la cadena a generar
 * @returns {string} Cadena aleatoria generada
 */
function randomString(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    { length },
    () => characters[Math.floor(Math.random() * characters.length)]
  ).join("");
}

/**
 * Genera una URL corta única verificando que no exista en la base de datos
 * @returns {Promise<string>} URL corta generada
 */
async function newPathUrl() {
  // Generar URL corta de 5 caracteres
  const short_url = randomString(5);

  try {
    // Verificar que no exista en la base de datos
    const stmt = db.prepare("SELECT short_url FROM urls WHERE short_url = ?");
    const result = await stmt.get(short_url);

    // Si existe, generar otra recursivamente
    if (result) {
      return await newPathUrl();
    }

    return short_url;
  } catch (error) {
    // En caso de error, genera una URL única con timestamp para evitar colisiones
    console.error("Error al verificar disponibilidad de URL:", error);
    return `${short_url}_${Date.now()}`;
  }
}

export { isURL, newPathUrl };
