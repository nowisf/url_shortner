import { db } from "./db.js";
import express from "express";
import "dotenv/config";
import cors from "cors";

import { isURL, newPathUrl } from "./utils.js";

const PORT = process.env.PORT || 3000;
const app = express();

// Capturar promesas no manejadas a nivel global
process.on("unhandledRejection", (reason, promise) => {
  console.error("Promesa no manejada:", reason);
});

app.use(express.json());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL || "*"
        : "http://localhost:5173", // Frontend URL basado en entorno o cualquier origen
    methods: ["GET", "POST"],
  })
);

app.listen(PORT, () => {
  console.log(`Shortener app ${PORT}`);
});

app.post("/shortner", async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).send("Missing URL");
    }

    if (!isURL(url)) {
      return res.status(400).send("Invalid URL");
    }
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const stmtOriginalUrl = db.prepare(
      "SELECT original_url FROM urls WHERE original_url = ?"
    );
    const resultOriginalUrl = await stmtOriginalUrl.get(url);

    if (resultOriginalUrl) {
      const stmt = db.prepare(
        "SELECT short_url FROM urls WHERE original_url = ?"
      );
      const result = await stmt.get(url);
      if (!result) {
        throw new Error("Error al obtener URL acortada existente");
      }
      const fullShortUrl = `${baseUrl}/${result.short_url}`;
      return res.status(200).send({ fullShortUrl });
    }

    const short_url = newPathUrl();
    const fullShortUrl = `${baseUrl}/${short_url}`;
    const id = crypto.randomUUID();
    const stmt = db.prepare(
      "INSERT INTO urls (id, original_url, creation_date, short_url) VALUES (?, ?, ?, ?)"
    );
    await stmt.run(id, url, new Date().toISOString(), short_url);

    res.status(200).send({ fullShortUrl });
  } catch (e) {
    console.error("Error en endpoint /shortner:", e);
    next(e);
  }
});

//Redirect
app.get("/:shortUrl", async (req, res, next) => {
  try {
    const { shortUrl } = req.params;
    const stmt = db.prepare(
      "SELECT original_url FROM urls WHERE short_url = ?"
    );
    const result = await stmt.get(shortUrl);

    if (!result) {
      return res.status(404).json({ error: "URL no encontrada" });
    }

    // Incrementar el contador
    try {
      const stmt2 = db.prepare(
        "UPDATE urls SET times_clicked = times_clicked + 1 WHERE short_url = ?"
      );
      await stmt2.run(shortUrl);
    } catch (counterError) {
      console.error("Error al incrementar contador:", counterError);
      // Continuamos incluso si hay error en el contador
    }

    res.redirect(result.original_url);
  } catch (e) {
    console.error("Error en endpoint /:shortUrl:", e);
    next(e);
  }
});

app.get("/stats/:shortUrl", async (req, res, next) => {
  try {
    const { shortUrl } = req.params;
    const stmt = db.prepare(
      "SELECT original_url, times_clicked FROM urls WHERE short_url = ?"
    );
    const result = await stmt.get(shortUrl);

    if (result) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ error: "URL no encontrada" });
    }
  } catch (e) {
    console.error("Error en endpoint /stats/:shortUrl:", e);
    next(e);
  }
});

// Middleware para manejar errores
app.use((err, req, res, next) => {
  console.error("Error en middleware:", err);
  res.status(500).send({ error: "Internal Server Error" });
});

// Para evitar que la aplicación termine por errores no manejados
process.on("uncaughtException", (err) => {
  console.error("Error no capturado:", err);
});
