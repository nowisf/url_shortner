import { db } from "./db.js";
import express from "express";
import "dotenv/config";
import cors from "cors";

import { isURL, newPathUrl } from "./utils.js";

/**
 * Configuración del servidor Express para el acortador de URLs
 */
const PORT = process.env.PORT || 3000;
const app = express();

// Manejo global de promesas no controladas
process.on("unhandledRejection", (reason) => {
  console.error("Promesa no manejada:", reason);
});

// Configuración de middleware
app.use(express.json());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL || "*"
        : "http://localhost:5173",
    methods: ["GET", "POST"],
  })
);

// Log de configuración
const corsOrigin =
  process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL || "* (todos los orígenes)"
    : "http://localhost:5173";

console.log(
  `Entorno: ${process.env.NODE_ENV || "development"}, CORS: ${corsOrigin}`
);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
});

/**
 * POST /shortner - Crea una URL acortada
 *
 * Body: { "url": "https://example.com" }
 * Response: { "fullShortUrl": "http://domain.com/abc123" }
 */
app.post("/shortner", async (req, res, next) => {
  try {
    const { url } = req.body;

    // Validaciones
    if (!url) {
      return res.status(400).json({ error: "URL requerida" });
    }

    if (!isURL(url)) {
      return res.status(400).json({ error: "URL inválida" });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // Verificar si la URL ya existe en la base de datos
    const stmtOriginalUrl = db.prepare(
      "SELECT original_url FROM urls WHERE original_url = ?"
    );
    const resultOriginalUrl = await stmtOriginalUrl.get(url);

    if (resultOriginalUrl) {
      // Si existe, recuperar la URL corta existente
      const stmt = db.prepare(
        "SELECT short_url FROM urls WHERE original_url = ?"
      );
      const result = await stmt.get(url);

      if (!result) {
        throw new Error("Error al recuperar URL acortada existente");
      }

      const fullShortUrl = `${baseUrl}/${result.short_url}`;
      return res.status(200).json({ fullShortUrl });
    }

    // Crear nueva URL acortada
    const short_url = await newPathUrl();
    const fullShortUrl = `${baseUrl}/${short_url}`;
    const id = crypto.randomUUID();

    // Guardar en base de datos
    const stmt = db.prepare(
      "INSERT INTO urls (id, original_url, creation_date, short_url) VALUES (?, ?, ?, ?)"
    );
    await stmt.run(id, url, new Date().toISOString(), short_url);

    res.status(201).json({ fullShortUrl });
  } catch (e) {
    console.error("Error al acortar URL:", e);
    next(e);
  }
});

/**
 * GET /:shortUrl - Redirecciona a la URL original
 *
 * Param: shortUrl - Identificador corto de la URL
 * Response: Redirección HTTP 302 a la URL original
 */
app.get("/:shortUrl", async (req, res, next) => {
  try {
    const { shortUrl } = req.params;

    // Buscar URL original
    const stmt = db.prepare(
      "SELECT original_url FROM urls WHERE short_url = ?"
    );
    const result = await stmt.get(shortUrl);

    if (!result) {
      return res.status(404).json({ error: "URL no encontrada" });
    }

    // Incrementar contador de visitas
    try {
      const stmt2 = db.prepare(
        "UPDATE urls SET times_clicked = times_clicked + 1 WHERE short_url = ?"
      );
      await stmt2.run(shortUrl);
    } catch (counterError) {
      // No bloqueamos la redirección si falla el contador
      console.error("Error al incrementar contador:", counterError);
    }

    // Redireccionar a la URL original
    res.redirect(result.original_url);
  } catch (e) {
    console.error("Error al redireccionar:", e);
    next(e);
  }
});

/**
 * GET /stats/:shortUrl - Obtiene estadísticas de la URL
 *
 * Param: shortUrl - Identificador corto de la URL
 * Response: { original_url, times_clicked }
 */
app.get("/stats/:shortUrl", async (req, res, next) => {
  try {
    const { shortUrl } = req.params;

    // Buscar estadísticas
    const stmt = db.prepare(
      "SELECT original_url, times_clicked FROM urls WHERE short_url = ?"
    );
    const result = await stmt.get(shortUrl);

    if (result) {
      return res.status(200).json(result);
    }

    res.status(404).json({ error: "URL no encontrada" });
  } catch (e) {
    console.error("Error al obtener estadísticas:", e);
    next(e);
  }
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error("Error en la aplicación:", err);
  res.status(500).json({ error: "Error interno del servidor" });
});

// Manejo global de excepciones no capturadas
process.on("uncaughtException", (err) => {
  console.error("Excepción no capturada:", err);
});
