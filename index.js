import { db } from "./db.js";
import express from "express";
import { v4 as uuidv4 } from "uuid";
import "dotenv/config";
import "chance";

import { isURL, newPathUrl } from "./utils.js";

const PORT = process.env.PORT;
const app = express();

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

app.post("/shortner", (req, res, next) => {
  try {
    const { url } = req.body;
    if (!isURL(url)) {
      return res.status(400).send("Invalid URL");
    }
    const short_url = newPathUrl();
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const fullShortUrl = `${baseUrl}/${short_url}`;
    console.log(`short_url: ${short_url}`);
    const id = uuidv4();
    const stmt = db.prepare(
      "INSERT INTO urls (id, original_url, creation_date, short_url) VALUES (?, ?, ?, ?)"
    );
    stmt.run(id, url, new Date().toISOString(), short_url);

    res.status(200).send({ fullShortUrl });
  } catch (e) {
    next(e);
  }
});

app.get("/:shortUrl", (req, res, next) => {
  try {
    const { shortUrl } = req.params;
    const stmt = db.prepare(
      "SELECT original_url FROM urls WHERE short_url = ?"
    );
    const result = stmt.get(shortUrl);
    console.log(`shortUrl: ${shortUrl}`);
    console.log(`result: ${result}`);
    if (result) {
      res.redirect(result.original_url);
    } else {
      res.status(404).json({ error: "URL no encontrada" });
    }
  } catch (e) {
    next(e);
  }
});

// Middleware para manejar errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: "Internal Server Error" });
});
