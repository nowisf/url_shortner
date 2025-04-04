import Database from "better-sqlite3";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

let db;

// Verificar el entorno para usar la base de datos correspondiente
if (process.env.NODE_ENV === "production") {
  // Configuración para Supabase en producción
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Crear una versión compatible con la API de better-sqlite3
  db = {
    prepare: (text) => {
      return {
        run: async (...params) => {
          // Adaptar consultas INSERT, UPDATE, DELETE para Supabase
          if (text.trim().toLowerCase().startsWith("insert into urls")) {
            const { data, error } = await supabase.from("urls").insert([
              {
                id: params[0],
                original_url: params[1],
                creation_date: params[2],
                short_url: params[3],
              },
            ]);
            if (error) throw error;
            return data;
          } else if (
            text.trim().toLowerCase().includes("update urls set times_clicked")
          ) {
            // Para actualizar times_clicked
            const { data, error } = await supabase.rpc("increment_clicks", {
              short_url_param: params[0],
            });
            if (error) throw error;
            return data;
          }
        },
        get: async (...params) => {
          // Adaptar consultas SELECT para Supabase
          if (text.includes("FROM urls WHERE short_url =")) {
            const { data, error } = await supabase
              .from("urls")
              .select("*")
              .eq("short_url", params[0])
              .single();

            if (error && error.code !== "PGRST116") return null; // No results
            return data;
          } else if (text.includes("FROM urls WHERE original_url =")) {
            const { data, error } = await supabase
              .from("urls")
              .select("*")
              .eq("original_url", params[0])
              .single();

            if (error && error.code !== "PGRST116") return null; // No results
            return data;
          }
        },
        all: async (...params) => {
          const { data, error } = await supabase.from("urls").select("*");
          if (error) throw error;
          return data;
        },
      };
    },
    exec: async (text) => {
      // Esta función solo se usa durante la inicialización, no es necesaria para Supabase
      // ya que las tablas deben crearse en la interfaz de Supabase
      console.log("Las tablas deben ser creadas manualmente en Supabase");
    },
  };

  // No es necesario crear tablas aquí, se hace en la interfaz de Supabase
  console.log("Conectado a Supabase");
} else {
  // SQLite para desarrollo
  db = new Database("database.sqlite");

  db.exec(`
    CREATE TABLE IF NOT EXISTS urls (
      id TEXT PRIMARY KEY,
      original_url TEXT NOT NULL,
      creation_date TEXT NOT NULL,
      times_clicked INTEGER NOT NULL DEFAULT 0,
      short_url TEXT NOT NULL
    )
  `);
}

export { db };
