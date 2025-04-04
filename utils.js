import { db } from "./db.js";

function isURL(str) {
  try {
    new URL(str);
    return true;
  } catch (e) {
    return false;
  }
}

function randomString(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    { length },
    () => characters[Math.floor(Math.random() * characters.length)]
  ).join("");
}

async function newPathUrl() {
  const short_url = randomString(5);
  try {
    const stmt = db.prepare("SELECT short_url FROM urls WHERE short_url = ?");
    const result = await stmt.get(short_url);
    if (result) {
      return await newPathUrl(); // Llamada recursiva con await
    }
    return short_url;
  } catch (error) {
    console.error("Error al generar nuevo path:", error);
    // En caso de error, devolver un string único pero loggear el error
    return `${short_url}_${Date.now()}`;
  }
}

export { isURL, newPathUrl };
